import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, page;
const now = Date.UTC(2026, 8, 12, 14, 27, 40, 500);
before(async () => {
  await server.listen();
  browser = await chromium.launch();
  // The browser zone is the live default.
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, timezoneId: 'America/Sao_Paulo', locale: 'en-GB' });
  page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/time-range-live.html`);
  await trigger().waitFor();
});
after(async () => { await browser?.close(); await server.close(); });
beforeEach(async () => {
  await page.keyboard.press('Escape');
  await page.evaluate(start => {
    window.changes = []; window.zones = [];
    window.update({ now: start, maxDuration: 1_800_000, resumeDuration: 900_000, timeZone: undefined,
      value: { kind: 'relative', duration: 900_000 } });
  }, now);
  await page.locator('.time-range-content').waitFor({ state: 'detached' });
});

const trigger = () => page.locator('.time-range-trigger[data-time-range-state]');
const popover = () => page.locator('.time-range-content');
const button = name => popover().getByRole('button', { name, exact: true });
const changes = () => page.evaluate(() => window.changes);
// Waits a frame so React has rendered the new props.
const update = props => page.evaluate(next => new Promise(resolve => {
  window.update(next);
  requestAnimationFrame(() => setTimeout(resolve));
}), props);
const from = () => popover().getByLabel(/^From/);
const to = () => popover().getByLabel(/^To/);
async function openCustom() {
  await trigger().click();
  await button('Custom range').click();
  await from().waitFor();
}

test('presets stop at the retention and the current one is pressed', async () => {
  await update({ maxDuration: 1_200_000 });
  await trigger().click();
  const presets = popover().getByRole('group', { name: 'Presets' }).getByRole('button');
  assert.deepEqual(await presets.allTextContents(), ['Last 5 minutes', 'Last 15 minutes', 'Custom range']);
  assert.equal(await button('Last 15 minutes').getAttribute('aria-pressed'), 'true');
  assert.equal(await button('Last 5 minutes').getAttribute('aria-pressed'), 'false');
  assert.equal(await popover().getByText('Entire run').count(), 0);
  await button('Last 5 minutes').click();
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 300_000 }]);
  assert.equal(await popover().count(), 0);
});

test('an open draft survives polling, and validation waits for Apply', async () => {
  await openCustom();
  assert.equal(await from().inputValue(), '2026-09-12T11:12:41', 'the shown start rounds up');
  assert.equal(await to().inputValue(), '2026-09-12T11:27:40', 'the shown end rounds down');
  await from().fill('2026-09-12T11:30');
  await update({ now: now + 5000 });
  await update({ now: now + 10_000, value: { kind: 'relative', duration: 300_000 } });
  assert.equal(await from().inputValue(), '2026-09-12T11:30');
  assert.equal(await popover().getByRole('alert').count(), 0);
  await button('Apply range').click();
  assert.match(await popover().getByRole('alert').textContent(), /start before the end/);
  assert.equal(await from().getAttribute('aria-invalid'), 'true');
  assert.deepEqual(await changes(), []);
  await from().fill('2026-09-12T11:20');
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 8, 12, 14, 20), to: now }]);
});

test('a full-retention range applies unchanged', async () => {
  await update({ value: { kind: 'relative', duration: 1_800_000 } });
  await openCustom();
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: now - 1_800_000, to: now }]);
});

test('a chart-selected range keeps its milliseconds, and an edited end rounds down', async () => {
  const selected = { kind: 'absolute', from: now - 600_000 + 250, to: now - 60_000 + 750 };
  await update({ value: selected });
  await openCustom();
  await button('Apply range').click();
  assert.deepEqual((await changes())[0], selected);
  await openCustom();
  await to().fill('2026-09-12T11:26:07');
  await button('Apply range').click();
  assert.deepEqual((await changes())[1], { kind: 'absolute', from: selected.from, to: Date.UTC(2026, 8, 12, 14, 26, 7) });
});

test('a paused range offers Back to live', async () => {
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 60_000 }, resumeDuration: 600_000 });
  assert.equal(await trigger().getAttribute('data-time-range-state'), 'paused');
  assert.match(await trigger().getAttribute('aria-label'), /Paused/);
  await trigger().click();
  assert.match(await popover().locator('.time-range-paused').textContent(), /Paused at 11:22:40 to 11:26:40 GMT-3/);
  await button('Back to live').click();
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 600_000 }]);
  assert.equal(await trigger().getAttribute('data-time-range-state'), 'live');
});

test('the time zone view searches and picks a zone', async () => {
  await trigger().click();
  await button('Time zone: America/Sao_Paulo').click();
  assert.equal(await button('Browser time zone (America/Sao_Paulo)').getAttribute('aria-pressed'), 'true');
  await popover().getByRole('searchbox', { name: 'Search time zones' }).fill('tokyo');
  await button('Asia/Tokyo').click();
  assert.deepEqual(await page.evaluate(() => window.zones), ['Asia/Tokyo']);
  await button('Time zone: Asia/Tokyo').waitFor();
  await page.keyboard.press('Escape');
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 60_000 } });
  assert.match(await trigger().textContent(), /23:22:40 to 23:26:40 GMT\+9/);
  await trigger().click();
  await button('Time zone: Asia/Tokyo').click();
  await popover().getByRole('searchbox').fill('no such zone');
  await popover().getByText('No matching time zones.').waitFor();
  await button('Browser time zone (America/Sao_Paulo)').click();
});

test('native constraints never block Apply across a daylight-saving overlap', async () => {
  // 05:45Z is 01:45 EDT and 06:15Z is 01:15 EST: the wall-time window reverses.
  await update({ timeZone: 'America/New_York', now: Date.UTC(2026, 10, 1, 6, 15), value: { kind: 'relative', duration: 1_800_000 } });
  await openCustom();
  assert.equal(await from().getAttribute('min'), null);
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 10, 1, 5, 45), to: Date.UTC(2026, 10, 1, 6, 15) }]);
});

test('the keyboard reaches every action and Escape returns focus', async () => {
  await trigger().focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.textContent === 'Last 5 minutes', null, { timeout: 2000 });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Last 15 minutes');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 300_000 }]);
  await page.waitForFunction(() => document.activeElement?.classList.contains('time-range-trigger'));
  await page.keyboard.press('Enter');
  await popover().waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await popover().count(), 0);
  await page.waitForFunction(() => document.activeElement?.classList.contains('time-range-trigger'));
});

test('the tooltip repeats the full range', async () => {
  await trigger().hover();
  const tip = page.getByRole('tooltip');
  await tip.waitFor();
  assert.match(await tip.textContent(), /12 Sept 2026, 11:12:40 GMT-03:00 to 12 Sept 2026, 11:27:40 GMT-03:00/);
  await page.mouse.move(0, 0);
});


test('an edited wall time inside a daylight-saving gap moves forward', async () => {
  // 06:59:59.500Z shows as 03:00:00 EDT; 02:30 does not exist that night.
  await update({ timeZone: 'America/New_York', now: Date.UTC(2026, 2, 8, 7, 20),
    value: { kind: 'absolute', from: Date.UTC(2026, 2, 8, 6, 59, 59, 500), to: Date.UTC(2026, 2, 8, 7, 10) } });
  await openCustom();
  assert.equal(await from().inputValue(), '2026-03-08T03:00');
  await from().fill('2026-03-08T02:30');
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 2, 8, 7), to: Date.UTC(2026, 2, 8, 7, 10) }]);
});

test('a Chart with timeZone formats its axis and readout in that zone', async () => {
  await page.locator('.chart-plot .recharts-cartesian-axis-tick-value').first().waitFor();
  const ticks = (await page.locator('.chart-plot .recharts-cartesian-axis-tick-value').allTextContents()).filter(tick => tick.includes(':'));
  assert.ok(ticks.length > 0 && ticks.every(tick => /^23:0\d:\d0$/.test(tick)), ticks.join());
  await page.locator('[data-slot="chart"] .recharts-surface').first().focus();
  await page.keyboard.press('ArrowRight');
  const readout = page.locator('.chart-inspection strong').first();
  await readout.waitFor();
  assert.match(await readout.textContent(), /^23:0\d:\d0$/);
});

test('a zoned artifact form keeps unchanged instants and never blocks Apply in an overlap', async () => {
  const artifact = page.getByRole('button', { name: /^Artifact range:/ });
  assert.match(await artifact.getAttribute('aria-label'), /01:10:00\.250 to .*01:14:00\.000 GMT-5/);
  await artifact.click();
  await button('Custom range').click();
  await from().waitFor();
  assert.equal(await from().getAttribute('min'), null, 'the reversed wall-time window is not a native constraint');
  await button('Apply range').click();
  assert.deepEqual(await page.evaluate(() => window.artifactChanges),
    [{ from: Date.UTC(2026, 10, 1, 6, 10, 0, 250), to: Date.UTC(2026, 10, 1, 6, 14) }]);
});
