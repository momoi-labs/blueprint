import { useState, type ReactNode } from "react";
import { Button } from "@momoi-labs/kiso-react";
import { appearanceCode, type AppearanceSettings } from "./appearance-settings";

// Only the HTML and JavaScript snippets generated on this page are highlighted.
// Render tokens as React text so displayed and copied code keep the same source.
function HighlightedCode({ source, language }: { source: string; language: "html" | "javascript" }) {
  const pattern = language === "html"
    ? /(?<comment><!--[\s\S]*?-->)|(?<string>"[^"]*"|'[^']*')|(?<tag><\/?[\w:-]+)|(?<attribute>[\w:-]+(?=\s*=))/g
    : /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<keyword>\b(?:const|let|if|else|delete|import|from|return|true|false|null|undefined)\b)|(?<function>\b[\w$]+(?=\s*\())/g;
  const parts: ReactNode[] = [];
  let offset = 0;
  for (const match of source.matchAll(pattern)) {
    parts.push(source.slice(offset, match.index));
    let kind = Object.keys(match.groups ?? {}).find(key => match.groups?.[key] !== undefined);
    const end = match.index + match[0].length;
    if (language === "javascript" && kind === "string" && /^\s*:/.test(source.slice(end))) kind = "property";
    parts.push(<span className={`syntax-${kind}`} key={match.index}>{match[0]}</span>);
    offset = end;
  }
  parts.push(source.slice(offset));
  return <pre><code data-language={language}>{parts}</code></pre>;
}

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
    <h3 id="appearance-usage-title" className="t-caps">Use in code</h3>
    <p className="muted t-label">These examples follow your current selection. Attributes on <code>&lt;html&gt;</code> apply to the whole application, including dialogs.</p>
    <section aria-labelledby="appearance-styles-title">
      <h3 id="appearance-styles-title" className="t-label">Load the styles</h3>
      <p className="muted t-label">Theme, accent, layout, borders, and corner marks are included in the Kiso stylesheet. No gallery files are needed.</p>
      <HighlightedCode language="javascript" source={'import "@momoi-labs/kiso-react/styles.css";'} />
    </section>
    <section aria-labelledby="appearance-html-title">
      <div className="appearance-code-heading">
        <h3 id="appearance-html-title" className="t-label">Set the initial HTML</h3>
        <Button size="sm" onClick={() => copy("HTML", code.html)}>Copy HTML</Button>
      </div>
      <p className="muted t-label">Set these attributes before the page renders. System theme omits <code>data-theme</code> so the browser follows the operating system.</p>
      <HighlightedCode language="html" source={code.html} />
      <p className="muted t-label">Visual style applies across headings, cards, metrics, and page layouts. Set <code>data-visual-style="default"</code> on a region to keep it compact. PageHeader and AppShell also accept an explicit <code>variant</code> override.</p>
    </section>
    <section aria-labelledby="appearance-js-title">
      <div className="appearance-code-heading">
        <h3 id="appearance-js-title" className="t-label">Change settings with JavaScript</h3>
        <Button size="sm" onClick={() => copy("JavaScript", code.javascript)}>Copy JavaScript</Button>
      </div>
      <HighlightedCode language="javascript" source={code.javascript} />
      <p className="muted t-label">This updates the current page. In your app, save and restore preferences if they should survive reloads. The gallery uses <code>appearance-init.js</code> to restore its saved settings before first paint.</p>
    </section>
    <p role="status" className="muted t-label">{copyStatus}</p>
  </section>;
}
