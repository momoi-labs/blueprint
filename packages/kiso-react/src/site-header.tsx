"use client";
import * as React from "react";
import { clsx as cn } from "clsx";
import { Menu, X } from "lucide-react";
import { Button } from "./button.js";

export type SiteHeaderLabels = { navigation: string; open: string; close: string };
const defaultLabels: SiteHeaderLabels = { navigation: "Main", open: "Open menu", close: "Close menu" };

function scrollParent(node: HTMLElement): HTMLElement | Window {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return window;
}

/* The site's top bar: brand, links and actions. `sticky` keeps it at the top
   and takes the tone of the SiteSection under it. `overlay` lays it over the
   next section, transparent until that section scrolls away. Below 760px the
   links and actions fold into a menu. */
function SiteHeader({ className, brand, links, actions, sticky = false, overlay = false, fold = "menu", labels: custom, ...props }:
  React.ComponentProps<"header"> & {
    brand?: React.ReactNode; links?: React.ReactNode; actions?: React.ReactNode;
    sticky?: boolean; overlay?: boolean;
    /** Below 760px: `menu` folds links and actions behind a toggle; `hide`
        hides the links and keeps the actions in the bar. */
    fold?: "menu" | "hide";
    labels?: Partial<SiteHeaderLabels>;
  }) {
  const labels = { ...defaultLabels, ...custom };
  const root = React.useRef<HTMLElement>(null);
  const toggle = React.useRef<HTMLButtonElement>(null);
  const menu = React.useId();
  const [open, setOpen] = React.useState(false);
  const [tone, setTone] = React.useState<string>();
  const [solid, setSolid] = React.useState(!overlay);

  // Follows the section under the bar: its tone, and whether the overlaid one has gone.
  React.useEffect(() => {
    const header = root.current;
    if (!header || (!sticky && !overlay)) return;
    const next = header.nextElementSibling;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = header.getBoundingClientRect();
      const under = document.elementsFromPoint(box.left + box.width / 2, box.bottom + 1)
        .find(element => !header.contains(element))?.closest<HTMLElement>(".site-section");
      setTone(under?.dataset.tone);
      if (overlay) setSolid(!next || !next.contains(under ?? null) || next.getBoundingClientRect().bottom <= box.bottom);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const target = scrollParent(header);
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { target.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, [sticky, overlay]);

  // The open menu closes on Escape, on a link and outside the bar.
  React.useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const pointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", pointer);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", pointer); };
  }, [open]);

  return (
    <header ref={root} data-slot="site-header" data-sticky={sticky || overlay || undefined} data-overlay={overlay || undefined}
      data-solid={solid || undefined} data-open={open || undefined} data-tone={tone} data-fold={fold}
      className={cn("site-header", className)} {...props}>
      <div className="site-header-inner">
        {brand != null && <div className="site-header-brand">{brand}</div>}
        {(links != null || actions != null) && <>
          {fold === "menu" && <Button ref={toggle} variant="ghost" size="sm" className="btn-icon site-header-toggle"
            aria-expanded={open} aria-controls={menu} aria-label={open ? labels.close : labels.open}
            onClick={() => setOpen(value => !value)}>
            {open ? <X className="icon" aria-hidden="true" /> : <Menu className="icon" aria-hidden="true" />}
          </Button>}
          <div id={menu} className="site-header-nav" onClick={event => { if ((event.target as Element).closest("a")) setOpen(false); }}>
            {links != null && <nav aria-label={labels.navigation}><ul className="site-header-links">
              {React.Children.map(links, link => link != null && <li>{link}</li>)}
            </ul></nav>}
            {actions != null && <div className="site-header-actions">{actions}</div>}
          </div>
        </>}
      </div>
    </header>
  );
}

export { SiteHeader };
