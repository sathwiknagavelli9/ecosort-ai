from __future__ import annotations

import json
import math
import threading
import warnings
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from .config import (
    CLASS_NAMES_PATH,
    CONFIDENCE_THRESHOLD,
    MAX_IMAGE_DIMENSION,
    MAX_IMAGE_PIXELS,
    MODEL_METRICS_PATH,
    MODEL_PATH,
)
from .recommendations import get_recommendation, supported_recommendation_classes
from .schemas import ModelInfoResponse, PredictionResponse, RankedPrediction

SUPPORTED_IMAGE_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
MIME_TO_FORMAT = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


class ModelContractError(RuntimeError):
    """Raised when a saved artifact violates the documented model contract."""


class ImageValidationError(ValueError):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class ArtifactMetadata:
    class_names: tuple[str, ...]
    input_shape: tuple[int, int, int]
    input_dtype: str
    preprocessing: str
    output_description: str
    metrics: dict[str, Any]


def _read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ModelContractError(f"Expected a JSON object in {path.name}.")
    return value


def load_artifact_metadata(
    class_names_path: Path = CLASS_NAMES_PATH,
    metrics_path: Path = MODEL_METRICS_PATH,
) -> ArtifactMetadata:
    mapping = _read_json(class_names_path)
    metrics = _read_json(metrics_path)

    class_names_value = mapping.get("class_names")
    if not isinstance(class_names_value, list) or not all(
        isinstance(item, str) and item for item in class_names_value
    ):
        raise ModelContractError("class_names.json does not contain a valid ordered class list.")
    class_names = tuple(class_names_value)
    if len(class_names) != 6 or len(set(class_names)) != 6:
        raise ModelContractError("EcoSort requires exactly six unique output classes.")

    class_to_index = mapping.get("class_to_index")
    expected_indices = {name: index for index, name in enumerate(class_names)}
    if class_to_index != expected_indices:
        raise ModelContractError("class_to_index does not match class_names order.")

    index_to_class = mapping.get("index_to_class")
    if index_to_class != {str(index): name for index, name in enumerate(class_names)}:
        raise ModelContractError("index_to_class does not match class_names order.")

    input_shape_value = mapping.get("input_shape")
    if input_shape_value != [224, 224, 3]:
        raise ModelContractError(f"Unsupported model input shape: {input_shape_value!r}.")
    if mapping.get("input_dtype") != "float32":
        raise ModelContractError("The saved input dtype must be float32.")
    if mapping.get("raw_input_range") != [0, 255]:
        raise ModelContractError("The saved raw input range must be [0, 255].")

    preprocessing = mapping.get("preprocessing")
    if not isinstance(preprocessing, dict) or preprocessing.get("included_in_model") is not True:
        raise ModelContractError("MobileNetV2 preprocessing must be embedded in the model.")
    operation = preprocessing.get("operation")
    if operation != "x / 127.5 - 1.0":
        raise ModelContractError(f"Unexpected embedded preprocessing: {operation!r}.")

    labels = metrics.get("confusion_matrix_labels")
    if labels != list(class_names):
        raise ModelContractError("Metrics labels do not match class_names order.")

    return ArtifactMetadata(
        class_names=class_names,
        input_shape=(224, 224, 3),
        input_dtype="float32",
        preprocessing=operation,
        output_description=str(mapping.get("output", "")),
        metrics=metrics,
    )


