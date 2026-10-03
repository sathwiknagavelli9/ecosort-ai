import type {
  PredictionResponse,
  RankedPrediction,
  RecyclingGuidance,
  WasteClass,
} from "@/types/prediction";

export const PREDICTION_TIMEOUT_MS = 120_000;

const WASTE_CLASSES = new Set<WasteClass>([
  "cardboard",
  "glass",
  "metal",
  "paper",
  "plastic",
  "trash",
]);

export type PredictionErrorCode =
  | "configuration"
  | "timeout"
  | "network"
  | "http"
  | "invalid-response";

export class PredictionApiError extends Error {
  constructor(
    message: string,
    public readonly code: PredictionErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PredictionApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProbability(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function parseRankedPrediction(value: unknown): RankedPrediction | null {
  if (!isRecord(value)) {
    return null;
  }

  const className = value.class;
  const displayName = value.display_name;
  const confidence = value.confidence;

  if (
    typeof className !== "string" ||
    !WASTE_CLASSES.has(className as WasteClass) ||
    typeof displayName !== "string" ||
    displayName.trim().length === 0 ||
    !isProbability(confidence)
  ) {
    return null;
  }

  return {
    class: className as WasteClass,
    display_name: displayName,
    confidence,
  };
}

function parseGuidance(value: unknown): RecyclingGuidance | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    (typeof value.recyclable !== "boolean" && value.recyclable !== null) ||
    typeof value.category !== "string" ||
    typeof value.recommendation !== "string" ||
    typeof value.local_rules_note !== "string"
  ) {
    return null;
  }

  return {
    recyclable: value.recyclable,
    category: value.category,
    recommendation: value.recommendation,
    local_rules_note: value.local_rules_note,
  };
}

function parsePredictionResponse(value: unknown): PredictionResponse {
  if (!isRecord(value)) {
    throw new PredictionApiError(
      "The classifier returned an unreadable response. Please try again.",
      "invalid-response",
    );
  }

  const prediction = parseRankedPrediction(value.prediction);
  const topPredictions = Array.isArray(value.top_predictions)
    ? value.top_predictions.map(parseRankedPrediction)
    : [];
  const recycling = parseGuidance(value.recycling);

  if (
    !prediction ||
    topPredictions.length !== 3 ||
    topPredictions.some((item) => item === null) ||
    typeof value.uncertain !== "boolean" ||
    !recycling
  ) {
    throw new PredictionApiError(
      "The classifier returned an unexpected response. Please try again later.",
      "invalid-response",
    );
  }

  const validTopPredictions = topPredictions as RankedPrediction[];
  if (
    validTopPredictions.some(
      (item, index) =>
        index > 0 &&
        item.confidence > validTopPredictions[index - 1].confidence,
    )
  ) {
    throw new PredictionApiError(
      "The classifier returned invalid prediction rankings. Please try again later.",
      "invalid-response",
    );
  }

  return {
    prediction,
    top_predictions: validTopPredictions,
    uncertain: value.uncertain,
    uncertainty_message:
      typeof value.uncertainty_message === "string"
        ? value.uncertainty_message
        : undefined,
    recycling,
  };
}

function extractApiMessage(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.detail === "string") {
    return value.detail;
  }

  if (typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function messageForStatus(status: number, apiMessage: string | null): string {
  switch (status) {
    case 400:
    case 422:
      return apiMessage ?? "This file could not be read as a valid image.";
    case 413:
      return "This image is too large for the classifier. Choose a file no larger than 8 MiB.";
    case 415:
      return "This image format is not supported. Use a JPEG, PNG, or WEBP file.";
    case 429:
      return "The classifier is busy right now. Wait a moment, then try again.";
    case 503:
      return "The model is temporarily unavailable. Please try again shortly.";
    default:
      return status >= 500
        ? "The classifier encountered a server error. Please try again shortly."
        : apiMessage ?? "The prediction request could not be completed.";
  }
}

export async function predictWaste(file: File): Promise<PredictionResponse> {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    throw new PredictionApiError(
      "The classifier service is not configured for this site.",
      "configuration",
    );
  }

  const baseUrl = configuredBaseUrl.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    PREDICTION_TIMEOUT_MS,
  );

  const formData = new FormData();
  formData.append("file", file, file.name);

  try {
    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new PredictionApiError(
        messageForStatus(response.status, extractApiMessage(payload)),
        "http",
        response.status,
      );
    }

    return parsePredictionResponse(payload);
  } catch (error) {
    if (error instanceof PredictionApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PredictionApiError(
        "The classifier took longer than two minutes to respond. It may be starting up—please try once more.",
        "timeout",
      );
    }

    throw new PredictionApiError(
      "We could not reach the classifier. Check your connection and try again.",
      "network",
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}
