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
  // Escape resets an edit before it closes the popover.
  for (let i = 0; i < 3 && await page.locator('.time-range-live-content').count(); i++) await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.evaluate(start => new Promise(resolve => {
    window.changes = []; window.zones = [];
    window.update({ now: start, maxDuration: 1_800_000, resumeDuration: 900_000, timeZone: undefined,
      value: { kind: 'relative', duration: 900_000 } });
    requestAnimationFrame(() => setTimeout(resolve));
  }), now);
  await page.locator('.time-range-live-content').waitFor({ state: 'detached' });
});

const trigger = () => page.locator('.time-range-trigger[data-time-range-state]');
const pauseButton = () => page.locator('.time-range-live-pause');
const popover = () => page.locator('.time-range-live-content');
const button = name => popover().getByRole('button', { name, exact: true });
const changes = () => page.evaluate(() => window.changes);
// Waits a frame so React has rendered the new props.
const update = props => page.evaluate(next => new Promise(resolve => {
  window.update(next);
  requestAnimationFrame(() => setTimeout(resolve));
}), props);
const from = () => popover().getByLabel(/^From/);
const to = () => popover().getByLabel(/^To/);
const alert = () => popover().getByRole('alert');
async function open() {
  await trigger().click();
  await from().waitFor();
}

test('presets stop at the retention, the current one is pressed, and there is no custom view', async () => {
  await update({ maxDuration: 1_200_000 });
  await open();
  const presets = popover().getByRole('group', { name: 'Presets' }).getByRole('button');
  assert.deepEqual(await presets.allTextContents(), ['Last 5 minutes', 'Last 15 minutes']);
  assert.equal(await button('Last 15 minutes').getAttribute('aria-pressed'), 'true');
  assert.equal(await popover().getByText(/Entire run|Custom range/).count(), 0);
  await button('Last 5 minutes').click();
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 300_000 }]);
  assert.equal(await popover().count(), 0);
});

test('a live value shows now-x text, and a relative edit survives polling and applies live', async () => {
  await open();
  assert.equal(await from().inputValue(), 'now-15m');
  assert.equal(await to().inputValue(), 'now');
  assert.match(await popover().getByText(/follows the clock/).first().textContent(), /11:12:40/);
  assert.equal(await button('Apply range').count(), 0, 'actions wait for an edit');
  await from().fill('now-20m');
  await update({ now: now + 5000 });
  assert.equal(await from().inputValue(), 'now-20m');
  await from().press('Enter');
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 1_200_000 }]);
});

test('Apply validates the grammar, the order, and the retention against the latest now', async () => {
  await open();
  await from().fill('2026-02-30 10:00');
  await button('Apply range').click();
  assert.match(await alert().textContent(), /Enter a start/);
  assert.equal(await from().getAttribute('aria-invalid'), 'true');
  await from().fill('11:30');
  await button('Apply range').click();
  assert.match(await alert().textContent(), /before the end/);
  await from().fill('now-40m');
  await button('Apply range').click();
  assert.match(await alert().textContent(), /within the data kept/);
  await from().fill('11:20');
  await to().fill('now-0m');
  await update({ now: now + 5000 });
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 8, 12, 14, 20), to: now + 5000 }]);
});

test('an untouched end keeps its milliseconds and the future is rejected', async () => {
  const selected = { kind: 'absolute', from: now - 600_000 + 250, to: now - 60_000 + 750 };
  await update({ value: selected });
  await open();
  assert.equal(await from().inputValue(), '2026-09-12 11:17:41');
  await to().fill('11:30');
  await button('Apply range').click();
  assert.match(await alert().textContent(), /future/);
  assert.equal(await to().getAttribute('aria-invalid'), 'true');
  await to().fill('11:26:07');
  await to().press('Enter');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: selected.from, to: Date.UTC(2026, 8, 12, 14, 26, 7) }]);
});

test('Escape resets an edit first, then closes; Reset and new values behave', async () => {
  await open();
  await from().fill('now-10m');
  await update({ value: { kind: 'relative', duration: 300_000 } });
  assert.equal(await from().inputValue(), 'now-10m', 'a new value keeps the edit');
  await page.keyboard.press('Escape');
  assert.equal(await from().inputValue(), 'now-5m');
  assert.equal(await popover().count(), 1);
  await from().fill('now-10m');
  await button('Reset').click();
  assert.equal(await from().inputValue(), 'now-5m');
  await page.keyboard.press('Escape');
  await popover().waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement?.classList.contains('time-range-trigger'));
});

