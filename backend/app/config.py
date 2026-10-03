from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

BACKEND_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODELS_DIR / "ecosort_mobilenetv2.keras"
CLASS_NAMES_PATH = MODELS_DIR / "class_names.json"
MODEL_METRICS_PATH = MODELS_DIR / "model_metrics.json"

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_DIMENSION = 12_000
UPLOAD_CHUNK_BYTES = 1024 * 1024
CONFIDENCE_THRESHOLD = 0.60

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _is_http_origin(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc) and not parsed.path.rstrip("/")


def get_allowed_origins() -> list[str]:
    """Return configured origins, or local development defaults when none are set."""
    configured = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_ORIGIN") or ""
    candidates = (
        [part.strip().rstrip("/") for part in configured.split(",") if part.strip()]
        if configured
        else list(DEFAULT_ALLOWED_ORIGINS)
    )

    origins: list[str] = []
    for origin in candidates:
        if origin == "*":
            raise ValueError("Wildcard CORS origins are not permitted.")
        if not _is_http_origin(origin):
            raise ValueError(f"Invalid CORS origin: {origin!r}")
        if origin not in origins:
            origins.append(origin)
    return origins
