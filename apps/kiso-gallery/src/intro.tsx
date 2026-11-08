import { ComponentOrbit } from "./component-orbit";
import { FoundationLab } from "./foundation-lab";
import { HeroPanels } from "./hero-panels";
import { ShellAssembly } from "./shell-assembly";
import "./landing.css";
import { Button } from "@momoi-labs/kiso-react";

// lucide-react 1.x has no brand icons, so the GitHub mark is inline.
function GitHubMark() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>;
}

// Emoji flags do not render on Windows, so the flag is inline.
function BrazilFlag() {
  return <svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="2" fill="#009c3b" /><path d="M10 2 18 7 10 12 2 7z" fill="#ffdf00" /><circle cx="10" cy="7" r="3" fill="#002776" /></svg>;
}

export function Intro() {
  return (
    <div className="intro-page studio-landing">
      <section className="studio-hero studio-wrap" aria-labelledby="intro-title">
        <div className="studio-copy">
          <p className="t-caps">Momoi Labs · design system</p>
          <div className="intro-wordmark">
            <span className="intro-kanji" lang="ja">基礎</span>
            <span className="intro-romaji">kiso</span>
          </div>
          <h1 id="intro-title" className="t-display" tabIndex={-1}>
            Small pieces.<br /><em>Solid foundation.</em>
          </h1>
          <p className="muted intro-description">
            Components, tokens and layouts. Build an interface that is yours.
          </p>
          <div className="intro-actions">
            <Button variant="primary" asChild>
              <a href="#components">
                Browse components <span aria-hidden="true">→</span>
              </a>
            </Button>
            <Button asChild>
              <a href="#example">Explore layouts</a>
            </Button>
          </div>
        </div>
        <HeroPanels />
      </section>
      <section className="intro-contrast studio-demo" aria-labelledby="intro-contrast-title">
        <div className="studio-wrap studio-section">
          <div className="studio-showcase-heading"><p className="t-caps">One system, from token to screen</p><h2 id="intro-contrast-title">Small pieces. Complete interfaces.</h2></div>
          <div className="studio-showcase-grid">
            <section aria-labelledby="studio-foundations-title">
              <FoundationLab />
              <p className="t-caps">01 / Foundations</p><h3 id="studio-foundations-title">A common visual language</h3><p className="muted">Color, type and spacing that stay consistent.</p>
              <Button asChild variant="ghost" size="sm"><a href="#appearance">Explore appearance <span aria-hidden="true">→</span></a></Button>
            </section>
            <section aria-labelledby="studio-components-title">
              <ComponentOrbit />
              <p className="t-caps">02 / Components</p><h3 id="studio-components-title">Details you can inspect</h3><p className="muted">Real controls. Connected behavior.</p>
              <Button asChild variant="ghost" size="sm"><a href="#components/form-field">Explore components <span aria-hidden="true">→</span></a></Button>
            </section>
            <section aria-labelledby="studio-layouts-title">
              <ShellAssembly />
              <p className="t-caps">03 / Layouts</p><h3 id="studio-layouts-title">See the pieces together</h3><p className="muted">Complete screens from the same components.</p>
              <Button asChild variant="ghost" size="sm"><a href="#example/crud">Explore layouts <span aria-hidden="true">→</span></a></Button>
            </section>
          </div>
        </div>
      </section>

      <section className="intro-cta studio-cta" data-accent="violet" aria-labelledby="intro-cta-title"><div className="studio-wrap studio-section"><h2 id="intro-cta-title">Make it yours.</h2><div className="studio-actions"><Button asChild variant="ghost"><a href="https://github.com/momoi-labs/blueprint" target="_blank" rel="noreferrer"><GitHubMark />GitHub</a></Button></div></div></section>
      <footer className="studio-wrap studio-footer"><span>© {new Date().getFullYear()} Momoi Labs</span><span className="studio-made-in">Made in Brazil <BrazilFlag /></span></footer>
    </div>
  );
}
