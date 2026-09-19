from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, documents, similarity, anomaly, entities

app = FastAPI(
    title="TenderLens AI Service",
    version="0.2.0",
    description="NLP, similarity, and anomaly detection for TenderLens.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(similarity.router, prefix="/similarity", tags=["similarity"])
app.include_router(anomaly.router, prefix="/anomaly", tags=["anomaly"])
app.include_router(entities.router, prefix="/entities", tags=["entities"])


@app.get("/")
def root() -> dict:
    return {"service": "tenderlens-ai", "status": "ok", "version": "0.2.0"}
