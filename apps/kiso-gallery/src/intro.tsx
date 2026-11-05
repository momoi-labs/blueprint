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
              <a href="#examples">Explore layouts</a>
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

        </div>
      </section>
      <section className="intro-sequence" aria-labelledby="intro-sequence-title">
        <p className="t-caps">One system, from token to screen</p>
        <h2 id="intro-sequence-title" className="t-h2">Small pieces. Complete interfaces.</h2>
        <div className="intro-features">
          <section>
            <div className="intro-specimen intro-token-specimen" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p className="t-caps">01 / Foundations</p>
            <h3 className="t-h3">A common visual language</h3>
            <p className="muted">Color, type and spacing that stay consistent.</p>
          </section>
          <section>
            <div className="intro-specimen" aria-hidden="true">
              <div className="intro-control-specimen"><i /><i /><span>Continue</span></div>
            </div>
            <p className="t-caps">02 / Components</p>
            <h3 className="t-h3">Details you can inspect</h3>
            <p className="muted">Controls and feedback, with every state considered.</p>
          </section>
          <section>
            <div className="intro-specimen" aria-hidden="true">
              <div className="intro-layout-specimen">
                <div className="intro-layout-bar"><i /><i /></div>
                <div className="intro-layout-rail"><i /><i /><i /></div>
                <div className="intro-layout-panels"><span><i /><i /></span><span><i /><i /></span><span><i /><i /></span></div>
              </div>
            </div>
            <p className="t-caps">03 / Layouts</p>
            <h3 className="t-h3">See the pieces together</h3>
            <p className="muted">Complete screens built from the same pieces.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
