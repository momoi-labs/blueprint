import { flushSync } from "react-dom";

const active = new Map<string, () => void>();

// Animate only the rail. Catalog layout and pointer input update immediately.
export function animateGalleryPanels(selector: string, update: () => void) {
  active.get(selector)?.();
  const panel = document.querySelector<HTMLElement>(`.component-gallery > ${selector}`);
  if (!panel || !panel.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  const closing = !panel.hidden;
  const bounds = panel.getBoundingClientRect();
  const snapshot = closing ? panel.cloneNode(true) as HTMLElement : null;
  const scrollSelector = ".sidebar-body, .appearance-controls-scroll";
  const scrollers = snapshot ? [...panel.querySelectorAll<HTMLElement>(scrollSelector)].map(el => el.scrollTop) : [];
  flushSync(update);

  const target = snapshot ?? panel;
  if (snapshot) {
    // A noninteractive copy lets the closed rail fade without holding its column.
    snapshot.removeAttribute("id");
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.inert = true;
    snapshot.querySelectorAll("[id], [name]").forEach(el => {
      el.removeAttribute("id");
      el.removeAttribute("name");
    });
    Object.assign(snapshot.style, {
      position: "fixed", margin: "0", left: `${bounds.left}px`, top: `${bounds.top}px`,
      width: `${bounds.width}px`, height: `${bounds.height}px`, pointerEvents: "none", zIndex: "2",
    });
    document.body.append(snapshot);
    snapshot.querySelectorAll<HTMLElement>(scrollSelector).forEach((el, index) => {
      if (scrollers[index]) el.scrollTop = scrollers[index];
    });
  }
  const styles = getComputedStyle(target);
  const duration = styles.getPropertyValue("--motion-duration-normal").trim();
  const collapsed = selector === ".catalog-sidebar" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
  const frames = [{ opacity: 0, clipPath: collapsed }, { opacity: 1, clipPath: "inset(0 0 0 0)" }];
  const animation = target.animate(closing ? frames.reverse() : frames, {
    duration: parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000),
    easing: styles.getPropertyValue("--motion-easing-standard").trim(),
  });
  animation.id = `gallery-${selector === ".catalog-sidebar" ? "navigation" : "settings"}-${closing ? "out" : "in"}`;
  const cleanup = () => {
    if (animation.playState !== "finished") animation.cancel();
    snapshot?.remove();
    if (active.get(selector) === cleanup) active.delete(selector);
  };
  active.set(selector, cleanup);
  void animation.finished.then(cleanup, cleanup);
}
