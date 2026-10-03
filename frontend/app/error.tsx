"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="route-message">
      <div>
        <AlertTriangle size={34} aria-hidden="true" />
        <span className="eyebrow">Application error</span>
        <h1>Something interrupted this page.</h1>
        <p>The trained model has not produced a fallback result. You can safely try loading the page again.</p>
        <button className="button button--primary" type="button" onClick={reset}>
          <RefreshCw size={17} aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}

