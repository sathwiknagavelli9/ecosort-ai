export type WasteClass =
  | "cardboard"
  | "glass"
  | "metal"
  | "paper"
  | "plastic"
  | "trash";

export type RankedPrediction = {
  class: WasteClass;
  display_name: string;
  confidence: number;
};

export type RecyclingGuidance = {
  recyclable: boolean | null;
  category: string;
  recommendation: string;
  local_rules_note: string;
};

export type PredictionResponse = {
  prediction: RankedPrediction;
  top_predictions: RankedPrediction[];
  uncertain: boolean;
  uncertainty_message?: string;
  recycling: RecyclingGuidance;
};
