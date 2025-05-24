#!/usr/bin/env python3
import sys
import json
import os
import logging
import traceback
from typing import Dict, List, Any

# --- Optional PDF Support ---
# Checks if PyMuPDF is installed for PDF processing.
HAS_PDF_SUPPORT = False
PDF_IMPORT_ERROR = None
try:
    import fitz  # PyMuPDF library
    HAS_PDF_SUPPORT = True
except ImportError as pdf_err:
    PDF_IMPORT_ERROR = str(pdf_err)
    # We don't exit yet, only log a warning. Error if PDF is actually used.
    pass # Continue execution, handle error later if PDF is input
# --- End Optional PDF Support ---

# --- Langchain Imports ---
# Tries importing essential Langchain libraries. Exits early if they are missing.
try:
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage
except ImportError as lc_err:
    # Cannot proceed without these core libraries
    # Log error (logging might not be configured yet, print is fallback)
    print(json.dumps({
        "status": "error",
        "message": f"Python environment missing required Langchain libraries: {lc_err}. Install langchain-groq and langchain-core."
    }), file=sys.stderr) # Print error message to stderr
    # Also print JSON to stdout for Java to potentially capture
    print(json.dumps({
        "status": "error",
        "message": f"Python environment missing required Langchain libraries: {lc_err}. Install langchain-groq and langchain-core."
    }))
    sys.exit(1) # Exit script with error code
# --- End Langchain Imports ---


# --- Logging Configuration ---
# Configure Logging: Write logs to 'ai_script.log' in the script's directory.
# This prevents log messages from interfering with the JSON output on stdout.
# Ensure the directory where the script runs is writable.
try:
    log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai_script.log')
    logging.basicConfig(level=logging.INFO, # Set desired log level (INFO, DEBUG, WARNING, ERROR)
                        format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
                        filename=log_file_path,
                        filemode='a') # 'a' for append, 'w' for overwrite
    # Add a handler to also log errors to stderr for immediate visibility if needed
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.ERROR) # Only log ERROR level and above to stderr
    stderr_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    stderr_handler.setFormatter(stderr_formatter)
    logging.getLogger().addHandler(stderr_handler)

except Exception as log_e:
    # Fallback if logging setup fails (e.g., permissions)
    print(f"Warning: Failed to configure file logging: {log_e}", file=sys.stderr)
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stderr)

logger = logging.getLogger(__name__) # Use a named logger

# Log initial warning about PDF support if needed
if not HAS_PDF_SUPPORT:
    logger.warning(f"PyMuPDF (fitz) import failed: {PDF_IMPORT_ERROR}. PDF processing disabled. Install with: pip install pymupdf")

# --- API Key Configuration ---
# Get API Key from environment variable (recommended) or replace placeholder
# Ensure the placeholder is actually replaced if not using environment variables.
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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") # Replace placeholder if needed

# --- Helper Functions ---

def extract_text(file_path: str) -> str:
    """
    Extracts text from PDF or TXT file.

    Args:
        file_path (str): The path to the file.

    Returns:
        str: The extracted text (cleaned).

    Raises:
        FileNotFoundError: If the file does not exist.
        ImportError: If PDF processing is attempted without PyMuPDF.
        ValueError: If the file type is unsupported.
        Exception: For other unexpected errors during extraction.
    """
    logger.info(f"Attempting to extract text from: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found at path: {file_path}")

    file_lower = file_path.lower()

    try:
        if file_lower.endswith('.pdf'):
            if not HAS_PDF_SUPPORT:
                # This should ideally be caught by check_dependencies, but double-check
                raise ImportError(f"PDF support not available (PyMuPDF missing: {PDF_IMPORT_ERROR})")

            text = ""
            with fitz.open(file_path) as doc:
                logger.info(f"Opened PDF '{os.path.basename(file_path)}', processing {len(doc)} pages.")
                for i, page in enumerate(doc):
                    page_text = page.get_text("text", sort=True)
                    if page_text:
                        text += page_text.strip() + " "
            cleaned_text = ' '.join(text.split())
            logger.info(f"Successfully extracted {len(cleaned_text)} characters from PDF.")
            return cleaned_text

        elif file_lower.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            cleaned_text = ' '.join(text.split())
            logger.info(f"Successfully read {len(cleaned_text)} characters from TXT file.")
            return cleaned_text
        else:
            raise ValueError(f"Unsupported file type: {os.path.basename(file_path)}. Only PDF and TXT are supported.")

    except fitz.EmptyFileError: # Specific exception for PyMuPDF
        logger.error(f"File is empty or not a valid PDF: {file_path}")
        raise ValueError(f"File is empty or not a valid PDF: {os.path.basename(file_path)}") from None
    except Exception as e: # Catch other potential errors
        logger.error(f"Error extracting text from {file_path}: {e}", exc_info=True)
        # Re-raise to be caught by the main exception handler
        raise RuntimeError(f"Error during file text extraction: {e}") from e


