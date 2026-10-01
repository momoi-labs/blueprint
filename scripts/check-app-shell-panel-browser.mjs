import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile:false, logLevel:'error', server:{host:'127.0.0.1',port:0} });
let browser, url;
before(async () => { await server.listen(); url=`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/app-shell-panel.html`; browser=await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query='', width=1440) {
  const page=await browser.newPage({viewport:{width,height:900}});
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  return page;
}
for (const variant of ['default','inset']) for (const rtl of [false,true]) test(`Independent panels retain values, focus and width in ${variant}, rtl=${rtl}`, async () => {
  const page=await open(`variant=${variant}${rtl?'&rtl':''}`);
  try {
    const main=page.locator('[data-slot="app-shell-main"]');
    const panel=page.getByRole('complementary',{name:'Settings'});
    const toggle=page.locator('[data-slot="app-shell-panel-toggle"]');
    const width=async()=> (await main.boundingBox()).width;
    const before=await width();
    const panelBox=await panel.boundingBox();
    const toggleBox=await toggle.boundingBox();
    assert.equal(panelBox.width,320);
    assert(Math.abs((rtl?toggleBox.x:toggleBox.x+toggleBox.width)-(rtl?panelBox.x+panelBox.width:panelBox.x))<1,'Floating control follows the panel edge');
    assert(Math.abs(toggleBox.y+toggleBox.height/2-450)<1);
    await page.getByRole('textbox',{name:'Panel value'}).fill('Retained');
    await page.getByRole('textbox',{name:'Main value'}).fill('Working');
    assert(await panel.isVisible(),'Main content remains interactive');
    await page.getByRole('button',{name:'Toggle navigation'}).click();
    assert(await width()>before+200);
    const noNavigation=await width();
    await page.getByRole('button',{name:'Close from panel'}).click();
    assert.equal(await width(),noNavigation+320);
    assert(await toggle.evaluate(el=>el===document.activeElement));
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.keyboard.press('Space');
    assert.equal(await page.getByRole('textbox',{name:'Panel value'}).inputValue(),'Retained');
    assert.equal(await page.getByRole('textbox',{name:'Main value'}).inputValue(),'Working');
    await page.getByRole('combobox',{name:/^Toggle placement/}).selectOption('header');
    assert.equal(await toggle.evaluate(el=>getComputedStyle(el).position),'static');
    await toggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  } finally { await page.close(); }
});
for (const layout of ['sidebar','topbar']) test(`ApplicationShell ${layout} accepts the panel without losing its layout`,async()=>{
  const page=await open(`application${layout==='topbar'?'&topbar':''}`);
  try {
    const main=page.locator('[data-slot="app-shell-main"]');
    const panel=page.getByRole('complementary',{name:'Settings'});
    if(layout==='sidebar') {
      const before=(await main.boundingBox()).width;
      await page.getByRole('button',{name:'Collapse sidebar'}).click();
      assert((await main.boundingBox()).width>before);
      assert.equal((await panel.boundingBox()).width,320);
    }
    await panel.evaluate(el=>el.scrollTop=100);
    assert.equal(await panel.evaluate(el=>el.scrollTop),100);
    const top=(await panel.boundingBox()).y;
    await page.evaluate(()=>window.scrollTo(0,400));
    assert.equal((await panel.boundingBox()).y,top);
    await page.getByRole('button',{name:'Close panel',exact:true}).click();
    assert.equal(await panel.isVisible(),false);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  } finally { await page.close(); }
});
test('The low-level panel stacks and releases its space on narrow screens',async()=>{
  const page=await open('',390);
  try {
    const panel=page.getByRole('complementary',{name:'Settings'});
    const main=await page.locator('[data-slot="app-shell-main"]').boundingBox();
    assert((await panel.boundingBox()).y>=main.y+main.height);
    assert((await panel.boundingBox()).height<=450);
    await page.getByRole('button',{name:'Close panel',exact:true}).click();
    assert.equal(await panel.isVisible(),false);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  } finally { await page.close(); }
});
