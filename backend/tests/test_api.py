from __future__ import annotations

import pytest

from app.config import DEFAULT_ALLOWED_ORIGINS, MAX_UPLOAD_BYTES, get_allowed_origins
from tests.conftest import make_image_bytes


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "name": "EcoSort AI API",
        "status": "ok",
        "documentation": "/docs",
    }


def test_cors_defaults_are_local_only_when_unconfigured(monkeypatch):
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    monkeypatch.delenv("FRONTEND_ORIGIN", raising=False)
    assert get_allowed_origins() == list(DEFAULT_ALLOWED_ORIGINS)


def test_configured_cors_replaces_local_defaults(monkeypatch):
    production_origin = "https://ecosort-ai.example"
    monkeypatch.setenv("ALLOWED_ORIGINS", production_origin)
    assert get_allowed_origins() == [production_origin]


def test_health_reports_loaded_model(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_loaded"] is True
    assert response.json()["supported_categories"] == 6


def test_model_info_uses_saved_metrics(client):
    response = client.get("/model-info")
    assert response.status_code == 200
    body = response.json()
    assert body["classes"] == ["cardboard", "glass", "metal", "paper", "plastic", "trash"]
    assert body["input_shape"] == [224, 224, 3]
    assert body["test_accuracy"] == pytest.approx(0.850415512465374)
    assert body["macro_f1"] == pytest.approx(0.8259942272207406)
    assert body["weighted_f1"] == pytest.approx(0.8493687824131492)
    assert body["test_samples"] == 361
    assert body["confidence_threshold"] == 0.60


@pytest.mark.parametrize(
    ("image_format", "mime", "filename"),
    [
        ("JPEG", "image/jpeg", "sample.jpg"),
        ("PNG", "image/png", "sample.png"),
        ("WEBP", "image/webp", "sample.webp"),
    ],
)
def test_predict_accepts_supported_images(client, image_format, mime, filename):
    response = client.post(
        "/predict", files={"file": (filename, make_image_bytes(image_format), mime)}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["prediction"] == {
        "class": "metal",
        "display_name": "Metal",
        "confidence": pytest.approx(0.71),
    }
    assert [item["class"] for item in body["top_predictions"]] == ["metal", "glass", "paper"]
    assert body["uncertain"] is False
    assert body["recycling"]["recyclable"] is True


def test_predict_rejects_invalid_mime(client):
    response = client.post(
        "/predict", files={"file": ("sample.txt", b"plain text", "text/plain")}
    )
    assert response.status_code == 415
    assert "JPEG, PNG, or WEBP" in response.json()["detail"]


def test_predict_rejects_mime_spoof(client):
    response = client.post(
        "/predict", files={"file": ("pretend.jpg", b"not an image", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "not a valid image" in response.json()["detail"]


def test_predict_rejects_mismatched_content(client):
    response = client.post(
        "/predict",
        files={"file": ("pretend.jpg", make_image_bytes("PNG"), "image/jpeg")},
    )
    assert response.status_code == 415
    assert "does not match" in response.json()["detail"]


def test_predict_rejects_corrupt_image(client):
    response = client.post(
        "/predict", files={"file": ("broken.png", b"\x89PNG\r\n\x1a\n", "image/png")}
    )
    assert response.status_code == 400


def test_predict_rejects_oversized_upload(client):
    response = client.post(
        "/predict",
        files={"file": ("large.jpg", b"x" * (MAX_UPLOAD_BYTES + 1), "image/jpeg")},
    )
    assert response.status_code == 413
    assert "8 MiB" in response.json()["detail"]


def test_predict_requires_file_field(client):
    response = client.post("/predict")
    assert response.status_code == 422
    assert "named 'file'" in response.json()["detail"]
