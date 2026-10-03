import { ArrowUpRight, Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="brand" href="#top" aria-label="EcoSort AI home">
          <span className="brand__mark" aria-hidden="true">
            <Leaf size={19} strokeWidth={2.4} />
          </span>
          <span className="brand__name">
            EcoSort <strong>AI</strong>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#performance">Performance</a>
          <a href="#about">About the model</a>
        </nav>

        <a className="button button--small button--dark" href="#classifier">
          Classify waste
          <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </div>
    </header>
  );
}
