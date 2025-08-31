from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api import content, progress, payments

app = FastAPI(
    title="Educational Assistant API",
    description="API for generating educational content and tracking user progress.",
    version="1.0.0"
)

# CORS (Cross-Origin Resource Sharing)
# This allows the frontend (running on a different domain/port) to communicate with the backend.
origins = [
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router, prefix="/api/content", tags=["Content Generation"])
app.include_router(progress.router, prefix="/api/progress", tags=["User Progress"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}