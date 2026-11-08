import { Database } from "lucide-react";
import {
  Badge, Button, Card, CardContent, FeatureGrid, FeatureGridItem, FeatureList, FeatureListItem, PerspectiveStack,
  SiteFooter, SiteHeader, SiteHeading, SiteSection, SiteSectionBody, SiteSectionFoot, Tabs, TabsList, TabsTrigger, WindowFrame,
} from "@momoi-labs/kiso-react";
import { DemoSettings, useDemoOptions } from "./demo-settings";

/* Demos for the site layout components. Each sits in a bounded frame, so a
   sticky header or a full-width band stays inside the catalog card. */

const brand = <a href="#components/site-header" className="row" style={{ color: "inherit", textDecoration: "none", gap: "var(--spacing-sm)" }}>
  <Database className="icon" aria-hidden="true" />pg-probe</a>;
const links = [
  <a key="how" href="#components/site-header" aria-current="page">How it works</a>,
  <a key="report" href="#components/site-header">Report</a>,
  <a key="mcp" href="#components/site-header">MCP <Badge variant="warning">New</Badge></a>,
];

type SiteSectionOptions = { tone: "default" | "inverse" | "accent"; size: "sm" | "md" | "lg"; variant: "band" | "inset"; glow: "none" | "top" | "start" | "end"; layout: "stack" | "center" | "split" | "row" | "grid" };
export const siteSectionShareOptions: Record<keyof SiteSectionOptions, readonly string[]> = {
  tone: ["default", "inverse", "accent"], size: ["sm", "md", "lg"], variant: ["band", "inset"], glow: ["none", "top", "start", "end"], layout: ["stack", "center", "split", "row", "grid"],
};
type SiteHeaderOptions = { sticky: "on" | "off"; overlay: "off" | "on"; fold: "menu" | "hide" };
export const siteHeaderShareOptions: Record<keyof SiteHeaderOptions, readonly string[]> = { sticky: ["on", "off"], overlay: ["off", "on"], fold: ["menu", "hide"] };
type SiteHeadingOptions = { size: "section" | "display"; align: "start" | "center" };
export const siteHeadingShareOptions: Record<keyof SiteHeadingOptions, readonly string[]> = { size: ["section", "display"], align: ["start", "center"] };

/* A labelled select for one demo option, in the Appearance panel. */
function OptionSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return <label className="field">{label}<select className="select" value={value} onChange={event => onChange(event.target.value as T)}>
    {options.map(option => <option key={option} value={option}>{option}</option>)}
  </select></label>;
}

const attr = (name: string, value: string, fallback: string) => value === fallback ? "" : ` ${name}="${value}"`;

