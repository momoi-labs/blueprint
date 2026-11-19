import { openPage, round } from "./lib.mjs";

export async function jump(browser, cases, options, log) {
  const urls = [...new Set(cases.map(item => item.url))];
  const rows = [];
  for (const width of options.widths ?? [1280]) {
    for (const url of urls) {
      let row;
      try {
        const page = await openPage(browser, url, { width, theme: options.theme || undefined });
        row = await page.evaluate(() => {
          const title = document.querySelector('.page [data-slot="page-header-title"], .page h1');
          const head = title?.closest(".page > *");
          const block = head?.nextElementSibling;
          return {
            pages: document.querySelectorAll(".page").length,
            title: title ? title.getBoundingClientRect().top : null,
            block: block ? block.getBoundingClientRect().top : null,
          };
        });
        await page.context().close();
      } catch (error) {
        row = { pages: 0, title: null, block: null, error: error.message };
      }
      rows.push({ width, url, ...row });
    }
  }

  let failed = 0;
  for (const width of new Set(rows.map(row => row.width))) {
    const group = rows.filter(row => row.width === width);
    const first = group.find(row => !row.error) ?? group[0];
    for (const row of group) {
      const problems = [];
      if (row.error) problems.push(row.error);
      else {
        if (row.pages !== 1) problems.push(`${row.pages} .page elements`);
        if (row.title === null) problems.push("no page title");
        if (row.block === null) problems.push("no block under the header");
        if (row.title !== null && Math.abs(row.title - first.title) > 0.5) problems.push(`title top ${round(row.title)} differs from ${round(first.title)}`);
        if (row.block !== null && Math.abs(row.block - first.block) > 0.5) problems.push(`first block top ${round(row.block)} differs from ${round(first.block)}`);
      }
      row.problems = problems;
      if (problems.length) failed++;
      log(`${problems.length ? "FAIL" : "ok  "}  ${width}  title ${round(row.title)}  block ${round(row.block)}  pages ${row.pages}  ${row.url}${problems.length ? `  ${problems.join("; ")}` : ""}`);
    }
  }
  const summary = failed ? `${failed} of ${rows.length} pages jump` : `all ok (${rows.length} pages, title and first block equal)`;
  return { name: "jump", ok: failed === 0, total: rows.length, failed, summary, rows };
}
