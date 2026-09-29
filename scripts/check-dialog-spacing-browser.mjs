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
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/dialog-spacing.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}; distributed CSS; fallback fonts`);
});
after(async () => { await browser?.close(); await server.close(); });

for (const colorScheme of ['light', 'dark']) for (const width of [320, 1280]) {
  for (const [kind, placement] of [['Dialog'], ['AlertDialog'], ['Drawer', 'side'], ['Drawer', 'bottom']]) {
    for (const withBody of [false, true]) {
      const name = `${kind}${placement ? ` ${placement}` : ''} ${withBody ? 'with body' : 'without body'}`;
      test(`${name} has space before its footer at ${width}/${colorScheme}`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
        page.setDefaultTimeout(5000);
        await page.route('https://fonts.googleapis.com/**', route => route.abort());
        try {
          await page.goto(url);
          await page.getByRole('button', { name, exact: true }).click();
          const dialog = page.getByRole(kind === 'AlertDialog' ? 'alertdialog' : 'dialog', { name, exact: true });
          await dialog.waitFor();
          const spacing = await dialog.evaluate(element => {
            const footer = element.querySelector('.dialog-footer');
            const body = element.querySelector('.dialog-body');
            const last = body?.lastElementChild ?? element.querySelector('.dialog-header').lastElementChild;
            return {
              gap: footer.getBoundingClientRect().top - last.getBoundingClientRect().bottom,
              minimum: parseFloat(getComputedStyle(element).getPropertyValue('--spacing-lg')),
            };
          });
          assert(spacing.gap >= spacing.minimum - 0.5, `${name}: ${JSON.stringify(spacing)}`);
          await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
          await dialog.waitFor({ state: 'hidden' });
        } finally { await page.close(); }
      });
    }
  }
}
