import { createContext, useContext, useEffect, useLayoutEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const DemoSettingsContext = createContext<{
  target: HTMLElement | null;
  open: boolean;
  register: (title: string | null) => void;
} | null>(null);

// Demos retain their state while their controls appear in the gallery panel.
// The standalone prototype and catalog cards keep controls beside the example.
export function DemoSettings({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  const settings = useContext(DemoSettingsContext);
  const register = settings?.register;
  const target = settings?.target;
  const open = settings?.open;
  useEffect(() => {
    if (!register) return;
    register(title);
    return () => register(null);
  }, [register, title]);
  useLayoutEffect(() => {
    if (open) target?.scrollIntoView({ block: "nearest" });
  }, [open, target, title]);
  if (!settings) return <div className="demo-settings-inline">{children}</div>;
  return settings.target ? createPortal(
    <section className="appearance-section" aria-labelledby={id}>
      <h3 id={id} className="t-caps">{title} options</h3>
      <div className="stack">{children}</div>
    </section>, settings.target,
  ) : null;
}
