import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile:false, logLevel:'error', server:{host:'127.0.0.1',port:0} });
let browser, url;
before(async () => { await server.listen(); url=`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/app-shell-phone.html`; browser=await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query, width) {
  const page=await browser.newPage({viewport:{width,height:844}});
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.getByRole('heading',{name:'Workspace'}).waitFor();
  return page;
}
const frame = page => page.evaluate(() => {
  const main=document.querySelector('[data-slot="app-shell-main"]');
  const style=getComputedStyle(main);
  return { x: main.getBoundingClientRect().x, width: main.getBoundingClientRect().width,
    border: style.borderTopWidth, radius: parseFloat(style.borderTopLeftRadius),
    marks: getComputedStyle(main, '::after').content };
});

for (const width of [390, 440]) for (const background of ['momoi', 'solid']) test(`An unset outer frame meets the edges at ${width}px with ${background}`, async () => {
  const page=await open(`background=${background}&cornerStyle=rounded&cornerMarks=ticks`, width);
  try {
    const main=await frame(page);
    assert.equal(main.x, 0); assert.equal(main.width, width);
    assert.equal(main.border, '0px'); assert.equal(main.radius, 0); assert.equal(main.marks, 'none');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});
for (const width of [1024, 1280]) test(`An unset outer frame keeps the full frame at ${width}px`, async () => {
  const page=await open('cornerStyle=rounded', width);
  try {
    const main=await frame(page);
    assert.equal(main.x, 32, 'Outer padding plus the background margin');
    assert.equal(main.border, '1px'); assert(main.radius > 0);
  } finally { await page.close(); }
});
for (const width of [390, 1280]) test(`Explicit outer modes hold at ${width}px`, async () => {
  const measure=async (query) => { const page=await open(`cornerStyle=rounded&cornerSize=large&${query}`, width); try { return await frame(page); } finally { await page.close(); } };
  const full=await measure('outer=full'), compact=await measure('outer=compact'), none=await measure('outer=none');
  const solidCompact=await measure('outer=compact&background=solid');
  assert.equal(full.x, 32); assert.equal(full.border, '1px');
  assert.equal(compact.x, 8); assert.equal(solidCompact.x, 8); assert.equal(compact.border, '1px');
  assert(compact.radius > 0 && compact.radius < full.radius, `compact ${compact.radius} < full ${full.radius}`);
  assert.equal(none.x, 0); assert.equal(none.border, '0px'); assert.equal(none.radius, 0);
});
test('A topbar grows to contain children that wrap', async () => {
  const page=await open('wrap', 390);
  try {
    const { bar, children }=await page.evaluate(() => {
      const top=document.querySelector('.topbar');
      return { bar: top.getBoundingClientRect().bottom - parseFloat(getComputedStyle(top).borderBottomWidth),
        children: Math.max(...[...top.querySelectorAll('a')].map(a => a.getBoundingClientRect().bottom)) };
    });
    assert(children <= bar, `children end at ${children}, the border starts at ${bar}`);
  } finally { await page.close(); }
});
test('The Momoi symbol shrinks below 700px', async () => {
  for (const [width, size] of [[390, '64px'], [1024, '160px']]) {
    const page=await open('', width);
    try { assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.app-shell'), '::before').maskSize), new RegExp(`^min\\(${size}`)); }
    finally { await page.close(); }
  }
});
for (const theme of ['light', 'dark']) test(`BottomNav at 390px in ${theme}`, async () => {
  const page=await open(`bottom&theme=${theme}`, 390);
  try {
    const nav=page.getByRole('navigation', { name: 'Primary' });
    const box=await nav.boundingBox();
    assert.equal(box.y + box.height, 844, 'The bar sits on the bottom edge');
    const links=await nav.getByRole('link').evaluateAll(links => links.map(link => ({
      height: link.getBoundingClientRect().height,
      cut: [...link.querySelectorAll('span:not(.bottom-nav-badge)')].some(label => label.scrollWidth > label.clientWidth),
      current: link.getAttribute('aria-current'),
    })));
    assert.equal(links.length, 4);
    for (const link of links) { assert(link.height >= 44); assert.equal(link.cut, false, 'No label is cut'); }
    assert.deepEqual(links.map(link => link.current), [null, 'page', null, null]);
    assert.equal(await nav.getByRole('link', { name: 'In progress 12' }).count(), 1);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const last=await page.locator('#last').boundingBox();
    assert(last.y + last.height <= (await nav.boundingBox()).y, 'The last element scrolls clear of the bar');
    assert.equal((await page.locator('.topbar').boundingBox()).y, 0, 'The header stays at the top');
    await page.locator('#last').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.closest('nav')?.getAttribute('aria-label')), 'Primary');
  } finally { await page.close(); }
});
test('BottomNav does not render from 700px', async () => {
  for (const width of [700, 1280]) {
    const page=await open('bottom', width);
    try {
      assert.equal(await page.getByRole('navigation', { name: 'Primary' }).isVisible(), false);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.app-shell')).paddingBottom), '16px');
    } finally { await page.close(); }
  }
});
for (const width of [390, 800]) test(`ApplicationShell builds the bar from its navigation at ${width}px`, async () => {
  const page=await open('sidebar=bottom', width);
  try {
    const bar=page.getByRole('navigation', { name: 'Primary' }).and(page.locator('.bottom-nav'));
    const menu=page.getByRole('button', { name: 'Open navigation' });
    if (width < 700) {
      assert(await bar.isVisible()); assert.equal(await menu.isVisible(), false);
      assert.equal(await page.locator('.sidebar').isVisible(), false);
      assert(await page.locator('.topbar .app-shell-phone-brand').isVisible(), 'The header carries the brand');
      const link=bar.getByRole('link', { name: 'In progress 12' });
      assert.equal(await link.getAttribute('aria-current'), 'page');
      assert.equal(await link.locator('.bottom-nav-icon').getAttribute('aria-hidden'), 'true');
    } else {
      assert.equal(await bar.isVisible(), false); assert(await menu.isVisible(), 'Between 700px and 1023px the drawer stays');
      assert.equal(await page.locator('.topbar .app-shell-phone-brand').isVisible(), false);
    }
  } finally { await page.close(); }
});
test('The default drawer keeps its menu on phones', async () => {
  const page=await open('sidebar', 390);
  try {
    assert(await page.getByRole('button', { name: 'Open navigation' }).isVisible());
    assert.equal(await page.locator('.bottom-nav').count(), 0);
  } finally { await page.close(); }
});
test('More holds the destinations past the fifth and the footer', async () => {
  const page=await open('sidebar=bottom&more', 390);
  try {
    const bar=page.locator('.bottom-nav');
    assert.deepEqual(await bar.getByRole('link').allInnerTexts(), ['New', 'In progress\n12', 'Ready', 'Account']);
    const more=bar.getByRole('button', { name: 'More' });
    await more.click();
    const sheet=page.getByRole('dialog', { name: 'More' });
    await sheet.waitFor();
    assert.deepEqual(await sheet.getByRole('link').allInnerTexts(), ['Settings', 'Help']);
    assert(await sheet.getByText('Signed in as Alex').isVisible());
    await sheet.getByRole('link', { name: 'Settings' }).click();
    await sheet.waitFor({ state: 'hidden' });
    assert(await page.evaluate(() => document.activeElement?.textContent?.includes('More')), 'Focus returns to More');
  } finally { await page.close(); }
});
