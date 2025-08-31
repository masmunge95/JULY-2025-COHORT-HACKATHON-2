from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

# --- User Models ---
class User(BaseModel):
    id: uuid.UUID
    email: str
    is_premium: bool = False

# --- Content Generation Models ---
class TopicRequest(BaseModel):
    topic: str = Field(..., example="The Solar System")

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]

# --- Progress Tracking Models ---
class QuizResultRequest(BaseModel):
    topic: str
    score: int
    total_questions: int