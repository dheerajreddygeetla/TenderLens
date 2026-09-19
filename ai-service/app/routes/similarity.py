from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.similarity_service import compare_texts

router = APIRouter()


class Source(BaseModel):
    id: str
    text: str


class Target(BaseModel):
    id: str
    text: str


class CompareRequest(BaseModel):
    source: Source
    targets: list[Target] = Field(default_factory=list)


@router.post("/compare")
def compare(req: CompareRequest):
    results = compare_texts(req.source.text, [t.model_dump() for t in req.targets])
    return {"sourceId": req.source.id, "results": results}
