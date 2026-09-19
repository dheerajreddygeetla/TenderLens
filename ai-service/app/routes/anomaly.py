from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.anomaly_service import detect, FEATURE_ORDER

router = APIRouter()


class DetectRequest(BaseModel):
    features: dict
    peers: list[dict] = Field(default_factory=list)


@router.post("/detect")
def detect_route(req: DetectRequest):
    result = detect(req.features, req.peers)
    result["feature_order"] = FEATURE_ORDER
    return result
