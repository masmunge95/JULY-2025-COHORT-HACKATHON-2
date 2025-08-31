import httpx
import json
from fastapi import HTTPException

from ..core.config import settings

API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"
HEADERS = {"Authorization": f"Bearer {settings.HF_API_KEY}"}

async def query_huggingface_api(payload):
    """Helper function to query the Hugging Face API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(API_URL, headers=HEADERS, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {response.text}")
    return response.json()

def clean_json_response(text: str) -> dict:
    """Cleans and parses the JSON response from the AI model."""
    try:
        # Find the start and end of the JSON object
        start_index = text.find('{')
        end_index = text.rfind('}') + 1
        if start_index == -1 or end_index == 0:
            raise ValueError("No JSON object found in the response.")
        
        json_str = text[start_index:end_index]
        return json.loads(json_str)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing JSON from AI response: {e}")
        print(f"Original text: {text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI-generated content.")

async def generate_quiz_from_topic(topic: str) -> dict:
    """Generates a quiz using a predefined prompt."""
    prompt = f"""
    Generate a multiple-choice quiz with 3 questions about the topic: "{topic}".
    The questions should be educational and test understanding.
    Provide the output in a valid JSON format. The JSON object should have a single key "questions", which is an array of objects.
    Each object in the array should have the following keys: "question" (string), "options" (an array of 4 strings), and "answer" (a string that is one of the options).
    Do not include any text outside of the JSON object.

    Example format:
    {{
      "questions": [
        {{
          "question": "What is the capital of France?",
          "options": ["Berlin", "Madrid", "Paris", "Rome"],
          "answer": "Paris"
        }}
      ]
    }}
    """
    response = await query_huggingface_api({"inputs": prompt})
    generated_text = response[0]['generated_text']
    return clean_json_response(generated_text)

async def generate_flashcards_from_topic(topic: str) -> dict:
    """Generates flashcards using a predefined prompt."""
    prompt = f"""
    Generate 3 educational flashcards about the topic: "{topic}".
    Provide the output in a valid JSON format. The JSON object should have a single key "flashcards", which is an array of objects.
    Each object in the array should have two keys: "front" (a question or concept) and "back" (the answer or explanation).
    Do not include any text outside of the JSON object.

    Example format:
    {{
      "flashcards": [
        {{
          "front": "What is the powerhouse of the cell?",
          "back": "The mitochondrion is known as the powerhouse of the cell."
        }}
      ]
    }}
    """
    response = await query_huggingface_api({"inputs": prompt})
    generated_text = response[0]['generated_text']
    return clean_json_response(generated_text)