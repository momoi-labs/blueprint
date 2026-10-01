import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShellPanel, AppShellPanelToggle, Button, Disclosure, Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@momoi-labs/kiso-react";
import { DemoSettingsContext } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { AppearanceControls } from "./appearance";
import { AppearanceUsage } from "./appearance-usage";
import type { AppearanceSettings } from "./appearance-settings";

export function GallerySettings({ children, route, settings, onChange, onReset }: {
  children: (panel: ReactNode, toggle: ReactNode) => ReactNode;
  route: string;
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [togglePlacement, setTogglePlacement] = useState<"header" | "floating">("floating");
  const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 1200px)").matches);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const manualOpen = useRef(false);
  const returnFocus = useRef(false);
  const register = useCallback((title: string | null) => {
    if (title) setOpen(true);
  }, []);
  const context = useMemo(() => ({ target, register, open }), [target, register, open]);

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
    setOpen(false);
  }
  const controls = <>
    <div className="appearance-controls-scroll" role="region" aria-label="Settings options" tabIndex={0}>
      <AppearanceControls settings={settings} onChange={onChange} workspaceControls={
        <div className="field"><label htmlFor="gallery-panel-toggle">Settings toggle</label>
          <select id="gallery-panel-toggle" className="select" value={togglePlacement} onChange={event => setTogglePlacement(event.target.value as typeof togglePlacement)}>
            <option value="header">Header</option><option value="floating">Floating</option>
          </select>
        </div>
      } />
      <div ref={setTarget} className="gallery-component-settings" />
      <Disclosure summary="Use in code"><AppearanceUsage settings={settings} /></Disclosure>
    </div>
    <div className="gallery-settings-footer">
      <Button onClick={() => { onReset(); setMessage("Global settings reset."); }}>Reset appearance</Button>
      <p role="status" className="muted t-label">{message}</p>
    </div>
  </>;
  const toggle = <AppShellPanelToggle ref={trigger} placement={desktop ? togglePlacement : "floating"}
    className="gallery-settings-trigger" aria-label={open ? "Close settings" : "Open settings"}
    aria-expanded={open} aria-controls="gallery-settings" onClick={() => {
      if (open) close();
      else { manualOpen.current = true; setOpen(true); }
    }}>
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 12h12M5 2v4M11 10v4" /></svg>
    <span>{open ? "Close" : "Settings"}</span>
  </AppShellPanelToggle>;

  const panel = desktop ? <AppShellPanel id="gallery-settings" className="gallery-settings-panel appearance-controls" hidden={!open}
    aria-labelledby="gallery-settings-title" onKeyDown={event => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.stopPropagation(); close(); }
    }}>
    <div className="gallery-settings-heading">
      <h2 id="gallery-settings-title" className="t-h3" ref={heading} tabIndex={-1}>Settings</h2>
    </div>
    {controls}
  </AppShellPanel> : null;

  return <DemoSettingsContext.Provider value={context}>
    {children(panel, desktop ? toggle : null)}
    {!desktop && <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{toggle}</DrawerTrigger>
      <DrawerContent id="gallery-settings" placement="side" className="gallery-settings-drawer appearance-controls" aria-describedby={undefined}>
        <div className="gallery-settings-heading">
          <DrawerTitle>Settings</DrawerTitle>
          <Button size="sm" variant="ghost" onClick={close} aria-label="Close settings">Close</Button>
        </div>
        {controls}
      </DrawerContent>
    </Drawer>}
  </DemoSettingsContext.Provider>;
}
