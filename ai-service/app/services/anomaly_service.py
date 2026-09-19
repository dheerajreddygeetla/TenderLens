from typing import Iterable
import numpy as np
from sklearn.ensemble import IsolationForest


FEATURE_ORDER = [
    "bidder_count",
    "average_deviation_pct",
    "spread_deviation_pct",
    "duration_days",
    "amendment_count",
    "contract_change_pct",
]


def _vectorize(features: dict) -> list[float]:
    return [float(features.get(k) or 0.0) for k in FEATURE_ORDER]


def detect(features: dict, peer_features: list[dict]) -> dict:
    """
    Fit IsolationForest on peer_features (reference population) plus the subject.
    Return whether subject is an outlier + a per-feature deviation summary.
    """
    peers = [p for p in peer_features if any(p.get(k) is not None for k in FEATURE_ORDER)]
    if len(peers) < 15:
        return {
            "is_anomaly": False,
            "score": 0.0,
            "reason": f"not enough peer data ({len(peers)} rows) — need ≥15",
            "feature_deviations": {},
        }

    X_peers = np.array([_vectorize(p) for p in peers], dtype=float)
    x = np.array([_vectorize(features)], dtype=float)

    model = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42,
    )
    model.fit(X_peers)

    prediction = int(model.predict(x)[0])  # 1 = normal, -1 = anomaly
    score = float(-model.score_samples(x)[0])  # higher = more anomalous

    # Per-feature deviation vs peer mean/std
    means = X_peers.mean(axis=0)
    stds = X_peers.std(axis=0) + 1e-9
    z_scores = (x[0] - means) / stds
    deviations = {
        FEATURE_ORDER[i]: {
            "value": round(float(x[0][i]), 4),
            "peer_mean": round(float(means[i]), 4),
            "z_score": round(float(z_scores[i]), 3),
        }
        for i in range(len(FEATURE_ORDER))
    }

    top_features = sorted(
        deviations.items(), key=lambda kv: abs(kv[1]["z_score"]), reverse=True
    )[:3]

    return {
        "is_anomaly": prediction == -1,
        "score": round(score, 4),
        "model": "IsolationForest",
        "model_version": "sklearn-1.x",
        "feature_deviations": deviations,
        "top_features": [{"name": k, **v} for k, v in top_features],
    }
