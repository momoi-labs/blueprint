import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { AppShellPanel, Button, Drawer, DrawerContent, DrawerTitle } from "@momoi-labs/kiso-react";
import { DemoOptionsContext, DemoSettingsContext, type DemoChoiceProps, type DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { animateGalleryPanels } from "../../../kiso/blocks/react-prototype/src/gallery-motion";
import { VisualSelector } from "./appearance";
import { BackgroundPreview, PanelPreview } from "./appearance-previews";
import type { AppearanceSettings, BorderStyle, CornerMarks, CornerStyle, Size } from "./appearance-settings";

const focusOptionsLink = () => document.querySelector<HTMLElement>('a[href="#gallery-settings"]')?.focus();

export function GallerySettings({ children, settings, onChange, demos, onDemosChange }: {
  children: (panel: ReactNode) => ReactNode;
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  demos: DemoOptions;
  onDemosChange: Dispatch<SetStateAction<DemoOptions>>;
}) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 1200px)").matches);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const register = useCallback((title: string | null, manual = false) => {
    if (!title) setOpen(false);
    else if (!manual && matchMedia("(min-width: 1200px)").matches) setOpen(true);
  }, []);
  const [revision, setRevision] = useState(0);
  const show = useCallback(() => {
    const update = () => {
      setOpen(true);
      setRevision(value => value + 1);
    };
    if (document.querySelector(".component-gallery > .gallery-settings-panel[hidden]")) animateGalleryPanels(".gallery-settings-panel", update);
    else update();
  }, []);
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
  const context = useMemo(() => ({ target, register, open, show, revision, choice }), [target, register, open, show, revision, choice]);
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
      focusOptionsLink();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [desktop, open]);

  function close() {
    if (!desktop) return setOpen(false);
    animateGalleryPanels(".gallery-settings-panel", () => setOpen(false));
    focusOptionsLink();
  }
  const closeButton = <Button size="sm" variant="ghost" onClick={close} aria-label="Close options">Close</Button>;
  const controls = <div className="appearance-controls-scroll" role="region" aria-label="Demo options list" tabIndex={0}>
    <div ref={setTarget} className="gallery-component-settings" />
  </div>;

  const panel = desktop ? <AppShellPanel id="gallery-settings" className="gallery-settings-panel appearance-controls" hidden={!open}
    aria-labelledby="gallery-settings-title">
    <div className="gallery-settings-heading">
      <h2 id="gallery-settings-title" className="t-h3">Demo options</h2>
      {closeButton}
    </div>
    {controls}
  </AppShellPanel> : null;

  return <DemoOptionsContext.Provider value={optionsContext}><DemoSettingsContext.Provider value={context}>
    <Drawer open={!desktop && open} onOpenChange={setOpen}>
      {children(panel)}
      {!desktop && <DrawerContent id="gallery-settings" placement="side" className="gallery-settings-drawer appearance-controls" aria-describedby={undefined}
        onCloseAutoFocus={event => { event.preventDefault(); focusOptionsLink(); }}>
        <div className="gallery-settings-heading">
          <DrawerTitle>Demo options</DrawerTitle>
          {closeButton}
        </div>
        {controls}
      </DrawerContent>}
    </Drawer>
  </DemoSettingsContext.Provider></DemoOptionsContext.Provider>;
}
