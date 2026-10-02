import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShellPanel, AppShellPanelToggle, Button, Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@momoi-labs/kiso-react";
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
    <div className="gallery-settings-actions">
      <Button size="sm" onClick={() => { onReset(); setMessage("Global settings reset."); }}>Reset appearance</Button>
      <p role="status" className="muted t-label">{message}</p>
    </div>
    <div className="appearance-controls-scroll" role="region" aria-label="Settings options" tabIndex={0}>
      <AppearanceControls settings={settings} onChange={onChange} />
      <div ref={setTarget} className="gallery-component-settings" />
      <AppearanceUsage settings={settings} />
    </div>
  </>;
  const toggle = <AppShellPanelToggle ref={trigger} placement="header"
    className="gallery-settings-trigger btn-icon" aria-label={open ? "Close settings" : "Open settings"}
    aria-expanded={open} aria-controls="gallery-settings" onClick={() => {
      if (open) close();
      else { manualOpen.current = true; setOpen(true); }
    }}>
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9.5 3-.5 2-2 1-2-.5-2 3.5 1.5 1.5v3L3 15l2 3.5 2-.5 2 1 .5 2h5l.5-2 2-1 2 .5 2-3.5-1.5-1.5v-3L21 9l-2-3.5-2 .5-2-1-.5-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
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
