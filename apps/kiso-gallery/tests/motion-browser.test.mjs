import assert from 'node:assert/strict';
import { before, after } from 'node:test';
import { test } from './shard.mjs';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let server, browser, baseUrl, url;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 } });
  baseUrl = `http://127.0.0.1:${server.httpServer.address().port}/`;
  url = `${baseUrl}#components`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});
async function open(mode = 'animate', saved = null, hash = '#components') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(({ mode, saved }) => {
    if (saved && window === window.top) localStorage.setItem('kiso-gallery-appearance', JSON.stringify(saved));
    window.railAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = mode === 'unsupported' ? undefined : function(...args) {
      const rail = this.matches('.catalog-sidebar, .gallery-settings-panel');
      if (rail && mode === 'reduce') throw Error('Reduced motion must update without a transition');
      const animation = animate.apply(this, args);
      if (rail) window.railAnimations.push(animation);
      return animation;
    };
  }, { mode, saved });
  await page.goto(`${baseUrl}${hash}`);
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
    await page.locator('[data-pane-id="textarea"]').scrollIntoViewIfNeeded();
    await notes.fill('Keep this draft');
    const selector = '.component-gallery .catalog-sidebar-toggle';
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
    assert.equal(await notes.inputValue(), 'Keep this draft');
    await page.evaluate(() => { location.hash = '#components/table'; });
    const options = page.locator('#gallery-settings');
    await options.waitFor();
    await options.getByRole('button', { name: 'Close options', exact: true }).click();
    await options.waitFor({ state: 'hidden' });
    await settled(page);
    await page.locator('a[href="#gallery-settings"]').click();
    await options.waitFor();
    await settled(page);
    const animations = await page.evaluate(() => window.railAnimations.map(animation => ({ name: animation.id, duration: animation.effect.getTiming().duration })));
    for (const name of ['gallery-settings-in', 'gallery-settings-out', 'gallery-navigation-in', 'gallery-navigation-out']) {
      assert(animations.some(animation => animation.name === name && animation.duration > 0 && animation.duration <= 250), `${name} runs as a short transition`);
    }
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('The header and catalog accept pointer input during rail animations', async () => {
  const page = await open();
  try {
    for (const selector of ['.component-gallery .catalog-sidebar-toggle']) {
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
        for (const target of ['.component-gallery .catalog-sidebar-toggle', '.catalog-open']) {
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
    await page.evaluate(() => { location.hash = '#components/table'; });
    await page.locator('#gallery-settings').waitFor();
    await page.locator('a[href="#gallery-settings"]').click();
    await page.keyboard.press('Escape');
    await page.locator('#gallery-settings').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('href') === '#gallery-settings');
    await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
    await page.locator("#component-navigation[data-collapsed='true']").waitFor();
    await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
    await page.locator('#component-navigation:not([data-collapsed])').waitFor();
    assert.equal(await page.evaluate(() => window.railAnimations.length), 0);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('Sidebar collapse and expand preserve geometry, corners, and icon positions mid-animation', async () => {
  const presets = [
    {
      name: 'snes-floating',
      hash: '#example',
      pixel: false,
      saved: { theme: 'light', accent: 'snes', headerVariant: 'floating', appShell: 'inset', backgroundStyle: 'glow', panelFill: 'glass', cornerStyle: 'rounded', cornerSize: 'large' },
    },
    {
      name: 'default',
      hash: '#components',
      pixel: false,
      saved: { theme: 'light', accent: 'violet', headerVariant: 'default', appShell: 'default', backgroundStyle: 'solid', panelFill: 'solid', cornerStyle: 'rounded' },
    },
    {
      name: 'floating-pixel',
      hash: '#example',
      pixel: true,
      saved: { theme: 'light', accent: 'snes', headerVariant: 'floating', appShell: 'inset', backgroundStyle: 'solid', panelFill: 'solid', cornerStyle: 'pixel', borderStyle: 'solid', frameScope: 'all' },
    },
  ];
  const measure = page => page.evaluate(() => {
    const sidebar = document.querySelector('.component-gallery > .catalog-sidebar');
    const header = sidebar.querySelector(':scope > .catalog-sidebar-header');
    const toggle = sidebar.querySelector('.catalog-sidebar-toggle');
    const sidebarStyle = getComputedStyle(sidebar);
    const headerStyle = getComputedStyle(header);
    const toggleBox = toggle.getBoundingClientRect();
    const icons = [...sidebar.querySelectorAll('.nav-item .sidebar-link-icon')].map(el => {
      const rect = (el.querySelector('svg') || el).getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
    return {
      width: sidebar.getBoundingClientRect().width,
      borderRadius: sidebarStyle.borderRadius,
      clipPath: sidebarStyle.clipPath,
      headerHeight: header.getBoundingClientRect().height,
      headerBorderBottom: headerStyle.borderBottomWidth,
      toggleClickable: toggle.contains(document.elementFromPoint(toggleBox.right - 4, toggleBox.top + toggleBox.height / 2)),
      bodyClones: document.querySelectorAll('body > .catalog-sidebar').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      icons,
    };
  });

  for (const preset of presets) {
    const page = await open('animate', preset.saved, preset.hash);
    try {
      await page.locator('.component-gallery > .catalog-sidebar .sidebar-link-icon').first().waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const baseline = await measure(page);
      assert(baseline.icons.length > 0, `${preset.name}: renders navigation icons`);
      if (preset.name === 'snes-floating') assert.notEqual(baseline.borderRadius, '0px', `${preset.name}: floating sidebar has rounded corners`);

      for (const phase of ['collapse', 'expand']) {
        const runningCount = await page.evaluate(() => {
          document.querySelector('.component-gallery .catalog-sidebar-toggle').click();
          const running = window.railAnimations.filter(a => a.playState === 'running');
          for (const a of running) a.pause();
          return running.length;
        });
        assert(runningCount >= 1, `${preset.name}/${phase}: runs a sidebar animation`);
        for (const t of [30, 80, 140]) {
          await page.evaluate(ms => {
            for (const a of window.railAnimations) if (a.playState === 'paused') a.currentTime = ms;
          }, t);
          const snap = await measure(page);
          assert.equal(snap.bodyClones, 0, `${preset.name}/${phase}@${t}ms: must not append a style-stripped clone to body`);
          assert.equal(snap.borderRadius, baseline.borderRadius, `${preset.name}/${phase}@${t}ms: border-radius stays constant`);
          assert(Math.abs(snap.headerHeight - baseline.headerHeight) <= 0.5, `${preset.name}/${phase}@${t}ms: header height stays constant`);
          assert.equal(snap.headerBorderBottom, baseline.headerBorderBottom, `${preset.name}/${phase}@${t}ms: header divider stays constant`);
          if (preset.pixel) assert(snap.clipPath.startsWith('polygon('), `${preset.name}/${phase}@${t}ms: pixel corner polygon stays intact`);
          else assert(!snap.clipPath.startsWith('polygon('), `${preset.name}/${phase}@${t}ms: no L-shaped polygon notch`);
          assert(snap.toggleClickable, `${preset.name}/${phase}@${t}ms: toggle stays clickable`);
          assert(snap.overflow <= 0, `${preset.name}/${phase}@${t}ms: no horizontal overflow`);
          for (let i = 0; i < baseline.icons.length; i++) {
            const dx = Math.abs(snap.icons[i].x - baseline.icons[i].x);
            const dy = Math.abs(snap.icons[i].y - baseline.icons[i].y);
            assert(dx <= 0.5 && dy <= 0.5, `${preset.name}/${phase}@${t}ms icon ${i} shifted (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
          }
        }
        await page.evaluate(() => {
          for (const a of window.railAnimations) if (a.playState === 'paused') a.play();
        });
        await settled(page);
        const finalSnap = await measure(page);
        for (let i = 0; i < baseline.icons.length; i++) {
          const dx = Math.abs(finalSnap.icons[i].x - baseline.icons[i].x);
          const dy = Math.abs(finalSnap.icons[i].y - baseline.icons[i].y);
          assert(dx <= 0.5 && dy <= 0.5, `${preset.name}/${phase}@settled icon ${i} shifted (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
        }
      }

      await page.evaluate(() => {
        document.querySelector('.component-gallery .catalog-sidebar-toggle').click();
        for (const a of window.railAnimations) if (a.playState === 'running') { a.pause(); a.currentTime = 140; }
      });
      const interruptedWidth = (await measure(page)).width;
      await page.evaluate(() => {
        document.querySelector('.component-gallery .catalog-sidebar-toggle').click();
        for (const a of window.railAnimations) if (a.playState === 'running') { a.pause(); a.currentTime = 1; }
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      const reversedState = await page.evaluate(() => {
        const sidebar = document.querySelector('.component-gallery > .catalog-sidebar');
        const label = sidebar.querySelector('.sidebar-link-with-icon .sidebar-link-label');
        return {
          motion: sidebar.dataset.panelMotion,
          expandedWidth: sidebar.style.getPropertyValue('--catalog-sidebar-expanded-body-width'),
          labelOpacity: parseFloat(getComputedStyle(label).opacity),
        };
      });
      assert.equal(reversedState.motion, 'expanding', `${preset.name}: cancelled cleanup must not clear replacement data-panel-motion`);
      assert(parseFloat(reversedState.expandedWidth) > 0, `${preset.name}: cancelled cleanup must not clear replacement width var`);
      assert(reversedState.labelOpacity < 0.2, `${preset.name}: reversed expand starts from faded label opacity (${reversedState.labelOpacity})`);
      await page.evaluate(() => {
        for (const a of window.railAnimations) if (a.playState === 'paused') a.currentTime = 80;
      });
      const reversed = await measure(page);
      assert(reversed.width >= interruptedWidth - 1, `${preset.name}: interrupted collapse reverses smoothly from live width`);
      assert.equal(reversed.bodyClones, 0);
      await page.evaluate(() => {
        for (const a of window.railAnimations) if (a.playState === 'paused') a.play();
      });
      await settled(page);
      assert.equal(await page.locator('.component-gallery .catalog-sidebar-toggle').getAttribute('aria-expanded'), 'true');
    } finally { await page.close(); }
  }
});

test('Floating settings panel keeps its rounded and pixel surfaces while opening and closing', async () => {
  const cases = [
    {
      name: 'snes-rounded',
      pixel: false,
      saved: { theme: 'light', accent: 'snes', headerVariant: 'floating', appShell: 'inset', backgroundStyle: 'glow', panelFill: 'glass', cornerStyle: 'rounded', cornerSize: 'large' },
    },
    {
      name: 'floating-pixel',
      pixel: true,
      saved: { theme: 'light', accent: 'snes', headerVariant: 'floating', appShell: 'inset', backgroundStyle: 'solid', panelFill: 'solid', cornerStyle: 'pixel', borderStyle: 'solid', frameScope: 'all' },
    },
  ];
  for (const preset of cases) {
    const page = await open('animate', preset.saved, '#components/table');
    try {
      const panel = page.locator('#gallery-settings');
      await panel.waitFor();
      const before = await panel.evaluate(el => {
        const style = getComputedStyle(el);
        const pseudo = getComputedStyle(el, '::before');
        return {
          borderRadius: style.borderRadius,
          borderTopWidth: style.borderTopWidth,
          clipPath: style.clipPath,
          pseudoContent: pseudo.content,
          pseudoClip: pseudo.clipPath,
        };
      });
      if (preset.pixel) {
        assert(before.clipPath.startsWith('polygon('), `${preset.name}: open panel has pixel polygon`);
        assert.notEqual(before.pseudoContent, 'none', `${preset.name}: open panel has pixel border pseudo-element`);
      } else {
        assert.notEqual(before.borderRadius, '0px', `${preset.name}: open panel has rounded corners`);
      }

      await page.evaluate(() => {
        document.querySelector('#gallery-settings button[aria-label="Close options"]').click();
        for (const a of window.railAnimations) if (a.playState === 'running') { a.pause(); a.currentTime = 80; }
      });
      const clone = await page.evaluate(() => {
        const el = document.querySelector('body > .gallery-settings-panel[inert]');
        if (!el) return null;
        const style = getComputedStyle(el);
        const pseudo = getComputedStyle(el, '::before');
        return {
          borderRadius: style.borderRadius,
          borderTopWidth: style.borderTopWidth,
          clipPath: style.clipPath,
          pseudoContent: pseudo.content,
          pseudoClip: pseudo.clipPath,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert(clone, `${preset.name}: closing snapshot exists during gallery-settings-out`);
      assert.equal(clone.borderRadius, before.borderRadius, `${preset.name}: closing snapshot preserves border-radius`);
      assert.equal(clone.borderTopWidth, before.borderTopWidth, `${preset.name}: closing snapshot preserves border`);
      assert(clone.overflow <= 0, `${preset.name}: closing snapshot causes no horizontal overflow`);
      if (preset.pixel) {
        assert(clone.clipPath.startsWith('polygon('), `${preset.name}: closing snapshot preserves pixel polygon`);
        assert.notEqual(clone.pseudoContent, 'none', `${preset.name}: closing snapshot preserves pixel border pseudo-element`);
        assert(clone.pseudoClip.startsWith('polygon('), `${preset.name}: closing snapshot preserves pixel border clip`);
      }
      await page.evaluate(() => {
        for (const a of window.railAnimations) if (a.playState === 'paused') a.play();
      });
      await settled(page);
      assert.equal(await page.locator('body > [inert]').count(), 0);

      await page.evaluate(() => {
        document.querySelector('a[href="#gallery-settings"]').click();
        for (const a of window.railAnimations) if (a.playState === 'running') { a.pause(); a.currentTime = 80; }
      });
      const opening = await panel.evaluate(el => {
        const style = getComputedStyle(el);
        const pseudo = getComputedStyle(el, '::before');
        return {
          borderRadius: style.borderRadius,
          clipPath: style.clipPath,
          pseudoContent: pseudo.content,
          pseudoClip: pseudo.clipPath,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.equal(opening.borderRadius, before.borderRadius, `${preset.name}: opening panel preserves border-radius`);
      assert(opening.overflow <= 0, `${preset.name}: opening panel causes no horizontal overflow`);
      if (preset.pixel) {
        assert(opening.clipPath.startsWith('polygon('), `${preset.name}: opening panel preserves pixel polygon`);
        assert.notEqual(opening.pseudoContent, 'none', `${preset.name}: opening panel preserves pixel border pseudo-element`);
        assert(opening.pseudoClip.startsWith('polygon('), `${preset.name}: opening panel preserves pixel border clip`);
      }
      await page.evaluate(() => {
        for (const a of window.railAnimations) if (a.playState === 'paused') a.play();
      });
      await settled(page);
    } finally { await page.close(); }
  }
});
