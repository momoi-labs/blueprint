import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/media-preview.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url); await page.getByRole('button', { name: /Voice/ }).waitFor();
  return page;
}
// Which sources are playing now.
const playing = page => page.evaluate(() => window.audios.filter(audio => audio.dataset.playing === 'true').map(audio => window.sources[audio.src]));

test('Nothing plays until asked, and Ctrl+Enter plays the focused option without choosing it', async () => {
  const page = await open();
  try {
    await page.getByRole('button', { name: /Voice/ }).click();
    const panel = page.getByRole('dialog', { name: 'Voice: options' });
    await panel.getByRole('button', { name: 'Play Aiko' }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.audios.length), 0, 'opening the list loads no sound');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Aiko');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.getByLabel('Selected').textContent(), 'ren');
    await page.keyboard.press('Control+Enter');
    assert.deepEqual(await playing(page), ['ren.wav']);
    await panel.getByRole('button', { name: 'Pause Ren' }).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Ren', 'focus stays on the selection');
    assert.equal(await page.getByLabel('Changes').textContent(), '1');
    assert(await panel.isVisible(), 'the panel stays open');
    await page.keyboard.press('Meta+Enter');
    assert.deepEqual(await playing(page), []);
    await panel.getByRole('button', { name: 'Play Ren' }).waitFor();
    // On an option without audio the key does nothing.
    await page.keyboard.press('End');
    await page.keyboard.press('Control+Enter');
    assert.equal(await page.getByLabel('Selected').textContent(), 'mute');
    assert(await panel.isVisible());
    assert.deepEqual(await playing(page), []);
  } finally { await page.close(); }
});

test('A play button plays one preview at a time, never selects, and stops when the list closes', async () => {
  const page = await open();
  try {
    await page.getByRole('button', { name: /Voice/ }).click();
    const panel = page.getByRole('dialog', { name: 'Voice: options' });
    await panel.getByRole('button', { name: 'Play Ren' }).click();
    await panel.getByRole('button', { name: 'Play Sora' }).click();
    assert.deepEqual(await playing(page), ['sora.wav']);
    await panel.getByRole('button', { name: 'Play Ren' }).waitFor();
    assert.equal(await panel.getByRole('button', { name: 'Pause Sora' }).getAttribute('data-state'), 'playing');
    assert.equal(await page.getByLabel('Selected').textContent(), 'aiko');
    assert.equal(await page.getByLabel('Changes').textContent(), '0');
    await page.evaluate(() => window.audios.find(audio => window.sources[audio.src] === 'sora.wav').dispatchEvent(new Event('ended')));
    await panel.getByRole('button', { name: 'Play Sora' }).waitFor();
    await panel.getByRole('button', { name: 'Play Sora' }).click();
    await page.keyboard.press('Escape');
    assert.equal(await panel.count(), 0);
    assert.deepEqual(await playing(page), []);
  } finally { await page.close(); }
});

test('DetailOption names a listbox option by its title and plays from the keyboard', async () => {
  const page = await open();
  try {
    const list = page.getByRole('listbox', { name: 'Library' });
    assert.equal(await list.getByRole('option', { name: 'ren', exact: true }).count(), 1, 'the play button stays out of the name');
    assert.equal(await list.getByRole('option', { name: 'ren' }).getAttribute('aria-describedby'), 'item-1-description');
    await list.focus();
    await page.keyboard.press('Control+Enter');
    assert.deepEqual(await playing(page), [], 'an image has nothing to play');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Control+Enter');
    assert.deepEqual(await playing(page), ['ren-item.wav']);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Library');
    const look = await page.evaluate(() => {
      const option = document.getElementById('item-0'), image = option.querySelector('img');
      const probe = document.createElement('i'); probe.style.color = 'var(--color-selected)'; document.body.append(probe);
      const selected = getComputedStyle(probe).color; probe.remove();
      return { image: [image.offsetWidth, image.offsetHeight], loading: image.loading, selected: getComputedStyle(document.getElementById('item-1')).backgroundColor, expected: selected,
        plain: getComputedStyle(document.querySelector('[data-testid=plain]')).gridTemplateColumns.split(' ').length };
    });
    assert.deepEqual(look.image, [32, 32], 'a compact thumbnail is a square the height of a small control');
    assert.equal(look.loading, 'lazy');
    assert.equal(look.selected, look.expected);
    assert.equal(look.plain, 1, 'without an illustration the body takes the row');
  } finally { await page.close(); }
});
