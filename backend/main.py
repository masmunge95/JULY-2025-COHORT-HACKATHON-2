import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List
from groq import AsyncGroq  # Use the asynchronous client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simplicity. In production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Pydantic Models ---
class Topic(BaseModel):
    topic: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class Flashcard(BaseModel):
    front: str
    back: str

class ExplanationResponse(BaseModel):
    explanation: str

class ChatMessage(BaseModel):
    message: str
    # The frontend might send history, let's make it optional
    history: List[Dict[str, str]] = []

class ChatResponse(BaseModel):
    response: str

# --- Groq API Client ---
try:
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables.")
    groq_client = AsyncGroq(api_key=groq_api_key)  # Initialize the ASYNC client
except ValueError as e:
    print(f"Error: {e}")
    groq_client = None

# --- Helper for Groq call ---
# NOTE: The model 'llama-3.3-70b-versatile' might not exist.
# The current recommended model is 'llama-3.1-70b-versatile'.
# If you encounter errors, consider changing the model name.
async def get_ai_json_response(prompt: str, root_key: str, model: str = "llama-3.3-70b-versatile"):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API client not initialized. Check GROQ_API_KEY.")
    
    try:
        print(f"--- Sending prompt to Groq for '{root_key}' ---")
        # Added more specific instructions to the system prompt for better JSON adherence.
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that always responds in valid JSON format as requested. Do not include any explanatory text before or after the JSON object.",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=model,
            response_format={"type": "json_object"},
        )
        response_content = chat_completion.choices[0].message.content or ""
        print("--- Received from Groq ---")
        print(response_content)
        data = json.loads(response_content)
        
        # The model was asked to wrap the array in a root object, so we extract it
        if isinstance(data, dict) and root_key in data and isinstance(data[root_key], list):
            return data[root_key]
        
        # Handle the case where the model returns the list directly
        if isinstance(data, list):
            print(f"Warning: AI returned a list directly instead of an object with root key '{root_key}'. Processing the list.")
            return data
        
        # If we are here, the format is not what we expected.
        print(f"Error: AI response did not contain the expected root key '{root_key}' with a list value.")
        raise HTTPException(status_code=500, detail=f"AI response did not have the expected format. Expected a JSON object with a '{root_key}' key containing a list.")

    except json.JSONDecodeError:
        print("Error: AI returned invalid JSON.")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {response_content}")
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        raise HTTPException(status_code=500, detail=f"Error communicating with AI service: {e}")

async def get_ai_text_response(prompt: str, model: str = "llama-3.1-70b-versatile", messages: List[Dict[str, str]] | None = None):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API client not initialized. Check GROQ_API_KEY.")
    
    if messages is None:
        messages = [
            {
                "role": "system",
                "content": "You are a helpful and concise educational assistant.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ]

    try:
        print(f"--- Sending prompt to Groq for text response ---")
        chat_completion = await groq_client.chat.completions.create(
            messages=messages,
            model=model,
        )
        response_content = chat_completion.choices[0].message.content
        print("--- Received from Groq ---")
        print(response_content)
        return response_content
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        raise HTTPException(status_code=500, detail=f"Error communicating with AI service: {e}")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the EduAssistant API"}

@app.post("/generate_quiz", response_model=List[QuizQuestion])
async def generate_quiz(topic: Topic):
    prompt = f"""
    You are an expert educator. Your task is to generate a 5-question multiple-choice quiz on the topic of "{topic.topic}".
    Format your response as a valid JSON object with a single key "quiz" which contains an array of question objects.
    Each question object must have keys: "question" (string), "options" (an array of 4 strings), and "answer" (a string that exactly matches one of the options).
    """
    quiz_data = await get_ai_json_response(prompt, root_key="quiz")
    return quiz_data

@app.post("/generate_flashcards", response_model=List[Flashcard])
async def generate_flashcards(topic: Topic):
    prompt = f"""
    You are an expert educator. Your task is to generate a set of 5 flashcards for the topic: "{topic.topic}".
    Format your response as a valid JSON object with a single key "flashcards" which contains an array of flashcard objects.
    Each flashcard object must have keys: "front" (string for the term/question) and "back" (string for the definition/answer).
    """
    flashcard_data = await get_ai_json_response(prompt, root_key="flashcards")
    return flashcard_data

@app.post("/generate_explanation", response_model=ExplanationResponse)
async def generate_explanation(topic: Topic):
    prompt = f"""
    Please provide a clear and concise explanation of the topic: {topic.topic}.
    Focus on the key concepts. Format your response using simple HTML tags like <h3> for titles, <p> for paragraphs, <strong> for bold text, and <ul>/<li> for lists.
    Do not include <html> or <body> tags.
    """
    explanation_text = await get_ai_text_response(prompt)
    return {"explanation": explanation_text}

@app.post("/start_discussion", response_model=ChatResponse)
async def start_discussion(topic: Topic):
    prompt = f"You are an educational AI assistant. Start a friendly discussion about the topic: {topic.topic}. Ask an engaging opening question to get the user talking."
    response_text = await get_ai_text_response(prompt)
    return {"response": response_text}

@app.post("/chat_response", response_model=ChatResponse)
async def chat_response(chat_message: ChatMessage):
    # Construct the full message history for the AI, which is more effective than a flat string.
    messages = [
        {"role": "system", "content": "You are a helpful educational assistant continuing a discussion. Provide a concise and engaging response to continue the conversation based on the user's last message."}
    ]
    # Add the history from the client
    for msg in chat_message.history:
        # Ensure the history has the correct format before appending
        if "role" in msg and "content" in msg:
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Add the user's latest message
    messages.append({"role": "user", "content": chat_message.message})

    response_text = await get_ai_text_response("Continue the conversation.", messages=messages)
    return {"response": response_text}