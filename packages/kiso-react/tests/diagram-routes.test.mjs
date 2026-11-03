import assert from 'node:assert/strict';
import test from 'node:test';
import { draw, route } from '../dist/diagram-routes.js';

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

const anchors = (node) => [[node.x, node.top], [node.right, node.y], [node.x, node.bottom], [node.left, node.y]];
const onAnchor = (point, node) => anchors(node).some(([x, y]) => x === point[0] && y === point[1]);
const bends = (points) => points.length - 2;
const clearOf = (points, boxes, ends) => {
  for (let j = 0; j < points.length - 1; j++) {
    for (const item of boxes) if (!ends.includes(item.id)) assert.ok(!runsThrough(points[j], points[j + 1], item), `no run through ${item.id}`);
  }
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
  // a leaves by its bottom and b comes in by its top, so the edge back takes
  // other anchors: an anchor is either in or out.
  assert.ok(onAnchor(up.points[0], b) && onAnchor(up.points[up.points.length - 1], a));
  assert.notDeepEqual(up.points[0], [b.x, b.top]);
  assert.notDeepEqual(up.points[up.points.length - 1], [a.x, a.bottom]);
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

test('an edge takes the anchors with the shortest clear path', () => {
  const a = box('a', 0, 0);
  const beside = box('beside', 260, 0);
  const below = box('below', 0, 220);
  const nodes = [a, beside, below];
  const edges = [edge('a', 'beside'), edge('a', 'below', { series: 1 })];
  const { result: routes, warnings } = quiet(() => route(measure(edges, nodes), nodes, 'grid'));
  assert.deepEqual(warnings, []);
  const of = (to) => routes.find((item) => item.ends[1] === to).points;
  assert.deepEqual(of('beside'), [[a.right, a.y], [beside.left, beside.y]], 'side by side: straight across, centre to centre');
  assert.deepEqual(of('below'), [[a.x, a.bottom], [below.x, below.top]], 'one under the other: straight down');
  const corner = box('corner', 300, 260);
  const elbow = quiet(() => route(measure([edge('a', 'corner')], [a, corner]), [a, corner], 'grid')).result[0].points;
  assert.equal(bends(elbow), 1, 'diagonal: one turn');
  assert.ok(onAnchor(elbow[0], a) && onAnchor(elbow[elbow.length - 1], corner), 'both ends sit on anchors');
});

test('fromSide and toSide force the anchors', () => {
  const a = box('a', 0, 0);
  const b = box('b', 300, 0);
  const nodes = [a, b];
  const { result: routes } = quiet(() => route(measure([edge('a', 'b', { fromSide: 'bottom', toSide: 'bottom' })], nodes), nodes, 'grid'));
  const points = routes[0].points;
  assert.deepEqual(points[0], [a.x, a.bottom]);
  assert.deepEqual(points[points.length - 1], [b.x, b.bottom]);
  assert.ok(points[points.length - 2][1] > b.bottom, 'comes up into the bottom');
  const forced = quiet(() => route(measure([edge('a', 'b', { route: 'drop', toSide: 'top' })], nodes), nodes, 'grid')).result[0].points;
  assert.deepEqual(forced[0], [a.x, a.bottom], 'route still picks the side toSide leaves open');
  assert.deepEqual(forced[forced.length - 1], [b.x, b.top], 'toSide wins over route');
});

test('issue 285: an edge between two bands detours around the band between them', () => {
  // Three cluster bands in one column: main, pg18 and rr, a standby of main.
  const db1 = box('main-db1', 40, 40);
  const db2 = box('main-db2', 240, 40);
  const pg = [box('pg18-db1', 40, 260), box('pg18-db2', 240, 260), box('pg18-db3', 440, 260)];
  const rr = box('rr-db1', 40, 480);
  const frames = [box('frame:0', 16, 16, 408, 148), box('frame:1', 16, 236, 608, 148), box('frame:2', 16, 456, 208, 148)];
  const titles = [box('title:0', 28, 8, 120, 16), box('title:1', 28, 228, 120, 16), box('title:2', 28, 448, 120, 16)];
  const nodes = [db1, db2, ...pg, rr];
  const edges = [edge('main-db1', 'main-db2', { series: 1 }), edge('main-db1', 'rr-db1', { series: 2, label: 'Lag: 0 B' })];
  const { result: routes, warnings } = quiet(() => route(measure(edges, nodes), nodes, 'grid', frames, titles));
  assert.deepEqual(warnings, []);
  const standby = routes.find((item) => item.ends[1] === 'rr-db1').points;
  assert.ok(onAnchor(standby[0], db1) && onAnchor(standby[standby.length - 1], rr), 'both ends sit on anchors');
  clearOf(standby, [...nodes, ...titles, frames[1]], ['main-db1', 'rr-db1']);
  const drawn = draw(routes, [], 'none', 'auto', (text) => ({ width: text.length * 7, height: 12 }), { boxes: new Map(nodes.map((node) => [node.id, node])), blocks: titles });
  const label = drawn.labels[0];
  const rect = label.plate ?? { x: label.x - 30, y: label.y - 10, width: 60, height: 12 };
  for (const item of [...nodes, ...titles]) {
    const hit = rect.x < item.right && rect.x + rect.width > item.left && rect.y < item.bottom && rect.y + rect.height > item.top;
    assert.ok(!hit, `the label keeps off ${item.id}`);
  }
});

test('edges of one kind from one anchor share a trunk and part at a dot', () => {
  const a = box('a', 200, 0);
  const left = box('left', 0, 260);
  const right = box('right', 400, 260);
  const far = box('far', 400, 480);
  const nodes = [a, left, right, far];
  const edges = [edge('a', 'right', { series: 3 }), edge('a', 'far', { series: 3 }), edge('a', 'left', { series: 4 })];
  const { result: routes } = quiet(() => route(measure(edges, nodes), nodes, 'grid'));
  const of = (to) => routes.find((item) => item.ends[1] === to);
  const near = of('right');
  const long = of('far');
  assert.ok(near.dot, 'the nearer edge of the kind leaves at a dot');
  assert.deepEqual(near.points[0], near.dot, 'and starts there');
  assert.ok(long.points.some((p, k) => {
    const q = long.points[k + 1];
    return q && Math.min(p[0], q[0]) - 0.5 <= near.dot[0] && near.dot[0] <= Math.max(p[0], q[0]) + 0.5 && Math.min(p[1], q[1]) - 0.5 <= near.dot[1] && near.dot[1] <= Math.max(p[1], q[1]) + 0.5;
  }), 'the dot sits on the trunk');
  assert.ok(!of('left').dot, 'an edge of another kind gets no dot');
});

test('an anchor an edge comes into is not one an edge leaves by', () => {
  const a = box('a', 0, 0);
  const b = box('b', 260, 0);
  const c = box('c', 520, 0);
  const nodes = [a, b, c];
  const { result: routes } = quiet(() => route(measure([edge('a', 'b'), edge('b', 'c', { series: 1 }), edge('b', 'a', { series: 2 })], nodes), nodes, 'grid'));
  const into = routes.filter((item) => item.ends[1] === 'b').map((item) => item.points[item.points.length - 1].join());
  const out = routes.filter((item) => item.ends[0] === 'b').map((item) => item.points[0].join());
  for (const point of out) assert.ok(!into.includes(point), `b leaves by ${point}, which no edge comes into`);
});

test('a label that fits nowhere on its line still keeps off the cards', () => {
  for (const [height, text] of [[100, 'a very long edge label'], [1200, 'long label '.repeat(10).trim()]]) {
    const a = box('a', 0, 0, 160, height);
    const b = box('b', 200, 0, 160, height);
    const nodes = [a, b];
    const { result: routes } = quiet(() => route(measure([edge('a', 'b', { label: text })], nodes), nodes, 'grid'));
    const measureText = (text) => ({ width: text.length * 7, height: 12 });
    const drawn = draw(routes, [], 'none', 'auto', measureText, { boxes: new Map(nodes.map((node) => [node.id, node])) });
    const [label] = drawn.labels;
    assert.ok(label, 'the label is drawn');
    const width = Math.max(...label.lines.map((line) => measureText(line).width));
    const rect = label.plate ?? { x: label.x - width / 2, y: label.y - 9 - (label.lines.length - 1) * 14.4, width, height: 12 + (label.lines.length - 1) * 14.4 };
    for (const node of nodes) {
      assert.ok(!(rect.x < node.right && rect.x + rect.width > node.left && rect.y < node.bottom && rect.y + rect.height > node.top), `${height}px cards: the label keeps off ${node.id}`);
    }
  }
});

test('a straight edge keeps the side toSide sets', () => {
  const a = box('a', 0, 0);
  const b = box('b', 200, 500);
  const nodes = [a, b];
  const boxes = new Map(nodes.map((node) => [node.id, node]));
  const { result: routes } = quiet(() => route(measure([edge('a', 'b', { fromSide: 'right', toSide: 'left', shape: 'straight' })], nodes), nodes, 'grid'));
  const drawn = quiet(() => draw(routes, [], 'none', 'auto', (text) => ({ width: text.length * 7, height: 12 }), { boxes })).result;
  const end = drawn.paths[0].d.trim().split(/\s+/).slice(-2).map(Number);
  assert.deepEqual(end, [b.left, b.y], 'ends on the left anchor');
  const free = quiet(() => route(measure([edge('a', 'b', { shape: 'straight' })], nodes), nodes, 'grid')).result;
  const ends = quiet(() => draw(free, [], 'none', 'auto', (text) => ({ width: text.length * 7, height: 12 }), { boxes })).result.paths[0].d.trim().split(/\s+/).slice(-2).map(Number);
  assert.ok([[b.x, b.top], [b.left, b.y]].some(([x, y]) => x === ends[0] && y === ends[1]), 'without toSide it still ends on an anchor');
});
