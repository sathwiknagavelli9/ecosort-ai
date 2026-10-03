from __future__ import annotations

from io import BytesIO

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.inference import ModelService, build_prediction_response
from app.main import create_app


class FakeModelService(ModelService):
    def __init__(self) -> None:
        super().__init__()
        self._loaded_for_tests = True
        self.runtime_version = "test runtime"

    @property
    def loaded(self) -> bool:
        return self._loaded_for_tests

    def load(self) -> None:
        self._loaded_for_tests = True

    def predict(self, _image: Image.Image):
        return build_prediction_response(
            np.array([0.04, 0.08, 0.71, 0.07, 0.06, 0.04], dtype=np.float64),
            self.class_names,
            self.confidence_threshold,
        )


@pytest.fixture(scope="session")
def fake_service() -> FakeModelService:
    return FakeModelService()


@pytest.fixture()
def client(fake_service: FakeModelService):
    with TestClient(create_app(fake_service)) as test_client:
        yield test_client


def make_image_bytes(image_format: str, size: tuple[int, int] = (96, 72)) -> bytes:
    width, height = size
    x = np.linspace(0, 255, width, dtype=np.uint8)
    y = np.linspace(0, 255, height, dtype=np.uint8)[:, None]
    pixels = np.empty((height, width, 3), dtype=np.uint8)
    pixels[..., 0] = x
    pixels[..., 1] = y
    pixels[..., 2] = (x[None, :] // 2 + y // 2).astype(np.uint8)
    image = Image.fromarray(pixels, mode="RGB")
    output = BytesIO()
    image.save(output, format=image_format)
    return output.getvalue()