def analyze_cv(cv_text: str, skills_dict: Dict[str, Any]) -> Dict:
    """
    Analyze CV against required skills using Groq API and Llama model.

    Args:
        cv_text (str): Text content of the CV.
        skills_dict (Dict[str, Any]): Dictionary of required skills (keys are skill names).

    Returns:
        Dict: A dictionary containing the analysis result or an error structure.
              Guaranteed to have a "status" key ("success" or "error").
    """
    logger.info("Starting CV analysis using LLM.")
    raw_llm_content = "" # Initialize to empty string

    try:
        # --- Pre-checks ---
        if not GROQ_API_KEY or "YOUR_GROQ_API_KEY" in GROQ_API_KEY or len(GROQ_API_KEY) < 15: # Basic sanity check
            raise ValueError("Groq API Key is not configured correctly.")
        if not cv_text or not cv_text.strip():
            raise ValueError("CV text is empty, cannot analyze.")

        skills_list = [str(skill).strip() for skill in skills_dict.keys() if str(skill).strip()]
        if not skills_list:
            logger.warning("No valid required skills provided for analysis. Returning empty success.")
            # Return a valid success structure with empty lists/defaults
            return {
                "status": "success",
                "matched_skills": [],
                "missing_skills": [],
                "match_score": 0,

            }

        # --- LLM Prompt ---
        # Keep prompt concise and clear, emphasizing desired output format
        prompt = f"""
Analyze the provided CV text based ONLY on the "Required Skills" list below.

**CV Text:**
--- START CV ---
{cv_text[:15000]} ... [CV text potentially truncated]
--- END CV ---

**Required Skills:**
{json.dumps(skills_list, indent=2)}

**Instructions:**
1. Identify ONLY skills from the **"Required Skills"** list mentioned or strongly implied in the CV. List these in `matched_skills`.
2. List ONLY skills from the **"Required Skills"** list NOT found in the CV in `missing_skills`.
3. Calculate `match_score` (integer 0-100): (Number of Matched Skills / Total Required Skills) * 100. Round to nearest integer.


**Output Format:**
Return *ONLY* a single, valid JSON object containing ONLY the following 5 keys. NO extra text, comments, or markdown.
{{
  "matched_skills": ["Skill A", "Skill B", ...],
  "missing_skills": ["Skill C", "Skill D", ...],
  "match_score": <integer_percentage>,

}}
"""
        # --- End Prompt ---


        # --- API Call ---
        logger.info(f"Sending request to Groq API. Required skills count: {len(skills_list)}")
        chat = ChatGroq(
            temperature=0.1,
            groq_api_key=GROQ_API_KEY,
            model_name="llama3-70b-8192",
            # request_timeout=60.0 # Consider adding timeout
        )
        messages = [HumanMessage(content=prompt)]
        response = chat.invoke(messages)
        raw_llm_content = response.content
        logger.info("Received response from Groq API.")
        # logger.debug(f"Raw LLM Response Content:\n{raw_llm_content}") # Very verbose

        if not raw_llm_content or not raw_llm_content.strip():
            raise ValueError("Received empty response content from LLM.")

        # --- Robust JSON Parsing ---
        cleaned_response = raw_llm_content.strip()
        # Remove markdown code blocks
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:-3].strip()
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:-3].strip()

        # Find the JSON object boundaries '{...}'
        start_index = cleaned_response.find('{')
        end_index = cleaned_response.rfind('}')

        if start_index == -1 or end_index == -1 or end_index < start_index:
            raise json.JSONDecodeError("Could not find JSON object boundaries in response", cleaned_response, 0)

        json_string_candidate = cleaned_response[start_index:end_index+1]
        try:
            data = json.loads(json_string_candidate)
            logger.info("Successfully parsed extracted JSON object.")
        except json.JSONDecodeError as e_inner:
            logger.error(f"Failed parsing extracted JSON substring. Error: {e_inner}. Extracted: '{json_string_candidate}'", exc_info=True)
            # Raise a more informative error than the raw JSONDecodeError
            raise ValueError(f"LLM response substring was not valid JSON: {json_string_candidate}") from e_inner


        # --- Validate and Sanitize Parsed Data ---
        final_result = {} # Build the final dictionary carefully

        # Process matched_skills
        processed_matched = []
        raw_matched = data.get("matched_skills")
        if isinstance(raw_matched, list):
            for item in raw_matched:
                skill_name = None
                if isinstance(item, str):
                    skill_name = item.strip()
                elif isinstance(item, dict) and isinstance(item.get("skill"), str):
                    skill_name = item["skill"].strip() # Extract from object if needed
                if skill_name: # Add if valid string
                    processed_matched.append(skill_name)
                else:
                    logging.warning(f"Ignoring unexpected item in matched_skills: {item}")
            final_result["matched_skills"] = sorted(list(set(processed_matched)))
        else:
            logging.warning("'matched_skills' missing or not a list in LLM JSON.")
            final_result["matched_skills"] = []

        # Process missing_skills
        processed_missing = []
        raw_missing = data.get("missing_skills")
        if isinstance(raw_missing, list):
            processed_missing = [item.strip() for item in raw_missing if isinstance(item, str) and item.strip()]
            final_result["missing_skills"] = sorted(list(set(processed_missing)))
        else:
            logging.warning("'missing_skills' missing or not a list in LLM JSON.")
            final_result["missing_skills"] = []

        # Process match_score
        raw_score = data.get("match_score")
        score_val = 0
        if isinstance(raw_score, (int, float)):
            score_val = int(round(raw_score))
        elif isinstance(raw_score, str): # Try converting string score
            try:
                score_val = int(round(float(raw_score.strip())))
            except (ValueError, TypeError):
                logging.warning(f"Could not convert string match_score '{raw_score}' to number. Recalculating.")
                score_val = -1 # Indicate recalculation needed
        else:
            logging.warning(f"LLM 'match_score' ('{raw_score}') invalid or missing. Recalculating.")
            score_val = -1 # Indicate recalculation needed

        # Recalculate score if needed or to verify
        if score_val == -1:
            if skills_list:
                try:
                    score_val = int(round((len(final_result["matched_skills"]) / len(skills_list)) * 100))
                    logging.info(f"Using recalculated match_score: {score_val}")
                except ZeroDivisionError: score_val = 0
                except Exception as calc_e:
                    logging.error(f"Error recalculating score: {calc_e}")
                    score_val = 0
            else: score_val = 0 # No required skills = 0 score

        # Ensure score is within 0-100
        final_result["match_score"] = max(0, min(100, score_val))

        # Process strengths and weaknesses (ensure they are strings)


        # Check for any extra keys returned and log them (they won't be included in final_result)
        expected_keys = {"matched_skills", "missing_skills", "match_score"}
        extra_keys = set(data.keys()) - expected_keys
        if extra_keys:
            logging.warning(f"LLM response contained unexpected extra keys (ignored): {extra_keys}")

        # --- Final Success Result ---
        final_result["status"] = "success"
        logging.info("Successfully processed and sanitized LLM response.")
        return final_result

    except Exception as e:
        # Catch-all for any exception during the process
        logger.error(f"Analysis function failed: {str(e)}", exc_info=True)
        # Return a structured error, including raw content if available
        error_details = {
            "status": "error",
            "message": f"Analysis failed: {str(e)}",
            "traceback": traceback.format_exc() # Include traceback string
        }
        # Add raw content if it was captured before the error
        if raw_llm_content is not None:
            error_details["raw_llm_response"] = raw_llm_content
        return error_details

