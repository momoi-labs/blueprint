import { useState } from "react";
import { Badge, Button, GridPane, PaneGrid, type PaneGridLayout, type PaneGridOverflow } from "@momoi-labs/kiso-react";

import { DemoSettings } from "./demo-settings";

export function PaneGridDemo() {
  const [overflow, setOverflow] = useState<PaneGridOverflow>("wrap");
  const [fill, setFill] = useState(false);
  const [pack, setPack] = useState(false);
  const [layout, setLayout] = useState<PaneGridLayout>();
  return <div className="stack">
    <DemoSettings title="PaneGrid">
      <label className="field">Overflow<select className="select" value={overflow} onChange={event => setOverflow(event.target.value as PaneGridOverflow)}>
        <option value="wrap">Wrap onto lines</option><option value="scroll">Scroll the row</option>
      </select></label>
      <label className="check"><input type="checkbox" checked={fill} onChange={event => setFill(event.target.checked)} /><span className="check-text"><span>Fill lines</span></span></label>
      <label className="check"><input type="checkbox" checked={pack} onChange={event => setPack(event.target.checked)} /><span className="check-text"><span>Pack by size</span></span></label>
    </DemoSettings>
    <PaneGrid title="Summary" aria-label="Application summary" overflow={overflow} fill={fill} pack={pack} onLayoutChange={setLayout}>
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
