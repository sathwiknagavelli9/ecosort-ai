import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Recycle,
  RotateCcw,
} from "lucide-react";
import { formatPercent } from "@/lib/model-data";
import type { PredictionResponse } from "@/types/prediction";

type PredictionResultProps = {
  result: PredictionResponse;
  onClassifyAnother: () => void;
};

function recyclingLabel(value: boolean | null): string {
  if (value === true) {
    return "Commonly recyclable";
  }
  if (value === false) {
    return "Residual-waste guidance";
  }
  return "Acceptance varies locally";
}

export function PredictionResult({
  result,
  onClassifyAnother,
}: PredictionResultProps) {
  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <div className="result-panel__header">
        <div>
          <span className="eyebrow">Classification result</span>
          <p>Real output from the trained six-class model</p>
        </div>
        <span
          className={
            result.uncertain
              ? "confidence-status confidence-status--low"
              : "confidence-status confidence-status--high"
          }
        >
          {result.uncertain ? (
            <AlertTriangle size={15} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={15} aria-hidden="true" />
          )}
          {result.uncertain ? "Low confidence" : "Higher confidence"}
        </span>
      </div>

      <div className="result-primary">
        <div className="result-primary__label">
          <span>Predicted category</span>
          <h3 id="result-heading">{result.prediction.display_name}</h3>
        </div>
        <div
          className="confidence-ring"
          role="img"
          style={{ "--confidence": `${result.prediction.confidence * 360}deg` } as React.CSSProperties}
          aria-label={`Model confidence ${formatPercent(result.prediction.confidence)}`}
        >
          <div>
            <strong>{formatPercent(result.prediction.confidence)}</strong>
            <span>confidence</span>
          </div>
        </div>
      </div>

      {result.uncertain ? (
        <div className="uncertainty-note" role="status">
          <AlertTriangle size={19} aria-hidden="true" />
          <p>{result.uncertainty_message ?? "The model is uncertain about this image."}</p>
        </div>
      ) : (
        <div className="confidence-note">
          <Info size={17} aria-hidden="true" />
          <span>Confidence is a model score, not a guarantee of correctness.</span>
        </div>
      )}

      <section className="ranking" aria-labelledby="ranking-heading">
        <div className="ranking__heading">
          <h4 id="ranking-heading">Top three predictions</h4>
          <span>Model probability</span>
        </div>
        <ol>
          {result.top_predictions.map((item, index) => (
            <li key={item.class}>
              <span className="ranking__position">0{index + 1}</span>
              <span className="ranking__name">{item.display_name}</span>
              <span className="ranking__bar" aria-hidden="true">
                <i style={{ width: `${item.confidence * 100}%` }} />
              </span>
              <strong>{formatPercent(item.confidence)}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="guidance-card" aria-labelledby="guidance-heading">
        <div className="guidance-card__icon" aria-hidden="true">
          <Recycle size={24} />
        </div>
        <div>
          <span>{recyclingLabel(result.recycling.recyclable)}</span>
          <h4 id="guidance-heading">{result.recycling.category}</h4>
          <p>{result.recycling.recommendation}</p>
          <small>{result.recycling.local_rules_note}</small>
        </div>
      </section>

      <button className="button button--dark result-panel__reset" type="button" onClick={onClassifyAnother}>
        <RotateCcw size={17} aria-hidden="true" />
        Classify another image
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
