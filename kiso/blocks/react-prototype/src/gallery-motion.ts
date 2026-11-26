import { flushSync } from "react-dom";

const active = new Map<string, () => void>();
const scrollSelector = ".sidebar-body, .appearance-controls-scroll";

function parseDuration(value: string) {
  return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
}

function minAnimatedWidth(fullWidth: number, styles: CSSStyleDeclaration) {
  const pixelRadius = parseFloat(styles.getPropertyValue("--pixel-r")) || 0;
  return Math.min(fullWidth, Math.max(32, 2 * pixelRadius));
}

export function animateGalleryPanels(selector: string, update: () => void) {
  const panel = document.querySelector<HTMLElement>(`.component-gallery > ${selector}`);
  if (!panel || !panel.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    active.get(selector)?.();
    update();
    return;
  }

  const wasAnimating = active.has(selector);
  const liveWidth = panel.getBoundingClientRect().width;
  const liveOpacity = parseFloat(getComputedStyle(panel).getPropertyValue("--catalog-sidebar-label-opacity"));
  active.get(selector)?.();

  const wasHidden = panel.hidden;
  const closing = !wasHidden && panel.dataset.collapsed !== "true";
  const beforeBounds = panel.getBoundingClientRect();
  const beforeClientWidth = panel.clientWidth;
  const beforeStyles = getComputedStyle(panel);
  const beforeNavWidth = closing ? panel.querySelector<HTMLElement>(".sidebar-body > nav")?.getBoundingClientRect().width ?? 0 : 0;
  const snapshot = closing ? panel.cloneNode(true) as HTMLElement : null;
  const scrollers = snapshot ? [...panel.querySelectorAll<HTMLElement>(scrollSelector)].map(el => el.scrollTop) : [];
  const beforeHasPixelClip = beforeStyles.clipPath.startsWith("polygon(");
  const copiedStyles = snapshot ? {
    backgroundColor: beforeStyles.backgroundColor,
    backgroundImage: beforeStyles.backgroundImage,
    backdropFilter: beforeStyles.backdropFilter,
    boxShadow: beforeStyles.boxShadow,
    color: beforeStyles.color,
    borderTop: beforeStyles.borderTop,
    borderRight: beforeStyles.borderRight,
    borderBottom: beforeStyles.borderBottom,
    borderLeft: beforeStyles.borderLeft,
    borderRadius: beforeStyles.borderRadius,
  } : null;

  flushSync(update);

  const isSidebar = selector === ".catalog-sidebar";
  const inPlace = !wasHidden && !panel.hidden;

  if (inPlace) {
    const startWidth = wasAnimating ? liveWidth : beforeBounds.width;
    const afterWidth = panel.getBoundingClientRect().width;
    if (Math.abs(startWidth - afterWidth) < 1) return;

    const afterNavWidth = panel.dataset.collapsed !== "true" ? panel.querySelector<HTMLElement>(".sidebar-body > nav")?.getBoundingClientRect().width ?? 0 : 0;
    const expandedBodyWidth = Math.max(beforeNavWidth, afterNavWidth);
    const startOpacity = wasAnimating && Number.isFinite(liveOpacity) ? liveOpacity : (closing ? 1 : 0);

    panel.dataset.panelMotion = closing ? "collapsing" : "expanding";
    if (expandedBodyWidth > 0) {
      panel.style.setProperty("--catalog-sidebar-expanded-body-width", `${expandedBodyWidth}px`);
    }

    const styles = getComputedStyle(panel);
    const frames: Keyframe[] = closing
      ? [
          { width: `${startWidth}px`, "--catalog-sidebar-label-opacity": startOpacity },
          { offset: 0.7, "--catalog-sidebar-label-opacity": 0 },
          { width: `${afterWidth}px`, "--catalog-sidebar-label-opacity": 0 },
        ]
      : [
          { width: `${startWidth}px`, "--catalog-sidebar-label-opacity": startOpacity },
          ...(wasAnimating ? [] : [{ offset: 0.2, "--catalog-sidebar-label-opacity": 0 }]),
          { width: `${afterWidth}px`, "--catalog-sidebar-label-opacity": 1 },
        ];

    const animation = panel.animate(frames, {
      duration: parseDuration(styles.getPropertyValue("--motion-duration-normal").trim()),
      easing: styles.getPropertyValue("--motion-easing-standard").trim(),
    });
    animation.id = `gallery-${isSidebar ? "navigation" : "settings"}-${closing ? "out" : "in"}`;

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      if (animation.playState !== "finished") animation.cancel();
      delete panel.dataset.panelMotion;
      panel.style.removeProperty("--catalog-sidebar-expanded-body-width");
      if (active.get(selector) === cleanup) active.delete(selector);
    };
    active.set(selector, cleanup);
    void animation.finished.then(cleanup, cleanup);
    return;
  }

  const target = snapshot && panel.hidden ? snapshot : panel;
  const fullWidth = target === snapshot ? beforeBounds.width : panel.getBoundingClientRect().width;
  const expandedContentWidth = target === snapshot ? beforeClientWidth : panel.clientWidth;

  if (target === snapshot && copiedStyles) {
    snapshot.removeAttribute("id");
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.inert = true;
    snapshot.dataset.panelMotion = "closing";
    if (beforeHasPixelClip) snapshot.dataset.gallerySnapshot = "";
    snapshot.querySelectorAll("[id], [name]").forEach(el => {
      el.removeAttribute("id");
      el.removeAttribute("name");
    });
    if (expandedContentWidth > 0) {
      snapshot.style.setProperty("--gallery-settings-expanded-width", `${expandedContentWidth}px`);
    }
    Object.assign(snapshot.style, copiedStyles, {
      position: "fixed",
      margin: "0",
      top: `${beforeBounds.top}px`,
      left: "auto",
      right: `${document.documentElement.clientWidth - beforeBounds.right}px`,
      width: `${beforeBounds.width}px`,
      height: `${beforeBounds.height}px`,
      pointerEvents: "none",
      zIndex: "2",
    });
    document.body.append(snapshot);
    snapshot.querySelectorAll<HTMLElement>(scrollSelector).forEach((el, index) => {
      if (scrollers[index]) el.scrollTop = scrollers[index];
    });
  } else {
    panel.dataset.panelMotion = "opening";
    if (expandedContentWidth > 0) {
      panel.style.setProperty("--gallery-settings-expanded-width", `${expandedContentWidth}px`);
    }
  }

  const styles = getComputedStyle(target);
  const collapsedWidth = minAnimatedWidth(fullWidth, styles);
  const frames: Keyframe[] = [
    { opacity: 0, width: `${collapsedWidth}px` },
    { opacity: 1, width: `${fullWidth}px` },
  ];
  const animation = target.animate(closing ? frames.reverse() : frames, {
    duration: parseDuration(styles.getPropertyValue("--motion-duration-normal").trim()),
    easing: styles.getPropertyValue("--motion-easing-standard").trim(),
  });
  animation.id = `gallery-${isSidebar ? "navigation" : "settings"}-${closing ? "out" : "in"}`;

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    if (animation.playState !== "finished") animation.cancel();
    if (target === snapshot) {
      snapshot.remove();
    } else {
      delete panel.dataset.panelMotion;
      panel.style.removeProperty("--gallery-settings-expanded-width");
    }
    if (active.get(selector) === cleanup) active.delete(selector);
  };
  active.set(selector, cleanup);
  void animation.finished.then(cleanup, cleanup);
}
