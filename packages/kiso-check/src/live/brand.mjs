import { round } from "./lib.mjs";

const TOL = 0.5;
const near = (a, b) => Math.abs(a - b) <= TOL;
const fmt = value => (typeof value === "number" ? String(round(value)) : String(value));

const measure = page => page.evaluate(() => {
  const rect = element => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, w: box.width, h: box.height, r: box.right, b: box.bottom, cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
  };
  const visible = element => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== "hidden";
  };
  const resolve = (property, value) => {
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;visibility:hidden;${property}:${value}`;
    document.querySelector(".app-shell").append(probe);
    const result = getComputedStyle(probe)[property];
    probe.remove();
    return result;
  };
  const sidebar = document.querySelector(".sidebar");
  const sideHeader = document.querySelector(".sidebar-header");
  const topbar = document.querySelector("header.topbar");
  const sideStyle = getComputedStyle(sideHeader);
  const topStyle = getComputedStyle(topbar);
  const symbol = [...sideHeader.querySelectorAll("svg, img")].find(visible) ?? null;
  const expanded = sideHeader.querySelector(".sidebar-expanded-content");
  const lockup = expanded ? [...expanded.children].find(visible) ?? null : null;
  const phoneBrand = topbar.querySelector(".app-shell-phone-brand");
  const phoneSymbol = phoneBrand ? [...phoneBrand.querySelectorAll("svg, img")].find(visible) ?? null : null;
  const navIcon = [...sidebar.querySelectorAll(".sidebar-link-icon svg")].find(visible) ?? null;
  const shadow = sideStyle.boxShadow;
  const insetMatch = shadow.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|lab\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+inset/);
  const stripeColor = insetMatch ? insetMatch[1] : null;
  const stripeY = insetMatch ? Number(insetMatch[3]) : null;
  const page = document.querySelector(".page");
  const pageKids = page ? [...page.children].filter(visible) : [];
  const title = document.querySelector("[data-slot=page-header-title]");
  const firstBlock = pageKids[1] ?? null;
  const width = window.innerWidth;
  return {
    width,
    scrollWidth: document.documentElement.scrollWidth,
    collapsed: sidebar.getAttribute("data-collapsed") === "true",
    sidebarVisible: visible(sidebar),
    sidebar: rect(sidebar),
    sideHeader: rect(sideHeader),
    topbar: rect(topbar),
    sideBorderBottom: parseFloat(sideStyle.borderBottomWidth),
    topBorderBottom: parseFloat(topStyle.borderBottomWidth),
    sidePaddingLeft: parseFloat(sideStyle.paddingLeft),
    sidePaddingRight: parseFloat(sideStyle.paddingRight),
    sidePaddingTop: parseFloat(sideStyle.paddingTop),
    sidePaddingBottom: parseFloat(sideStyle.paddingBottom),
    stripeY,
    stripeColor,
    primary: resolve("color", "var(--color-primary)"),
    controlSm: parseFloat(resolve("width", "var(--size-control-sm)")),
    barHeight: parseFloat(resolve("height", "var(--app-shell-bar-height, 0px)")),
    symbol: rect(symbol),
    lockup: rect(lockup),
    lockupText: lockup ? lockup.textContent.trim() : null,
    phoneBrand: rect(phoneBrand),
    phoneSymbol: rect(phoneSymbol),
    phoneText: phoneBrand ? phoneBrand.textContent.trim() : null,
    navIcon: rect(navIcon),
    titleTop: title ? title.getBoundingClientRect().y : null,
    blockTop: firstBlock ? firstBlock.getBoundingClientRect().y : null,
    headerKind: pageKids[0] ? pageKids[0].getAttribute("data-slot") : null,
  };
});

const outline = page => page.addStyleTag({
  content: ".sidebar-header{outline:2px solid #e11d48 !important;outline-offset:-2px}header.topbar{outline:2px solid #2563eb !important;outline-offset:-2px}.sidebar-header svg,.app-shell-phone-brand svg{outline:1px solid #16a34a !important}.sidebar-link-icon svg{outline:1px dashed #9333ea !important}",
});

const open = async (browser, target, width) => {
  const context = await browser.newContext({ viewport: { width, height: 800 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    await page.goto(target, { waitUntil: "networkidle" });
    await page.waitForSelector(".sidebar-header", { state: "attached" });
  } catch {
    await context.close();
    throw new Error(`no .sidebar-header after 30s at ${target}. Brand measures the Kiso shell.`);
  }
  return page;
};

export async function brand(browser, { url, otherUrl, shots }, log) {
  const shotsDir = shots || null;
  const results = [];
  const record = (state, name, value, expected, ok) => {
    results.push({ state, name, value: fmt(value), expected: expected === undefined ? null : fmt(expected), ok });
    const want = expected === undefined ? "" : `  expect ${fmt(expected)}`;
    log(`${ok ? "PASS" : "FAIL"}  ${state.padEnd(12)} ${name.padEnd(34)} ${fmt(value)}${want}`);
  };
  const info = (state, name, value) => log(`info  ${state.padEnd(12)} ${name.padEnd(34)} ${fmt(value)}`);
  const eq = (state, name, value, expected) => record(state, name, value, expected, near(value, expected));

  const checkDesktop = (state, m, ref) => {
    eq(state, "sidebar header height", m.sideHeader.h, m.topbar.h);
    info(state, "header band height", m.topbar.h);
    eq(state, "header band height vs --app-shell-bar-height", m.topbar.h, m.barHeight);
    eq(state, "header band bottom = sidebar bar bottom", m.topbar.b, m.sideHeader.b);
    eq(state, "header band top = sidebar bar top", m.topbar.y, m.sideHeader.y);
    info(state, "bottom border width (sidebar/band)", `${m.sideBorderBottom}/${m.topBorderBottom}`);
    record(state, "stripe thickness (px)", m.stripeY === null ? "none" : -m.stripeY, 2, m.stripeY !== null && near(-m.stripeY, 2));
    record(state, "stripe color = --color-primary", m.stripeColor ?? "none", m.primary, m.stripeColor === m.primary);
    info(state, "stripe bottom edge y", m.sideHeader.b - m.sideBorderBottom);
    info(state, "padding l/r/t/b", `${m.sidePaddingLeft}/${m.sidePaddingRight}/${m.sidePaddingTop}/${m.sidePaddingBottom}`);
    eq(state, "symbol width", m.symbol.w, m.controlSm);
    eq(state, "symbol height", m.symbol.h, m.controlSm);
    const bandCenter = m.sideHeader.y + (m.sideHeader.h - m.sideBorderBottom - -m.stripeY) / 2;
    eq(state, "symbol center y vs bar content", m.symbol.cy, bandCenter);
    if (!m.collapsed) {
      info(state, "lockup box x,y,w,h", `${fmt(m.lockup.x)},${fmt(m.lockup.y)},${fmt(m.lockup.w)},${fmt(m.lockup.h)}`);
      eq(state, "lockup left = sidebar padding", m.lockup.x, m.sideHeader.x + m.sidePaddingLeft);
      eq(state, "lockup center y vs bar content", m.lockup.cy, bandCenter);
      record(state, "lockup shows name", m.lockupText, "non-empty", Boolean(m.lockupText));
    }
    info(state, "rail/sidebar width", m.sidebar.w);
    info(state, "symbol center x", m.symbol.cx);
    info(state, "symbol center x - rail center x", m.symbol.cx - (m.sidebar.x + m.sidebar.w / 2));
    info(state, "nav icon center x", m.navIcon.cx);
    eq(state, "symbol center x = nav icon center x", m.symbol.cx, m.navIcon.cx);
    if (ref) {
      eq(state, "sidebar header height vs expanded", m.sideHeader.h, ref.sideHeader.h);
      eq(state, "stripe y vs expanded", m.sideHeader.b, ref.sideHeader.b);
      eq(state, "symbol size vs expanded", m.symbol.w, ref.symbol.w);
      eq(state, "symbol center x vs expanded", m.symbol.cx, ref.symbol.cx);
      eq(state, "symbol center y vs expanded", m.symbol.cy, ref.symbol.cy);
      eq(state, "nav icon x vs expanded (delta)", m.navIcon.x, ref.navIcon.x);
      eq(state, "first nav icon y vs expanded", m.navIcon.y, ref.navIcon.y);
      record(state, "lockup name hidden", m.lockup ? "visible" : "hidden", "hidden", !m.lockup);
    }
  };

  const checkPhone = (state, m) => {
    record(state, "no sideways scroll", `${m.scrollWidth}/${m.width}`, "scrollWidth <= width", m.scrollWidth <= m.width);
    eq(state, "header band height", m.topbar.h, m.barHeight);
    record(state, "sidebar hidden (drawer)", m.sidebarVisible ? "visible" : "hidden", "hidden", !m.sidebarVisible);
    if (!m.phoneSymbol) {
      record(state, "phone header shows symbol", "missing", "visible", false);
      return;
    }
    eq(state, "symbol width", m.phoneSymbol.w, m.controlSm);
    eq(state, "symbol height", m.phoneSymbol.h, m.controlSm);
    eq(state, "symbol center y vs header center", m.phoneSymbol.cy, m.topbar.y + m.topbar.h / 2 - m.topBorderBottom / 2);
    record(state, "phone header shows symbol only", m.phoneText ? `"${m.phoneText}"` : "no text", "no text", !m.phoneText);
    info(state, "symbol center x", m.phoneSymbol.cx);
    info(state, "phone brand box x,y,w,h", `${fmt(m.phoneBrand.x)},${fmt(m.phoneBrand.y)},${fmt(m.phoneBrand.w)},${fmt(m.phoneBrand.h)}`);
  };

  const jump = async (browser, target, label) => {
    const page = await open(browser, target, 1280);
    const m = await measure(page);
    await page.context().close();
    info("jump", `${label} header kind`, m.headerKind ?? "none");
    info("jump", `${label} title top`, m.titleTop);
    info("jump", `${label} first block top`, m.blockTop);
    return m;
  };

  try {
    const expandedPage = await open(browser, url, 1280);
    const expanded = await measure(expandedPage);
    if (shotsDir) {
      await outline(expandedPage);
      await expandedPage.screenshot({ path: `${shotsDir}/brand-expanded.png` });
    }
    record("1280 expanded", "sidebar is expanded", expanded.collapsed ? "collapsed" : "expanded", "expanded", !expanded.collapsed);
    checkDesktop("1280 expanded", expanded, null);

    await expandedPage.click('button.sidebar-toggle[aria-label="Collapse sidebar"]');
    await expandedPage.waitForFunction(() => document.querySelector(".sidebar")?.getAttribute("data-collapsed") === "true");
    await expandedPage.waitForTimeout(600);
    await expandedPage.mouse.move(900, 600);
    const collapsed = await measure(expandedPage);
    if (shotsDir) {
      await expandedPage.screenshot({ path: `${shotsDir}/brand-collapsed.png` });
    }
    record("1280 collapsed", "sidebar is collapsed", collapsed.collapsed ? "collapsed" : "expanded", "collapsed", collapsed.collapsed);
    checkDesktop("1280 collapsed", collapsed, expanded);
    await expandedPage.context().close();

    const phonePage = await open(browser, url, 390);
    const phone = await measure(phonePage);
    if (shotsDir) {
      await outline(phonePage);
      await phonePage.screenshot({ path: `${shotsDir}/brand-390.png` });
    }
    checkPhone("390", phone);
    await phonePage.context().close();

    const first = await jump(browser, url, "page A");
    const partner = otherUrl;
    if (partner) {
      const second = await jump(browser, partner, "page B");
      const withAction = first.headerKind === "page-header-row" ? first : second;
      const without = first.headerKind === "page-header-row" ? second : first;
      if (withAction.headerKind === without.headerKind) {
        info("jump", "pages differ in header action", "no: both pages have the same header kind");
      }
      eq("jump", "title top, with vs without action", withAction.titleTop, without.titleTop);
      eq("jump", "first block top, with vs without action", withAction.blockTop, without.blockTop);
      info("jump", "title top delta (with - without)", withAction.titleTop - without.titleTop);
      info("jump", "first block top delta (with - without)", withAction.blockTop - without.blockTop);
    } else {
      info("jump", "second page", "not measured: pass a second URL");
    }
  } catch (error) {
    record("open", "page measured", error.message.split("\n")[0], "measured", false);
  }

  const failed = results.filter(result => !result.ok);
  const summary = `${results.length - failed.length}/${results.length} checks passed${failed.length ? `. FAILED: ${failed.map(result => `${result.state}: ${result.name}`).join("; ")}` : ""}`;
  return { name: "brand", ok: failed.length === 0, total: results.length, failed: failed.length, summary, rows: results };
}
