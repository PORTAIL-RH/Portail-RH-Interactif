import sys
import json
import requests
import traceback
from pathlib import Path

# --- PDF Support Handling ---
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("WARNING: PyPDF2 not available - PDF support disabled", file=sys.stderr)

# --- Text Extraction ---
def extract_text(file_path_str):
    """Extracts text from PDF or text files."""
    try:
        file_path = Path(file_path_str).absolute()
        print(f"DEBUG: Attempting to read file at: {file_path}", file=sys.stderr)

        if not file_path.exists():
            print(f"ERROR: File not found: {file_path}", file=sys.stderr)
            return None, f"File not found: {file_path}"

        # Handle PDF
        if file_path.suffix.lower() == '.pdf':
            if not PDF_SUPPORT:
                print("ERROR: PDF file provided, but PyPDF2 is not installed.", file=sys.stderr)
                return None, "PDF processing unavailable (PyPDF2 missing)"
            try:
                text = ""
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    if reader.is_encrypted:
                        print(f"WARNING: PDF is encrypted, attempting to decrypt (may fail): {file_path}", file=sys.stderr)
                        try:
                            reader.decrypt('') # Try empty password
                        except Exception as decrypt_err:
                            print(f"ERROR: Failed to decrypt PDF: {decrypt_err}", file=sys.stderr)
                            return None, f"PDF decryption failed: {decrypt_err}"

                    print(f"DEBUG: PDF has {len(reader.pages)} pages.", file=sys.stderr)
                    for i, page in enumerate(reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + " "
                            else:
                                print(f"DEBUG: No text extracted from page {i+1}", file=sys.stderr)
                        except Exception as page_err:
                            print(f"WARNING: Error extracting text from page {i+1}: {page_err}", file=sys.stderr)

                if text.strip():
                    print(f"DEBUG: Extracted {len(text)} characters from PDF.", file=sys.stderr)
                    return text.strip(), None
                else:
                    print("ERROR: PDF text extraction resulted in empty content. Is it scanned/image-based?", file=sys.stderr)
                    return None, "PDF appears to be empty or image-based (no text layer)"
            except Exception as e:
                print(f"ERROR: Failed to read PDF: {e}\n{traceback.format_exc()}", file=sys.stderr)
                return None, f"PDF read error: {str(e)}"

        # Handle Text (or fallback)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if content.strip():
                    print(f"DEBUG: Extracted {len(content)} characters from text file.", file=sys.stderr)
                    return content.strip(), None
                else:
                    print("ERROR: Text file appears to be empty.", file=sys.stderr)
                    return None, "Text file is empty"
        except Exception as e:
            print(f"ERROR: Failed to read text file: {e}\n{traceback.format_exc()}", file=sys.stderr)
            return None, f"Text read error: {str(e)}"

    except Exception as e:
        print(f"ERROR: Unexpected error during file processing: {e}\n{traceback.format_exc()}", file=sys.stderr)
        return None, f"File processing error: {str(e)}"

# --- AI Analysis ---
def analyze_cv(cv_text):
    """Sends CV text to Ollama for analysis and returns JSON."""
    if not cv_text or len(cv_text) < 50:
        print("ERROR: CV text is too short or empty for analysis.", file=sys.stderr)
        return None, "CV text too short (min 50 chars) or empty"

    # *** MODIFIED PROMPT: Only ask for skills, strengths, weaknesses ***
    prompt = f"""
Analyze this CV and return JSON with ONLY the following fields:
- technicalSkills: dict of skills with percentages (0-100, integer) identified from the CV. Example: {{"Python": 90, "Java": 80}}
- languageSkills: dict of languages with percentages (0-100, integer) identified from the CV. Example: {{"English": 100, "French": 90}}
- strengths: list of 3-5 key strengths (strings) identified from the CV.
- weaknesses: list of 3-5 potential weaknesses or areas for development (strings) identified from the CV.

CV Content:
\"\"\"
{cv_text[:15000]}
\"\"\"

Return ONLY valid JSON containing exactly the fields requested above. Example:
{{
  "technicalSkills": {{"Python": 90, "Java": 80, "SQL": 75, "Docker": 60}},
  "languageSkills": {{"English": 100, "French": 90}},
  "strengths": ["Strong Python skills", "Team player", "Fast learner"],
  "weaknesses": ["Limited cloud experience", "Needs more NoSQL experience"]
}}"""

    ollama_url = 'http://localhost:11434/api/generate'
    payload = {
        "model": "llama3", # Or your preferred model
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2} # Lower temp for consistency
    }

    print(f"DEBUG: Sending request to Ollama: {ollama_url}", file=sys.stderr)
    try:
        response = requests.post(ollama_url, json=payload, timeout=180) # Increased timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

        raw_response_text = response.text
        print(f"DEBUG: Raw Ollama response text:\n{raw_response_text}", file=sys.stderr)

        # Try parsing the JSON response directly
        try:
            json_data = response.json()
            if "response" in json_data and json_data["response"]:
                try:
                    inner_json_str = json_data["response"]
                    # Clean potential markdown fences ```json ... ```
                    if inner_json_str.strip().startswith("```json"):
                        inner_json_str = inner_json_str.strip()[7:]
                    if inner_json_str.strip().endswith("```"):
                        inner_json_str = inner_json_str.strip()[:-3]

                    parsed_inner_json = json.loads(inner_json_str.strip())
                    print("DEBUG: Successfully parsed inner JSON from Ollama response.", file=sys.stderr)
                    # Basic validation of expected structure
                    if not all(k in parsed_inner_json for k in ["technicalSkills", "languageSkills", "strengths", "weaknesses"]):
                        print("WARNING: Ollama response missing some expected keys.", file=sys.stderr)
                        # Provide defaults or handle partially? For now, return as is.
                    return parsed_inner_json, None
                except json.JSONDecodeError as e:
                    print(f"ERROR: Failed to parse inner JSON string from Ollama response: {e}", file=sys.stderr)
                    print(f"DEBUG: Inner JSON string was: {json_data.get('response', 'N/A')}", file=sys.stderr)
                    return None, f"Invalid inner JSON from AI: {e}"
                except Exception as e_inner:
                    print(f"ERROR: Unexpected error processing Ollama inner response: {e_inner}", file=sys.stderr)
                    return None, f"Error processing AI response: {e_inner}"
            else:
                print("ERROR: Ollama response JSON is missing 'response' field or it's empty.", file=sys.stderr)
                print(f"DEBUG: Full Ollama JSON: {json_data}", file=sys.stderr)
                return None, "AI response missing 'response' content"

        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse the main Ollama JSON response: {e}", file=sys.stderr)
            print(f"DEBUG: Raw response was: {raw_response_text}", file=sys.stderr)
            # Attempt to extract JSON manually as a fallback (less reliable)
            json_start = raw_response_text.find('{')
            json_end = raw_response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                try:
                    print("DEBUG: Attempting manual JSON extraction from raw text.", file=sys.stderr)
                    extracted_json = json.loads(raw_response_text[json_start:json_end])
                    print("DEBUG: Manual JSON extraction successful.", file=sys.stderr)
                    # Re-validate expected keys after manual extraction
                    if not all(k in extracted_json for k in ["technicalSkills", "languageSkills", "strengths", "weaknesses"]):
                        print("WARNING: Manually extracted JSON response missing some expected keys.", file=sys.stderr)
                    return extracted_json, None
                except json.JSONDecodeError as manual_e:
                    print(f"ERROR: Manual JSON extraction also failed: {manual_e}", file=sys.stderr)
                    return None, f"Invalid JSON response from AI: {e}"
            else:
                return None, f"Non-JSON response from AI: {e}"

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Ollama request failed: {e}\n{traceback.format_exc()}", file=sys.stderr)
        return None, f"Ollama connection error: {str(e)}"
    except Exception as e:
        print(f"ERROR: Unexpected error during AI analysis: {e}\n{traceback.format_exc()}", file=sys.stderr)
        return None, f"AI analysis error: {str(e)}"

