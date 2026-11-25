import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/nested-dialog.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}; distributed CSS; fallback fonts`);
});
after(async () => { await browser?.close(); await server.close(); });

for (const colorScheme of ['light', 'dark']) for (const width of [390, 1440]) {
  for (const [kind, role, name] of [['Dialog', 'dialog', 'child dialog'], ['AlertDialog', 'alertdialog', 'child alert']]) {
    test(`a ${kind} opened from a Dialog covers it at ${width}/${colorScheme}`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
      page.setDefaultTimeout(5000);
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      try {
        await page.goto(url);
        await page.getByRole('button', { name: 'Open parent dialog' }).click();
        const parent = page.getByRole('dialog', { name: 'Parent dialog' });
        await parent.getByRole('button', { name: `Open ${name}` }).click();
        const child = page.getByRole(role, { name });
        await child.waitFor();
        await child.evaluate(element => new Promise(resolve => {
          const settled = () => getComputedStyle(element).pointerEvents !== 'none' ? resolve() : requestAnimationFrame(settled);
          settled();
        }));
        const hit = await page.evaluate(childName => {
          const paint = document.head.appendChild(document.createElement('style'));
          paint.textContent = '.kiso-react-dialog, .kiso-react-overlay { pointer-events: auto !important; }';
          const [parent, child] = [...document.querySelectorAll('.kiso-react-dialog')];
          const overlays = document.querySelectorAll('.kiso-react-overlay');
          const p = parent.getBoundingClientRect();
          const c = child.getBoundingClientRect();
          const x = p.left + 8;
          const y = p.top + 8;
          const top = document.elementFromPoint(x, y);
          const result = {
            childName: child.getAttribute('aria-labelledby') && document.getElementById(child.getAttribute('aria-labelledby'))?.textContent === childName,
            outsideChild: x < c.left || x > c.right || y < c.top || y > c.bottom,
            insideParent: y < p.bottom,
            hitsChildOverlay: top === overlays[overlays.length - 1],
            childOnTop: child.contains(document.elementFromPoint(c.left + c.width / 2, c.top + 8)),
          };
          paint.remove();
          return result;
        }, name);
        assert.deepEqual(hit, { childName: true, outsideChild: true, insideParent: true, hitsChildOverlay: true, childOnTop: true });
        assert(await child.evaluate(element => element.contains(document.activeElement)), 'focus is in the child');
        await page.keyboard.press('Escape');
        await child.waitFor({ state: 'hidden' });
        assert(await parent.isVisible(), 'Escape closes only the child');
        assert(await parent.evaluate(element => new Promise(resolve => {
          const end = performance.now() + 2000;
          const settled = () => element.contains(document.activeElement) || performance.now() > end ? resolve(element.contains(document.activeElement)) : requestAnimationFrame(settled);
          settled();
        })), 'focus returns to the parent');
        await page.keyboard.press('Escape');
        await parent.waitFor({ state: 'hidden' });
      } finally { await page.close(); }
    });
  }
}
