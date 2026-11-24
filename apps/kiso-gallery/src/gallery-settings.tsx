import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { AppShellPanel, Button, Dot, Drawer, DrawerContent, DrawerTitle, Link, RadioGroup, RadioGroupItem } from "@momoi-labs/kiso-react";
import { DemoOptionsContext, DemoSettingsContext, type DemoChoiceProps, type DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { animateGalleryPanels } from "../../../kiso/blocks/react-prototype/src/gallery-motion";
import { VisualSelector, presetName } from "./appearance";
import { LookSettings, type LookTab } from "./look-settings";
import { BackgroundPreview, PanelPreview } from "./appearance-previews";
import type { AppearanceSettings, BorderStyle, CornerMarks, CornerStyle, Size } from "./appearance-settings";

type View = "demo" | "look";
const focusOpener = (view: View) => document.querySelector<HTMLElement>(view === "look" ? ".look-chip" : 'a[href="#gallery-settings"]')?.focus();
const reveal = (update: () => void) => {
  if (document.querySelector(".component-gallery > .gallery-settings-panel[hidden]")) animateGalleryPanels(".gallery-settings-panel", update);
  else update();
};

export function GallerySettings({ children, settings, onChange, demos, onDemosChange, lookDisabled = false, lookNote }: {
  children: (panel: ReactNode, chip: ReactNode) => ReactNode;
  lookDisabled?: boolean;
  lookNote?: string;
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  demos: DemoOptions;
  onDemosChange: Dispatch<SetStateAction<DemoOptions>>;
}) {
  const [state, setState] = useState<{ open: boolean; view: View }>({ open: false, view: "demo" });
  const [hasDemo, setHasDemo] = useState(false);
  const [lookTab, setLookTab] = useState<LookTab>("look");
  const view = state.view;
  const open = state.open && !(lookDisabled && view === "look");
  const setOpen = useCallback((next: boolean) => setState(current => ({ ...current, open: next })), []);
  const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 1200px)").matches);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const register = useCallback((title: string | null, manual = false) => {
    setHasDemo(title !== null);
    setState(current => {
      if (current.open && current.view === "look") return current;
      if (!title) return current.open ? { open: false, view: "demo" } : current;
      return !manual && matchMedia("(min-width: 1200px)").matches ? { open: true, view: "demo" } : current;
    });
  }, []);
  const [revision, setRevision] = useState(0);
  const show = useCallback(() => reveal(() => {
    setState({ open: true, view: "demo" });
    setRevision(value => value + 1);
  }), []);
  const lookOpen = open && view === "look";
  const toggleLook = () => {
    if (!lookOpen) return reveal(() => setState({ open: true, view: "look" }));
    if (desktop) animateGalleryPanels(".gallery-settings-panel", () => setOpen(false));
    else setOpen(false);
  };
  // Demo choices draw with the same previews as the sections above. "Pane
  // defaults" previews the current global choice, so inherit reads as a value.
  const choice = useCallback(({ label, kind, value, options, onChange, inherit, with: other, previews }: DemoChoiceProps) => {
    const preview = (key: string) => {
      // A demo's own setting brings its own previews.
      if (kind === "custom") return previews?.[key] ?? null;
      const pick = key === "inherit" ? undefined : key;
      if (kind === "background" || kind === "strength") {
        const background = (kind === "background" ? pick : other?.background) as AppearanceSettings["backgroundStyle"] | undefined;
        const strength = (kind === "strength" ? pick : other?.strength) as AppearanceSettings["backgroundStrength"] | undefined;
        return <BackgroundPreview background={background ?? settings.backgroundStyle} strength={strength ?? settings.backgroundStrength} tone={settings.paperTone} />;
      }
      return <PanelPreview
        shadow={kind === "shadow" ? (pick as AppearanceSettings["shadowStyle"] | undefined) ?? settings.shadowStyle : settings.shadowStyle}
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
  // Demo options live here, so Share carries them. Unset drops the key.
  const setOptions = useCallback((scope: string, patch: Record<string, string | undefined>) => {
    if (scope === "header") {
      onChange({
        ...(patch.variant ? { headerVariant: patch.variant as AppearanceSettings["headerVariant"] } : {}),
        ...(patch.size ? { headerSize: patch.size as AppearanceSettings["headerSize"] } : {}),
      });
      return;
    }
    onDemosChange(current => {
      const next = { ...current[scope], ...patch };
      for (const key of Object.keys(next)) if (next[key] === undefined) delete next[key];
      return { ...current, [scope]: next as Record<string, string> };
    });
  }, [onDemosChange, onChange]);
  const demoOpen = open && view === "demo";
  const context = useMemo(() => ({ target, register, open: demoOpen, show, revision, choice }), [target, register, demoOpen, show, revision, choice]);
  const optionsContext = useMemo(() => ({ options: { ...demos, header: { variant: settings.headerVariant, size: settings.headerSize } }, setOptions }), [demos, setOptions, settings.headerVariant, settings.headerSize]);

  useEffect(() => {
    const media = matchMedia("(min-width: 1200px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!desktop || !open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (!(event.target instanceof Node) || !document.getElementById("gallery-settings")?.contains(event.target)) return;
      animateGalleryPanels(".gallery-settings-panel", () => setOpen(false));
      focusOpener(view);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [desktop, open, view, setOpen]);

  function close() {
    if (!desktop) return setOpen(false);
    animateGalleryPanels(".gallery-settings-panel", () => setOpen(false));
    focusOpener(view);
  }
  const title = view === "look" ? "Look" : "Demo options";
  const closeButton = <Button size="sm" variant="ghost" onClick={close} aria-label={view === "look" ? "Close look" : "Close options"}>Close</Button>;
  const controls = <>
    {hasDemo && <div className="gallery-settings-switch">
      <RadioGroup label="Panel view" variant="segmented" value={view} onValueChange={next => setState({ open: true, view: next as View })}>
        <RadioGroupItem value="demo" label="This page" />
        <RadioGroupItem value="look" label="Look" />
      </RadioGroup>
    </div>}
    <div className="appearance-controls-scroll" role="region" aria-label="Demo options list" tabIndex={0} hidden={view !== "demo"}>
      <div ref={setTarget} className="gallery-component-settings" />
    </div>
    {view === "look" && <div className="gallery-look" role="region" aria-label="Look list">
      {lookNote && <p className="muted t-label gallery-look-note">{lookNote}</p>}
      <LookSettings settings={settings} onChange={onChange} tab={lookTab} onTabChange={setLookTab} idPrefix="look" variant="stacked"
        phoneHint="Layouts > Phone shows the result." />
      <p className="gallery-look-more"><Link href="#theme" onClick={() => { if (!desktop) setOpen(false); }}>Preview and export</Link></p>
    </div>}
  </>;
  const chip = <Button size="sm" className="look-chip" aria-label={`Look: ${presetName(settings)}`} title="Change the look"
    aria-expanded={lookOpen} aria-controls="gallery-settings" onClick={toggleLook}>
    <Dot className="look-chip-dot" /><span className="look-chip-name">{presetName(settings)}</span>
  </Button>;

  const panel = desktop ? <AppShellPanel id="gallery-settings" className="gallery-settings-panel appearance-controls" hidden={!open}
    aria-labelledby="gallery-settings-title">
    <div className="gallery-settings-heading">
      <h2 id="gallery-settings-title" className="t-h3">{title}</h2>
      {closeButton}
    </div>
    {controls}
  </AppShellPanel> : null;

  return <DemoOptionsContext.Provider value={optionsContext}><DemoSettingsContext.Provider value={context}>
    <Drawer open={!desktop && open} onOpenChange={setOpen}>
      {children(panel, chip)}
      {!desktop && <DrawerContent id="gallery-settings" placement="side" className="gallery-settings-drawer appearance-controls" aria-describedby={undefined}
        onCloseAutoFocus={event => { event.preventDefault(); focusOpener(view); }}>
        <div className="gallery-settings-heading">
          <DrawerTitle>{title}</DrawerTitle>
          {closeButton}
        </div>
        {controls}
      </DrawerContent>}
    </Drawer>
  </DemoSettingsContext.Provider></DemoOptionsContext.Provider>;
}
