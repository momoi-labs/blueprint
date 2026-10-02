import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let server, browser, url;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/#components`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});
async function open(mode = 'animate') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(mode => {
    window.railAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = mode === 'unsupported' ? undefined : function(...args) {
      const rail = this.matches('.catalog-sidebar, .gallery-settings-panel');
      if (rail && mode === 'reduce') throw Error('Reduced motion must update without a transition');
      const animation = animate.apply(this, args);
      if (rail) window.railAnimations.push(animation);
      return animation;
    };
  }, mode);
  await page.goto(url);
  return page;
}
async function settled(page) {
  await page.waitForFunction(() => window.railAnimations.every(animation => ["finished", "idle"].includes(animation.playState)));
}

test('Both rails animate, accept interrupted toggles and retain demo values', async () => {
  const page = await open();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const notes = page.getByRole('textbox', { name: 'Operator notes', exact: true });
    await notes.fill('Keep this draft');
    for (const selector of ['.gallery-settings-trigger', '.catalog-sidebar-toggle']) {
      for (let click = 0; click < 2; click++) {
        await page.locator(selector).click();
        await settled(page);
      }
      const initial = await page.locator(selector).getAttribute('aria-expanded');
      await page.evaluate(selector => {
        document.querySelector(selector).click();
        document.querySelector(selector).click();
      }, selector);
      await settled(page);
      assert.equal(await page.locator(selector).getAttribute('aria-expanded'), initial, 'Two rapid clicks return to the initial state');
    }
    const animations = await page.evaluate(() => window.railAnimations.map(animation => ({ name: animation.id, duration: animation.effect.getTiming().duration })));
    for (const name of ['gallery-settings-in', 'gallery-settings-out', 'gallery-navigation-in', 'gallery-navigation-out']) {
      assert(animations.some(animation => animation.name === name && animation.duration > 0 && animation.duration <= 250), `${name} runs as a short transition`);
    }
    assert.equal(await notes.inputValue(), 'Keep this draft');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('The header and catalog accept pointer input during rail animations', async () => {
  const page = await open();
  try {
    for (const selector of ['.gallery-settings-trigger', '.catalog-sidebar-toggle']) {
      const initial = await page.locator(selector).getAttribute('aria-expanded');
      for (let click = 0; click < 2; click++) {
        const box = await page.locator(selector).boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.evaluate(() => {
          for (const animation of window.railAnimations) if (animation.playState === 'running') {
            animation.pause();
            animation.currentTime = 80;
          }
        });
        for (const target of ['.gallery-settings-trigger', '.catalog-sidebar-toggle', '.catalog-section-heading a']) {
          assert(await page.locator(target).first().evaluate(el => {
            const box = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(box.right - 4, box.top + box.height / 2));
          }), `${target} must remain clickable during the animation`);
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Animation does not introduce horizontal scrolling');
      }
      assert.equal(await page.locator(selector).getAttribute('aria-expanded'), initial);
      await page.evaluate(() => window.railAnimations.forEach(animation => { if (animation.playState === 'paused') animation.play(); }));
      await settled(page);
      assert.equal(await page.locator('body > [inert]').count(), 0, 'Closing snapshots are removed');
    }
  } finally { await page.close(); }
});

for (const mode of ['reduce', 'unsupported']) test(`Rail toggles respond without animation in ${mode} mode`, async () => {
  const page = await open(mode);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.getByRole('button', { name: 'Open settings', exact: true }).click();
    await page.locator('#gallery-settings').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('#gallery-settings').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open settings');
    await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
    await page.locator('#component-navigation').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
    await page.locator('#component-navigation').waitFor();
    assert.equal(await page.evaluate(() => window.railAnimations.length), 0);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
