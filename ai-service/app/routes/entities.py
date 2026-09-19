from fastapi import APIRouter
from pydantic import BaseModel
from app.services.nlp_service import extract_entities

router = APIRouter()


class ExtractRequest(BaseModel):
    text: str


@router.post("/extract")
def extract_route(req: ExtractRequest):
    return extract_entities(req.text)