# --- Main Execution Function ---
def main():
    # --- Argument Handling ---
    if len(sys.argv) != 3:
        logging.error(f"Script called with incorrect arguments: {sys.argv}")
        # Print ONLY the error JSON to stdout
        print(json.dumps({
            "status": "error",
            "message": "Usage: python ai_script.py <path_to_cv_file> <path_to_skills_json>"
        }, indent=2))
        sys.exit(1) # Exit with non-zero status

    cv_path = sys.argv[1]
    skills_path = sys.argv[2]
    logging.info(f"Script started. CV Path: '{cv_path}', Skills Path: '{skills_path}'")

    result_json = {} # Initialize result

    try:
        # --- Input File Validation ---
        if not os.path.exists(cv_path):
            raise FileNotFoundError(f"CV file not found: {cv_path}")
        if not os.path.exists(skills_path):
            raise FileNotFoundError(f"Skills file not found: {skills_path}")

        # Check CV file type
        if not (cv_path.lower().endswith('.pdf') or cv_path.lower().endswith('.txt')):
            raise ValueError(f"Unsupported CV file type: {os.path.basename(cv_path)}. Only PDF and TXT supported.")

        # --- Load Skills JSON ---
        required_skills = {}
        with open(skills_path, 'r', encoding='utf-8') as f:
            skills_data = json.load(f)
        if not isinstance(skills_data, dict):
            raise ValueError("Skills file does not contain a valid JSON object (dictionary).")
        required_skills = skills_data
        logging.info(f"Successfully loaded {len(required_skills)} skills from {skills_path}")

        # --- Extract CV Text ---
        # extract_text now raises exceptions on error
        cv_text = extract_text(cv_path)
        if not cv_text or not cv_text.strip():
            raise ValueError(f"CV text extraction resulted in empty content for {os.path.basename(cv_path)}.")
        logging.info("CV text extracted successfully.")

        # --- Query AI Model ---
        logging.info("Querying LLM...")
        result_json = analyze_cv(cv_text, required_skills) # Call the analysis function
        logging.info(f"LLM Query completed. Result status: {result_json.get('status')}")

    except Exception as e:
        # Catch any exception from main execution flow (file loading, extraction, analysis call)
        logging.error(f"Critical error in main execution: {str(e)}", exc_info=True)
        # Structure the final error output
        result_json = {
            "status": "error",
            "message": f"Script execution failed: {str(e)}",
            "traceback": traceback.format_exc()
        }

    # --- Output Result ---
    # Always print the result dictionary (guaranteed to have 'status') as JSON to stdout
    try:
        print(json.dumps(result_json, indent=2))
    except Exception as print_e:
        # Fallback if printing the result itself fails (highly unlikely)
        logging.critical(f"FATAL: Failed to print final JSON result: {print_e}", exc_info=True)
        print(json.dumps({"status": "error", "message": "Failed to serialize final result to JSON."}, indent=2))
        sys.exit(1)

    # Exit with 0 for success, 1 for error, based on the final result status
    sys.exit(0 if result_json.get("status") == "success" else 1)


# --- Script Entry Point ---
if __name__ == "__main__":
    # Add a top-level log message indicating the script is running
    logging.info("ai_script.py execution started.")
    main()
    logging.info("ai_script.py execution finished.")