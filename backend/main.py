from fastapi import FastAPI

from .api import content

app = FastAPI(
    title="AI Learning Tools API",
    description="API for generating quizzes and flashcards.",
    version="0.1.0",
)

app.include_router(content.router, prefix="/content", tags=["content"])