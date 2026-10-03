import {
  BrainCircuit,
  ChevronRight,
  ImageDown,
  Recycle,
  ScanSearch,
  UploadCloud,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Choose or capture a clear photo with one main waste item.",
    icon: UploadCloud,
  },
  {
    number: "02",
    title: "Preprocess",
    description: "The image is oriented, converted to RGB, and resized to 224 × 224.",
    icon: ImageDown,
  },
  {
    number: "03",
    title: "Extract features",
    description: "MobileNetV2 identifies useful visual patterns learned through transfer learning.",
    icon: BrainCircuit,
  },
  {
    number: "04",
    title: "Classify",
    description: "A softmax layer ranks all six categories by model confidence.",
    icon: ScanSearch,
  },
  {
    number: "05",
    title: "Get guidance",
    description: "Deterministic advice explains a responsible next step for the result.",
    icon: Recycle,
  },
];

export function ProcessSection() {
  return (
    <section className="section process-section" id="how-it-works">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="From photo to practical guidance"
          description="One focused request flows from your browser to the trained model and back. Images are processed for prediction, not permanently stored by this interface."
        />

        <div className="process-flow">
          {steps.map((step, index) => (
            <div className="process-step-wrap" key={step.number}>
              <article className="process-step">
                <div className="process-step__top">
                  <span>{step.number}</span>
                  <step.icon size={22} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
              {index < steps.length - 1 ? (
                <ChevronRight className="process-arrow" size={18} aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>

        <div
          className="architecture-strip"
          role="img"
          aria-label="EcoSort AI deployment architecture: browser to FastAPI to model to result"
        >
          <div>
            <span>01</span>
            <strong>Browser</strong>
            <small>Next.js on Vercel</small>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>02</span>
            <strong>Secure API</strong>
            <small>FastAPI on Render</small>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>03</span>
            <strong>ML inference</strong>
            <small>Trained MobileNetV2</small>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>04</span>
            <strong>Result</strong>
            <small>Prediction + guidance</small>
          </div>
        </div>
      </div>
    </section>
  );
}
