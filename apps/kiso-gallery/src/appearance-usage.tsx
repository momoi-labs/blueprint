import { useState } from "react";
import { Button } from "@momoi-labs/kiso-react";
import { appearanceCode, type AppearanceSettings } from "./appearance-settings";

export function AppearanceUsage({ settings }: { settings: AppearanceSettings }) {
  const code = appearanceCode(settings);
  const [copyStatus, setCopyStatus] = useState("");
  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Select the code below to copy it manually.");
    }
  }
  return <section className="appearance-usage" aria-labelledby="appearance-usage-title">
    <h2 id="appearance-usage-title" className="t-h3">Use in code</h2>
    <p className="muted">These examples follow your current selection. Attributes on <code>&lt;html&gt;</code> apply to the whole application, including dialogs.</p>
    <section aria-labelledby="appearance-styles-title">
      <h3 id="appearance-styles-title" className="t-label">Load the styles</h3>
      <p className="muted t-label">Theme, accent, borders, and corner marks are included in the Kiso stylesheet. No gallery files are needed.</p>
      <pre><code>{'import "@momoi-labs/kiso-react/styles.css";'}</code></pre>
    </section>
    <section aria-labelledby="appearance-html-title">
      <div className="appearance-code-heading">
        <h3 id="appearance-html-title" className="t-label">Set the initial HTML</h3>
        <Button size="sm" onClick={() => copy("HTML", code.html)}>Copy HTML</Button>
      </div>
      <p className="muted t-label">Set these attributes before the page renders. System theme omits <code>data-theme</code> so the browser follows the operating system.</p>
      <pre><code>{code.html}</code></pre>
    </section>
    <section aria-labelledby="appearance-js-title">
      <div className="appearance-code-heading">
        <h3 id="appearance-js-title" className="t-label">Change settings with JavaScript</h3>
        <Button size="sm" onClick={() => copy("JavaScript", code.javascript)}>Copy JavaScript</Button>
      </div>
      <pre><code>{code.javascript}</code></pre>
      <p className="muted t-label">This updates the current page. In your app, save and restore preferences if they should survive reloads. The gallery uses <code>appearance-init.js</code> to restore its saved settings before first paint.</p>
    </section>
    <p role="status" className="muted t-label">{copyStatus}</p>
  </section>;
}
