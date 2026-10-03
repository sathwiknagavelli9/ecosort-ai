import { ArrowDown, ArrowRight, Leaf, ScanLine, Sparkles } from "lucide-react";
import { MODEL_METRICS, formatPercent } from "@/lib/model-data";

const categoryLabels = [
  "Cardboard",
  "Glass",
  "Metal",
  "Paper",
  "Plastic",
  "Trash",
];

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__glow hero__glow--one" aria-hidden="true" />
      <div className="hero__glow hero__glow--two" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__badge">
            <Sparkles size={14} aria-hidden="true" />
            B.Tech deep learning project
          </div>
          <h1>
            Scan. Sort.
            <span>Recycle smarter.</span>
          </h1>
          <p className="hero__lead">
            Upload a waste image and let a real MobileNetV2 model classify it as
            cardboard, glass, metal, paper, plastic, or trash—then get clear,
            responsible disposal guidance.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="#classifier">
              Classify waste
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="text-link" href="#how-it-works">
              See how it works
              <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="hero__model-note">
            <span aria-hidden="true" />
            Powered by transfer learning on TrashNet. Confidence is an estimate,
            not a guarantee.
          </p>
        </div>

        <section
          className="hero-visual"
          aria-label="The six categories recognized by EcoSort AI"
        >
          <div className="hero-visual__topline">
            <span className="status-dot" aria-hidden="true" />
            <span>Visual classification pipeline</span>
            <span className="hero-visual__tag">6 classes</span>
          </div>
          <div className="material-map">
            <div className="material-map__rings" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="material-map__core">
              <span className="material-map__icon" aria-hidden="true">
                <ScanLine size={30} />
              </span>
              <strong>EcoSort</strong>
              <small>224 × 224 RGB</small>
            </div>
            <div className="material-map__labels">
              {categoryLabels.map((label, index) => (
                <span key={label} className={`material-label material-label--${index + 1}`}>
                  <i aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="hero-visual__footer">
            <div>
              <Leaf size={16} aria-hidden="true" />
              <span>General guidance after every prediction</span>
            </div>
            <span>MobileNetV2</span>
          </div>
        </section>
      </div>

      <section className="container hero-stats" aria-label="Project summary">
        <div>
          <strong>{formatPercent(MODEL_METRICS.evaluation.testAccuracy, 2)}</strong>
          <span>Held-out test accuracy</span>
        </div>
        <div>
          <strong>{MODEL_METRICS.dataset.usableImages.toLocaleString("en-US")}</strong>
          <span>Usable TrashNet images</span>
        </div>
        <div>
          <strong>{MODEL_METRICS.classes.length}</strong>
          <span>Material categories</span>
        </div>
        <div>
          <strong>Real model</strong>
          <span>No simulated classifications</span>
        </div>
      </section>
    </section>
  );
}
