import { createContext, useContext, useEffect, useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@momoi-labs/kiso-react";

/* A choice among appearance values. The gallery draws it with the same
   previews as its own sections; the fallback is a native select. */
export type DemoChoiceProps = {
  label: string;
  kind: "border" | "corner" | "cornerSize" | "marks" | "background" | "strength";
  /** Unset means "follow the panels around it", offered when `inherit` is on. */
  value: string | undefined;
  options: readonly (readonly [string, string])[];
  onChange: (value: string | undefined) => void;
  inherit?: boolean;
  /** The demo's other current values, so a preview can show them together
      and choices that do not pair with them can be disabled. */
  with?: { background?: string; strength?: string; border?: string; corner?: string };
};

export const DemoSettingsContext = createContext<{
  target: HTMLElement | null;
  linkTarget?: HTMLElement | null;
  open: boolean;
  register: (title: string | null) => void;
  /** Opens the panel and asks the demo section to take focus. */
  show: () => void;
  /** Bumped by `show`, so an already open panel still scrolls to the section. */
  revision: number;
  choice?: (props: DemoChoiceProps) => ReactNode;
} | null>(null);

const inherit = "inherit";

export function DemoChoice(props: DemoChoiceProps) {
  const settings = useContext(DemoSettingsContext);
  if (settings?.choice) return settings.choice(props);
  const { label, value, options, onChange } = props;
  return (
    <label className="field">{label}
      <select className="select" value={value ?? inherit} onChange={(event) => onChange(event.target.value === inherit ? undefined : event.target.value)}>
        {props.inherit && <option value={inherit}>Pane defaults</option>}
        {options.map(([option, name]) => <option key={option} value={option}>{name}</option>)}
      </select>
    </label>
  );
}

// Demos retain their state while their controls appear in the gallery panel.
// The standalone prototype and catalog cards keep controls beside the example.
export function DemoSettings({ title, children, manual = false }: { title: string; children: ReactNode; manual?: boolean }) {
  const id = useId();
  const settings = useContext(DemoSettingsContext);
  const heading = useRef<HTMLHeadingElement>(null);
  const register = settings?.register;
  const target = settings?.target;
  const open = settings?.open;
  const revision = settings?.revision ?? 0;
  useEffect(() => {
    if (!register || manual) return;
    register(title);
    return () => register(null);
  }, [register, title, manual]);
  useLayoutEffect(() => {
    if (open) target?.scrollIntoView({ block: "nearest" });
  }, [open, target, title]);
  useLayoutEffect(() => {
    if (revision > 0 && open) heading.current?.focus();
  }, [revision, open]);
  if (!settings) return <div className="demo-settings-inline">{children}</div>;
  return <>
    {manual && settings.linkTarget && createPortal(<a href="#gallery-settings" className="link" aria-label={`${title} options in Appearance`} onClick={event => {
      event.preventDefault();
      settings.show();
    }}>Options</a>, settings.linkTarget)}
    {settings.target ? createPortal(
      <section className="appearance-section" aria-labelledby={id}>
        <h3 id={id} ref={heading} tabIndex={-1} className="t-caps">{title} options</h3>
        <div className="stack">{children}</div>
      </section>, settings.target,
    ) : null}
  </>;
}

// Tells the reader where the demo's controls went, with a way to get there.
// Renders nothing when the controls are already beside the example.
export function DemoSettingsHint({ title }: { title: string }) {
  const settings = useContext(DemoSettingsContext);
  if (!settings) return null;
  return (
    <p className="muted t-label demo-settings-hint">
      {title} options live in the Appearance panel.{" "}
      <Button size="sm" variant="ghost" className="btn-link" onClick={settings.show}>
        Open {title} options
      </Button>
    </p>
  );
}
