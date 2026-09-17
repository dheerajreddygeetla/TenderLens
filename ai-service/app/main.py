from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health

app = FastAPI(
    title="TenderLens AI Service",
    version="0.1.0",
    description="NLP, embeddings, similarity, and anomaly detection for TenderLens.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])


@app.get("/")
def root() -> dict:
    return {"service": "tenderlens-ai", "status": "ok"}
