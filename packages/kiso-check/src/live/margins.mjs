import { openPage } from "./lib.mjs";

export async function margins(browser, cases, options, log) {
  const urls = [...new Set(cases.map(item => item.url))];
  const phone = Number(options.phone ?? 699);
  let total = 0;
  let bad = 0;
  const rows = [];
  for (const width of options.widths ?? [1280, 390]) for (const url of urls) {
    const problems = [];
    let r = null;
    try {
      const page = await openPage(browser, url, { width, theme: options.theme || undefined });
      r = await page.evaluate(() => {
        const pageElement = document.querySelector(".page");
        const pageBox = pageElement.getBoundingClientRect();
        const style = getComputedStyle(pageElement);
        const sidebar = document.querySelector(".app-shell > .sidebar");
        const sidebarBox = sidebar?.getBoundingClientRect();
        return {
          pages: document.querySelectorAll(".page").length,
          scroll: document.documentElement.scrollWidth,
          width: window.innerWidth,
          pageLeft: pageBox.left,
          pageRight: window.innerWidth - pageBox.right,
          sidebarRight: sidebarBox && sidebarBox.width > 0 && getComputedStyle(sidebar).display !== "none" ? sidebarBox.right : 0,
          padStart: parseFloat(style.paddingLeft),
          padEnd: parseFloat(style.paddingRight),
          kids: [...pageElement.children].filter(child => child.getBoundingClientRect().height > 0).map(child => {
            const box = child.getBoundingClientRect();
            return { name: String(child.dataset.slot || child.className || child.tagName).split(" ")[0], l: +(box.left - pageBox.left).toFixed(1), r: +(pageBox.right - box.right).toFixed(1) };
          }),
        };
      });
      await page.context().close();
    } catch (error) {
      problems.push(error.message);
    }
    if (r) {
      if (r.pages !== 1) problems.push(`${r.pages} .page elements`);
      if (r.scroll > r.width) problems.push(`sideways scroll ${r.scroll}/${r.width}`);
      if (Math.abs(r.pageLeft - r.sidebarRight) > 0.5) problems.push(`page starts at ${r.pageLeft}, sidebar ends at ${r.sidebarRight}`);
      if (Math.abs(r.pageRight) > 0.5) problems.push(`page ends ${r.pageRight}px before the viewport`);
      for (const kid of r.kids) {
        if (kid.l < r.padStart - 0.5 || kid.r < r.padEnd - 0.5) problems.push(`${kid.name} l${kid.l} r${kid.r} is inside the ${r.padStart}px margin`);
        if (width <= phone && (Math.abs(kid.l - r.padStart) > 0.5 || Math.abs(kid.r - r.padEnd) > 0.5)) problems.push(`${kid.name} l${kid.l} r${kid.r}, expected l${r.padStart} r${r.padEnd} on a phone`);
      }
    }
    total++;
    if (problems.length) bad++;
    rows.push({ width, url, problems, ...(r ? { pageLeft: r.pageLeft, pageRight: r.pageRight, padStart: r.padStart, padEnd: r.padEnd } : {}) });
    log(`${problems.length ? "FAIL" : "ok  "}  ${width}  ${r ? `page l${r.pageLeft} r${r.pageRight} pad ${r.padStart}/${r.padEnd}` : "not measured"}  ${url}${problems.length ? `\n      ${problems.join("\n      ")}` : ""}`);
    if (options.verbose && r) for (const kid of r.kids) log(`      ${kid.name} l${kid.l} r${kid.r}`);
  }
  const summary = bad ? `${bad} of ${total} failed` : `all ok (${total} pages)`;
  return { name: "margins", ok: bad === 0, total, failed: bad, summary, rows };
}