export function SiteSectionDemo() {
  const [options, setOptions] = useDemoOptions<SiteSectionOptions>("siteSection", { tone: "default", size: "md", variant: "band", glow: "none", layout: "split" });
  const { tone, size, variant, glow, layout } = options;
  const action = <Button variant="primary" asChild><a href="#components/site-section">Get started</a></Button>;
  // A row puts the action beside the heading; the other layouts keep it in the heading.
  const heading = <SiteHeading align={layout === "center" ? "center" : "start"} eyebrow="Site section"
    title="Small pieces. Complete interfaces." description="Change the tone, size and layout in the Appearance panel."
    actions={layout === "row" || layout === "grid" ? undefined : action} />;
  const facts = ["Capture", "Console", "Report"].map(name => <div key={name} className="stack">
    <strong>{name}</strong><span className="muted">A short line about {name.toLowerCase()}.</span></div>);
  const body = {
    stack: heading,
    center: heading,
    split: <><div>{heading}</div><WindowFrame title="Example"><div className="stack" style={{ padding: "var(--spacing-lg)" }}>{facts}</div></WindowFrame></>,
    row: <>{heading}{action}</>,
    grid: <>{heading}{facts}</>,
  }[layout];
  return <div className="stack">
    <DemoSettings title="SiteSection" manual>
      <OptionSelect label="Tone" value={tone} options={siteSectionShareOptions.tone as SiteSectionOptions["tone"][]} onChange={tone => setOptions({ tone })} />
      <OptionSelect label="Size" value={size} options={siteSectionShareOptions.size as SiteSectionOptions["size"][]} onChange={size => setOptions({ size })} />
      <OptionSelect label="Variant" value={variant} options={siteSectionShareOptions.variant as SiteSectionOptions["variant"][]} onChange={variant => setOptions({ variant })} />
      <OptionSelect label="Glow" value={glow} options={siteSectionShareOptions.glow as SiteSectionOptions["glow"][]} onChange={glow => setOptions({ glow })} />
      <OptionSelect label="Body layout" value={layout} options={siteSectionShareOptions.layout as SiteSectionOptions["layout"][]} onChange={layout => setOptions({ layout })} />
    </DemoSettings>
    <SiteSection tone={tone} size={size} variant={variant} glow={glow === "none" ? undefined : glow}>
      <SiteSectionBody layout={layout} columns={layout === "grid" ? 3 : undefined}>{body}</SiteSectionBody>
      {variant === "band" && <SiteSectionFoot>
        <Tabs defaultValue="overview"><TabsList aria-label="Sections">
          <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="docs">Docs</TabsTrigger><TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList></Tabs>
      </SiteSectionFoot>}
    </SiteSection>
    <pre><code>{`<SiteSection${attr("tone", tone, "default")}${attr("size", size, "md")}${attr("variant", variant, "band")}${glow === "none" ? "" : ` glow="${glow}"`}>
  <SiteSectionBody${attr("layout", layout, "stack")}${layout === "grid" ? " columns={3}" : ""}>
    <SiteHeading title="..." />
  </SiteSectionBody>
</SiteSection>`}</code></pre>
  </div>;
}

export function SiteHeaderDemo() {
  const [{ sticky, overlay, fold }, setOptions] = useDemoOptions<SiteHeaderOptions>("siteHeader", { sticky: "on", overlay: "off", fold: "menu" });
  const header = <SiteHeader sticky={sticky === "on"} overlay={overlay === "on"} fold={fold} brand={brand} links={links} actions={<Button variant="primary" size="sm">Install</Button>} />;
  return <div className="stack">
    <DemoSettings title="SiteHeader" manual>
      <OptionSelect label="Sticky" value={sticky} options={siteHeaderShareOptions.sticky as SiteHeaderOptions["sticky"][]} onChange={sticky => setOptions({ sticky })} />
      <OptionSelect label="Overlay" value={overlay} options={siteHeaderShareOptions.overlay as SiteHeaderOptions["overlay"][]} onChange={overlay => setOptions({ overlay })} />
      <OptionSelect label="Fold" value={fold} options={siteHeaderShareOptions.fold as SiteHeaderOptions["fold"][]} onChange={fold => setOptions({ fold })} />
    </DemoSettings>
    <div className="site-demo-frame">
      {header}
      <SiteSection tone="inverse" glow="top"><SiteSectionBody><SiteHeading title="Scroll this frame." description="A sticky header takes the tone of the section under it. An overlay header is clear until you scroll." /></SiteSectionBody></SiteSection>
      <SiteSection tone="accent"><SiteSectionBody><SiteHeading title="An accent band." /></SiteSectionBody></SiteSection>
      <SiteSection><SiteSectionBody><SiteHeading title="The page again." /></SiteSectionBody></SiteSection>
    </div>
    <div className="site-demo-frame site-demo-phone">
      {header}
      <SiteSection size="sm"><SiteSectionBody><SiteHeading title="Below 760px" description={fold === "menu" ? "The links and actions fold into a menu. Open it with the button." : "The links hide; the actions stay."} /></SiteSectionBody></SiteSection>
    </div>
  </div>;
}

