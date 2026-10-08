import { useId, useState, type ReactNode } from "react";
import { Badge, Button, GridPane, PaneGrid, type PaneGridLayout, type PaneGridOverflow } from "@momoi-labs/kiso-react";

import { DemoSettings } from "./demo-settings";

/* Illustrated options, in the gallery panel's own tile language: a radio per
   choice with a small drawing of the result. The standalone prototype shows
   the same radios without the tile styling. */
function Tiles<T extends string>({ label, value, options, onChange, preview }: {
  label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void; preview: (value: T) => ReactNode;
}) {
  const name = useId();
  return <fieldset className="appearance-choices">
    <legend className="t-label">{label}</legend>
    <div className="appearance-options appearance-options-wide">
      {options.map(([key, text]) => <label className="appearance-option" key={key}>
        <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
        <span className="appearance-option-body">{preview(key)}<span className="t-label">{text}</span></span>
      </label>)}
    </div>
  </fieldset>;
}

/* A twelve-column grid as 96 units wide: a pane of six columns is 48 wide. */
function GridPreview({ panes, scroll = false }: { panes: readonly (readonly [x: number, y: number, width: number])[]; scroll?: boolean }) {
  return <svg className="appearance-scope-preview" viewBox="0 0 104 72" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <rect className="appearance-preview-paper" x="4" y="4" width="96" height="64" />
    {panes.map(([x, y, width]) => <g key={`${x}-${y}`}>
      <rect className="appearance-scope-panel" x={4 + x} y={8 + y} width={width - 2} height="22" />
      <path className="appearance-preview-text" d={`M${8 + x} ${14 + y}h${Math.min(width - 10, 16)}`} strokeWidth="2" />
    </g>)}
    {scroll && <>
      <rect x="92" y="4" width="8" height="64" fill="var(--color-card)" opacity=".85" stroke="none" />
      <path className="appearance-scope-accent" d="M12 60h52" strokeWidth="3" strokeLinecap="round" />
    </>}
  </svg>;
}

export function PaneGridDemo() {
  const [overflow, setOverflow] = useState<PaneGridOverflow>("wrap");
  const [fill, setFill] = useState<"off" | "on">("off");
  const [pack, setPack] = useState<"off" | "on">("off");
  const [debug, setDebug] = useState(false);
  const [layout, setLayout] = useState<PaneGridLayout>();
  return <div className="stack">
    <DemoSettings title="PaneGrid">
      <Tiles label="Row wider than twelve columns" value={overflow} onChange={setOverflow} options={[["wrap", "Wrap onto lines"], ["scroll", "Scroll the row"]]}
        preview={value => value === "wrap"
          ? <GridPreview panes={[[0, 0, 48], [48, 0, 48], [0, 28, 24]]} />
          : <GridPreview panes={[[0, 0, 48], [48, 0, 48], [96, 0, 24]]} scroll />} />
      <Tiles label="Free columns on a line" value={fill} onChange={setFill} options={[["off", "Leave free"], ["on", "Fill lines"]]}
        preview={value => value === "off"
          ? <GridPreview panes={[[0, 0, 48], [48, 0, 32], [0, 28, 24]]} />
          : <GridPreview panes={[[0, 0, 56], [56, 0, 40], [0, 28, 96]]} />} />
      <Tiles label="Order within a row" value={pack} onChange={setPack} options={[["off", "As arranged"], ["on", "Pack by size"]]}
        preview={value => value === "off"
          ? <GridPreview panes={[[0, 0, 24], [24, 0, 48], [0, 28, 48], [48, 28, 24]]} />
          : <GridPreview panes={[[0, 0, 48], [48, 0, 48], [0, 28, 24], [24, 28, 24]]} />} />
      <label className="check"><input type="checkbox" checked={debug} onChange={event => setDebug(event.target.checked)} /><span className="check-text"><span>Debug</span><span className="field-hint">Row columns, free columns and each pane's size bounds.</span></span></label>
    </DemoSettings>
    <PaneGrid title="Summary" aria-label="Application summary" overflow={overflow} fill={fill === "on"} pack={pack === "on"} debug={debug} onLayoutChange={setLayout}>
      <GridPane id="url" title="Public URL" min={3} size={6}>
        <dl className="kv"><dt>URL</dt><dd><a className="link t-mono" href="#components/pane-grid">https://laya.example.internal</a></dd><dt>TLS</dt><dd><Badge>auto</Badge></dd></dl>
      </GridPane>
      <GridPane id="listener" title="Listener" min={2} size={4}>
        <code>listens on 127.0.0.1:4310</code>
      </GridPane>
      <GridPane id="start" title="Start command" min={4} size={12} newRow actions={<><Button size="sm" variant="ghost">Copy</Button><Button size="sm" variant="ghost">Edit</Button></>}>
        <pre><code>uv run laya serve --port 4310</code></pre>
        <p className="t-metadata">Runs as <code>sf-app-7e983w7ecdpd</code> in the application home</p>
      </GridPane>
      <GridPane id="packages" title="Packages" min={3} size={6} newRow>
        <dl className="kv"><dt><code>python</code></dt><dd>3.12</dd><dt><code>uv</code></dt><dd>latest</dd><dt><code>pypi:laya-apple</code></dt><dd>latest <span className="t-metadata">extras=serve,ane</span></dd></dl>
      </GridPane>
      <GridPane id="variables" title="Variables" min={3} size={6}>
        <dl className="kv"><dt><code>LAYA_MODEL</code></dt><dd>••••••••••••</dd><dt><code>HF_HOME</code></dt><dd>••••••••••••</dd><dt><code>HF_TOKEN</code></dt><dd>••••••••••••</dd></dl>
      </GridPane>
      <GridPane id="health" title="Health" min={2} size={3} newRow>
        <Badge variant="success">Running</Badge>
        <span className="t-metadata">HTTP responding · 12ms</span>
      </GridPane>
      <GridPane id="routes" title="Routes" min={2} size={3}>
        <dl className="kv"><dt><code>/</code></dt><dd>4310</dd><dt><code>/api</code></dt><dd>4310</dd></dl>
      </GridPane>
    </PaneGrid>
    <p className="t-metadata">Drag a title to move a pane, drop it on the rule between rows to start a row, drag a pane's end edge to resize it. The layout the product would save: <code>{layout ? JSON.stringify(layout) : "unchanged"}</code></p>
  </div>;
}
