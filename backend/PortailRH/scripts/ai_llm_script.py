import os
import json
import logging
from typing import Dict, Any, Optional
from PIL import Image
from pymongo import MongoClient
from bson.objectid import ObjectId
from transformers import LlamaForCausalLM, LlamaTokenizer
from dotenv import load_dotenv
import torch
import datetime
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

load_dotenv()

class LlamaCVProcessor:
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the Llama 3.2 Vision processor
        Args:
            model_path: Path to the locally downloaded model (defaults to HF cache)
        """
        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {self.device}")

            # Initialize model and tokenizer
            self.tokenizer = LlamaTokenizer.from_pretrained(
                model_path or "meta-llama/Llama-3.2-11B-Vision-Instruct",
                token=os.getenv("HF_TOKEN")
            )

            self.model = LlamaForCausalLM.from_pretrained(
                model_path or "meta-llama/Llama-3.2-11B-Vision-Instruct",
                device_map="auto",
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                token=os.getenv("HF_TOKEN")
            )

            # System prompt for CV processing
            self.system_prompt = """You are an expert HR analyst. Extract:
            - Technical skills (list with proficiency 1-5)
            - Work experience (company, duration in months)
            - Education (degree, institution, year)
            - Languages (with proficiency: basic/intermediate/fluent)
            Return valid JSON only, with this structure:
            {
                "skills": {"skill_name": proficiency},
                "experience": [{"title": "", "company": "", "duration": ""}],
                "education": [{"degree": "", "institution": "", "year": ""}],
                "languages": {"language": proficiency}
            }"""

            logger.info("Llama 3.2 Vision processor initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize processor: {str(e)}")
            raise

    def process_cv(self, cv_path: str, candidate_id: str, job_id: str) -> Dict[str, Any]:
        """
        Full CV processing pipeline
        Args:
            cv_path: Path to CV image/PDF
            candidate_id: Candidate identifier
            job_id: Job posting identifier
        Returns:
            Dictionary with processing results
        """
        result = {
            "status": "processing_started",
            "candidate_id": candidate_id,
            "job_id": job_id,
            "timestamp": self._current_timestamp()
        }

        try:
            # Step 1: Load and validate image
            image = self._load_image(cv_path)

            # Step 2: Generate prompt
            prompt = self._build_prompt()

            # Step 3: Process with model
            cv_data = self._analyze_with_llama(prompt, image)

            # Step 4: Get job requirements
            job_reqs = self._get_job_requirements(job_id)

            # Step 5: Calculate matching score
            match_result = self._calculate_match(cv_data, job_reqs)

            result.update({
                "status": "completed",
                "cv_data": cv_data,
                "match_result": match_result
            })

        except Exception as e:
            logger.error(f"CV processing failed: {str(e)}", exc_info=True)
            result.update({
                "status": "failed",
                "error": str(e),
                "error_type": type(e).__name__
            })

        return result

    def _load_image(self, path: str) -> Image.Image:
        """Load and validate input image"""
        try:
            if not os.path.exists(path):
                raise FileNotFoundError(f"File not found: {path}")

            if path.lower().endswith('.pdf'):
                from pdf2image import convert_from_path
                images = convert_from_path(path)
                if not images:
                    raise ValueError("No pages found in PDF")
                return images[0]  # Use first page

            return Image.open(path)

        except Exception as e:
            logger.error(f"Image loading failed: {str(e)}")
            raise

    def _build_prompt(self) -> str:
        """Construct the LLM prompt with special tokens"""
        return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
        {self.system_prompt}
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        Analyze this CV image:<|image_1|>
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    def _analyze_with_llama(self, prompt: str, image: Image.Image) -> Dict[str, Any]:
        """Run inference with Llama 3.2 Vision"""
        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                images=image
            ).to(self.device)

            outputs = self.model.generate(
                **inputs,
                max_new_tokens=1000,
                temperature=0.1,
                do_sample=True
            )

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return self._parse_response(response)

        except Exception as e:
            logger.error(f"Model inference failed: {str(e)}")
            raise

    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Extract JSON from model response"""
        try:
            # Find JSON block in response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1

            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in response")

            json_str = response[json_start:json_end]
            data = json.loads(json_str)

            # Validate structure
            required_keys = {'skills', 'experience', 'education', 'languages'}
            if not all(k in data for k in required_keys):
                raise ValueError("Missing required fields in response")

            return data

        except Exception as e:
            logger.error(f"Failed to parse response: {response}")
            raise ValueError(f"Invalid response format: {str(e)}")

    def _get_job_requirements(self, job_id: str) -> Dict[str, Any]:
        """Retrieve job requirements from MongoDB"""
        try:
            db = self._get_db_connection()
            job = db.jobs.find_one({"_id": ObjectId(job_id)})

            if not job:
                raise ValueError(f"Job {job_id} not found")

            return job.get('requirements', {})

        except Exception as e:
            logger.error(f"Failed to get job requirements: {str(e)}")
            raise

    def _calculate_match(self, cv_data: Dict[str, Any], job_reqs: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate matching score between CV and job requirements"""
        try:
            prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
            Calculate suitability score (1-100) between candidate and job.
            Consider skills match, experience relevance, and language requirements.
            Return JSON with: overall_score, skill_matches, strengths, weaknesses.
            <|eot_id|><|start_header_id|>user<|end_header_id|>
            Candidate: {json.dumps(cv_data)}
            Job: {json.dumps(job_reqs)}
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            outputs = self.model.generate(**inputs, max_new_tokens=500)
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            return self._parse_response(response)

        except Exception as e:
            logger.error(f"Matching calculation failed: {str(e)}")
            raise

    def _get_db_connection(self):
        """Establish MongoDB connection"""
        try:
            client = MongoClient(
                os.getenv("MONGO_URI"),
                connectTimeoutMS=5000,
                serverSelectionTimeoutMS=5000
            )
            client.admin.command('ping')
            return client[os.getenv("MONGO_DB_NAME", "PortailRH")]

        except Exception as e:
            logger.error(f"DB connection failed: {str(e)}")
            raise

    def _current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

if __name__ == "__main__":
    try:
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("cv_path", help="Path to CV file")
        parser.add_argument("candidate_id", help="Candidate ID")
        parser.add_argument("job_id", help="Job ID")
        args = parser.parse_args()

        processor = LlamaCVProcessor()
        result = processor.process_cv(args.cv_path, args.candidate_id, args.job_id)
        print(json.dumps(result, indent=2))

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        print(json.dumps({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }))
        sys.exit(1)