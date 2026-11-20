import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsoleShell } from '../dist/index.js';

const render = extra => renderToStaticMarkup(createElement(ConsoleShell, {
  brand: 'Console',
  brandMark: 'C',
  navigation: [{ destinations: [{ href: '#', label: 'Clusters', active: true }] }],
  breadcrumb: [{ label: 'Clusters' }],
  account: { identity: 'alex@example.com', theme: 'system', onThemeChange: () => {}, onSignOut: () => {} },
  ...extra,
}, 'Body'));

test('ConsoleShell renders status in the top bar before the account trigger', () => {
  const html = render({ status: createElement('span', null, 'Healthy') });
  const status = html.indexOf('class="app-shell-status"');
  const account = html.indexOf('aria-label="Account"');
  assert.ok(status > -1, 'status slot is missing');
  assert.ok(account > status, 'status is not before the account trigger');
  assert.match(html.slice(status, account), /Healthy/);
});

test('ConsoleShell renders no status slot without status', () => {
  assert.doesNotMatch(render({}), /app-shell-status/);
  assert.doesNotMatch(render({ status: false }), /app-shell-status/);
});

test('ConsoleShell renders a zero status', () => {
  assert.match(render({ status: 0 }), /class="app-shell-status">0</);
});

test('ConsoleShell renders its destinations in a bottom navigation', () => {
  const html = render({});
  assert.match(html, /data-phone-navigation="bottom"/);
  assert.match(html, /<nav[^>]*class="bottom-nav"[^>]*aria-label="Primary"/);
  assert.match(html.slice(html.indexOf('class="bottom-nav"')), /aria-current="page" class="bottom-nav-link"[^>]*><span>Clusters</);
});
