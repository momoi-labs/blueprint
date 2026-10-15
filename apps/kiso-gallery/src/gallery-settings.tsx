import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { AppShellPanel, AppShellPanelToggle, Button, Drawer, DrawerContent, DrawerTitle, DrawerTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from "@momoi-labs/kiso-react";
import { DemoSettingsContext, type DemoChoiceProps } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { animateGalleryPanels } from "../../../kiso/blocks/react-prototype/src/gallery-motion";
import { AppearanceControls, VisualSelector, type AppearanceSectionId } from "./appearance";
import { BackgroundPreview, PanelPreview } from "./appearance-previews";
import { AppearanceShare } from "./appearance-share-ui";
import { AppearanceUsage } from "./appearance-usage";
import type { AppearanceSettings, BorderStyle, CornerMarks, CornerStyle, Size } from "./appearance-settings";

// Each tab is short. Frame puts the most used section first. Below 1024px the
// tabs become sections, one open at a time, so five labels never need to fit
// a phone.
const appearanceTabs: { value: string; label: string; sections?: AppearanceSectionId[] }[] = [
  { value: "look", label: "Look", sections: ["colors", "presets"] },
  { value: "canvas", label: "Canvas", sections: ["background", "charts"] },
  { value: "frame", label: "Frame", sections: ["main", "scope", "layout"] },
  { value: "phone", label: "Phone", sections: ["phone"] },
  { value: "code", label: "Code" },
];

export function GallerySettings({ children, route, settings, onChange, onReset }: {
  children: (panel: ReactNode, toggle: ReactNode) => ReactNode;
  route: string;
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 1200px)").matches);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("look");
  const scroll = useRef<HTMLDivElement>(null);
  // A new tab starts at its top. The strip is sticky, so scroll back to it
  // only when it has scrolled away; a phone section header stays in view.
  function selectTab(value: string) {
    setTab(value);
    requestAnimationFrame(() => {
      const region = scroll.current;
      const tabs = region?.querySelector(".appearance-tabs");
      const list = tabs?.querySelector<HTMLElement>(":scope > [role=tablist]");
      if (!region || !tabs || !list) return;
      if (list.offsetParent) {
        const top = tabs.getBoundingClientRect().top - region.getBoundingClientRect().top + region.scrollTop;
        region.scrollTop = Math.min(region.scrollTop, top);
      } else tabs.querySelector(".tabs-section[aria-expanded=true]")?.scrollIntoView({ block: "nearest" });
    });
  }
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const manualOpen = useRef(false);
  const returnFocus = useRef(false);
  // Demo options open beside the page on a desktop. Below 1200px the panel
  // is a modal drawer, so it waits for the options link instead of covering
  // the demo the person just opened.
  const register = useCallback((title: string | null) => {
    if (title && matchMedia("(min-width: 1200px)").matches) setOpen(true);
  }, []);
  const [revision, setRevision] = useState(0);
  const show = useCallback(() => {
    setOpen(true);
    setRevision(value => value + 1);
  }, []);
  // Demo choices draw with the same previews as the sections above. "Pane
  // defaults" previews the current global choice, so inherit reads as a value.
  const choice = useCallback(({ label, kind, value, options, onChange, inherit, with: other }: DemoChoiceProps) => {
    const preview = (key: string) => {
      const pick = key === "inherit" ? undefined : key;
      if (kind === "background" || kind === "strength") {
        const background = (kind === "background" ? pick : other?.background) as AppearanceSettings["backgroundStyle"] | undefined;
        const strength = (kind === "strength" ? pick : other?.strength) as AppearanceSettings["backgroundStrength"] | undefined;
        return <BackgroundPreview background={background ?? settings.backgroundStyle} strength={strength ?? settings.backgroundStrength} tone={settings.paperTone} />;
      }
      return <PanelPreview
        border={kind === "border" ? (pick as BorderStyle | undefined) ?? settings.borderStyle : settings.borderStyle}
        corner={kind === "corner" ? (pick as CornerStyle | undefined) ?? settings.cornerStyle : settings.cornerStyle}
        size={kind === "cornerSize" ? (pick as Size | undefined) ?? settings.cornerSize : settings.cornerSize}
        marks={kind === "marks" ? (pick as CornerMarks | undefined) ?? settings.cornerMarks : settings.cornerMarks} />;
    };
    // The same pairing rules as the Main style section, against the values the
    // nodes will take: the demo's own choice, or the page's when inherited.
    const border = other?.border ?? settings.borderStyle;
    const corner = other?.corner ?? settings.cornerStyle;
    const pixelBorder = (value: string) => ["solid", "none", "manga", "brush"].includes(value);
    const disabledOptions = options.map(([key]) => key).filter(key =>
      (kind === "marks" && ((key === "arcs" && (["manga", "brush"].includes(border) || corner === "pixel")) || (key === "brackets" && border === "brush")))
      || (kind === "corner" && key === "pixel" && !pixelBorder(border))
      || (kind === "border" && corner === "pixel" && !pixelBorder(key)));
    return <VisualSelector label={label} value={value ?? "inherit"} options={inherit ? [["inherit", "Pane defaults"], ...options] : options}
      onChange={next => onChange(next === "inherit" ? undefined : next)} preview={preview} disabledOptions={disabledOptions}
      layout={kind === "strength" ? "wide" : "compact"} />;
  }, [settings]);
  const context = useMemo(() => ({ target, register, open, show, revision, choice }), [target, register, open, show, revision, choice]);

  useEffect(() => {
    const media = matchMedia("(min-width: 1200px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    // Old bookmarks now open settings over Intro instead of a separate page.
    if (route === "appearance") {
      setOpen(true);
      window.location.replace("#intro");
    }
  }, [route]);
  useLayoutEffect(() => {
    if (desktop && open && manualOpen.current) heading.current?.focus();
    if (desktop && !open && returnFocus.current) trigger.current?.focus();
    manualOpen.current = false;
    returnFocus.current = false;
  }, [desktop, open]);

  function close() {
    returnFocus.current = true;
    if (desktop) animateGalleryPanels(".gallery-settings-panel", () => setOpen(false));
    else setOpen(false);
  }
  const controls = <>
    <div className="gallery-settings-actions">
      <div className="gallery-settings-buttons">
        <Button size="sm" onClick={() => { onReset(); setMessage("Global settings reset."); }}>Reset appearance</Button>
        <AppearanceShare settings={settings} onApply={onChange} />
      </div>
      <p role="status" className="muted t-label">{message}</p>
    </div>
    <div className="appearance-controls-scroll" role="region" aria-label="Settings options" tabIndex={0} ref={scroll}>
      <div ref={setTarget} className="gallery-component-settings" />
      <Tabs sections className="appearance-tabs" value={tab} onValueChange={selectTab}>
        <TabsList aria-label="Appearance groups">
          {appearanceTabs.map(item => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
        </TabsList>
        {appearanceTabs.map(item => <TabsContent key={item.value} value={item.value} forceMount hidden={tab !== item.value}>
          {item.sections ? <AppearanceControls settings={settings} onChange={onChange} sections={item.sections} collapsed={["scope", "layout"]} />
            : <AppearanceUsage settings={settings} />}
        </TabsContent>)}
      </Tabs>
    </div>
  </>;
  const toggle = <AppShellPanelToggle ref={trigger} placement="header"
    className="gallery-settings-trigger btn-icon" aria-label={open ? "Close settings" : "Open settings"}
    aria-expanded={open} aria-controls="gallery-settings" onClick={() => {
      manualOpen.current = true;
      returnFocus.current = true;
      if (desktop) animateGalleryPanels(".gallery-settings-panel", () => setOpen(value => !value));
      else setOpen(value => !value);
    }}>
    <Settings className="icon" aria-hidden="true" />
  </AppShellPanelToggle>;

  const panel = desktop ? <AppShellPanel id="gallery-settings" className="gallery-settings-panel appearance-controls" hidden={!open}
    aria-labelledby="gallery-settings-title" onKeyDown={event => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.stopPropagation(); close(); }
    }}>
    <div className="gallery-settings-heading">
      <h2 id="gallery-settings-title" className="t-h3" ref={heading} tabIndex={-1}>Appearance</h2>
    </div>
    {controls}
  </AppShellPanel> : null;

  return <DemoSettingsContext.Provider value={context}>
    <Drawer open={!desktop && open} onOpenChange={setOpen}>
      {children(panel, desktop ? toggle : <DrawerTrigger asChild>{toggle}</DrawerTrigger>)}
      {!desktop && <DrawerContent id="gallery-settings" placement="side" className="gallery-settings-drawer appearance-controls" aria-describedby={undefined}>
        <div className="gallery-settings-heading">
          <DrawerTitle>Appearance</DrawerTitle>
          <Button size="sm" variant="ghost" onClick={close} aria-label="Close settings">Close</Button>
        </div>
        {controls}
      </DrawerContent>}
    </Drawer>
  </DemoSettingsContext.Provider>;
}
