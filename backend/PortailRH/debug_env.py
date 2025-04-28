import os
from dotenv import load_dotenv

print("\n=== Environment Debug ===")
print(f"Current directory: {os.getcwd()}")
print(f"Files in directory: {[f for f in os.listdir() if f.startswith('.') or f.endswith('.env')]}")

load_dotenv(override=True)
print("\nLoaded environment variables:")
print(f"GROQ_API_KEY exists: {'GROQ_API_KEY' in os.environ}")
print(f"EMAIL_USER exists: {'EMAIL_USER' in os.environ}")
print(f"GROQ_API_KEY value: {os.getenv('GROQ_API_KEY')}")
print(f"EMAIL_USER value: {os.getenv('EMAIL_USER')}")
