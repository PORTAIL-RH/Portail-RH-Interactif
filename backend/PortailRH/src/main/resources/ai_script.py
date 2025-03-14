import sys
import json
import re
from pymongo import MongoClient
from bson.objectid import ObjectId

def process_cv(cv_file_path, candidate_id, candidature_id):
    try:
        # --- Read the CV text ---
        try:
            with open(cv_file_path, 'r', encoding='utf-8') as f:  # Specify encoding
                cv_text = f.read()  # Replace this with CV reading
        except Exception as e:
            cv_text = "Skills: AI, Data Science, Java"  # Dummy text

        # --- Connect to MongoDB ---
        try:
            client = MongoClient('mongodb+srv://fidaIslem:PortailRH@portailrh.lhwzf.mongodb.net/PortailRH?retryWrites=true&w=majority')
            db = client['PortailRH']
            candidatures = db['candidatures']

            # Print all candidatures for debugging (to stderr)
            print("All candidatures in the collection:", file=sys.stderr)
            for candidature in candidatures.find():
                print(candidature, file=sys.stderr)

            # Convert candidature_id to ObjectId
            candidature_id = ObjectId(candidature_id)

            # Find the specific candidature
            candidature = candidatures.find_one({'_id': candidature_id})
            if candidature:
                print("Found candidature:", candidature, file=sys.stderr)
                required_skills = candidature.get('skills', [])
            else:
                print("Candidature not found with ID:", candidature_id, file=sys.stderr)
                required_skills = []
        except Exception as e:
            print("Error connecting to MongoDB or retrieving candidature:", str(e), file=sys.stderr)
            required_skills = []

        # --- Extract Skills and Calculate Score ---
        extracted_skills = extract_skills_from_text(cv_text, required_skills)
        score = len(extracted_skills) / len(required_skills) if len(required_skills) > 0 else 0.0

        # Create result dictionary
        result = {
            "skills": extracted_skills,
            "score": score,
            "candidateId": candidate_id  # Use the candidate's ID
        }

        # Print only JSON to stdout
        print(json.dumps(result))

    except Exception as e:
        # Print only JSON to stdout
        print(json.dumps({"error": str(e)}))

def extract_skills_from_text(text, skill_list):
    text = text.lower()
    extracted_skills = []
    for skill in skill_list:
        if re.search(r"\b" + re.escape(skill.lower()) + r"\b", text):  # Whole word match
            extracted_skills.append(skill)
    return extracted_skills

if __name__ == "__main__":
    if len(sys.argv) > 3:
        cv_file_path = sys.argv[1]
        candidate_id = sys.argv[2]
        candidature_id = sys.argv[3]
        process_cv(cv_file_path, candidate_id, candidature_id)
    else:
        print(json.dumps({"error": "Missing arguments: CV file path, candidate ID, and candidature ID required"}))