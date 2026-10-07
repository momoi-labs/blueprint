import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/log-virtualization.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '') {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.locator('[data-index="499"]').waitFor();
 return page;
}
const scroller = page => page.locator('[data-slot="log-view-scroll"]');
const frames = (page, count) => page.evaluate(count => new Promise(resolve => {
 const next = left => left ? requestAnimationFrame(() => next(left - 1)) : resolve(); next(count);
}), count);
const read = page => scroller(page).evaluate(el => ({
 top: el.scrollTop, end: el.scrollHeight - el.clientHeight, follow: el.parentElement.dataset.follow,
 lines: [...el.querySelectorAll('[data-index]')].map(line => Number(line.dataset.index)),
}));
// Waits until the scroll position and height stop changing.
async function settle(page) {
 let last;
 for (let i = 0; i < 60; i++) {
  await frames(page, 2); const now = await read(page);
  if (last && now.top === last.top && now.end === last.end) return now;
  last = now;
 }
 throw new Error(`Scroller did not settle: ${JSON.stringify(last)}`);
}
async function press(page, name) { await page.getByRole('button', { name }).click(); return settle(page); }
const atEnd = state => state.end - state.top <= 1;
for (const mode of ['uncontrolled', 'controlled']) {
 test(`${mode}: the virtualizer gets the scroller and new lines pin the end`, async () => {
  const page = await open(mode);
  try {
   let state = await settle(page);
   assert(atEnd(state), JSON.stringify(state));
   assert.equal(Math.max(...state.lines), 499); assert(state.lines.length < 40, `${state.lines.length} lines rendered`);
   state = await press(page, 'Append line');
   assert(atEnd(state), JSON.stringify(state)); assert.equal(Math.max(...state.lines), 500);
   state = await press(page, 'Append 40 lines');
   assert(atEnd(state), JSON.stringify(state)); assert.equal(Math.max(...state.lines), 540); assert.equal(state.follow, 'true');
  } finally { await page.close(); }
 });
 test(`${mode}: scrolling back pauses following and the end resumes it`, async () => {
  const page = await open(mode);
  try {
   await settle(page); await scroller(page).hover();
   await page.mouse.wheel(0, -300);
   let state = await settle(page);
   assert(state.end - state.top >= 200, JSON.stringify(state)); assert.equal(state.follow, 'false');
   const { top } = state;
   state = await press(page, 'Append 40 lines');
   assert.equal(state.top, top); assert.equal(state.follow, 'false'); assert(!state.lines.includes(539));
   state = await press(page, 'Rerender');
   assert.equal(state.top, top);
   await scroller(page).hover(); await page.mouse.wheel(0, 2000); state = await settle(page);
   assert(atEnd(state), JSON.stringify(state)); assert.equal(state.follow, 'true');
   state = await press(page, 'Append line');
   assert(atEnd(state), JSON.stringify(state)); assert.equal(Math.max(...state.lines), 540);
  } finally { await page.close(); }
 });
 test(`${mode}: small steps leave the end`, async () => {
  const page = await open(mode);
  try {
   const { end } = await settle(page);
   // The fixture puts a row edge 5px above the end, inside the 8px that
   // counts as the bottom. Crossing it re-renders the rows.
   assert.equal(end % 20, 5, 'fixture geometry');
   // A trackpad moves a pixel or two per frame.
   for (let i = 0; i < 20; i++) { await scroller(page).evaluate(el => { el.scrollTop -= 1; }); await frames(page, 1); }
   let state = await settle(page);
   assert.equal(state.top, end - 20, JSON.stringify(state)); assert.equal(state.follow, 'false');
   state = await press(page, 'Jump to end');
   assert(atEnd(state), JSON.stringify(state)); assert.equal(state.follow, 'true');
  } finally { await page.close(); }
 });
}
test('controlled: turning Follow on moves to the end', async () => {
 const page = await open('controlled');
 try {
  await settle(page); await scroller(page).hover();
  await page.mouse.wheel(0, -300); await settle(page);
  const follow = page.getByRole('checkbox', { name: 'Follow' });
  assert.equal(await follow.isChecked(), false);
  await follow.check(); const state = await settle(page);
  assert(atEnd(state), JSON.stringify(state)); assert.equal(state.follow, 'true');
 } finally { await page.close(); }
});
