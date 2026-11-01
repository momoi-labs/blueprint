import { useState, type ReactNode } from "react";
import { Cloud, CornerDownRight, Database, HardDrive, FileCode, Forward, GitBranch, GitCommitHorizontal, Globe, Plug, Plus, Tag, Terminal, Zap } from "lucide-react";
import {
  Badge, Button, Diagram, DiagramGroup, Tabs, TabsContent, TabsList, TabsTrigger, DiagramColumn, DiagramEdge, DiagramEdgeKey, DiagramRow, DiagramFact, DiagramFilter, DiagramFold, DiagramLine, DiagramNode,
  DiagramNodeGroup, DiagramSection, StatusBadge,
  type DiagramBackground, type DiagramBorderStyle, type DiagramCrossings, type DiagramLabels, type DiagramCornerMarks, type DiagramCornerSize, type DiagramCornerStyle,
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
  const [example, setExample] = useState("basic");
  const [layout, setLayout] = useState<Layout>("right");
  const [crossings, setCrossings] = useState<DiagramCrossings>("none");
  const [labels, setLabels] = useState<DiagramLabels>("auto");
  const frame = { borderStyle, cornerStyle, cornerSize, cornerMarks };
  const edges = { crossings, labels };
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
        <DemoChoice label="Crossings" kind="custom" value={crossings} options={crossingOptions} previews={crossingPreviews}
          onChange={(value) => setCrossings((value ?? "none") as DiagramCrossings)} />
        <DemoChoice label="Edge labels" kind="custom" value={labels} options={labelOptions} previews={labelPreviews}
          onChange={(value) => setLabels((value ?? "auto") as DiagramLabels)} />
        <DemoChoice label="Layout" kind="custom" value={layout} options={layoutOptions} previews={layoutPreviews}
          onChange={(value) => setLayout((value ?? "right") as Layout)} />
      </DemoSettings>
      <DemoSettingsHint title="Diagram" />
      {/* One store, Varejo, in three examples that build on each other: its
          service, the database cluster behind it, and the service summary a
          reader works with. One at a time, so the page stays short. */}
      <Tabs value={example} onValueChange={setExample}>
        <TabsList aria-label="Example">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
        </TabsList>
      <TabsContent value="basic"><Diagram label="storefront: two routes served by a git repository backed by a database and a cache" background={background} strength={strength} {...frame} {...edges} {...flow(layout, [2, 1, 2])}>
        {stages(layout, [
          [
            <DiagramNode key="host" id="host" kind="route" label="Hostname" title="loja.varejo.com.br">
              https://loja.varejo.com.br
            </DiagramNode>,
            <DiagramNode key="path" id="path" kind="route" label="Path" title="varejo.com.br/loja">
              https://varejo.com.br/loja
            </DiagramNode>,
          ],
          [
            <DiagramNode key="repo" id="repo" kind="repository" title="storefront" accent>
              {"github.com/varejo/storefront\nbranch: main\nport: 8000"}
            </DiagramNode>,
          ],
          [
            <DiagramNode key="db" id="db" kind="database" title="varejo-prod">
              {"postgres:17\nvolume: varejo-data"}
            </DiagramNode>,
            <DiagramNode key="cache" id="cache" icon={Zap} label="Cache" title="varejo-cache" status="failed" borderStyle="dash">
              redis:7
            </DiagramNode>,
          ],
        ])}
        <DiagramEdge from={["host", "path"]} to="repo" label=":8000" />
        <DiagramEdge from="repo" to="db" label="DATABASE_URL" />
        <DiagramEdge from="repo" to="cache" label="REDIS_URL" line="dotted" tone="danger" />
      </Diagram></TabsContent>
      <TabsContent value="groups"><ClusterOverview layout={layout} background={background} strength={strength} frame={frame} edges={edges} /></TabsContent>
      <TabsContent value="interactive"><ServiceSummary layout={layout} background={background} strength={strength} frame={frame} /></TabsContent>
      </Tabs>
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

// The storefront's Summary, the one a reader works with: the routes that
// reach it fold under its hostname and filter by kind, the container that
// receives requests carries its facts with the other containers folded
// under it, and the project around the app and its databases folds to one
// line.
function ServiceSummary({ layout, background, strength, frame }: {
  layout: Layout;
  background?: DiagramBackground;
  strength?: "quiet" | "visible";
  frame: { borderStyle?: DiagramBorderStyle; cornerStyle?: DiagramCornerStyle; cornerSize?: DiagramCornerSize; cornerMarks?: DiagramCornerMarks };
}) {
  const [only, setOnly] = useState<string | null>(null);
  const show = (kind: string) => only === null || only === kind;
  const domains = (
    <DiagramNode id="domains" icon={Globe} title="loja.varejo.com.br">
      <DiagramFold title="Other routes" count={2}>
        <DiagramFilter value={only} onValueChange={setOnly}
          options={[{ value: "aliases", label: "Aliases", count: 1 }, { value: "redirects", label: "Redirects", count: 1 }]} />
        {show("aliases") && (
          <DiagramSection title="Aliases" icon={CornerDownRight} count={1} action={<AddButton label="Add an alias" />}>
            <DiagramLine>www.varejo.com.br/</DiagramLine>
          </DiagramSection>
        )}
        {show("redirects") && (
          <DiagramSection title="Redirects" icon={Forward} count={1} action={<AddButton label="Add a redirect" />}>
            <DiagramLine end="↪ /loja (301)">varejo.com.br/</DiagramLine>
          </DiagramSection>
        )}
      </DiagramFold>
    </DiagramNode>
  );
  const app = (
    <DiagramNodeGroup>
      <DiagramNode id="app" kind="repository" label="storefront" title="app" accent>
        <DiagramFact icon={GitBranch} label="Repository">https://github.com/varejo/storefront.git</DiagramFact>
        <DiagramFact icon={Tag} label="Ref">main</DiagramFact>
        <DiagramFact icon={FileCode} label="Built from">compose.deploy.yml</DiagramFact>
        <DiagramFact icon={GitCommitHorizontal} label="Commit">
          57f810fc03c8 <StatusBadge tone="success">Up to date</StatusBadge>
        </DiagramFact>
        <DiagramFact icon={Plug} label="Port">:8000</DiagramFact>
        <DiagramFact icon={Terminal} label="Command" empty="Image default" />
      </DiagramNode>
      <DiagramNode id="containers">
        <DiagramFold title="Other containers" count={1}>
          <DiagramSection>
            <DiagramLine end="https://github.com/varejo/storefront.git">worker</DiagramLine>
          </DiagramSection>
        </DiagramFold>
      </DiagramNode>
    </DiagramNodeGroup>
  );
  const databases = (
    <DiagramNode id="databases" icon={Database} title="Databases">
      <DiagramFold title="Connected" count={1}>
        <DiagramSection title="PostgreSQL" icon={Database} count={1} action={<AddButton label="Connect a database" />}>
          <DiagramLine onClick={() => {}} end={
            <Badge className="badge-outline"><span>env</span><span className="mono">DATABASE_URL</span></Badge>
          }>varejo-prod</DiagramLine>
        </DiagramSection>
      </DiagramFold>
    </DiagramNode>
  );
  // The project holds two stages: columns left to right, rows top to
  // bottom, and two cells of a band in a grid.
  const project = (children: ReactNode) => <DiagramGroup collapsible label="Project" title="varejo">{children}</DiagramGroup>;
  const body = layout === "right" ? <>
    <DiagramColumn>{domains}</DiagramColumn>
    {project(<><DiagramColumn>{app}</DiagramColumn><DiagramColumn>{databases}</DiagramColumn></>)}
  </> : layout === "down" ? <>
    <DiagramRow>{domains}</DiagramRow>
    {project(<><DiagramRow>{app}</DiagramRow><DiagramRow>{databases}</DiagramRow></>)}
  </> : <>
    <DiagramRow><DiagramColumn>{domains}</DiagramColumn></DiagramRow>
    {project(<><DiagramColumn>{app}</DiagramColumn><DiagramColumn>{databases}</DiagramColumn></>)}
  </>;
  return (
    <Diagram label="storefront: the routes that reach it and the database it uses" background={background} strength={strength} {...frame} {...flow(layout, [2])}>
      {body}
      <DiagramEdge from="domains" to="app" />
      <DiagramEdge from="app" to="databases" />
    </Diagram>
  );
}

type ExampleProps = {
  background?: DiagramBackground;
  strength?: "quiet" | "visible";
  frame: { borderStyle?: DiagramBorderStyle; cornerStyle?: DiagramCornerStyle; cornerSize?: DiagramCornerSize; cornerMarks?: DiagramCornerMarks };
  edges: { crossings: DiagramCrossings; labels: DiagramLabels };
};

// Small drawings of each edge option, for the gallery's Appearance panel.
const crossingOptions: [DiagramCrossings, string][] = [["none", "None"], ["hop", "Hop"], ["gap", "Gap"]];
const labelOptions: [DiagramLabels, string][] = [["auto", "Auto"], ["horizontal", "Horizontal"], ["vertical", "Vertical"]];
const sketch = (children: ReactNode) => (
  <svg viewBox="0 0 48 32" width="48" height="32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">{children}</svg>
);
const crossingPreviews: Record<DiagramCrossings, ReactNode> = {
  none: sketch(<><path d="M 4 16 H 44" opacity=".5" /><path d="M 24 3 V 29" /></>),
  hop: sketch(<><path d="M 4 16 H 44" opacity=".5" /><path d="M 24 3 V 12 A 4 4 0 0 1 24 20 V 29" /></>),
  gap: sketch(<><path d="M 4 16 H 19 M 29 16 H 44" opacity=".5" /><path d="M 24 3 V 29" /></>),
};
const labelPreviews: Record<DiagramLabels, ReactNode> = {
  auto: sketch(<><path d="M 14 3 V 9 M 14 23 V 29" /><path d="M 14 11 V 21" strokeWidth="3" opacity=".6" /><path d="M 28 16 H 44" /><path d="M 30 10 H 42" strokeWidth="3" opacity=".6" /></>),
  horizontal: sketch(<><path d="M 14 3 V 12 M 14 20 V 29" /><path d="M 7 16 H 21" strokeWidth="3" opacity=".6" /><path d="M 28 16 H 44" /><path d="M 30 10 H 42" strokeWidth="3" opacity=".6" /></>),
  vertical: sketch(<><path d="M 14 3 V 9 M 14 23 V 29" /><path d="M 14 11 V 21" strokeWidth="3" opacity=".6" /><path d="M 34 3 V 9 M 34 23 V 29" /><path d="M 34 11 V 21" strokeWidth="3" opacity=".6" /></>),
};

// Every example in each layout. Stages are columns left to right, rows top
// to bottom, and bands on shared columns in a grid. The cluster's sites and
// clusters are groups, so they do not change with the layout.
type Layout = "right" | "down" | "grid";
const flow = (layout: Layout, widths: number[]) => ({ direction: layout, columns: layout === "grid" ? Math.max(...widths) : undefined });
const stages = (layout: Layout, list: ReactNode[][]) => list.map((nodes, index) => layout === "right"
  ? <DiagramColumn key={index}>{nodes}</DiagramColumn>
  : layout === "down"
    ? <DiagramRow key={index}>{nodes}</DiagramRow>
    : <DiagramRow key={index}>{nodes.map((node, cell) => <DiagramColumn key={cell}>{node}</DiagramColumn>)}</DiagramRow>);
const layoutOptions: [Layout, string][] = [["right", "Left to right"], ["down", "Top to bottom"], ["grid", "Grid"]];
const layoutPreviews: Record<Layout, ReactNode> = {
  right: sketch(<><rect x="3" y="12" width="10" height="8" rx="1" /><rect x="35" y="4" width="10" height="8" rx="1" /><rect x="35" y="20" width="10" height="8" rx="1" /><path d="M 13 16 H 24 M 24 8 V 24 M 24 8 H 35 M 24 24 H 35" opacity=".6" /></>),
  down: sketch(<><rect x="18" y="3" width="12" height="7" rx="1" /><rect x="6" y="22" width="12" height="7" rx="1" /><rect x="30" y="22" width="12" height="7" rx="1" /><path d="M 24 10 V 16 M 12 16 H 36 M 12 16 V 22 M 36 16 V 22" opacity=".6" /></>),
  grid: sketch(<><rect x="2" y="2" width="44" height="13" rx="2" opacity=".5" /><rect x="2" y="17" width="44" height="13" rx="2" opacity=".5" /><rect x="7" y="5" width="10" height="7" rx="1" /><rect x="31" y="5" width="10" height="7" rx="1" /><rect x="7" y="20" width="10" height="7" rx="1" /><path d="M 17 8.5 H 31 M 12 12 V 20" opacity=".8" /></>),
};

const edgeKey = <>
  <DiagramEdgeKey series={1}>Replication inside a cluster</DiagramEdgeKey>
  <DiagramEdgeKey series={2}>Replication to a standby cluster</DiagramEdgeKey>
  <DiagramEdgeKey series={3}>WAL, to and from storage</DiagramEdgeKey>
  <DiagramEdgeKey series={4}>Backups to storage</DiagramEdgeKey>
</>;

// A database cluster on two sites, as pg-yard draws its overview: each
// site and each cluster is a group, and four kinds of link are told apart
// by series, each flowing toward its target. WAL and backups leave each
// source on one trunk that splits for the nearer storage. NUV1 has stopped
// streaming and restores WAL from s3-varejo instead. The key in the card
// footer belongs to the product.
function ClusterOverview({ layout, background, strength, frame, edges }: ExampleProps & { layout: Layout }) {
  const main = (
    <DiagramGroup label="Cluster" title="main">
      <DiagramNode id="db1" icon={Database} label="Primary" title="DB1" accent>
        10.0.1.11 · tl 7
        <StatusBadge tone="neutral" pulse>Restarting</StatusBadge>
      </DiagramNode>
      <DiagramNode id="db2" icon={Database} label="Replica" title="DB2">
        10.0.1.12 · lag 0 B
        <Badge variant="warning">Settings differ</Badge>
      </DiagramNode>
    </DiagramGroup>
  );
  const backup = (
    <DiagramNode id="backup-01" icon={HardDrive} label="Backup storage · LAN" title="backup-01">
      {"10.0.1.20 · repo1\n4 TB disk · 1.8 TB used"}
      <StatusBadge tone="success">Reachable</StatusBadge>
    </DiagramNode>
  );
  const reporting = (
    <DiagramGroup label="Standby cluster" title="reporting" footer={<><span className="t-caps muted">Backup</span><Badge>Off</Badge></>}>
      <DiagramNode id="db3" icon={Database} label="Standby leader" title="DB3">
        10.0.2.21 · lag 12 MB
        <StatusBadge tone="danger">Batch 13 failed</StatusBadge>
      </DiagramNode>
    </DiagramGroup>
  );
  const s3 = (
    <DiagramNode id="s3-varejo" icon={Cloud} label="Object storage · S3" title="s3-varejo">
      {"bucket · repo2\n620 GB used"}
      <StatusBadge tone="success">Reachable</StatusBadge>
    </DiagramNode>
  );
  const cloud = (
    <DiagramGroup label="Standby cluster" title="cloud">
      <DiagramNode id="nuv1" icon={Cloud} label="Standby leader" title="NUV1">
        172.16.0.5 · lag 2.1 GB
        <Badge variant="warning">Lag high</Badge>
      </DiagramNode>
    </DiagramGroup>
  );
  const site = (title: string, children: ReactNode) => <DiagramGroup line="solid" label="Site" title={title}>{children}</DiagramGroup>;
  // Columns read left to right; rows read top to bottom; a grid shares its
  // columns across the sites, so s3-varejo sits under main.
  const sites = layout === "right" ? <>
    {site("on-premises", <><DiagramColumn>{main}</DiagramColumn><DiagramColumn>{reporting}</DiagramColumn><DiagramColumn>{backup}</DiagramColumn></>)}
    {site("AWS sa-east-1", <><DiagramColumn>{s3}</DiagramColumn><DiagramColumn>{cloud}</DiagramColumn></>)}
  </> : layout === "down" ? <>
    {site("on-premises", <><DiagramRow justify="between">{main}{reporting}</DiagramRow><DiagramRow justify="end">{backup}</DiagramRow></>)}
    {site("AWS sa-east-1", <DiagramRow justify="between">{s3}{cloud}</DiagramRow>)}
  </> : <>
    {site("on-premises", <><DiagramColumn>{main}{backup}</DiagramColumn><DiagramColumn>{reporting}</DiagramColumn></>)}
    {site("AWS sa-east-1", <><DiagramColumn>{s3}</DiagramColumn><DiagramColumn>{cloud}</DiagramColumn></>)}
  </>;
  return (
    <Diagram direction={layout} columns={layout === "grid" ? 2 : undefined} label="Varejo Prod: two sites, on-premises and AWS sa-east-1, with their clusters and storage"
      background={background} strength={strength} {...frame} {...edges} footer={edgeKey}>
      {sites}
      <DiagramEdge from="db1" to="db2" series={1} flow label="Lag: 0 B" />
      <DiagramEdge from="db2" to="db3" series={2} flow label="Lag: 12 MB" />
      <DiagramEdge from="s3-varejo" to="nuv1" series={3} flow label="WAL restore" />
      <DiagramEdge from="db1" to="backup-01" series={3} flow />
      <DiagramEdge from="db1" to="s3-varejo" series={3} flow label="WAL" />
      <DiagramEdge from="db2" to="backup-01" series={4} flow />
      <DiagramEdge from="db2" to="s3-varejo" series={4} flow label="backups" />
    </Diagram>
  );
}
