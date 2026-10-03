import {
  AlertTriangle,
  Aperture,
  BrainCircuit,
  CheckCircle2,
  Layers3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { MODEL_METRICS } from "@/lib/model-data";
import { SectionHeading } from "@/components/section-heading";

const modelFacts = [
  {
    icon: Aperture,
    title: "Convolutional neural network",
    copy: "A CNN learns visual features such as edges, shapes, texture, and object patterns from images.",
  },
  {
    icon: BrainCircuit,
    title: "MobileNetV2 backbone",
    copy: "An efficient ImageNet-pretrained network supplies a strong starting point for a compact classifier.",
  },
  {
    icon: Layers3,
    title: "Transfer learning + fine-tuning",
    copy: "The classification head trained first, then selected upper backbone layers were refined at a lower learning rate.",
  },
  {
    icon: Sparkles,
    title: "Regularized training",
    copy: "Training-only augmentation and 35% dropout help reduce overfitting; neither changes an uploaded image at inference time.",
  },
];

const limitations = [
  "Recognizes only cardboard, glass, metal, paper, plastic, and trash.",
  "Mixed-material objects may not fit one learned category cleanly.",
  "Unusual angles, clutter, poor lighting, or partial occlusion can change a result.",
  "Dirty, crushed, or damaged objects can be harder to recognize.",
  "TrashNet photos do not represent every real-world waste setting.",
  "Model confidence is not a guarantee of correctness.",
  "Recycling acceptance and disposal policy differ by location.",
];

export function AboutSection() {
  return (
    <section className="section about-section" id="about">
      <div className="container">
        <SectionHeading
          eyebrow="About the model"
          title="A compact CNN, adapted for waste images"
          description="EcoSort AI uses transfer learning rather than claiming a network built or trained entirely from scratch. The saved artifact performs end-to-end preprocessing and six-class prediction."
        />

        <div className="about-grid">
          <div className="model-facts">
            {modelFacts.map((fact) => (
              <article className="model-fact" key={fact.title}>
                <span aria-hidden="true">
                  <fact.icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h3>{fact.title}</h3>
                  <p>{fact.copy}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="model-card" aria-label="Model configuration summary">
            <div className="model-card__header">
              <span>Selected model</span>
              <i>Validated</i>
            </div>
            <strong>{MODEL_METRICS.training.architecture}</strong>
            <p>{MODEL_METRICS.training.selectedStage} from validation-only comparison</p>
            <dl>
              <div>
                <dt>Input</dt>
                <dd>224 × 224 RGB</dd>
              </div>
              <div>
                <dt>Pretraining</dt>
                <dd>{MODEL_METRICS.training.pretrainedOn}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>6-class softmax</dd>
              </div>
              <div>
                <dt>Dropout</dt>
                <dd>{MODEL_METRICS.training.dropoutRate}</dd>
              </div>
              <div>
                <dt>Train / validation / test</dt>
                <dd>1,800 / 360 / 361</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="limitations-grid">
          <article className="limitations-card">
            <div className="limitations-card__title">
              <AlertTriangle size={22} aria-hidden="true" />
              <div>
                <span>Know the boundaries</span>
                <h3>Model limitations</h3>
              </div>
            </div>
            <ul>
              {limitations.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="limitations-card__example">
              For example, a chip packet can contain multiple materials and may not
              cleanly fit any one of the six classes.
            </p>
          </article>

          <article className="responsible-card">
            <span className="responsible-card__icon" aria-hidden="true">
              <ShieldAlert size={27} />
            </span>
            <span className="eyebrow">Responsible use</span>
            <h3>Useful guidance—not disposal authority</h3>
            <p>
              EcoSort AI is an educational deep learning project. Its recommendations
              are general and should never replace local regulated-disposal guidance.
            </p>
            <div>
              <span>Do not rely on it alone for</span>
              <ul>
                <li>Hazardous or medical waste</li>
                <li>Batteries and electronics</li>
                <li>Chemicals or regulated items</li>
              </ul>
            </div>
            <strong>When in doubt, follow your local authority&apos;s instructions.</strong>
          </article>
        </div>
      </div>
    </section>
  );
}
