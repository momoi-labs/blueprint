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
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/sliding-indicators.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}`);
});
after(async () => { await browser?.close(); await server.close(); });

// Each marker is expected where the per-item marker used to sit.
const groups = [
  { name: 'Tabs', container: '#tabs [role="tablist"]', pseudo: '::after', current: '[aria-selected="true"]',
    next: page => page.locator('#tabs').getByRole('tab', { name: 'Logs' }), marker: r => ({ x: r.x, y: r.y + r.h - 2, w: r.w, h: 2 }) },
  { name: 'Segmented', container: '#segmented', pseudo: '::before', current: '[aria-selected="true"]',
    next: page => page.locator('#segmented').getByRole('tab', { name: '7 days' }), marker: r => r },
  { name: 'ThemeSelector', container: '#theme .theme-buttons', pseudo: '::before', current: '[aria-checked="true"]',
    next: page => page.locator('#theme').getByRole('radio', { name: 'Dark theme' }), marker: r => r },
  { name: 'Navigation row', container: '#row .nav-row', pseudo: '::after', current: '[aria-current="page"]',
    next: page => page.locator('#row').getByRole('link', { name: 'Settings' }), marker: r => ({ x: r.x, y: r.y + r.h - 1, w: r.w, h: 2 }) },
  { name: 'Sidebar', container: '#sidebar nav[aria-label="Primary"]', pseudo: '::before', current: '[aria-current="page"]',
    next: page => page.locator('#sidebar nav[aria-label="Primary"]').getByRole('link', { name: 'Settings' }),
    marker: (r, gutter) => ({ x: r.x - gutter, y: r.y + 2, w: 2, h: r.h - 4 }) },
];

function helpers() {
  window.markerBox = (selector, pseudo) => {
    const element = document.querySelector(selector);
    const style = getComputedStyle(element, pseudo);
    if (style.content === 'none') return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + element.clientLeft - element.scrollLeft + parseFloat(style.left),
      y: rect.top + element.clientTop - element.scrollTop + parseFloat(style.top),
      w: parseFloat(style.width), h: parseFloat(style.height),
    };
  };
  window.transitionsOf = (container, pseudo) => document.getAnimations().filter(animation =>
    animation.effect?.target === document.querySelector(container) && animation.effect?.pseudoElement === pseudo);
  window.itemBox = selector => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  };
}

async function open(options = {}, query = '') {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1200 }, ...options });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(helpers);
  await page.goto(url + query);
  await page.locator('#sidebar-row').waitFor();
  return page;
}

const target = ({ container, pseudo }) => ({ container, pseudo });
const markerOf = (page, group) => page.evaluate(({ container, pseudo }) => markerBox(container, pseudo), target(group));
async function expectedOf(page, group) {
  const gutter = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing-sm')));
  return group.marker(await page.evaluate(selector => itemBox(selector), `${group.container} ${group.current}`), gutter);
}
function assertBox(actual, expected, message) {
  assert(actual, `${message}: no marker is drawn`);
  for (const key of ['x', 'y', 'w', 'h']) assert(Math.abs(actual[key] - expected[key]) <= 0.5, `${message}: ${key} is ${actual[key]}, expected ${expected[key]}`);
}
const between = (box, from, to) => box && ['x', 'y'].some(key =>
  Math.min(from[key], to[key]) + 0.5 < box[key] && box[key] < Math.max(from[key], to[key]) - 0.5);

// A long duration keeps a transition alive until the page can pause it.
const slow = page => page.addStyleTag({ content: ':root { --motion-duration-fast: 60s; }' });

// Pauses the marker's transitions halfway, measures it, then finishes them.
const midway = (page, group) => page.evaluate(({ container, pseudo }) => {
  const transitions = transitionsOf(container, pseudo);
  for (const transition of transitions) { transition.pause(); transition.currentTime = 30000; }
  const box = transitions.length ? markerBox(container, pseudo) : null;
  for (const transition of transitions) transition.finish();
  return box;
}, target(group));

for (const group of groups) {
  test(`${group.name} marker rests on the current item and follows a change`, async () => {
    const page = await open();
    try {
      const from = await markerOf(page, group);
      assertBox(from, await expectedOf(page, group), `${group.name} at rest`);
      await slow(page);
      await group.next(page).click();
      const mid = await midway(page, group);
      const to = await markerOf(page, group);
      assertBox(to, await expectedOf(page, group), `${group.name} after the change`);
      // Chromium animates anchor changes; other engines may move the marker at once.
      if (engine === 'chromium') assert(between(mid, from, to), `${group.name} slides through intermediate positions`);
    } finally { await page.close(); }
  });
}

test('Reduced motion moves every marker without a slide', async () => {
  const page = await open({ reducedMotion: 'reduce' });
  try {
    await slow(page);
    for (const group of groups) {
      await group.next(page).click();
      assert.equal(await page.evaluate(({ container, pseudo }) => transitionsOf(container, pseudo).length, target(group)), 0, `${group.name} does not slide`);
      assertBox(await markerOf(page, group), await expectedOf(page, group), `${group.name} moves at once`);
    }
  } finally { await page.close(); }
});

test('Right-to-left layouts keep the per-item markers', async () => {
  const page = await open({}, '?dir=rtl');
  try {
    for (const group of groups) {
      assert.equal(await markerOf(page, group), null, `${group.name} draws no shared marker`);
      const own = await page.locator(`${group.container} ${group.current}`).evaluate((element, name) => {
        if (name === 'Segmented' || name === 'ThemeSelector') return getComputedStyle(element).boxShadow;
        return getComputedStyle(element, name === 'Tabs' ? '::after' : '::before').content;
      }, group.name);
      assert.notEqual(own, 'none', `${group.name} keeps its own marker`);
    }
  } finally { await page.close(); }
});

test('Markers stay within their own group', async () => {
  const page = await open();
  try {
    assert.equal(await page.evaluate(() => markerBox('#segmented-empty', '::before')), null, 'A track without a selection draws no chip');
    const help = { container: '#sidebar nav[aria-label="Help"]', pseudo: '::before', current: '[aria-current="page"]', marker: groups[4].marker };
    assertBox(await markerOf(page, help), await expectedOf(page, help), 'A second navigation landmark keeps its own rail');
    assertBox(await markerOf(page, groups[4]), await expectedOf(page, groups[4]), 'The first landmark keeps its rail');
    assert.equal(await page.evaluate(() => markerBox('#sidebar-row nav', '::before')), null, 'A row inside a Sidebar draws no rail');
    const row = { container: '#sidebar-row .nav-row', pseudo: '::after', current: '[aria-current="page"]', marker: groups[3].marker };
    assertBox(await markerOf(page, row), await expectedOf(page, row), 'A row inside a Sidebar keeps the row marker');
    assert.equal(await page.evaluate(() => markerBox('#sidebar-row nav[aria-label="Views"]', '::before')), null, 'A Sidebar landmark laid out as a row draws no rail');
    const views = { container: '#sidebar-row nav[aria-label="Views"]', pseudo: '::after', current: '[aria-current="page"]', marker: groups[3].marker };
    assertBox(await markerOf(page, views), await expectedOf(page, views), 'A Sidebar landmark laid out as a row keeps the row marker');
  } finally { await page.close(); }
});

test('Tangerine draws the sliding tab underline in its ink', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { document.documentElement.dataset.accent = 'tangerine'; });
    const [marker, ink] = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement('i'));
      probe.style.color = 'var(--color-link)';
      const color = getComputedStyle(probe).color;
      probe.remove();
      return [getComputedStyle(document.querySelector('#tabs [role="tablist"]'), '::after').backgroundColor, color];
    });
    assert.equal(marker, ink, 'The bright Tangerine fill is too faint for a 2px underline');
  } finally { await page.close(); }
});
