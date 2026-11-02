import { CreateScreen, DetailScreen, ListScreen } from "../../../kiso/blocks/react-prototype/src/screens-demo";
import { rust, tsx } from "../../../kiso/blocks/react-prototype/src/code-highlight";
import { useNarrow } from "../../../kiso/blocks/react-prototype/src/use-narrow";
import { createContext, Fragment, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Monitor, Smartphone, SquareArrowOutUpRight, SquareTerminal, X } from "lucide-react";
import { TuiScreen, useTuiGallery, type TuiData } from "./tui-gallery";
import screensUrl from "./generated/tui-screens.json?url";
import { docsUrl, templates, type SourceFile, type Template } from "./templates/catalog";
import { LoginLayout, loginResults, type LoginResult } from "./templates/login";
import { ListDetailLayout } from "./templates/crud";
import { DashboardLayout } from "./templates/dashboard";
import { ChartsLayout } from "./templates/charts";
import { ReportLayout } from "./templates/report";
import { WorkspacePreview } from "./templates/workspace";
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FormField,
  Link,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from "@momoi-labs/kiso-react";

export const layouts = templates.map(({ id, label, description }) => ({ id, label, description }));

function LoginExample({ result: requested }: { result?: string }) {
  const result: LoginResult = loginResults.some(([value]) => value === requested) ? (requested as LoginResult) : "refused";
  const id = useId();
  return (
    <section aria-label="Login">
      <div className="layout-preview-caption">
        <div className="row-wrap layout-scene-controls">
          <Select value={result} onValueChange={value => { window.location.hash = `example/login/${value}`; }}>
            <FormField label="Sign-in result" layout="inline" id={`${id}-result`}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
            <SelectContent>
              {loginResults.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="row-wrap layout-scene-controls">
          <DeviceSwitch tui />
          <OpenAlone route={`example/login/${result}`} />
        </div>
      </div>
      <LayoutPreview route={`example/login/${result}`} tui={{ page: "login", state: result === "success" ? "default" : result }}>
        <LoginLayout key={result} result={result} />
      </LayoutPreview>
    </section>
  );
}

/* The same projects two ways: a split with the selected record beside the
   list, or separate list, detail and create screens. The screen in view and
   the save result live in the route, so the preview frame and a new tab open
   the same state; the preview itself moves between the screens. */
const scenes = [["split", "Split"], ["list", "List"], ["detail", "Detail"], ["create", "Create"]] as const;
type Scene = (typeof scenes)[number][0];

function CrudExample({ scene: requested, result }: { scene?: string; result?: string }) {
  const scene: Scene = scenes.some(([key]) => key === requested) ? (requested as Scene) : "split";
  const createFails = result === "error";
  const go = (next: Scene, fails = createFails) => { window.location.hash = `example/crud/${next}/${fails ? "error" : "success"}`; };
  const projects = { label: "Projects", onClick: () => go("list") };
  const notify = useToast();
  const id = useId();
  return (
    <section aria-label="CRUD">
      <div className="layout-preview-caption">
        <div className="row-wrap layout-scene-controls">
          <RadioGroup label="Screen" variant="segmented" className="layout-scene" value={scene} onValueChange={value => go(value as Scene)}>
            {scenes.map(([key, label]) => <RadioGroupItem key={key} value={key} label={label} />)}
          </RadioGroup>
          <Select value={createFails ? "error" : "success"} onValueChange={value => go(scene, value === "error")}>
            <FormField label="Save result" layout="inline" id={`${id}-result`}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
            <SelectContent>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error, then retry succeeds</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="row-wrap layout-scene-controls">
          <DeviceSwitch tui />
          <OpenAlone route={`example/crud/${scene}/${createFails ? "error" : "success"}`} />
        </div>
      </div>
      <LayoutPreview route={`example/crud/${scene}/${createFails ? "error" : "success"}`} tui={{ page: "crud", state: scene === "split" ? "list" : scene }}>
        {scene === "split" ? <ListDetailLayout createFails={createFails} /> : scene === "list" ? (
          <WorkspacePreview page="Projects">
            <ListScreen createFails={createFails} onOpen={() => go("detail")} onCreate={() => go("create")} />
          </WorkspacePreview>
        ) : scene === "detail" ? (
          <WorkspacePreview page="Website refresh" parent={projects}>
            <DetailScreen onDeleted={() => { go("list"); notify("success", "Project deleted", "Website refresh was removed."); }} />
          </WorkspacePreview>
        ) : (
          <WorkspacePreview page="New project" parent={projects}>
            <CreateScreen fail={createFails} onCancel={() => go("list")} onCreated={() => { go("list"); notify("success", "Project created", "Your team can start on it."); }} />
          </WorkspacePreview>
        )}
      </LayoutPreview>
    </section>
  );
}

const standaloneUrl = (route: string) => `${window.location.pathname}?frame#${route}`;

// The example alone in a tab, without the gallery around it.
function OpenAlone({ route }: { route: string }) {
  if (phoneFrame || standalone) return null;
  return <Link className="t-label" href={standaloneUrl(route)} target="_blank" rel="noopener noreferrer">
    Open in a new tab<SquareArrowOutUpRight className="icon icon-sm" aria-hidden="true" />
  </Link>;
}

// The page alone, for the previews: the gallery loads it in a frame at a
// desktop or a phone size, so its media queries respond as on that screen.
// The example's controls stay outside and pass their state in the route.
const frameParams = new URLSearchParams(window.location.search);
export const phoneFrame = frameParams.has("phone-frame");
const frameUrl = (route: string) => `${window.location.pathname}?phone-frame#${route}`;
// The example alone in a tab, with its controls and the device choice.
export const standalone = frameParams.has("frame");

/* How the example is shown: at desktop width, in a phone, or in a
   terminal, drawn by tui-kiso. */
type Device = "desktop" | "phone" | "tui";
const devices: Device[] = ["desktop", "phone", "tui"];
type DeviceView = { device: Device; choose: (device: Device) => void; tui: TuiData | "failed" | null; accent: string; theme: string };
const DeviceContext = createContext<DeviceView>({ device: "desktop", choose: () => {}, tui: null, accent: "", theme: "" });

// Sits in each example's caption row, so the preview keeps the height.
// The terminal is offered where the example has terminal screens.
function DeviceSwitch({ tui = false }: { tui?: boolean }) {
  const { device, choose } = useContext(DeviceContext);
  if (phoneFrame) return null;
  return <RadioGroup label="Preview device" variant="segmented" className="layout-device" value={device === "tui" && !tui ? "desktop" : device} onValueChange={value => choose(value as Device)}>
    <RadioGroupItem value="desktop" label="Desktop" icon={<Monitor className="icon" />} />
    <RadioGroupItem value="phone" label="Phone" icon={<Smartphone className="icon" />} />
    {tui && <RadioGroupItem value="tui" label="TUI" icon={<SquareTerminal className="icon" />} />}
  </RadioGroup>;
}

// The screen sizes the previews draw at, before they scale down to fit.
const desktopSize = [1280, 800] as const;
const phoneSize = [390, 844] as const;

/* Draws its child at its own size, then scales it down to fit the stage,
   so a whole screen shows without scrolling. Without a size, the child's
   own size is measured, as for a terminal screen. */
function Scaled({ size, className, children }: { size?: readonly [number, number]; className?: string; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const room = stage.current;
    const screen = inner.current;
    if (!room || !screen) return;
    const measure = () => {
      const style = getComputedStyle(room);
      const width = room.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = room.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const [w, h] = size ?? [screen.offsetWidth, screen.offsetHeight];
      if (!w || !h || width <= 0 || height <= 0) return;
      const scale = Math.min(1, width / w, height / h);
      setFit({ scale, width: Math.floor(w * scale), height: Math.floor(h * scale) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    observer.observe(screen);
    return () => observer.disconnect();
  }, [size]);
  return <div ref={stage} className={`layout-stage ${className ?? ""}`}>
    <div className="layout-scaled" style={fit ? { width: fit.width, height: fit.height } : undefined}>
      <div ref={inner} className="layout-scaled-screen"
        style={{ ...(size ? { width: size[0], height: size[1] } : { width: "max-content" }), transform: `scale(${fit?.scale ?? 1})`, visibility: fit ? undefined : "hidden" }}>
        {children}
      </div>
    </div>
  </div>;
}

function LayoutPreview({ route, tui, paper = false, children }: { route: string; tui?: { page: string; state: string }; paper?: boolean; children: ReactNode }) {
  const context = useContext(DeviceContext);
  const view = paper ? { ...context, device: "desktop" as Device } : context;
  if (phoneFrame) return <div className="layout-preview">{children}</div>;
  const terminal = view.device === "tui" && tui
    ? <TuiScreen data={view.tui} page={tui.page} state={tui.state} accent={view.accent} theme={view.theme} />
    : null;
  if (standalone) {
    // Alone in a tab the page is the window.
    if (view.device === "phone") return <div className="layout-preview"><PhoneFrame route={route} /></div>;
    if (terminal) return <Card className="tui-frame layout-tui"><div className="tui-stage hatch">{terminal}</div></Card>;
    return <div className="layout-preview">{children}</div>;
  }
  // In the gallery's dialog the whole screen scales down to the room left.
  if (terminal) return <Scaled className="hatch">{terminal}</Scaled>;
  const phone = view.device === "phone";
  return <Scaled size={phone ? phoneSize : desktopSize} className={phone ? "hatch layout-stage-phone" : undefined}>
    <iframe key={route} title={`Example at ${phone ? "phone" : "desktop"} size`} src={frameUrl(route)} />
  </Scaled>;
}

// The phone keeps a real 844px screen. Its panel takes the height left in
// the window and scrolls inside, so the page around it does not scroll.
function PhoneFrame({ route }: { route: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const fit = () => {
      const panel = stage.current;
      const card = panel?.parentElement;
      if (!panel || !card) return;
      // The gallery page scrolls inside its frame, not the window.
      let scroller: HTMLElement | null = card.parentElement;
      while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
      if (!scroller) return;
      const inner = scroller.getBoundingClientRect().bottom - parseFloat(getComputedStyle(scroller).paddingBottom);
      const content = Math.max(...[...scroller.children].filter(child => child.getClientRects().length > 0)
        .map(child => child.getBoundingClientRect().bottom + parseFloat(getComputedStyle(child).marginBottom)));
      setHeight(Math.floor(Math.max(320, panel.offsetHeight + inner - content - 1)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return <Card className="layout-phone-frame">
    <div ref={stage} className="layout-phone-stage hatch" style={{ height }}>
      <iframe title="Example at phone width" src={frameUrl(route)} />
    </div>
  </Card>;
}

export function LayoutExamples({ route, accent, theme }: { route: string; accent: string; theme: string }) {
  const [device, setDevice] = useState<Device>(() => {
    const saved = localStorage.getItem("kiso-gallery-layout-device");
    return devices.includes(saved as Device) ? (saved as Device) : "desktop";
  });
  const [, requested] = route.split("/");
  const open = templates.find(template => template.id === requested);
  // The terminal screens, written by the tui-kiso `screens` example, load
  // the first time the terminal is chosen.
  const tui = useTuiGallery(!phoneFrame && device === "tui" && (standalone || open !== undefined), screensUrl);
  if (phoneFrame) return <LayoutExample route={route} />;
  const choose = (next: Device) => { setDevice(next); localStorage.setItem("kiso-gallery-layout-device", next); };
  return (
    <DeviceContext.Provider value={{ device, choose, tui, accent, theme }}>
      {standalone ? <LayoutExample route={route} /> : <>
        <TemplateList />
        {open && <TemplateDialog key={open.id} template={open} route={route} />}
      </>}
    </DeviceContext.Provider>
  );
}

function LayoutExample({ route }: { route: string }) {
  const [, requested, scene, result] = route.split("/");
  const selected = templates.find((template) => template.id === requested) ?? templates[0];
  if (selected.id === "login") return <LoginExample result={scene} />;
  if (selected.id === "crud") return <CrudExample scene={scene} result={result} />;
  // The report prints from its own button; it has no phone or terminal view.
  if (selected.id === "report") return (
    <section aria-label={selected.label}>
      <div className="layout-preview-caption">
        <div className="row-wrap layout-scene-controls">
          <OpenAlone route="example/report" />
        </div>
      </div>
      <LayoutPreview route="example/report" paper><ReportLayout /></LayoutPreview>
    </section>
  );
  return (
    <section aria-label={selected.label}>
      <div className="layout-preview-caption">
        <div className="row-wrap layout-scene-controls">
          <DeviceSwitch tui />
          <OpenAlone route={`example/${selected.id}`} />
        </div>
      </div>
      <LayoutPreview route={`example/${selected.id}`} tui={{ page: selected.id, state: "default" }}>
        {selected.id === "dashboard" ? <DashboardLayout /> : <ChartsLayout />}
      </LayoutPreview>
    </section>
  );
}

/* The Layouts page: one template per row, its screen on the left and what
   it is for on the right. Open shows it in a dialog; on a phone, where a
   dialog has no room for a screen, it opens alone in a new tab. */
function TemplateList() {
  const { choose } = useContext(DeviceContext);
  const narrow = useNarrow();
  const open = (id: string, device: Device) => (event: MouseEvent<HTMLAnchorElement>) => {
    choose(device);
    if (narrow) return;
    event.preventDefault();
    window.location.hash = `example/${id}`;
  };
  const opener = { target: narrow ? "_blank" : undefined, rel: narrow ? "noopener noreferrer" : undefined };
  return (
    <div className="layout-list">
      {templates.map((template, index) => (
        <Fragment key={template.id}>
          {index > 0 && <Separator />}
          <article className="layout-row" aria-labelledby={`layout-${template.id}`}>
            <a className="layout-thumb" href={standaloneUrl(`example/${template.id}`)} {...opener} onClick={open(template.id, "desktop")}
              aria-label={`Open ${template.label}`}>
              <Scaled size={desktopSize}>
                <iframe title={`${template.label} preview`} src={frameUrl(`example/${template.id}`)} loading="lazy" tabIndex={-1} aria-hidden="true" />
              </Scaled>
            </a>
            <div className="layout-row-info">
              <div className="layout-row-title">
                <h2 className="t-h2" id={`layout-${template.id}`}>{template.label}</h2>
                <span className="muted t-label">
                  {template.states.length > 0 && `${template.states.length} states · `}{"paper" in template ? "Desktop and paper" : "Desktop, phone and TUI"}
                </span>
              </div>
              <p className="muted">{template.description}</p>
              {template.states.length > 0 && <div className="stack-sm">
                <p className="t-caps muted">States</p>
                <div className="row-wrap">{template.states.map(state => <Badge key={state} variant="neutral">{state}</Badge>)}</div>
              </div>}
              <div className="stack-sm">
                <p className="t-caps muted">Components</p>
                <div className="row-wrap">{template.components.map(item => <Badge key={item.name} variant="neutral" title={item.does}>{item.name}</Badge>)}</div>
              </div>
              <div className="row-wrap">
                <Button asChild variant="primary" size="sm">
                  <a href={standaloneUrl(`example/${template.id}`)} {...opener} onClick={open(template.id, "desktop")}>Open</a>
                </Button>
                {!("paper" in template) && <>
                <Button asChild variant="ghost" size="sm">
                  <a href={standaloneUrl(`example/${template.id}`)} {...opener} onClick={open(template.id, "phone")}
                    aria-label={`Open ${template.label} on a phone`}><Smartphone className="icon icon-sm" aria-hidden="true" />Phone</a>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={standaloneUrl(`example/${template.id}`)} {...opener} onClick={open(template.id, "tui")}
                    aria-label={`Open ${template.label} in a terminal`}><SquareTerminal className="icon icon-sm" aria-hidden="true" />TUI</a>
                </Button>
                </>}
              </div>
            </div>
          </article>
        </Fragment>
      ))}
    </div>
  );
}

/* A template in a dialog the size of the window: the screen with its
   states and devices, the code that draws it, and its components. The
   route names the template, so a link opens it. */
function TemplateDialog({ template, route }: { template: Template; route: string }) {
  const close = () => { window.location.hash = "example"; };
  return (
    <Dialog open onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="layout-dialog">
        <DialogHeader className="layout-dialog-head">
          <div className="layout-dialog-heading">
            <DialogTitle>{template.label}</DialogTitle>
            <DialogDescription>{template.description}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button className="btn-icon" size="sm" variant="ghost" aria-label="Close">
              <X className="icon icon-sm" aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <Tabs defaultValue="preview" className="layout-dialog-tabs">
          <TabsList aria-label={`${template.label} template`}>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="components">Components ({template.components.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="preview"><LayoutExample route={route} /></TabsContent>
          <TabsContent value="code"><TemplateCode files={template.files} /></TabsContent>
          <TabsContent value="components"><TemplateComponents template={template} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCode({ files }: { files: readonly SourceFile[] }) {
  const [index, setIndex] = useState(0);
  const file = files[index];
  return <>
    <RadioGroup label="File" variant="segmented" className="layout-files" value={String(index)} onValueChange={value => setIndex(Number(value))}>
      {files.map((item, at) => <RadioGroupItem key={item.name} value={String(at)} label={item.language === "rust" ? `Terminal · ${item.name}` : item.name} />)}
    </RadioGroup>
    <CodeBlock key={file.path} code={file.code} highlight={file.language === "rust" ? rust : tsx} title={file.path} copy="code" lineNumbers />
  </>;
}

function TemplateComponents({ template }: { template: Template }) {
  return <>
    <p className="muted">What each component does in this template, and what it leaves to another one. The link opens its full contract.</p>
    <Table aria-label={`Components in the ${template.label} template`}>
      <TableHeader>
        <TableRow>
          <TableHead>Component</TableHead>
          <TableHead>Does</TableHead>
          <TableHead>Does not</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {template.components.map(item => (
          <TableRow key={item.name}>
            <TableCell>
              <strong>{item.name}</strong>
              <p><Link className="mono t-label" href={`${docsUrl}components/${item.doc}`} target="_blank" rel="noopener noreferrer">{item.doc}</Link></p>
            </TableCell>
            <TableCell>{item.does}</TableCell>
            <TableCell className="muted">{item.doesNot}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <p className="t-label">
      Pattern: <Link href={`${docsUrl}patterns/${template.pattern}`} target="_blank" rel="noopener noreferrer">patterns/{template.pattern}</Link>
    </p>
  </>;
}
