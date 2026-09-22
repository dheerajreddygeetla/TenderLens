import pymupdf  # modern name; `fitz` is a deprecated alias
from typing import Tuple


def extract_pdf_text(data: bytes) -> Tuple[str, int, list[dict]]:
    """Return (full_text, page_count, pages metadata)."""
    doc = pymupdf.open(stream=data, filetype="pdf")
    pages: list[dict] = []
    parts: list[str] = []

    for i, page in enumerate(doc):
        text = page.get_text("text") or ""
        pages.append({"page": i + 1, "text": text, "chars": len(text)})
        parts.append(text)

    return "\n\n".join(parts), doc.page_count, pages


def split_into_chunks(text: str, target_chars: int = 1500, overlap: int = 200) -> list[str]:
    """Sliding window chunks with overlap. Strips excessive whitespace."""
    cleaned = " ".join(text.split())
    if len(cleaned) <= target_chars:
        return [cleaned] if cleaned else []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + target_chars, len(cleaned))
        chunks.append(cleaned[start:end])
        if end == len(cleaned):
            break
        start = end - overlap
    return chunks
