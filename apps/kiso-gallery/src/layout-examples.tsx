import { rust, tsx } from "../../../kiso/blocks/react-prototype/src/code-highlight";
import { useNarrow } from "../../../kiso/blocks/react-prototype/src/use-narrow";
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Monitor, Smartphone, SquareArrowOutUpRight, SquareTerminal, X } from "lucide-react";
import { TuiScreen, useTuiGallery, type TuiData } from "./tui-gallery";
import screensUrl from "./generated/tui-screens.json?url";
import { docsUrl, templates, type SourceFile, type Template } from "./templates/catalog";
import { loginResults } from "./templates/login";
import { consoleLayouts, consoleScreens, crudPath, type ConsoleScreen } from "./templates/crud";
import { ShopApp, readShopPath, shopName, shopPages } from "./templates/shop";
import { Storefront } from "./templates/storefront";
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
} from "@momoi-labs/kiso-react";

export const layouts = templates.map(({ id, label, description }) => ({ id, label, description }));

const appTemplates = templates.filter(template => template.id !== "landing");
const landing = templates.find(template => template.id === "landing")!;

function PageSelect({ page }: { page: string }) {
  const id = useId();
  return <Select value={page} onValueChange={value => { window.location.hash = `example/${value}`; }}>
    <FormField label="Page" layout="inline" id={`${id}-page`}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
    <SelectContent>
      {shopPages.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function AppExample({ route }: { route: string }) {
  const { theme, setTheme } = useContext(DeviceContext);
  const path = route.split("/").slice(1).join("/");
  const at = readShopPath(path);
  const navigate = (next: string) => {
    if (phoneFrame) window.location.replace(`#example/${next}`);
    else window.location.hash = `example/${next}`;
  };
  const tab = at.screen === "detail" && at.tab !== "overview" ? at.tab : undefined;
  const tui = at.page === "login" ? { page: "login", state: at.result === "success" ? "default" : at.result }
    : at.page === "crud" ? { page: "crud", state: at.screen === "detail" ? "detail" : at.screen === "list" || at.screen === "empty" ? "list" : "create" }
    : at.page === "report" ? { page: "report", state: at.report.id }
    : { page: at.page, state: "default" };
  const id = useId();
  return (
    <section data-page-width="full" aria-label={shopPages.find(([value]) => value === at.page)![1]}>
      <div className="layout-preview-caption">
        <div className="row-wrap layout-scene-controls">
          <PageSelect page={at.page} />
          {at.page === "login" && <>
            <Select value={at.result} onValueChange={value => navigate(`login/${value}`)}>
              <FormField label="Sign-in result" layout="inline" id={`${id}-result`}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
              <SelectContent>
                {loginResults.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="muted t-label">The demo account is filled in.</span>
          </>}
          {at.page === "crud" && <>
            <Select value={at.screen} onValueChange={value => navigate(crudPath(value as ConsoleScreen, at.chosen))}>
              <FormField label="Screen" layout="inline" id={`${id}-screen`}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
              <SelectContent>
                {consoleScreens.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <RadioGroup label="Layout" variant="segmented" className="layout-scene" value={at.layout}
              onValueChange={value => navigate(crudPath(at.screen, value, tab))}>
              {consoleLayouts.map(value => <RadioGroupItem key={value} value={value} label={value[0].toUpperCase() + value.slice(1)} />)}
            </RadioGroup>
            <RadioGroup label="Theme" variant="segmented" className="layout-scene" value={theme} onValueChange={setTheme}>
              {themes.map(([value, label]) => <RadioGroupItem key={value} value={value} label={label} />)}
            </RadioGroup>
          </>}
        </div>
        <div className="row-wrap layout-scene-controls">
          <DeviceSwitch tui={tui !== undefined} />
          <OpenAlone route={route} />
        </div>
      </div>
      <LayoutPreview route={route} tui={tui}>
        <ShopApp path={path} onNavigate={navigate} theme={theme} onThemeChange={setTheme} />
      </LayoutPreview>
    </section>
  );
}

const themes = [["system", "System"], ["light", "Light"], ["dark", "Dark"]] as const;

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
export type Device = "desktop" | "phone" | "tui";
const devices: Device[] = ["desktop", "phone", "tui"];
type DeviceView = { device: Device; choose: (device: Device) => void; tui: TuiData | "failed" | null; accent: string; theme: string; setTheme: (theme: string) => void };
const DeviceContext = createContext<DeviceView>({ device: "desktop", choose: () => {}, tui: null, accent: "", theme: "", setTheme: () => {} });

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
function Scaled({ size, fill = false, className, children }: { size?: readonly [number, number]; fill?: boolean; className?: string; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; width: number; height: number; drawWidth: number } | null>(null);
  useLayoutEffect(() => {
    const room = stage.current;
    const screen = inner.current;
    if (!room || !screen) return;
    const measure = () => {
      const style = getComputedStyle(room);
      const width = room.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = room.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const [base, h] = size ?? [screen.offsetWidth, screen.offsetHeight];
      if (!base || !h || width <= 0 || height <= 0) return;
      const w = size && fill ? Math.max(base, Math.floor(h * width / height)) : base;
      const scale = Math.min(1, width / w, height / h);
      setFit({ scale, width: Math.floor(w * scale), height: Math.floor(h * scale), drawWidth: w });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    observer.observe(screen);
    return () => observer.disconnect();
  }, [size, fill]);
  return <div ref={stage} className={`layout-stage ${className ?? ""}`}>
    <div className="layout-scaled" style={fit ? { width: fit.width, height: fit.height } : undefined}>
      <div ref={inner} className="layout-scaled-screen"
        style={{ ...(size ? { width: fit?.drawWidth ?? size[0], height: size[1] } : { width: "max-content" }), transform: `scale(${fit?.scale ?? 1})`, visibility: fit ? undefined : "hidden" }}>
        {children}
      </div>
    </div>
  </div>;
}

function ExampleFrame({ route, title, onNavigate }: { route: string; title: string; onNavigate?: (route: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [first] = useState(route);
  const shown = useRef(route);
  useEffect(() => {
    if (shown.current === route) return;
    shown.current = route;
    try {
      const inner = frame.current?.contentWindow;
      if (inner && inner.location.hash !== `#${route}`) inner.location.replace(frameUrl(route));
    } catch {
      return;
    }
  }, [route]);
  const watch = () => {
    const inner = frame.current?.contentWindow;
    if (!inner || !onNavigate) return;
    inner.addEventListener("hashchange", () => onNavigate(inner.location.hash.slice(1)));
  };
  return <iframe ref={frame} title={title} src={frameUrl(first)} onLoad={watch} />;
}

function LayoutPreview({ route, tui, children }: { route: string; tui?: { page: string; state: string }; children: ReactNode }) {
  const view = useContext(DeviceContext);
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
  return <Scaled size={phone ? phoneSize : desktopSize} fill={!phone} className={phone ? "hatch layout-stage-phone" : undefined}>
    <ExampleFrame route={route} title={`Example at ${phone ? "phone" : "desktop"} size`} />
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
      <ExampleFrame route={route} title="Example at phone width" />
    </div>
  </Card>;
}

export function LayoutExamples({ route, accent, theme, onThemeChange }: { route: string; accent: string; theme: string; onThemeChange: (theme: string) => void }) {
  const [device, setDevice] = useState<Device>(() => {
    const saved = localStorage.getItem("kiso-gallery-layout-device");
    return devices.includes(saved as Device) ? (saved as Device) : "desktop";
  });
  const [, requested] = route.split("/");
  const open = templates.find(template => template.id === requested);
  // The terminal screens, written by the tui-kiso `screens` example, load
  // the first time the terminal is chosen.
  const tui = useTuiGallery(!phoneFrame && device === "tui" && (standalone || open !== undefined), screensUrl);
  if (phoneFrame) return <DeviceContext.Provider value={{ device: "desktop", choose: () => {}, tui: null, accent, theme, setTheme: onThemeChange }}>
    <LayoutExample route={route} />
  </DeviceContext.Provider>;
  const choose = (next: Device) => { setDevice(next); localStorage.setItem("kiso-gallery-layout-device", next); };
  return (
    <DeviceContext.Provider value={{ device, choose, tui, accent, theme, setTheme: onThemeChange }}>
      {standalone ? <LayoutExample route={route} /> : <>
        <TemplateList />
        {open && <TemplateDialog key={open.id === "landing" ? "landing" : "app"} template={open} route={route} />}
      </>}
    </DeviceContext.Provider>
  );
}

function LayoutExample({ route }: { route: string }) {
  if (route.split("/")[1] !== "landing") return <AppExample route={route} />;
  return (
    <section aria-label={landing.label}>
      <div className="layout-preview-caption"><DeviceSwitch /><OpenAlone route="example/landing" /></div>
      <LayoutPreview route="example/landing"><Storefront /></LayoutPreview>
    </section>
  );
}

/* The Layouts page: the application and the landing page, each with its
   screen on the left and what it is for on the right. Open shows it in a
   dialog; on a phone, where a dialog has no room for a screen, it opens
   alone in a new tab. */
function TemplateList() {
  const { choose } = useContext(DeviceContext);
  const narrow = useNarrow();
  const open = (id: string, device?: Device) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (device) choose(device);
    if (narrow) return;
    event.preventDefault();
    window.location.hash = `example/${id}`;
  };
  const opener = { target: narrow ? "_blank" : undefined, rel: narrow ? "noopener noreferrer" : undefined };
  return (
    <div className="layout-list">
      <article className="layout-row" aria-labelledby="layout-app">
        <a className="layout-thumb" href={standaloneUrl("example/login")} {...opener} onClick={open("login", "desktop")}
          aria-label={`Open ${shopName}`}>
          <Scaled size={desktopSize}>
            <iframe title={`${shopName} preview`} src={frameUrl("example/dashboard")} loading="lazy" tabIndex={-1} aria-hidden="true" />
          </Scaled>
        </a>
        <div className="layout-row-info">
          <div className="layout-row-title">
            <h2 className="t-h2" id="layout-app">{shopName}</h2>
            <span className="muted t-label">{appTemplates.length} pages · Desktop, phone and TUI</span>
          </div>
          <p className="muted">
            One application on ConsoleShell: the back office of a small shop that sells tools for ninjas.
            Sign in, then use the sidebar to reach every page. Each page shows its own code.
          </p>
          <Table aria-label={`Pages of ${shopName}`}>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>What it shows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Link href={standaloneUrl(`example/${template.id}`)} {...opener} onClick={open(template.id)}>{template.label}</Link>
                  </TableCell>
                  <TableCell className="muted">{template.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="row-wrap">
            <Button asChild variant="primary" size="sm">
              <a href={standaloneUrl("example/login")} {...opener} onClick={open("login", "desktop")}>Open app</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={standaloneUrl("example/login")} {...opener} onClick={open("login", "phone")}
                aria-label={`Open ${shopName} on a phone`}><Smartphone className="icon icon-sm" aria-hidden="true" />Phone</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={standaloneUrl("example/login")} {...opener} onClick={open("login", "tui")}
                aria-label={`Open ${shopName} in a terminal`}><SquareTerminal className="icon icon-sm" aria-hidden="true" />TUI</a>
            </Button>
          </div>
        </div>
      </article>
      <Separator />
      <article className="layout-row" aria-labelledby="layout-landing">
        <a className="layout-thumb" href={standaloneUrl("example/landing")} {...opener} onClick={open("landing", "desktop")}
          aria-label={`Open ${landing.label}`}>
          <Scaled size={desktopSize}>
            <iframe title={`${landing.label} preview`} src={frameUrl("example/landing")} loading="lazy" tabIndex={-1} aria-hidden="true" />
          </Scaled>
        </a>
        <div className="layout-row-info">
          <div className="layout-row-title">
            <h2 className="t-h2" id="layout-landing">{landing.label}</h2>
            <span className="muted t-label">Desktop and phone</span>
          </div>
          <p className="muted">{landing.description}</p>
          <div className="stack-sm">
            <p className="t-caps muted">Components</p>
            <div className="row-wrap">{landing.components.map(item => <Badge key={item.name} variant="neutral" title={item.does}>{item.name}</Badge>)}</div>
          </div>
          <div className="row-wrap">
            <Button asChild variant="primary" size="sm">
              <a href={standaloneUrl("example/landing")} {...opener} onClick={open("landing", "desktop")}>Open</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={standaloneUrl("example/landing")} {...opener} onClick={open("landing", "phone")}
                aria-label={`Open ${landing.label} on a phone`}><Smartphone className="icon icon-sm" aria-hidden="true" />Phone</a>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}

/* The application or the landing page in a dialog the size of the window:
   the screen with its states and devices, the code that draws the page in
   view, and its components. The route names the page, so a link opens it. */
function TemplateDialog({ template, route }: { template: Template; route: string }) {
  const close = () => { window.location.hash = "example"; };
  const app = template.id !== "landing";
  const [tab, setTab] = useState("preview");
  return (
    <Dialog open onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="layout-dialog">
        <DialogHeader className="layout-dialog-head">
          <div className="layout-dialog-heading">
            <DialogTitle>{app ? shopName : template.label}</DialogTitle>
            <DialogDescription>{app ? `${template.label}. ${template.description}` : template.description}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button className="btn-icon" size="sm" variant="ghost" aria-label="Close">
              <X className="icon icon-sm" aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="layout-dialog-tabs">
          <TabsList aria-label={`${app ? shopName : template.label} template`}>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="components">Components ({template.components.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" forceMount hidden={tab !== "preview"}><LayoutExample route={route} /></TabsContent>
          <TabsContent value="code">
            <TemplateCode key={template.id} files={template.files} page={app ? template.id : undefined} />
          </TabsContent>
          <TabsContent value="components">
            {app && <div className="row-wrap layout-scene-controls"><PageSelect page={template.id} /></div>}
            <TemplateComponents template={template} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCode({ files, page }: { files: readonly SourceFile[]; page?: string }) {
  const [index, setIndex] = useState(0);
  const file = files[index];
  return <>
    <div className="row-wrap layout-scene-controls">
      {page && <PageSelect page={page} />}
      <RadioGroup label="File" variant="segmented" className="layout-files" value={String(index)} onValueChange={value => setIndex(Number(value))}>
        {files.map((item, at) => <RadioGroupItem key={item.name} value={String(at)} label={item.language === "rust" ? `Terminal · ${item.name}` : item.name} />)}
      </RadioGroup>
    </div>
    <CodeBlock key={file.path} code={file.code} highlight={file.language === "rust" ? rust : file.language === "tsx" ? tsx : undefined} title={file.path} copy="code" lineNumbers />
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

export function ThemePreview({ page, device, accent, theme, onPage }: { page: string; device: Device; accent: string; theme: string; onPage: (page: string) => void }) {
  const data = useTuiGallery(device === "tui", screensUrl);
  const route = `example/${page}`;
  const at = readShopPath(page);
  const label = shopPages.find(([value]) => value === at.page)?.[1] ?? shopName;
  if (device === "tui") {
    const state = at.page === "login" ? "default" : at.page === "crud" ? "list" : at.page === "report" ? at.report.id : "default";
    return <Scaled className="hatch"><TuiScreen data={data} page={at.page} state={state} accent={accent} theme={theme} /></Scaled>;
  }
  const phone = device === "phone";
  return <Scaled size={phone ? phoneSize : desktopSize} fill={!phone} className={phone ? "hatch layout-stage-phone" : undefined}>
    <ExampleFrame route={route} title={`${label} at ${phone ? "phone" : "desktop"} size`}
      onNavigate={path => { if (path.startsWith("example/")) onPage(path.slice(8)); }} />
  </Scaled>;
}
