import {
  Badge,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  FormField,
  TerminalIcon,
} from "@momoi-labs/kiso-react";

export function Intro() {
  return (
    <div className="intro-page">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <p className="t-caps">Momoi Labs · design system</p>
          <div className="brand intro-wordmark">
            <BrandMark>
              <TerminalIcon />
            </BrandMark>
            <span>
              Kiso{" "}
              <span className="muted" lang="ja">
                基礎
              </span>
            </span>
          </div>
          <h1 id="intro-title" className="t-display" tabIndex={-1}>
            A shared foundation for your next interface.
          </h1>
          <p className="muted intro-description">
            Kiso means "foundation" in Japanese. It brings together reusable
            components, design tokens and layout patterns for Momoi Labs
            products. Consistent details, with room for each product to be
            itself.
          </p>
          <div className="intro-actions">
            <Button variant="primary" asChild>
              <a href="#components">
                Browse components <span aria-hidden="true">→</span>
              </a>
            </Button>
            <Button asChild>
              <a href="#example/dashboard">Explore layouts</a>
            </Button>
          </div>
          <p className="muted t-label">
            React components · Light and dark themes · Keyboard navigation
          </p>
        </div>
        <div
          className="intro-composition"
          aria-label="Example Kiso composition"
        >
          <Card>
            <CardHeader>
              <div className="layout-between">
                <div className="brand">
                  <BrandMark>
                    <TerminalIcon />
                  </BrandMark>
                  <span className="t-label">Your next project</span>
                </div>
                <Badge variant="success">Ready to build</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="t-h2">Start with the essentials.</h2>
              <p className="muted">
                The same components, from a single field to a complete
                workspace.
              </p>
              <FormField
                label="Project name"
                defaultValue="Something worth building"
                readOnly
              />
              <div className="intro-sample-status">
                <span className="t-label">Project status</span>
                <div className="layout-inline">
                  <Badge variant="neutral">Draft</Badge>
                  <Badge variant="info">In progress</Badge>
                  <Badge variant="success">Complete</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <span className="muted t-label">A preview of the system</span>
              <Button variant="primary" size="sm" asChild>
                <a href="#components/card">Explore this card</a>
              </Button>
            </CardFooter>
          </Card>
          <div className="intro-foundation-note">
            <span className="intro-kanji" lang="ja" aria-hidden="true">
              基礎
            </span>
            <div>
              <p className="t-label">Small details. Shared everywhere.</p>
              <p className="muted t-label">
                Type, color, spacing and states work together.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="intro-features">
        <section>
          <p className="t-caps">01 / Foundations</p>
          <h2 className="t-h3">A common visual language</h2>
          <p className="muted">
            Semantic tokens keep color, typography and spacing consistent across
            themes.
          </p>
        </section>
        <section>
          <p className="t-caps">02 / Components</p>
          <h2 className="t-h3">Details you can inspect</h2>
          <p className="muted">
            Explore controls, forms, navigation and feedback with their
            different states.
          </p>
        </section>
        <section>
          <p className="t-caps">03 / Layouts</p>
          <h2 className="t-h3">See the pieces together</h2>
          <p className="muted">
            Browse complete dashboards, settings pages, sign-in screens and
            more.
          </p>
        </section>
      </div>
    </div>
  );
}