export function SiteHeadingDemo() {
  const [{ size, align }, setOptions] = useDemoOptions<SiteHeadingOptions>("siteHeading", { size: "display", align: "center" });
  return <div className="stack">
    <DemoSettings title="SiteHeading">
      <OptionSelect label="Size" value={size} options={siteHeadingShareOptions.size as SiteHeadingOptions["size"][]} onChange={size => setOptions({ size })} />
      <OptionSelect label="Align" value={align} options={siteHeadingShareOptions.align as SiteHeadingOptions["align"][]} onChange={align => setOptions({ align })} />
    </DemoSettings>
    <SiteHeading level={2} size={size} align={align} eyebrow="For people who work with PostgreSQL"
      title={<>Your client runs one command. <em>You see the whole picture.</em></>}
      description="pg-probe records PostgreSQL and host metrics into a single file."
      actions={<Button variant="primary" asChild><a href="#components/site-heading">Install pg-probe</a></Button>} />
  </div>;
}

export function SiteFooterDemo() {
  return <SiteFooter start="© 2026 Momoi Labs · PostgreSQL License">
    <a href="#components/site-footer">GitHub</a><a href="#components/site-footer">Releases</a><a href="#components/site-footer">Momoi Labs</a>
  </SiteFooter>;
}

export function FeatureGridDemo() {
  return <div className="stack">
    <FeatureGrid>
      <FeatureGridItem title="Read-only session">One connection with <code>default_transaction_read_only=on</code>.</FeatureGridItem>
      <FeatureGridItem title="Strict allowlist">No credentials, environment variables or command lines in the file.</FeatureGridItem>
      <FeatureGridItem title="Inspectable">The client can open the file before sending it.</FeatureGridItem>
    </FeatureGrid>
    <FeatureGrid>
      <FeatureGridItem title="9.3 and later">PostgreSQL versions</FeatureGridItem>
      <FeatureGridItem title="EL7 and later">RHEL, CentOS, Rocky</FeatureGridItem>
      <FeatureGridItem title="Ubuntu 18.04 and later">deb, tested on 24.04</FeatureGridItem>
      <FeatureGridItem title="x86_64 · arm64">Static binary</FeatureGridItem>
    </FeatureGrid>
  </div>;
}

export function FeatureListDemo() {
  return <FeatureList>
    <FeatureListItem title="Cover and summary,">with a link to every chart.</FeatureListItem>
    <FeatureListItem title={'"What to look for"'}>on every page, written for people who do not know the metric.</FeatureListItem>
    <FeatureListItem title="Sources that were unavailable">listed after the cover, never drawn as zero.</FeatureListItem>
  </FeatureList>;
}

export function WindowFrameDemo() {
  return <div className="stack">
    <WindowFrame variant="terminal" title="ssh db-prod-01" caption="Nothing leaves the server.">
      postgres@db-prod-01:~$ pg-probe capture --duration 3m{"\n"}
      <span className="terminal-badge">pg-probe</span><span className="terminal-tag">0.4.0</span> <span className="terminal-strong">Capture</span> <span className="terminal-dim">· 3m every 5s</span>{"\n\n"}
      <span className="terminal-rule">Progress</span>
      {"Samples      "}<span className="terminal-strong">37</span>{"\n"}
      {"Artifact     "}./db-prod-01.sqlite.gz <span className="terminal-dim">534.0 KiB</span>{"\n\n"}
      <span className="terminal-done">DONE!  Capture finished</span>
      postgres@db-prod-01:~$ <span className="terminal-cursor" />
    </WindowFrame>
    <WindowFrame title="Console">
      <div className="stack" style={{ padding: "var(--spacing-lg)" }}><strong>db-prod-01</strong><span className="muted">156 samples · 39 charts</span></div>
    </WindowFrame>
  </div>;
}

export function PerspectiveStackDemo() {
  return <PerspectiveStack width="16rem">
    <Card data-theme="dark"><CardContent className="stack-sm"><span className="t-caps">Capture report</span><strong>db-prod-01</strong><span className="muted">Saturday, 14:57</span></CardContent></Card>
    <Card><CardContent className="stack-sm"><strong>Lock requests waiting</strong><span className="muted">Page 33 of 47</span></CardContent></Card>
    <Card><CardContent className="stack-sm"><strong>What to look for</strong><span className="muted">Short waits come and go on a busy server.</span></CardContent></Card>
  </PerspectiveStack>;
}