# --- Main Execution Logic ---
def main(cv_path):
    """Main function to extract text and analyze CV."""
    # Note: The 'status' field is removed here as it's no longer generated by the AI
    result_payload = {} # Start with an empty dict

    cv_text, error = extract_text(cv_path)
    if error:
        # Return a specific error structure if text extraction fails
        return {"status": "failed", "error": f"Text extraction failed: {error}"}

    ai_result_dict, error = analyze_cv(cv_text)
    if error:
        # Return specific error if AI analysis fails
        return {"status": "failed", "error": f"AI analysis failed: {error}"}

    # If AI analysis succeeded, use its result directly (contains the 4 fields)
    # Add defaults for missing fields defensively, although the prompt asks for all 4
    ai_result_dict.setdefault("technicalSkills", {})
    ai_result_dict.setdefault("languageSkills", {})
    ai_result_dict.setdefault("strengths", [])
    ai_result_dict.setdefault("weaknesses", [])

    # Add a success status for the Java side to check
    ai_result_dict["status"] = "success" # Indicate script ran successfully

    return ai_result_dict # Return the dictionary containing the 4 fields + status

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "failed", "error": "Missing file path argument"}), file=sys.stdout)
        sys.exit(1)

    cv_file_path = sys.argv[1]
    analysis_result = main(cv_file_path)

    # Print the final JSON result (either success or error structure) to stdout
    try:
        print(json.dumps(analysis_result, ensure_ascii=False))
    except Exception as e:
        # Fallback error if serialization fails
        print(json.dumps({"status": "failed", "error": f"Failed to serialize final result: {e}", "raw_result": str(analysis_result)}))
        sys.exit(1)

    # Exit code based on the 'status' field in the result
    if analysis_result.get("status") == "failed":
        sys.exit(1)
    else:
        sys.exit(0)