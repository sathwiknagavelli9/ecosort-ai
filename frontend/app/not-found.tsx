import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <main className="route-message">
      <div>
        <Leaf size={34} aria-hidden="true" />
        <span className="eyebrow">404 · Not found</span>
        <h1>This path is outside the sorting stream.</h1>
        <p>Return to EcoSort AI to classify a waste image with the trained model.</p>
        <Link className="button button--primary" href="/">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to EcoSort AI
        </Link>
      </div>
    </main>
  );
}

