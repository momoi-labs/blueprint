import assert from 'node:assert/strict';
import test from 'node:test';
import { route } from '../dist/diagram-routes.js';

const box = (id, left, top, width = 160, height = 100) => ({
  id, left, top, width, height, right: left + width, bottom: top + height, x: left + width / 2, y: top + height / 2,
});
const edge = (from, to, more = {}) => ({ key: `${from}->${to}`, from: [from], to, series: 3, flow: true, ...more });
const measure = (edges, nodes) => edges.map((item) => ({
  edge: item, target: nodes.find((node) => node.id === item.to), sources: item.from.map((id) => nodes.find((node) => node.id === id)),
}));
const runsThrough = ([ax, ay], [bx, by], node) => Math.max(ax, bx) > node.left + 1 && Math.min(ax, bx) < node.right - 1
  && Math.max(ay, by) > node.top + 1 && Math.min(ay, by) < node.bottom - 1;
const quiet = (fn) => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(message);
  try { return { result: fn(), warnings }; } finally { console.warn = original; }
};

// pg-yard: a cluster of three side by side, and the backup server under it.
// The primary archives WAL down to the backup; a replica restores it back up.
const db2 = box('db2', 0, 0);
const db1 = box('db1', 200, 0);
const db3 = box('db3', 400, 0);
const cluster = box('frame:1', -24, -24, 608, 148);

test('a grid edge to a node above draws from the source up into the target bottom', () => {
  for (const [name, backup] of [['beside, a drop', box('backup', 200, 220)], ['under, a down', box('backup', 380, 220)]]) {
    const nodes = [db2, db1, db3, backup];
    const edges = [edge('db1', 'backup'), edge('db2', 'backup', { series: 4 }), edge('backup', 'db3', { label: 'Lag: 48 MB' })];
    const { result: routes, warnings } = quiet(() => route(measure(edges, nodes), nodes, 'grid', [cluster]));
    assert.deepEqual(warnings, [], name);
    const up = routes.find((item) => item.key === 'backup->db3:backup');
    assert.ok(up, `${name}: the edge up is drawn`);
    const first = up.points[0];
    const last = up.points[up.points.length - 1];
    const before = up.points[up.points.length - 2];
    assert.deepEqual(up.ends, ['backup', 'db3']);
    assert.equal(last[1], db3.bottom, `${name}: ends on the target bottom`);
    assert.ok(before[1] > last[1] && before[0] === last[0], `${name}: comes in from below`);
    assert.ok(first[1] === backup.top || first[0] === backup.left || first[0] === backup.right, `${name}: leaves the top or a side`);
    assert.equal(up.look.series, 3);
    assert.equal(up.look.flow, true);
    assert.equal(up.label.text, 'Lag: 48 MB');
    const p = up.points[up.label.run];
    const q = up.points[up.label.run + 1];
    assert.equal(p[0], q[0], `${name}: the label sits on a vertical run`);
    for (let j = 0; j < up.points.length - 1; j++) {
      for (const node of nodes) if (node.id !== 'backup' && node.id !== 'db3') assert.ok(!runsThrough(up.points[j], up.points[j + 1], node), `${name}: no run through ${node.id}`);
    }
  }
});

test('an edge up leaves the routes down unchanged', () => {
  const backup = box('backup', 200, 220);
  const nodes = [db2, db1, db3, backup];
  const down = [edge('db1', 'backup'), edge('db2', 'backup', { series: 4 })];
  const before = quiet(() => route(measure(down, nodes), nodes, 'grid', [cluster])).result;
  const after = quiet(() => route(measure([...down, edge('backup', 'db3')], nodes), nodes, 'grid', [cluster])).result;
  // The edge up takes a slot on the backup's side, so only entries there may move.
  for (const item of before) {
    const same = after.find((other) => other.key === item.key);
    assert.deepEqual(same.points.slice(0, -1).map(([x]) => x), item.points.slice(0, -1).map(([x]) => x), item.key);
  }
});

test('a top to bottom edge to a row above is drawn', () => {
  const a = box('a', 0, 0);
  const b = box('b', 0, 200);
  const { result: routes, warnings } = quiet(() => route(measure([edge('a', 'b'), edge('b', 'a')], [a, b]), [a, b], 'down'));
  assert.deepEqual(warnings, []);
  const up = routes.find((item) => item.key === 'b->a:b');
  assert.equal(up.points[0][1], b.top);
  assert.equal(up.points[up.points.length - 1][1], a.bottom);
});

test('left to right, an edge to a column on the left comes into the target right side', () => {
  const a = box('a', 0, 0);
  const b = box('b', 300, 0);
  const { result: routes, warnings } = quiet(() => route(measure([edge('b', 'a')], [a, b]), [a, b], 'right'));
  assert.deepEqual(warnings, []);
  const up = routes[0];
  assert.equal(up.points[0][0], b.left);
  assert.equal(up.points[up.points.length - 1][0], a.right);
});
