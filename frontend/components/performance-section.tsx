import { AlertCircle, BarChart3 } from "lucide-react";
import { MODEL_METRICS, formatPercent } from "@/lib/model-data";
import { SectionHeading } from "@/components/section-heading";

const headlineMetrics = [
  { label: "Test accuracy", value: MODEL_METRICS.evaluation.testAccuracy },
  { label: "Macro precision", value: MODEL_METRICS.evaluation.macroPrecision },
  { label: "Macro recall", value: MODEL_METRICS.evaluation.macroRecall },
  { label: "Macro F1", value: MODEL_METRICS.evaluation.macroF1 },
  { label: "Weighted F1", value: MODEL_METRICS.evaluation.weightedF1 },
];

export function PerformanceSection() {
  return (
    <section className="section performance-section" id="performance">
      <div className="container">
        <SectionHeading
          eyebrow="Measured performance"
          title="Real results, without inflated claims"
          description="These figures come from the saved model_metrics.json produced by the completed training run—not from the live API and not from estimates in the interface."
          inverse
        />

        <div className="metrics-layout">
          <div className="metric-cards">
            {headlineMetrics.map((metric, index) => (
              <article className={index === 0 ? "metric-card metric-card--featured" : "metric-card"} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{formatPercent(metric.value, 2)}</strong>
                <div className="metric-card__track" aria-hidden="true">
                  <i style={{ width: `${metric.value * 100}%` }} />
                </div>
              </article>
            ))}
            <article className="metric-card">
              <span>Held-out test images</span>
              <strong>{MODEL_METRICS.dataset.testImages}</strong>
              <small>Never used for model selection</small>
            </article>
          </div>

          <div className="class-performance">
            <div className="class-performance__header">
              <div>
                <BarChart3 size={20} aria-hidden="true" />
                <h3>Per-class F1 score</h3>
              </div>
              <span>Test support</span>
            </div>
            <div className="class-performance__rows">
              {MODEL_METRICS.perClass.map((item) => (
                <div className="class-row" key={item.class}>
                  <span>{item.displayName}</span>
                  <div className="class-row__bar" aria-hidden="true">
                    <i style={{ width: `${item.f1 * 100}%` }} />
                  </div>
                  <strong>{formatPercent(item.f1)}</strong>
                  <small>n={item.support}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="performance-note">
          <AlertCircle size={21} aria-hidden="true" />
          <p>
            The model achieved about 85% accuracy on its held-out TrashNet test set.
            Real-world performance may differ because lighting, backgrounds, object
            condition, and mixed materials can differ from the training dataset. The
            <strong> trash</strong> class had only 20 test examples and the weakest F1
            score (65%), so its result deserves extra caution.
          </p>
        </div>
      </div>
    </section>
  );
}