test('a zone change discards an edit typed in the old zone, even after a round trip', async () => {
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 60_000 } });
  await open();
  await from().fill('11:00');
  await update({ timeZone: 'Asia/Tokyo' });
  assert.equal(await from().inputValue(), '2026-09-12 23:22:41');
  await from().fill('now-7m');
  await update({ timeZone: 'UTC' });
  await update({ timeZone: 'Asia/Tokyo' });
  assert.equal(await from().inputValue(), '2026-09-12 23:22:41');
  assert.equal(await button('Apply range').count(), 0);
});

test('an untouched field follows a new value while the other one is edited', async () => {
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 60_000 } });
  await open();
  await from().fill('11:00');
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 30_000 } });
  assert.equal(await from().inputValue(), '11:00');
  assert.equal(await to().inputValue(), '2026-09-12 11:27:10');
});

test('pause freezes the window and resume returns to the resume duration', async () => {
  assert.equal(await pauseButton().getAttribute('aria-label'), 'Pause');
  await pauseButton().click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: now - 900_000, to: now }]);
  assert.equal(await trigger().getAttribute('data-time-range-state'), 'paused');
  assert.equal(await pauseButton().getAttribute('aria-label'), 'Resume live');
  await open();
  assert.equal(await popover().locator('.time-range-live-status').textContent(), ' Paused');
  await button('Back to live').click();
  assert.deepEqual((await changes())[1], { kind: 'relative', duration: 900_000 });
  assert.equal(await trigger().getAttribute('data-time-range-state'), 'live');
});

test('the time zone view searches and picks a zone', async () => {
  await open();
  await button('Time zone: America/Sao_Paulo').click();
  assert.equal(await button('Browser time zone (America/Sao_Paulo)').getAttribute('aria-pressed'), 'true');
  await popover().getByRole('searchbox', { name: 'Search time zones' }).fill('tokyo');
  await button('Asia/Tokyo').click();
  assert.deepEqual(await page.evaluate(() => window.zones), ['Asia/Tokyo']);
  await button('Time zone: Asia/Tokyo').waitFor();
  await page.keyboard.press('Escape');
  await update({ value: { kind: 'absolute', from: now - 300_000, to: now - 60_000 } });
  assert.match(await trigger().textContent(), /23:22:40 to 23:26:40 GMT\+9/);
  await open();
  await button('Time zone: Asia/Tokyo').click();
  await button('Browser time zone (America/Sao_Paulo)').click();
});

test('the tooltip shows the timeline on a neutral surface', async () => {
  await trigger().hover();
  const tip = page.locator('.time-range-live-tip');
  await tip.waitFor();
  assert.match(await tip.textContent(), /11:12:40.*11:27:40.*Keeps 30 minutes\./);
  const segment = await tip.locator('.time-range-live-segment').evaluate(node => ({ left: node.style.left, width: node.style.width }));
  assert.deepEqual(segment, { left: '50%', width: '50%' });
  assert.notEqual(await tip.evaluate(node => getComputedStyle(node).backgroundColor),
    await page.locator('.time-range-live-pause').evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary')));
  await page.mouse.move(0, 0);
});

test('an edited wall time inside a daylight-saving gap moves forward', async () => {
  await update({ timeZone: 'America/New_York', now: Date.UTC(2026, 2, 8, 7, 20),
    value: { kind: 'absolute', from: Date.UTC(2026, 2, 8, 6, 59, 59, 500), to: Date.UTC(2026, 2, 8, 7, 10) } });
  await open();
  assert.equal(await from().inputValue(), '2026-03-08 03:00:00');
  await from().fill('2026-03-08 02:30');
  await from().press('Enter');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 2, 8, 7), to: Date.UTC(2026, 2, 8, 7, 10) }]);
});

test('an untouched end inside a daylight-saving overlap keeps its instant', async () => {
  // 06:15Z is 01:15 EST; 01:50 is read as EDT, the earlier instant.
  await update({ timeZone: 'America/New_York', now: Date.UTC(2026, 10, 1, 6, 20),
    value: { kind: 'absolute', from: Date.UTC(2026, 10, 1, 5, 45), to: Date.UTC(2026, 10, 1, 6, 15) } });
  await open();
  await from().fill('2026-11-01 01:50');
  await from().press('Enter');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 10, 1, 5, 50), to: Date.UTC(2026, 10, 1, 6, 15) }]);
});

test('the popover has two columns when wide and the keyboard reaches it', async () => {
  await trigger().focus();
  await page.keyboard.press('Enter');
  await from().waitFor();
  const columns = await page.locator('.time-range-live-panel').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
  assert.equal(columns, 2);
  await page.keyboard.press('Escape');
  await popover().waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement?.classList.contains('time-range-trigger'));
});

