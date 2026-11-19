import { applyAction, openPage, round } from "./lib.mjs";

const measure = page => page.evaluate(() => {
  const pageElement = document.querySelector(".page");
  const pageBox = pageElement.getBoundingClientRect();
  const style = getComputedStyle(pageElement);
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:var(--size-control-sm)";
  pageElement.append(probe);
  const controlSm = probe.getBoundingClientRect().width;
  probe.remove();
  const box = element => {
    const rect = element.getBoundingClientRect();
    return { l: +(rect.left - pageBox.left).toFixed(2), r: +(pageBox.right - rect.right).toFixed(2), w: +rect.width.toFixed(2), t: +rect.top.toFixed(2), h: +rect.height.toFixed(2) };
  };
  const kids = [...pageElement.children].filter(element => element.getBoundingClientRect().height > 0);
  const head = kids[0];
  const title = head?.querySelector('[data-slot="page-header-title"], h1');
  const action = head?.querySelector('[data-slot="page-header-actions"] > *');
  const widthOwner = kids.find(element => element.dataset.width);
  return {
    pages: document.querySelectorAll(".page").length,
    padStart: parseFloat(style.paddingLeft),
    padEnd: parseFloat(style.paddingRight),
    padTop: parseFloat(style.paddingTop),
    gap: parseFloat(style.rowGap) || 0,
    content: pageBox.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    pageTop: pageBox.top,
    controlSm,
    head: head ? box(head) : null,
    title: title ? box(title) : null,
    action: action ? box(action) : null,
    blocks: kids.slice(1).map(element => ({ name: String(element.dataset.slot || element.className || element.tagName).split(" ")[0], ...box(element) })),
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
    guessKind: pageElement.querySelector(":scope > .form-page, :scope > form") ? "form" : pageElement.querySelector(":scope > .detail-tabs") ? "detail" : "list",
    guessLayout: widthOwner?.dataset.width ?? null,
  };
});

const near = (a, b) => Math.abs(a - b) <= 0.5;

export function check(r, kind, layout) {
  const problems = [];
  const max = kind === "form" ? 720 : 880;
  const pad = r.padStart;
  if (r.pages !== 1) problems.push(`${r.pages} .page elements`);
  if (r.scroll > r.width) problems.push(`sideways scroll ${r.scroll}/${r.width}`);
  if (!r.blocks.length) problems.push("no block under the header");
  if (!r.title) problems.push("no page title");
  if (problems.length) return problems;
  if (!near(r.head.t, r.pageTop + r.padTop)) problems.push(`header top ${r.head.t}, expected ${round(r.pageTop + r.padTop)}`);
  if (!near(r.head.h, r.controlSm)) problems.push(`header height ${r.head.h}, expected ${r.controlSm}`);
  if (!near(r.blocks[0].t, r.head.t + r.head.h + r.gap)) problems.push(`first block top ${r.blocks[0].t}, expected ${round(r.head.t + r.head.h + r.gap)}`);
  const start = Math.min(...r.blocks.map(block => block.l));
  const end = Math.min(...r.blocks.map(block => block.r));
  if (!near(r.head.l, start) || !near(r.head.r, end)) problems.push(`header l${r.head.l} r${r.head.r} is not the box l${start} r${end}`);
  if (!near(r.title.l, start)) problems.push(`title starts at ${r.title.l}, box at ${start}`);
  if (r.action && !near(r.action.r, end)) problems.push(`action ends at ${r.action.r}, box at ${end}`);
  const narrow = r.content < max;
  for (const item of [r.head, ...r.blocks]) {
    const name = item.name ?? "header";
    if (narrow || layout === "full") {
      if (!near(item.l, pad) || !near(item.r, r.padEnd)) problems.push(`${name} l${item.l} r${item.r}, expected l${pad} r${r.padEnd}`);
    } else {
      if (item.w > max + 0.5) problems.push(`${name} is ${item.w} wide, max ${max}`);
      if (layout === "left" && (!near(item.l, pad) || item.r <= r.padEnd)) problems.push(`${name} l${item.l} r${item.r} is not left`);
      if (layout === "right" && (!near(item.r, r.padEnd) || item.l <= pad)) problems.push(`${name} l${item.l} r${item.r} is not right`);
      if (layout === "center" && (item.l <= pad || Math.abs(item.l - item.r) > 1)) problems.push(`${name} l${item.l} r${item.r} is not centred`);
    }
  }
  return problems;
}

export async function layouts(browser, cases, options, log) {
  const widths = options.widths ?? [1280, 390];
  const themes = options.themes ?? ["light", "dark"];
  let total = 0;
  let bad = 0;
  const rows = [];
  const table = [];
  for (const width of widths) for (const theme of themes) for (const item of cases) {
    let problems;
    let kind = item.kind;
    let layout = item.layout;
    let r = null;
    try {
      const page = await openPage(browser, item.url, { width, theme });
      try {
        await applyAction(page, item.action);
        r = await measure(page);
      } finally {
        await page.context().close();
      }
      kind ??= r.guessKind;
      layout ??= r.guessLayout ?? (kind === "form" ? "left" : "full");
      problems = check(r, kind, layout);
    } catch (error) {
      kind ??= "?";
      layout ??= "?";
      problems = [error.message.split("\n")[0]];
    }
    total++;
    const label = `${width} ${theme} ${kind}:${layout}${item.kind ? "" : " (guessed)"}${item.action ? ` ${item.action.startsWith("#") ? "hash" : "click"} ${item.action}` : ""} ${item.url}`;
    rows.push({ width, theme, kind, layout, guessed: !item.kind, action: item.action, url: item.url, problems });
    if (problems.length) { bad++; log(`FAIL ${label}\n     ${problems.join("\n     ")}`); }
    if (options.table && r && theme === themes[0]) table.push([width, kind, layout, `head l${r.head.l} r${r.head.r} top ${r.head.t}`, r.action ? `action r${r.action.r}` : "no action", r.blocks.map(block => `${block.name} l${block.l} r${block.r} w${block.w} top ${block.t}`).join(" | ")].join("\t"));
  }
  for (const row of table) log(row);
  const summary = bad ? `${bad} of ${total} failed` : `all ok (${total} cases)`;
  return { name: "layouts", ok: bad === 0, total, failed: bad, summary, rows };
}
