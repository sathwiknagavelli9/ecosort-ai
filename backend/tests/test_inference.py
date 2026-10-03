from __future__ import annotations

import math

import numpy as np
import pytest
from PIL import Image

from app.inference import (
    ModelContractError,
    ModelService,
    build_prediction_response,
    coerce_probabilities,
    load_artifact_metadata,
)


EXPECTED_CLASSES = ("cardboard", "glass", "metal", "paper", "plastic", "trash")


def test_authoritative_class_mapping_and_preprocessing():
    metadata = load_artifact_metadata()
    assert metadata.class_names == EXPECTED_CLASSES
    assert metadata.input_shape == (224, 224, 3)
    assert metadata.input_dtype == "float32"
    assert metadata.preprocessing == "x / 127.5 - 1.0"


def test_softmax_probabilities_are_not_applied_twice():
    original = np.array([[0.05, 0.10, 0.15, 0.20, 0.25, 0.25]], dtype=np.float32)
    result = coerce_probabilities(original, 6, output_is_softmax=True)
    assert np.allclose(result, original[0], atol=1e-7)


def test_logits_are_converted_programmatically():
    result = coerce_probabilities(
        np.array([[2.0, 1.0, 0.0, -1.0, -2.0, -3.0]]),
        6,
        output_is_softmax=False,
    )
    assert math.isclose(float(result.sum()), 1.0, abs_tol=1e-7)
    assert np.all(result >= 0.0) and np.all(result <= 1.0)
    assert int(np.argmax(result)) == 0


@pytest.mark.parametrize(
    "invalid",
    [
        np.array([0.5, 0.5]),
        np.array([0.2, 0.2, 0.2, 0.2, np.nan, 0.0]),
        np.array([0.2, 0.2, 0.2, 0.2, np.inf, 0.0]),
    ],
)
def test_invalid_model_outputs_are_rejected(invalid):
    with pytest.raises(ModelContractError):
        coerce_probabilities(invalid, 6, output_is_softmax=None)


def test_top_three_are_sorted_and_argmax_is_prediction():
    probabilities = np.array([0.02, 0.11, 0.52, 0.21, 0.09, 0.05])
    response = build_prediction_response(probabilities, EXPECTED_CLASSES)
    assert response.prediction.class_name == "metal"
    assert response.prediction.confidence == pytest.approx(float(probabilities.max()))
    confidences = [item.confidence for item in response.top_predictions]
    assert confidences == sorted(confidences, reverse=True)
    assert [item.class_name for item in response.top_predictions] == ["metal", "paper", "glass"]


def test_low_confidence_policy_keeps_prediction_and_warns():
    probabilities = np.array([0.21, 0.19, 0.17, 0.16, 0.15, 0.12])
    response = build_prediction_response(probabilities, EXPECTED_CLASSES, threshold=0.60)
    assert response.prediction.class_name == "cardboard"
    assert response.uncertain is True
    assert response.uncertainty_message is not None
    assert "clearer photo" in response.uncertainty_message


@pytest.fixture(scope="session")
def real_service() -> ModelService:
    service = ModelService()
    service.load()
    return service


@pytest.mark.integration
def test_real_model_loads_with_expected_contract(real_service: ModelService):
    assert real_service.loaded
    assert real_service.class_names == EXPECTED_CLASSES
    info = real_service.model_info()
    assert info.input_shape == [224, 224, 3]
    assert info.supported_categories == 6
    assert "TensorFlow" in info.runtime and "Keras" in info.runtime


@pytest.mark.integration
def test_real_model_inference_is_finite_and_sorted(real_service: ModelService):
    x = np.linspace(0, 255, 320, dtype=np.uint8)
    y = np.linspace(0, 255, 240, dtype=np.uint8)[:, None]
    pixels = np.empty((240, 320, 3), dtype=np.uint8)
    pixels[..., 0] = x
    pixels[..., 1] = y
    pixels[..., 2] = ((x[None, :].astype(np.uint16) + y.astype(np.uint16)) // 2).astype(np.uint8)
    image = Image.fromarray(pixels, mode="RGB")

    batch = real_service.preprocess_image(image)
    assert batch.shape == (1, 224, 224, 3)
    assert batch.dtype == np.float32
    assert float(batch.min()) >= 0.0 and float(batch.max()) <= 255.0

    probabilities = real_service.predict_probabilities(image)
    assert probabilities.shape == (6,)
    assert np.all(np.isfinite(probabilities))
    assert np.all(probabilities >= 0.0) and np.all(probabilities <= 1.0)
    assert float(probabilities.sum()) == pytest.approx(1.0, abs=1e-6)
    response = real_service.predict(image)
    assert response.prediction.class_name == EXPECTED_CLASSES[int(np.argmax(probabilities))]
    assert [item.confidence for item in response.top_predictions] == sorted(
        [item.confidence for item in response.top_predictions], reverse=True
    )