const track = () => popover().locator('.time-range-live-track');
const slider = name => popover().getByRole('slider', { name, exact: true });
// Starts a pointer drag on a slider's middle and returns a mover in track widths.
async function grab(name, at = 0.5) {
  const box = await slider(name).boundingBox();
  const width = (await track().boundingBox()).width;
  const x = box.x + box.width * at, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return async fraction => page.mouse.move(x + fraction * width, y, { steps: 4 });
}
const paused = { kind: 'absolute', from: now - 1_200_000, to: now - 600_000 };

test('dragging the segment moves the range once, on release, and keeps its duration', async () => {
  await update({ value: paused });
  await open();
  const move = await grab('Move range');
  await move(-1 / 6);
  assert.deepEqual(await changes(), [], 'a drag previews without applying');
  await page.mouse.up();
  const [change] = await changes();
  assert.equal(change.kind, 'absolute');
  assert.equal(change.to - change.from, 600_000);
  assert.ok(Math.abs(change.from - (paused.from - 300_000)) <= 15_000, String(change.from - paused.from));
  assert.equal((await changes()).length, 1);
});

test('dragging the end to now follows the clock with a rounded duration', async () => {
  await update({ value: paused });
  await open();
  const move = await grab('Range end');
  await move(0.5);
  assert.match(await popover().getByRole('status').textContent(), /Release to follow the clock: Last 20 minutes/);
  await page.mouse.up();
  assert.deepEqual(await changes(), [{ kind: 'relative', duration: 1_200_000 }]);
});

test('Escape cancels a drag before it resets an edit, and the release applies nothing', async () => {
  await update({ value: paused });
  await open();
  await from().fill('now-25m');
  const move = await grab('Move range');
  await move(-0.1);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.deepEqual(await changes(), []);
  assert.equal(await from().inputValue(), 'now-25m', 'the edit is still there');
  await from().focus();
  await page.keyboard.press('Escape');
  assert.equal(await from().inputValue(), '2026-09-12 11:07:41');
  assert.equal(await popover().count(), 1);
});

test('a cancelled pointer applies nothing, and polling does not move a drag', async () => {
  await update({ value: paused });
  await open();
  let move = await grab('Move range');
  await move(-0.1);
  await track().dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
  assert.deepEqual(await changes(), []);
  move = await grab('Move range');
  await move(-1 / 6);
  await update({ now: now + 60_000 });
  await move(-1 / 6);
  await page.mouse.up();
  const [change] = await changes();
  assert.ok(Math.abs(change.from - (paused.from - 300_000)) <= 15_000, 'the drag kept its own now');
});

test('the sliders have limits, step by 1/120 of retention, and apply each key', async () => {
  await update({ value: paused });
  await open();
  const start = slider('Range start');
  assert.deepEqual(await start.evaluate(node => [node.ariaValueMin, node.ariaValueMax, node.ariaValueNow].map(Number)),
    [now - 1_800_000, paused.to - 1000, paused.from]);
  assert.match(await slider('Move range').getAttribute('aria-valuetext'), /11:07:40 to 11:17:40/);
  await slider('Move range').focus();
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: paused.from - 15_000, to: paused.to - 15_000 }]);
  await page.keyboard.press('Home');
  assert.deepEqual((await changes())[1], { kind: 'absolute', from: now - 1_800_000, to: now - 1_800_000 + 600_000 });
  await slider('Range end').focus();
  await page.keyboard.press('End');
  assert.deepEqual((await changes())[2], { kind: 'absolute', from: now - 1_800_000, to: now });
  await slider('Range start').focus();
  await page.keyboard.press('End');
  assert.deepEqual((await changes())[3], { kind: 'absolute', from: now - 1000, to: now });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Range start');
});

test('dragging the start of a live range keeps it live', async () => {
  await open();
  const move = await grab('Range start');
  await move(-1 / 6);
  await page.mouse.up();
  const [change] = await changes();
  assert.equal(change.kind, 'relative');
  assert.ok(Math.abs(change.duration - 1_200_000) <= 60_000, String(change.duration));
});

test('a release that polling shrinks below one second applies nothing', async () => {
  await update({ value: { kind: 'absolute', from: now - 1_790_000, to: now - 1_789_000 } });
  await open();
  const move = await grab('Move range');
  await move(-0.5);
  await update({ now: now + 600 });
  await page.mouse.up();
  assert.deepEqual(await changes(), []);
});

test('a paused range crossing the retention start exposes valid slider limits', async () => {
  await update({ value: { kind: 'absolute', from: now - 1_860_000, to: now - 1_200_000 } });
  await open();
  const start = slider('Range start');
  const [min, , value] = await start.evaluate(node => [node.ariaValueMin, node.ariaValueMax, node.ariaValueNow].map(Number));
  assert.equal(value, min);
  await slider('Range end').focus();
  await page.keyboard.press('End');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: now - 1_800_000, to: now }]);
});

