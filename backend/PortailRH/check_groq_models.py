import requests

API_KEY = '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'
headers = {'Authorization': f'Bearer {API_KEY}'}

try:
    print("\nFetching available models from Groq API...")
    response = requests.get('https://api.groq.com/openai/v1/models', headers=headers)
    models = [model['id'] for model in response.json()['data']]
    print("\nAvailable Models:")
    for model in models:
        print(f"- {model}")
except Exception as e:
    print(f"\nError: {str(e)}")
