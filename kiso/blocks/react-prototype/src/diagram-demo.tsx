import { useState } from "react";
import { CornerDownRight, Database, FileCode, Forward, GitBranch, GitCommitHorizontal, Globe, Plug, Plus, Tag, Terminal, Zap } from "lucide-react";
import {
  Badge, Button, Diagram, DiagramColumn, DiagramEdge, DiagramFact, DiagramFilter, DiagramFold, DiagramLine, DiagramNode,
  DiagramNodeGroup, DiagramSection, StatusBadge,
  type DiagramBackground, type DiagramBorderStyle, type DiagramCornerMarks, type DiagramCornerSize, type DiagramCornerStyle,
} from "@momoi-labs/kiso-react";
import { DemoChoice, DemoSettings, DemoSettingsHint } from "./demo-settings";

const backgrounds: [DiagramBackground, string][] = [
  ["construction", "Construction lines"], ["solid", "Solid"], ["dots", "Dot grid"], ["grid", "Fine grid"],
  ["crosses", "Cross grid"], ["guides", "Drawing guides"], ["fibers", "Paper fibers"],
];
// The same choices as the Main style section above, so a reader can compare.
const borders: [DiagramBorderStyle, string][] = [
  ["solid", "Solid"], ["none", "None"], ["rail", "Side rail"], ["dash", "Dashed outline"], ["bevel", "Inset edge"],
  ["double", "Double outline"], ["base", "Weighted base"], ["offset", "Offset outline"], ["manga", "Manga panel"], ["brush", "Brush frame"],
];
const corners: [DiagramCornerStyle, string][] = [["square", "Square"], ["rounded", "Rounded"], ["asym", "Asymmetric"], ["pixel", "Pixel classic"]];
const sizes: [DiagramCornerSize, string][] = [["off", "Off"], ["small", "Small"], ["medium", "Medium"], ["large", "Large"]];
const marks: [DiagramCornerMarks, string][] = [
  ["none", "None"], ["ticks", "Original ticks"], ["brackets", "Outer brackets"], ["arcs", "Curved brackets"], ["diagonal", "Diagonal ticks"],
];

export function DiagramDemo() {
  const [background, setBackground] = useState<DiagramBackground>();
  const [strength, setStrength] = useState<"quiet" | "visible">();
  const [borderStyle, setBorderStyle] = useState<DiagramBorderStyle>();
  const [cornerStyle, setCornerStyle] = useState<DiagramCornerStyle>();
  const [cornerSize, setCornerSize] = useState<DiagramCornerSize>();
  const [cornerMarks, setCornerMarks] = useState<DiagramCornerMarks>();
  const frame = { borderStyle, cornerStyle, cornerSize, cornerMarks };
  return (
    <div className="stack">
      <DemoSettings title="Diagram">
        <DemoChoice label="Node border" kind="border" inherit value={borderStyle} options={borders} with={{ corner: cornerStyle }}
          onChange={(value) => setBorderStyle(value as DiagramBorderStyle | undefined)} />
        <DemoChoice label="Node corners" kind="corner" inherit value={cornerStyle} options={corners} with={{ border: borderStyle }}
          onChange={(value) => setCornerStyle(value as DiagramCornerStyle | undefined)} />
        <DemoChoice label="Node corner size" kind="cornerSize" inherit value={cornerSize} options={sizes}
          onChange={(value) => setCornerSize(value as DiagramCornerSize | undefined)} />
        <DemoChoice label="Node corner marks" kind="marks" inherit value={cornerMarks} options={marks} with={{ border: borderStyle, corner: cornerStyle }}
          onChange={(value) => setCornerMarks(value as DiagramCornerMarks | undefined)} />
        <DemoChoice label="Background" kind="background" inherit value={background} options={backgrounds} with={{ strength }}
          onChange={(value) => setBackground(value as DiagramBackground | undefined)} />
        <DemoChoice label="Strength" kind="strength" inherit value={strength} options={[["quiet", "Quiet"], ["visible", "Visible"]]} with={{ background }}
          onChange={(value) => setStrength(value as "quiet" | "visible" | undefined)} />
      </DemoSettings>
      <DemoSettingsHint title="Diagram" />
      <Diagram label="cli-proxy-api: two routes served by one container image" background={background} strength={strength} {...frame}>
        <DiagramColumn>
          <DiagramNode id="host" kind="route" label="Hostname" title="cli-proxy-api.momoi.internal">
            https://cli-proxy-api.momoi.internal
          </DiagramNode>
          <DiagramNode id="path" kind="route" label="Path" title="tools.momoi.internal/proxy">
            https://tools.momoi.internal/proxy
          </DiagramNode>
        </DiagramColumn>
        <DiagramColumn>
          <DiagramNode id="image" kind="image" title="cli-proxy-api" status="stopped" borderStyle="dash">
            cli-proxy-api:8317
          </DiagramNode>
        </DiagramColumn>
        <DiagramEdge from={["host", "path"]} to="image" label=":8317" />
      </Diagram>
      <Diagram label="honcho: two routes served by a git repository backed by a database and a cache" background={background} strength={strength} {...frame}>
        <DiagramColumn>
          <DiagramNode id="host" kind="route" label="Hostname" title="honcho.momoi.internal">
            https://honcho.momoi.internal
          </DiagramNode>
          <DiagramNode id="path" kind="route" label="Path" title="tools.momoi.internal/honcho">
            https://tools.momoi.internal/honcho
          </DiagramNode>
        </DiagramColumn>
        <DiagramColumn>
          <DiagramNode id="repo" kind="repository" title="honcho" accent>
            {"github.com/momoi-labs/honcho\nbranch: main\nport: 8000"}
          </DiagramNode>
        </DiagramColumn>
        <DiagramColumn>
          <DiagramNode id="db" kind="database" title="honcho-db">
            {"postgres:17\nvolume: honcho-data"}
          </DiagramNode>
          <DiagramNode id="cache" icon={Zap} label="Cache" title="honcho-cache" status="failed" borderStyle="dash">
            redis:7
          </DiagramNode>
        </DiagramColumn>
        <DiagramEdge from={["host", "path"]} to="repo" label=":8000" />
        <DiagramEdge from="repo" to="db" label="DATABASE_URL" />
        <DiagramEdge from="repo" to="cache" label="REDIS_URL" line="dotted" tone="danger" />
      </Diagram>
      <Diagram label="honcho-db: two applications read it, each from its own variable" background={background} strength={strength} {...frame}>
        <DiagramColumn>
          <DiagramNode id="honcho" kind="repository" title="honcho" />
          <DiagramNode id="worker" kind="image" title="honcho-worker" />
        </DiagramColumn>
        <DiagramColumn>
          <DiagramNode id="shared-db" kind="database" title="honcho-db" accent>postgres:17</DiagramNode>
        </DiagramColumn>
        <DiagramEdge from="honcho" to="shared-db" label="DATABASE_URL" />
        <DiagramEdge from="worker" to="shared-db" label="QUEUE_DB_URL" />
      </Diagram>
      <ServiceSummary background={background} strength={strength} frame={frame} />
    </div>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <Button size="xs" variant="ghost" className="btn-icon" aria-label={label}>
      <Plus className="icon icon-sm" aria-hidden="true" />
    </Button>
  );
}

