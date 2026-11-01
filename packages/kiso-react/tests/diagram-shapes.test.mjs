import assert from 'node:assert/strict';
import test from 'node:test';
import { draw, route } from '../dist/diagram-routes.js';

const box = (id, left, top, width, height) => ({ id, left, top, right: left + width, bottom: top + height, width, height, x: left + width / 2, y: top + height / 2 });
const measure = (text) => ({ width: text.length * 7, height: 12 });

// A cluster on a grid: two trunks that split at dots, frames to cross.
function cluster(flow) {
  const nodes = [box('db1', 40, 40, 180, 120), box('db2', 300, 40, 180, 120), box('db3', 600, 40, 180, 120), box('bk', 150, 260, 220, 140), box('s3', 170, 500, 200, 140), box('nuv', 600, 500, 200, 140)];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edge = (from, to, extra = {}) => ({ key: `${from}->${to}#${extra.series}`, from: [from], to, ...extra });
  const edges = [
    edge('db1', 'db2', { series: 1, flow: true, label: 'Lag: 0 B' }), edge('db2', 'db3', { series: 2, label: 'Lag: 12 MB' }),
    edge('db1', 'bk', { series: 3 }), edge('db1', 's3', { series: 3, label: 'WAL' }),
    edge('db2', 'bk', { series: 4 }), edge('db2', 's3', { series: 4, label: 'backups' }),
    edge('s3', 'nuv', { series: 3, label: 'WAL restore' }),
  ];
  const frames = [{ ...box('f0', 20, 20, 480, 160), radius: 0 }, { ...box('f1', 10, 10, 800, 420), radius: 0 }, { ...box('f2', 10, 470, 800, 200), radius: 4 }];
  const measured = edges.map((item) => ({ edge: item, target: byId.get(item.to), sources: item.from.map((id) => byId.get(id)) }));
  return { routes: route(measured, nodes, flow, frames), frames, boxes: byId };
}

// The knots of a path: every point it passes through.
const knots = (d) => [...d.matchAll(/(?:[ML]|C(?: -?[\d.]+){4}) (-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const near = (d, [x, y]) => Math.min(...knots(d).map(([a, b]) => Math.hypot(a - x, b - y)));

test('the default draws what it drew before edge shapes', () => {
  const { routes, frames } = cluster('grid');
  const before = [
    'M 130 202 L 130 202 Q 130 210 138 210 L 215.33333333333331 210 Q 223.33333333333331 210 223.33333333333331 218 L 223.33333333333331 260',
    'M 130 160 L 130 175 A 5 5 0 0 1 130 185 L 130 425 A 5 5 0 0 1 130 435 L 130 465 A 5 5 0 0 1 130 475 L 130 562 Q 130 570 138 570 L 170 570',
    'M 394 202 L 394 202 Q 394 210 386 210 L 304.66666666666663 210 Q 296.66666666666663 210 296.66666666666663 218 L 296.66666666666663 260',
    'M 394 160 L 394 175 A 5 5 0 0 1 394 185 L 394 425 A 5 5 0 0 1 394 435 L 394 465 A 5 5 0 0 1 394 475 L 394 562 Q 394 570 386 570 L 370 570',
    'M 220 100 L 300 100',
    'M 480 100 L 495 100 A 5 5 0 0 1 505 100 L 600 100',
    'M 370 558 L 600 558',
  ];
  assert.deepEqual(draw(routes, frames, 'hop', 'auto', measure).paths.map((path) => path.d), before);
  assert.deepEqual(draw(routes, frames, 'hop', 'auto', measure, { shape: 'orthogonal' }), draw(routes, frames, 'hop', 'auto', measure));
  assert.ok(draw(routes, frames, 'none', 'auto', measure).paths.every((path) => path.head === 'triangle'));
});

test('every shape keeps each junction dot on the lines that pass it', () => {
  for (const flow of ['grid', 'down', 'right']) {
    const { routes, frames, boxes } = cluster(flow);
    for (const shape of ['curve', 'straight', 'sketch']) {
      const drawn = draw(routes, frames, 'none', 'auto', measure, { shape, boxes });
      for (const dot of drawn.dots) {
        const passing = routes.filter((item) => item.points.some((p, k) => {
          const q = item.points[k + 1];
          return q && Math.min(p[0], q[0]) - 0.5 <= dot.x && dot.x <= Math.max(p[0], q[0]) + 0.5 && Math.min(p[1], q[1]) - 0.5 <= dot.y && dot.y <= Math.max(p[1], q[1]) + 0.5;
        }));
        assert.ok(passing.length >= 2, `${flow}: a dot joins two routes`);
        for (const item of passing) {
          const path = drawn.paths.find((p) => p.key === item.key);
          assert.ok(near(path.d, [dot.x, dot.y]) < 1, `${flow} ${shape}: ${item.key} passes its dot`);
        }
      }
    }
  }
});

test('a sketch is the same on every render, and stems of unequal length match', () => {
  const long = { key: 'a', points: [[0, 0], [0, 300], [120, 300]], arrow: true, look: { series: 1 } };
  const short = { key: 'b', points: [[0, 0], [0, 140], [60, 140]], arrow: true, look: { series: 1 } };
  const one = draw([long, short], [], 'none', 'auto', measure, { shape: 'sketch' });
  assert.deepEqual(one, draw([long, short], [], 'none', 'auto', measure, { shape: 'sketch' }));
  assert.equal(one.paths[0].head, 'sketch');
  const stem = (d) => knots(d).filter(([, y]) => y < 110).map((p) => p.join(' '));
  assert.ok(stem(one.paths[0].d).length > 5);
  assert.deepEqual(stem(one.paths[0].d), stem(one.paths[1].d));
  assert.ok(stem(one.paths[0].d).some((p) => Number(p.split(' ')[0]) !== 0), 'the stem wobbles');
});

test('tails that share a stem and cross get a gap', () => {
  const a = { key: 'a', points: [[100, 0], [100, 100], [300, 100], [300, 300]], arrow: true, look: { series: 1 } };
  const b = { key: 'b', points: [[100, 40], [100, 60], [20, 60], [20, 200], [400, 200]], arrow: true, look: { series: 1 }, dot: [100, 40] };
  for (const shape of ['curve', 'straight']) {
    const drawn = draw([a, b], [], 'hop', 'auto', measure, { shape });
    assert.ok(!drawn.paths[0].knock, `${shape}: the earlier edge has no knockout`);
    assert.ok(drawn.paths[1].knock, `${shape}: the later edge breaks the earlier one`);
  }
});

test('a curve ends with a straight run into its port', () => {
  const { routes, frames } = cluster('grid');
  const drawn = draw(routes, frames, 'none', 'auto', measure, { shape: 'curve' });
  for (const [index, path] of drawn.paths.entries()) {
    const curve = path.d.match(/C (?:-?[\d.]+ ){4}(-?[\d.]+) (-?[\d.]+) L (-?[\d.]+) (-?[\d.]+)$/);
    if (!curve) continue;
    const [fx, fy, ex, ey] = curve.slice(1).map(Number);
    const points = routes[index].points;
    const [px, py] = points[points.length - 2];
    const along = Math.hypot(ex - px, ey - py);
    assert.ok(Math.abs(Math.hypot(ex - fx, ey - fy) - 12) < 0.01, 'the run is 12px');
    assert.ok(Math.abs((ex - fx) * (ey - py) - (ey - fy) * (ex - px)) / along < 0.01, 'along the last run');
  }
});