test('keyboard steps stay whole seconds on a short retention', async () => {
  await update({ maxDuration: 1500, value: { kind: 'absolute', from: now - 1500, to: now - 500 } });
  await open();
  await slider('Range end').focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: now - 1500, to: now }]);
});

const week = 7 * 86_400_000;
const calendar = () => page.locator('.time-range-calendar');
const day = () => page.evaluate(() => document.activeElement?.dataset.day);
// The calendar moves focus to the field's day a frame after it opens.
async function openCalendar(name) {
  await popover().getByRole('button', { name }).click();
  await calendar().waitFor();
  await page.waitForFunction(() => document.activeElement?.dataset.day);
}

test('the calendar appears only when retention spans days, and a pick waits for Apply', async () => {
  await open();
  assert.equal(await popover().getByRole('button', { name: 'Choose start date' }).count(), 0);
  await update({ maxDuration: week });
  await openCalendar('Choose start date');
  assert.equal(await day(), '2026-09-12');
  assert.equal(await calendar().locator('[aria-current="date"]').getAttribute('data-day'), '2026-09-12');
  assert.equal(await calendar().locator('th').first().getAttribute('abbr'), 'Monday', 'en-GB weeks start on Monday');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await day(), '2026-09-10');
  await page.keyboard.press('Enter');
  await calendar().waitFor({ state: 'detached' });
  assert.equal(await from().inputValue(), '2026-09-10 11:12:40', 'the relative start resolved to its time first');
  assert.deepEqual(await changes(), []);
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 8, 10, 14, 12, 40), to: now }]);
});

test('days outside retention cannot be picked and months stop at retention', async () => {
  await update({ maxDuration: week });
  await open();
  await openCalendar('Choose start date');
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  assert.equal(await day(), '2026-09-04');
  assert.match(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), /outside the data kept/);
  await page.keyboard.press('Enter');
  assert.equal(await calendar().count(), 1);
  assert.equal(await calendar().getByRole('button', { name: 'Previous month' }).isDisabled(), true);
  assert.equal(await calendar().getByRole('button', { name: 'Next month' }).isDisabled(), true);
  await page.keyboard.press('PageUp');
  assert.equal(await day(), '2026-09-01', 'keys stop at the first month of retention');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  assert.equal(await day(), '2026-09-01');
  await page.keyboard.press('PageDown');
  assert.equal(await day(), '2026-09-30', 'and at the last one');
  assert.match(await calendar().locator('strong').textContent(), /September 2026/);
  await calendar().locator('[data-day="2026-08-31"]').click({ force: true });
  assert.match(await calendar().locator('strong').textContent(), /September 2026/, 'an unavailable spillover day changes nothing');
  assert.equal(await calendar().count(), 1);
});

test('Escape closes only the calendar, and a click inside it keeps the popover open', async () => {
  await update({ maxDuration: week });
  await open();
  const opener = popover().getByRole('button', { name: 'Choose end date' });
  await opener.click();
  await calendar().waitFor();
  await page.keyboard.press('Escape');
  await calendar().waitFor({ state: 'detached' });
  assert.equal(await popover().count(), 1);
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Choose end date');
  await opener.click();
  await calendar().locator('[data-day="2026-09-11"]').click();
  assert.equal(await to().inputValue(), '2026-09-11 11:27:40');
  assert.equal(await popover().count(), 1);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await popover().waitFor({ state: 'detached' });
});

test('a picked day on a daylight-saving date resolves on Apply', async () => {
  const at = Date.UTC(2026, 2, 9, 12);
  await update({ timeZone: 'America/New_York', now: at, maxDuration: week,
    value: { kind: 'absolute', from: Date.UTC(2026, 2, 7, 7, 30), to: at - 3_600_000 } });
  await open();
  await openCalendar('Choose start date');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  assert.equal(await from().inputValue(), '2026-03-08 02:30:00');
  await button('Apply range').click();
  assert.deepEqual(await changes(), [{ kind: 'absolute', from: Date.UTC(2026, 2, 8, 7), to: at - 3_600_000 }]);
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
  const content = page.locator('.time-range-content');
  await content.getByRole('button', { name: 'Custom range', exact: true }).click();
  const start = content.getByLabel(/^From/);
  await start.waitFor();
  assert.equal(await start.getAttribute('min'), null, 'the reversed wall-time window is not a native constraint');
  assert.equal(await content.evaluate(node => node.getBoundingClientRect().width), 384, 'artifact keeps its width');
  await content.getByRole('button', { name: 'Apply range', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.artifactChanges),
    [{ from: Date.UTC(2026, 10, 1, 6, 10, 0, 250), to: Date.UTC(2026, 10, 1, 6, 14) }]);
});
