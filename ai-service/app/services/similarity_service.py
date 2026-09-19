from typing import Iterable
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def compare_texts(source_text: str, targets: list[dict]) -> list[dict]:
    """
    targets: [{"id": "...", "text": "..."}]
    Returns: [{"id": "...", "similarity": 0.87}, ...] sorted desc.
    """
    if not source_text or not targets:
        return []

    corpus = [source_text] + [t.get("text", "") for t in targets]
    if all(len(c.strip()) < 20 for c in corpus):
        return [{"id": t["id"], "similarity": 0.0} for t in targets]

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=20_000,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(corpus)

    sims = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
    results = [
        {"id": targets[i]["id"], "similarity": round(float(sims[i]), 4)}
        for i in range(len(targets))
    ]
    results.sort(key=lambda r: r["similarity"], reverse=True)
    return results


def pairwise_matrix(texts: Iterable[str]) -> dict:
    """Utility for future batch mode. Returns dict with size only."""
    docs = list(texts)
    if not docs:
        return {"size": 0}
    return {"size": len(docs)}