def decode_uploaded_image(payload: bytes, content_type: str | None) -> Image.Image:
    normalized_content_type = (content_type or "").split(";", 1)[0].strip().lower()
    expected_format = MIME_TO_FORMAT.get(normalized_content_type)
    if expected_format is None:
        raise ImageValidationError(
            "Unsupported media type. Upload a JPEG, PNG, or WEBP image.", status_code=415
        )
    if not payload:
        raise ImageValidationError("The uploaded image is empty.")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(payload)) as probe:
                detected_format = (probe.format or "").upper()
                width, height = probe.size
                probe.verify()

            if detected_format not in SUPPORTED_IMAGE_FORMATS:
                raise ImageValidationError(
                    "Unsupported image content. Upload a JPEG, PNG, or WEBP image.", status_code=415
                )
            if detected_format != expected_format:
                raise ImageValidationError(
                    "The declared media type does not match the image content.", status_code=415
                )
            if width < 1 or height < 1:
                raise ImageValidationError("The image has invalid dimensions.")
            if (
                width > MAX_IMAGE_DIMENSION
                or height > MAX_IMAGE_DIMENSION
                or width * height > MAX_IMAGE_PIXELS
            ):
                raise ImageValidationError(
                    "The image dimensions are too large to process safely.", status_code=413
                )

            with Image.open(BytesIO(payload)) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")
                image.load()
                return image.copy()
    except ImageValidationError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ImageValidationError(
            "The image dimensions are too large to process safely.", status_code=413
        ) from exc
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise ImageValidationError("The uploaded file is corrupt or is not a valid image.") from exc


def coerce_probabilities(
    raw_output: Any,
    expected_classes: int,
    *,
    output_is_softmax: bool | None,
) -> np.ndarray:
    values = np.asarray(raw_output, dtype=np.float64)
    if values.ndim == 2 and values.shape[0] == 1:
        values = values[0]
    if values.ndim != 1 or values.shape[0] != expected_classes:
        raise ModelContractError(
            f"Expected {expected_classes} model outputs, received shape {values.shape}."
        )
    if not np.all(np.isfinite(values)):
        raise ModelContractError("Model output contains NaN or infinite values.")

    looks_like_probabilities = bool(
        np.all(values >= -1e-6)
        and np.all(values <= 1.0 + 1e-6)
        and math.isclose(float(values.sum()), 1.0, rel_tol=0.0, abs_tol=1e-4)
    )
    if output_is_softmax is True and not looks_like_probabilities:
        raise ModelContractError("The declared softmax output is not a valid probability vector.")

    if looks_like_probabilities:
        probabilities = np.clip(values, 0.0, 1.0)
        probabilities /= probabilities.sum()
    else:
        shifted = values - np.max(values)
        exponentials = np.exp(shifted)
        probabilities = exponentials / exponentials.sum()

    if not np.all(np.isfinite(probabilities)) or not math.isclose(
        float(probabilities.sum()), 1.0, rel_tol=0.0, abs_tol=1e-6
    ):
        raise ModelContractError("Could not produce a valid probability distribution.")
    return probabilities.astype(np.float64, copy=False)


def build_prediction_response(
    probabilities: np.ndarray,
    class_names: tuple[str, ...],
    threshold: float = CONFIDENCE_THRESHOLD,
) -> PredictionResponse:
    if probabilities.shape != (len(class_names),):
        raise ModelContractError("Probability count does not match the class mapping.")
    ranked_indices = np.argsort(-probabilities, kind="stable")
    top_index = int(ranked_indices[0])

    def ranked(index: int) -> RankedPrediction:
        class_name = class_names[index]
        return RankedPrediction(
            class_name=class_name,
            display_name=class_name.title(),
            confidence=float(probabilities[index]),
        )

    top_prediction = ranked(top_index)
    uncertain = top_prediction.confidence < threshold
    return PredictionResponse(
        prediction=top_prediction,
        top_predictions=[ranked(int(index)) for index in ranked_indices[:3]],
        uncertain=uncertain,
        uncertainty_message=(
            "Low-confidence prediction. Try a clearer photo with one waste item centered in the image."
            if uncertain
            else None
        ),
        recycling=get_recommendation(class_names[top_index]),
    )