// A service's Summary as the self-host console draws it: the routes that
// reach it fold under its hostname, the container that receives requests
// carries its facts with the other containers joined under it, and the
// databases it reads list the variable each URL arrives in.
function ServiceSummary({ background, strength, frame }: {
  background?: DiagramBackground;
  strength?: "quiet" | "visible";
  frame: { borderStyle?: DiagramBorderStyle; cornerStyle?: DiagramCornerStyle; cornerSize?: DiagramCornerSize; cornerMarks?: DiagramCornerMarks };
}) {
  const [only, setOnly] = useState<string | null>(null);
  const show = (kind: string) => only === null || only === kind;
  return (
    <Diagram label="storefront: the routes that reach it and the database it uses" background={background} strength={strength} {...frame}>
      <DiagramColumn>
        <DiagramNode id="domains" icon={Globe} title="app.example.com">
          <DiagramFold title="Other routes" count={2}>
            <DiagramFilter value={only} onValueChange={setOnly}
              options={[{ value: "aliases", label: "Aliases", count: 1 }, { value: "redirects", label: "Redirects", count: 1 }]} />
            {show("aliases") && (
              <DiagramSection title="Aliases" icon={CornerDownRight} count={1} action={<AddButton label="Add an alias" />}>
                <DiagramLine>admin.example.com/</DiagramLine>
              </DiagramSection>
            )}
            {show("redirects") && (
              <DiagramSection title="Redirects" icon={Forward} count={1} action={<AddButton label="Add a redirect" />}>
                <DiagramLine end="↪ /admin (301)">admin.example.com/</DiagramLine>
              </DiagramSection>
            )}
          </DiagramFold>
        </DiagramNode>
      </DiagramColumn>
      <DiagramColumn>
        <DiagramNodeGroup>
          <DiagramNode id="app" kind="repository" label="storefront" title="app" accent>
            <DiagramFact icon={GitBranch} label="Repository">https://github.com/example/storefront.git</DiagramFact>
            <DiagramFact icon={Tag} label="Ref">main</DiagramFact>
            <DiagramFact icon={FileCode} label="Built from">compose.deploy.yml</DiagramFact>
            <DiagramFact icon={GitCommitHorizontal} label="Commit">
              57f810fc03c8 <StatusBadge tone="success">Up to date</StatusBadge>
            </DiagramFact>
            <DiagramFact icon={Plug} label="Port">:8787</DiagramFact>
            <DiagramFact icon={Terminal} label="Command" empty="Image default" />
          </DiagramNode>
          <DiagramNode id="containers">
            <DiagramFold title="Other containers" count={1}>
              <DiagramSection>
                <DiagramLine end="https://github.com/example/storefront.git">worker</DiagramLine>
              </DiagramSection>
            </DiagramFold>
          </DiagramNode>
        </DiagramNodeGroup>
      </DiagramColumn>
      <DiagramColumn>
        <DiagramNode id="databases">
          <DiagramFold title="Databases" count={1}>
            <DiagramSection title="PostgreSQL" icon={Database} count={1} action={<AddButton label="Connect a database" />}>
              <DiagramLine onClick={() => {}} end={
                <Badge className="badge-outline"><span>env</span><span className="mono">DATABASE_URL</span></Badge>
              }>storefront-db</DiagramLine>
            </DiagramSection>
          </DiagramFold>
        </DiagramNode>
      </DiagramColumn>
      <DiagramEdge from="domains" to="app" />
      <DiagramEdge from="app" to="databases" />
    </Diagram>
  );
}
