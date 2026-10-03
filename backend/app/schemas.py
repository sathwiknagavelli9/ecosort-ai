from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RootResponse(ApiModel):
    name: str
    status: str
    documentation: str


class HealthResponse(ApiModel):
    status: str
    model_loaded: bool
    runtime: str
    supported_categories: int


class ModelInfoResponse(ApiModel):
    model: str
    architecture: str
    runtime: str
    input_shape: list[int]
    input_dtype: str
    preprocessing: str
    output: str
    classes: list[str]
    supported_categories: int
    confidence_threshold: float
    test_accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    weighted_f1: float
    test_samples: int


class RankedPrediction(ApiModel):
    class_name: str = Field(serialization_alias="class")
    display_name: str
    confidence: float = Field(ge=0.0, le=1.0)


class RecyclingGuidance(ApiModel):
    recyclable: bool | None
    category: str
    recommendation: str
    local_rules_note: str


class PredictionResponse(ApiModel):
    prediction: RankedPrediction
    top_predictions: list[RankedPrediction] = Field(min_length=3, max_length=3)
    uncertain: bool
    uncertainty_message: str | None = None
    recycling: RecyclingGuidance