class ModelService:
    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        class_names_path: Path = CLASS_NAMES_PATH,
        metrics_path: Path = MODEL_METRICS_PATH,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
    ) -> None:
        self.model_path = model_path
        self.metadata = load_artifact_metadata(class_names_path, metrics_path)
        if tuple(supported_recommendation_classes()) != self.metadata.class_names:
            raise ModelContractError("Recommendation mapping does not match model class order.")
        self.confidence_threshold = confidence_threshold
        self._model: Any | None = None
        self._tf: Any | None = None
        self._inference_lock = threading.Lock()
        self._output_is_softmax: bool | None = None
        self.runtime_version = "not loaded"

    @property
    def loaded(self) -> bool:
        return self._model is not None

    @property
    def class_names(self) -> tuple[str, ...]:
        return self.metadata.class_names

    def load(self) -> None:
        if self.loaded:
            return
        if not self.model_path.is_file():
            raise ModelContractError("The trained model artifact is missing.")

        import keras
        import tensorflow as tf

        model = keras.models.load_model(self.model_path, compile=False)
        input_shape = tuple(int(value) for value in model.input_shape[1:])
        if input_shape != self.metadata.input_shape:
            raise ModelContractError(
                f"Model input shape {input_shape} does not match {self.metadata.input_shape}."
            )
        if tuple(model.output_shape) != (None, len(self.class_names)):
            raise ModelContractError(f"Unexpected model output shape: {model.output_shape!r}.")

        final_config = model.layers[-1].get_config()
        activation = str(final_config.get("activation", "")).lower()
        self._output_is_softmax = activation == "softmax"
        self._tf = tf
        self._model = model
        self.runtime_version = f"TensorFlow {tf.__version__} / Keras {keras.__version__}"

    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        if self._tf is None:
            raise RuntimeError("The model runtime has not been loaded.")
        pixels = np.asarray(image, dtype=np.uint8)
        if pixels.ndim != 3 or pixels.shape[2] != 3:
            raise ImageValidationError("The decoded image is not RGB.")
        tensor = self._tf.convert_to_tensor(pixels)
        tensor = self._tf.image.resize(
            tensor,
            self.metadata.input_shape[:2],
            method="bilinear",
            antialias=True,
        )
        tensor = self._tf.cast(tensor, self._tf.float32)
        batch = self._tf.expand_dims(tensor, axis=0)
        return np.asarray(batch.numpy(), dtype=np.float32)

    def predict_probabilities(self, image: Image.Image) -> np.ndarray:
        if self._model is None:
            raise RuntimeError("The trained model is unavailable.")
        batch = self.preprocess_image(image)
        with self._inference_lock:
            raw_output = self._model(batch, training=False)
            if hasattr(raw_output, "numpy"):
                raw_output = raw_output.numpy()
        return coerce_probabilities(
            raw_output,
            len(self.class_names),
            output_is_softmax=self._output_is_softmax,
        )

    def predict(self, image: Image.Image) -> PredictionResponse:
        probabilities = self.predict_probabilities(image)
        return build_prediction_response(
            probabilities, self.class_names, self.confidence_threshold
        )

    def model_info(self) -> ModelInfoResponse:
        test_metrics = self.metadata.metrics["test_metrics"]
        test_samples = int(self.metadata.metrics["splits"]["sizes"]["test"])
        return ModelInfoResponse(
            model=str(self.metadata.metrics["model"]),
            architecture=(
                "Embedded training augmentation (inactive at inference) -> Rescaling -> "
                "MobileNetV2 -> GlobalAveragePooling2D -> Dropout(0.35) -> Dense(6, softmax)"
            ),
            runtime=self.runtime_version,
            input_shape=list(self.metadata.input_shape),
            input_dtype=self.metadata.input_dtype,
            preprocessing=f"{self.metadata.preprocessing} (embedded in model)",
            output=self.metadata.output_description,
            classes=list(self.class_names),
            supported_categories=len(self.class_names),
            confidence_threshold=self.confidence_threshold,
            test_accuracy=float(test_metrics["accuracy"]),
            macro_precision=float(test_metrics["precision_macro"]),
            macro_recall=float(test_metrics["recall_macro"]),
            macro_f1=float(test_metrics["f1_macro"]),
            weighted_f1=float(test_metrics["f1_weighted"]),
            test_samples=test_samples,
        )

