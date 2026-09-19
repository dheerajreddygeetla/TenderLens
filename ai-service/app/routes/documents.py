from fastapi import APIRouter, File, HTTPException, UploadFile
from app.services.pdf_service import extract_pdf_text, split_into_chunks

router = APIRouter()


@router.post("/extract")
async def extract(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail=f"unsupported content-type: {file.content_type}")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")

    try:
        text, pages, page_meta = extract_pdf_text(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"pdf parse error: {e}")

    chunks = split_into_chunks(text)

    return {
        "page_count": pages,
        "char_count": len(text),
        "chunk_count": len(chunks),
        "chunks": chunks,
        "pages": page_meta,
    }
