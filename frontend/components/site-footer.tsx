import { ArrowUp, Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div>
          <a className="brand brand--footer" href="#top" aria-label="EcoSort AI home">
            <span className="brand__mark" aria-hidden="true">
              <Leaf size={19} strokeWidth={2.4} />
            </span>
            <span className="brand__name">
              EcoSort <strong>AI</strong>
            </span>
          </a>
          <p>Smart waste classification and responsible recycling guidance using deep learning.</p>
        </div>
        <div className="site-footer__links">
          <a href="#classifier">Classifier</a>
          <a href="#categories">Categories</a>
          <a href="#how-it-works">How it works</a>
          <a href="#performance">Performance</a>
          <a href="#about">Model &amp; limits</a>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>
          <Leaf size={17} aria-hidden="true" />
          MobileNetV2 waste classification
        </span>
        <p>General guidance only · Always follow local disposal rules</p>
        <a href="#top" aria-label="Back to top">
          Back to top
          <ArrowUp size={16} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
