/* Edge geometry for Diagram: routes as polylines, then crossings, paths and
   labels. Pure functions over measured boxes, so the component only measures
   and renders. */

export type DiagramEdgeLine = "solid" | "dashed" | "dotted"
export type DiagramEdgeTone = "neutral" | "success" | "danger"
export type DiagramEdgeRoute = "side" | "down" | "drop"
export type DiagramEdgeSide = "top" | "right" | "bottom" | "left"
export type DiagramCrossings = "none" | "hop" | "gap"
export type DiagramLabels = "auto" | "horizontal" | "vertical"
export type DiagramEdgeShape = "orthogonal" | "curve" | "straight" | "sketch"
export type DiagramArrow = "triangle" | "chevron" | "stealth" | "dot" | "sketch" | "none"

export type EdgeLook = { line?: DiagramEdgeLine; tone?: DiagramEdgeTone; series?: number; flow?: boolean; shape?: DiagramEdgeShape; head?: DiagramArrow }
export type EdgeSpec = EdgeLook & { key: string; from: string[]; to: string; label?: string; route?: DiagramEdgeRoute; fromSide?: DiagramEdgeSide; toSide?: DiagramEdgeSide }

export type Pt = [number, number]
export type Box = { id: string; left: number; right: number; top: number; bottom: number; width: number; height: number; x: number; y: number }
export type Frame = { left: number; right: number; top: number; bottom: number; radius: number }
export type Measured = { edge: EdgeSpec; target: Box; sources: Box[] }

type RouteLabel = {
  text: string
  /** The segment the label belongs to. */
  run: number
  /** Where along its run the label centres, 0 to 1. */
  along?: number
  /** Width a flat label may take before it stacks. */
  room?: number
  /** Distance from the run's start the label keeps clear of, past a split. */
  from?: number
}

/* `pinned` says the edge set `toSide`, so no shape moves its end. */
export type Route = { key: string; points: Pt[]; arrow: boolean; look: EdgeLook; ends?: [string, string]; label?: RouteLabel; dot?: Pt; pinned?: boolean }

export type Rect = { key: string; x: number; y: number; width: number; height: number }
export type Drawn = {
  /** `arrow` says whether the path gets a head, `head` which one. `knock`
      is drawn just before the path, in the card colour, to break the lines
      it crosses. */
  paths: (EdgeLook & { key: string; d: string; arrow: boolean; head: DiagramArrow; knock?: string })[]
  labels: { key: string; x: number; y: number; lines: string[]; anchor?: "start"; rotate?: boolean; middle?: boolean; plate?: Rect }[]
  plates: Rect[]
  dots: (EdgeLook & { key: string; x: number; y: number })[]
}

export const RADIUS = 8
/* A label beside a run sits this far from it. */
export const TRACK = 6
/* The half width of a hop, and of a gap in a crossed line. */
const HOP = 5
const GAP = 4
/* Room the arrowhead takes at the end of an edge. */
const ARROW = 10
/* A line runs this far past a crossing mark to its end, arrowhead
   included, so the arrow sits on a straight line; without the room, the
   mark is left out. A group's 24px entry room leaves enough for it. */
const SETTLE = 12

export const look = (edge: EdgeSpec): EdgeLook => ({ line: edge.line, tone: edge.tone, series: edge.series, flow: edge.flow, shape: edge.shape, head: edge.head })

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])
const towards = (a: Pt, b: Pt, d: number): Pt => {
  const n = dist(a, b) || 1
  return [a[0] + ((b[0] - a[0]) / n) * d, a[1] + ((b[1] - a[1]) / n) * d]
}
const isVertical = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.5

/* Drops repeated points and points in the middle of a straight line, so every
   inner point is a real turn. */
function clean(points: Pt[]) {
  const out: Pt[] = []
  for (const point of points) {
    if (out.length && dist(out[out.length - 1]!, point) < 0.5) continue
    if (out.length >= 2) {
      const a = out[out.length - 2]!
      const b = out[out.length - 1]!
      if ((isVertical(a, b) && isVertical(b, point)) || (Math.abs(a[1] - b[1]) < 0.5 && Math.abs(b[1] - point[1]) < 0.5)) out.pop()
    }
    out.push(point)
  }
  return out
}

/* The corner radius at each point: 8px, or less when a segment is short. A
   segment shared by two corners gives each half of its length. */
function radii(points: Pt[]) {
  const last = points.length - 1
  return points.map((point, j) => {
    if (j === 0 || j === last) return 0
    const before = dist(points[j - 1]!, point) * (j - 1 === 0 ? 1 : 0.5)
    const after = dist(point, points[j + 1]!) * (j + 1 === last ? 1 : 0.5)
    return Math.max(0, Math.min(RADIUS, before, after))
  })
}

/* ------------------------------------------------------------------------
   Routes. Every node has four anchors, one in the middle of each side. Each
   edge takes the pair of anchors with the cheapest orthogonal path between
   them: its length, plus a price for each turn, for running beside another
   edge and for crossing one. The path keeps clear of every card, every group
   title and every group that holds neither end, so when the straight way is
   blocked it detours through a gutter or around a frame.
   ------------------------------------------------------------------------ */

export type DiagramFlow = "right" | "down" | "grid"

/* How far a run keeps from a card it passes. */
const PAD = 10
/* Two runs side by side sit this far apart. */
const LANE = 12
/* The straight run out of a node, and the run into one: the run in holds the
   arrowhead and the turn before it. */
const OUT = 12
const IN = 20
/* The price of a turn, in pixels of length. */
const BEND = 40
/* Running within LANE of another edge costs this many times its length. */
const NEAR = 3
/* Running on an edge of the same kind and end costs half: they share it. */
const JOIN = 0.5
/* The price of crossing another edge. */
const CROSS = 16
/* The price of an anchor already taken the other way. */
const TAKEN = 400
/* How far a search looks past the box around its two nodes, before it
   tries the whole drawing. */
const REACH = 160

const SIDES: DiagramEdgeSide[] = ["top", "right", "bottom", "left"]
const NORMAL: Record<DiagramEdgeSide, Pt> = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] }
/* Directions a path moves in: right, down, left, up. */
const DIRS: Pt[] = [[1, 0], [0, 1], [-1, 0], [0, -1]]
const dirOf = (v: Pt) => DIRS.findIndex((d) => d[0] === v[0] && d[1] === v[1])
const SWAP: Record<DiagramEdgeSide, DiagramEdgeSide> = { top: "left", left: "top", bottom: "right", right: "bottom" }

export function anchorOf(box: Box, side: DiagramEdgeSide): Pt {
  if (side === "top") return [box.x, box.top]
  if (side === "bottom") return [box.x, box.bottom]
  return [side === "left" ? box.left : box.right, box.y]
}

const grow = (box: Box, by: number): Box => ({
  ...box, left: box.left - by, right: box.right + by, top: box.top - by, bottom: box.bottom + by,
  width: box.width + 2 * by, height: box.height + 2 * by,
})
const holds = (frame: Box, box: Box) => frame.left <= box.left + 1 && frame.right >= box.right - 1 && frame.top <= box.top + 1 && frame.bottom >= box.bottom - 1
const inside = (box: Box, [x, y]: Pt) => x > box.left + 0.01 && x < box.right - 0.01 && y > box.top + 0.01 && y < box.bottom - 0.01
/* Whether an axis-aligned segment passes through the inside of a box. */
const through = (a: Pt, b: Pt, box: Box) => Math.max(a[0], b[0]) > box.left + 0.01 && Math.min(a[0], b[0]) < box.right - 0.01
  && Math.max(a[1], b[1]) > box.top + 0.01 && Math.min(a[1], b[1]) < box.bottom - 0.01

/* `route` names a path relative to the flow; it becomes the sides it uses.
   Left to right the names hold with the axes swapped. */
function forced(edge: EdgeSpec, source: Box, target: Box, flow: DiagramFlow): [DiagramEdgeSide, DiagramEdgeSide] | null {
  if (!edge.route) return null
  const turned = flow === "right"
  const along = (box: Box) => turned ? box.x : box.y
  const across = (box: Box) => turned ? box.y : box.x
  const ahead = along(target) >= along(source)
  const toward: DiagramEdgeSide = across(target) >= across(source) ? "right" : "left"
  const away: DiagramEdgeSide = toward === "right" ? "left" : "right"
  const pair: [DiagramEdgeSide, DiagramEdgeSide] = edge.route === "side" ? [toward, away]
    : edge.route === "down" ? [ahead ? "bottom" : "top", ahead ? "top" : "bottom"]
    : [ahead ? "bottom" : "top", away]
  return turned ? [SWAP[pair[0]], SWAP[pair[1]]] : pair
}

type Pair = { edge: EdgeSpec; source: Box; target: Box; labelled: boolean; from: DiagramEdgeSide[]; to: DiagramEdgeSide[] }
/* A run already drawn, for the price of running beside or across it. */
type Run = { a: Pt; b: Pt; kind: string; source: string; target: string; border?: boolean }

/* The side of a box an anchor sits on. */
function sideAt(box: Box, [x, y]: Pt): DiagramEdgeSide | null {
  return SIDES.find((side) => {
    const a = anchorOf(box, side)
    return Math.abs(a[0] - x) < 0.5 && Math.abs(a[1] - y) < 0.5
  }) ?? null
}

const kindOf = (edge: EdgeSpec) => `${edge.series ?? ""}|${edge.line ?? ""}|${edge.tone ?? ""}|${edge.flow ?? ""}`

export function route(measured: Measured[], nodes: Box[], flow: DiagramFlow, frames: Box[] = [], titles: Box[] = []): Route[] {
  const pairs: Pair[] = []
  for (const { edge, target, sources } of measured) {
    sources.forEach((source, index) => {
      if (source.id === target.id) return
      const pick = forced(edge, source, target, flow)
      pairs.push({
        edge, source, target, labelled: index === 0,
        from: edge.fromSide ? [edge.fromSide] : pick ? [pick[0]] : SIDES,
        to: edge.toSide ? [edge.toSide] : pick ? [pick[1]] : SIDES,
      })
    })
  }
  // Short edges go first, so they keep the straight lines.
  const span = (pair: Pair) => Math.abs(pair.source.x - pair.target.x) + Math.abs(pair.source.y - pair.target.y)
  const order = pairs.map((_, index) => index).sort((a, b) => span(pairs[a]!) - span(pairs[b]!) || a - b)
  const forward: [DiagramEdgeSide, DiagramEdgeSide] = flow === "right" ? ["right", "left"] : ["bottom", "top"]
  // Group borders count as runs too, so no edge runs along one.
  const runs: Run[] = frames.flatMap((frame) => {
    const corners: Pt[] = [[frame.left, frame.top], [frame.right, frame.top], [frame.right, frame.bottom], [frame.left, frame.bottom]]
    return corners.map((a, k) => ({ a, b: corners[(k + 1) % 4]!, kind: "", source: "", target: "", border: true }))
  })
  // An anchor an edge comes into is not one an edge leaves by, and the
  // other way round, so an arrow never points at a line going out.
  const used = new Map<string, "in" | "out">()
  const found: Pt[][] = []
  for (const index of order) {
    const pair = pairs[index]!
    const points = search(pair, nodes, frames, titles, runs, forward, used)
    found[index] = points
    const kind = kindOf(pair.edge)
    for (let j = 0; j < points.length - 1; j++) runs.push({ a: points[j]!, b: points[j + 1]!, kind, source: pair.source.id, target: pair.target.id })
    const out = sideAt(pair.source, points[0]!)
    const into = sideAt(pair.target, points[points.length - 1]!)
    if (out) used.set(`${pair.source.id}:${out}`, "out")
    if (into) used.set(`${pair.target.id}:${into}`, "in")
  }
  const routes: Route[] = pairs.map((pair, index) => ({
    key: `${pair.edge.key}:${pair.source.id}`, points: found[index]!, arrow: true, look: look(pair.edge),
    ends: [pair.source.id, pair.target.id], ...(pair.edge.toSide ? { pinned: true } : {}),
  }))
  trunks(routes, pairs)
  pairs.forEach((pair, index) => {
    const item = routes[index]!
    if (!pair.labelled || !pair.edge.label) return
    const run = longest(item.points)
    const flat = item.points.length === 2 && !isVertical(item.points[0]!, item.points[1]!)
    item.label = { text: pair.edge.label, run, ...(flat ? { along: 0.5, room: dist(item.points[0]!, item.points[1]!) - ARROW } : {}) }
  })
  return routes
}

function longest(points: Pt[]) {
  let best = 0
  for (let j = 1; j < points.length - 1; j++) if (dist(points[j]!, points[j + 1]!) > dist(points[best]!, points[best + 1]!) + 0.5) best = j
  return best
}

/* Coordinates of a search grid, each one exact: no rounding, so no run
   slants. The anchors and their stubs stay as they are; any other
   coordinate closer than 3px to one already kept is left out. */
function axis(keys: number[], rest: number[]) {
  const kept = [...new Set(keys)]
  for (const value of rest) if (Number.isFinite(value) && kept.every((other) => Math.abs(other - value) >= 3)) kept.push(value)
  kept.sort((a, b) => a - b)
  const mids: number[] = []
  for (let k = 0; k < kept.length - 1; k++) if (kept[k + 1]! - kept[k]! >= 2 * LANE) mids.push((kept[k]! + kept[k + 1]!) / 2)
  return [...kept, ...mids].sort((a, b) => a - b)
}

function lowerBound(list: number[], value: number) {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (list[mid]! < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/* The cheapest path for one edge. It looks near the two nodes first, then
   across the whole drawing, then through the groups that hold neither end.
   With no clear path at all it takes an elbow and says so once. */
function search(pair: Pair, nodes: Box[], frames: Box[], titles: Box[], runs: Run[], forward: [DiagramEdgeSide, DiagramEdgeSide], used: Map<string, "in" | "out">): Pt[] {
  const { source, target } = pair
  const area = {
    left: Math.min(source.left, target.left) - REACH, right: Math.max(source.right, target.right) + REACH,
    top: Math.min(source.top, target.top) - REACH, bottom: Math.max(source.bottom, target.bottom) + REACH,
  }
  const walls = (strict: boolean) => [
    ...nodes.map((node) => grow(node, PAD)),
    ...titles.map((title) => grow(title, 4)),
    ...(strict ? frames.filter((frame) => !holds(frame, source) && !holds(frame, target)).map((frame) => grow(frame, 4)) : []),
  ]
  for (const [strict, near] of [[true, true], [true, false], [false, false]] as const) {
    for (const into of [IN, OUT]) {
      const points = cheapest(pair, walls(strict), runs, forward, used, near ? area : null, into)
      if (points) return points
    }
  }
  warn(`${pair.edge.key}:${source.id}`, `Diagram: the edge ${source.id} -> ${target.id} finds no clear path, so it runs through what is in the way. Move a node, or set fromSide and toSide on the edge.`)
  const a = anchorOf(source, forward[0])
  const b = anchorOf(target, forward[1])
  return clean([a, [a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2], b])
}

function cheapest(pair: Pair, walls: Box[], runs: Run[], forward: [DiagramEdgeSide, DiagramEdgeSide], used: Map<string, "in" | "out">, area: { left: number; right: number; top: number; bottom: number } | null, into: number): Pt[] | null {
  const { source, target } = pair
  const kind = kindOf(pair.edge)
  const own = [grow(source, PAD), grow(target, PAD)]
  const others = walls.filter((wall) => !own.some((item) => item.left === wall.left && item.top === wall.top && item.right === wall.right && item.bottom === wall.bottom))
  const clear = (a: Pt, b: Pt) => !others.some((wall) => through(a, b, wall))
  // A side along the flow costs a little less; an anchor taken the other
  // way costs as much as a long detour.
  const prefer = (box: Box, side: DiagramEdgeSide, best: DiagramEdgeSide, way: "in" | "out") => {
    const taken = used.get(`${box.id}:${side}`)
    return (side === best ? 0 : 2) + (taken && taken !== way ? TAKEN : 0)
  }
  const starts = pair.from.flatMap((side) => {
    const a = anchorOf(source, side)
    const n = NORMAL[side]
    const p: Pt = [a[0] + n[0] * OUT, a[1] + n[1] * OUT]
    return clear(a, p) && !inside(own[1]!, p) ? [{ side, a, p, dir: dirOf(n), cost: prefer(source, side, forward[0], "out") }] : []
  })
  const ends = pair.to.flatMap((side) => {
    const a = anchorOf(target, side)
    const n = NORMAL[side]
    const p: Pt = [a[0] + n[0] * into, a[1] + n[1] * into]
    return clear(p, a) && !inside(own[0]!, p) ? [{ side, a, p, dir: dirOf([-n[0], -n[1]] as Pt), cost: prefer(target, side, forward[1], "in") }] : []
  })

  // Two anchors that face each other on one line join straight.
  let direct: { cost: number; points: Pt[] } | null = null
  for (const start of pair.from) {
    for (const end of pair.to) {
      const a = anchorOf(source, start)
      const b = anchorOf(target, end)
      const n = NORMAL[start]
      const m = NORMAL[end]
      if (n[0] !== -m[0] || n[1] !== -m[1]) continue
      const ahead = (b[0] - a[0]) * n[0] + (b[1] - a[1]) * n[1]
      if (ahead < ARROW + 2 || Math.abs((b[0] - a[0]) * n[1] - (b[1] - a[1]) * n[0]) > 0.5) continue
      if (!clear(a, b)) continue
      const cost = ahead + prefer(source, start, forward[0], "out") + prefer(target, end, forward[1], "in") + crossings(a, b, runs)
      if (!direct || cost < direct.cost) direct = { cost, points: [a, b] }
    }
  }
  if (!starts.length || !ends.length) return direct?.points ?? null

  const inArea = (value: number, lo: number, hi: number) => value >= lo && value <= hi
  const pick = (values: number[], lo: number, hi: number) => area ? values.filter((value) => inArea(value, lo, hi)) : values
  const keyX = [...starts.flatMap((item) => [item.p[0], item.a[0]]), ...ends.flatMap((item) => [item.p[0], item.a[0]])]
  const keyY = [...starts.flatMap((item) => [item.p[1], item.a[1]]), ...ends.flatMap((item) => [item.p[1], item.a[1]])]
  const lanesX = runs.flatMap((run) => isVertical(run.a, run.b) ? [run.a[0], run.a[0] - LANE, run.a[0] + LANE] : [])
  const lanesY = runs.flatMap((run) => isVertical(run.a, run.b) ? [] : [run.a[1], run.a[1] - LANE, run.a[1] + LANE])
  const boundsX = walls.flatMap((wall) => [wall.left, wall.right])
  const boundsY = walls.flatMap((wall) => [wall.top, wall.bottom])
  const lo = area ?? { left: Math.min(...boundsX, ...keyX) - 2 * LANE, right: Math.max(...boundsX, ...keyX) + 2 * LANE, top: Math.min(...boundsY, ...keyY) - 2 * LANE, bottom: Math.max(...boundsY, ...keyY) + 2 * LANE }
  const xs = axis(keyX, [...pick(boundsX, lo.left, lo.right), ...pick(lanesX, lo.left, lo.right), lo.left, lo.right])
  const ys = axis(keyY, [...pick(boundsY, lo.top, lo.bottom), ...pick(lanesY, lo.top, lo.bottom), lo.top, lo.bottom])
  const nx = xs.length
  const ny = ys.length
  const at = (i: number, j: number) => j * nx + i

  // Runs between neighbouring grid points: blocked, beside another edge,
  // on one of its own kind, or across one.
  const blockH = new Uint8Array(nx * ny)
  const blockV = new Uint8Array(nx * ny)
  const nearH = new Uint8Array(nx * ny)
  const nearV = new Uint8Array(nx * ny)
  const joinH = new Uint8Array(nx * ny)
  const joinV = new Uint8Array(nx * ny)
  const crossH = new Float64Array(nx * ny)
  const crossV = new Float64Array(nx * ny)
  for (const wall of walls) {
    const i0 = Math.max(0, lowerBound(xs, wall.left) - 1)
    const i1 = lowerBound(xs, wall.right)
    const j0 = Math.max(0, lowerBound(ys, wall.top) - 1)
    const j1 = lowerBound(ys, wall.bottom)
    for (let j = j0; j <= j1 && j < ny; j++) {
      for (let i = i0; i <= i1 && i < nx; i++) {
        if (i + 1 < nx && through([xs[i]!, ys[j]!], [xs[i + 1]!, ys[j]!], wall)) blockH[at(i, j)] = 1
        if (j + 1 < ny && through([xs[i]!, ys[j]!], [xs[i]!, ys[j + 1]!], wall)) blockV[at(i, j)] = 1
      }
    }
  }
  for (const run of runs) {
    const friend = run.kind === kind && (run.source === source.id || run.target === target.id)
    const x0 = Math.min(run.a[0], run.b[0])
    const x1 = Math.max(run.a[0], run.b[0])
    const y0 = Math.min(run.a[1], run.b[1])
    const y1 = Math.max(run.a[1], run.b[1])
    if (isVertical(run.a, run.b)) {
      const x = run.a[0]
      for (let i = lowerBound(xs, x - LANE + 0.5); i < nx && xs[i]! < x + LANE - 0.5; i++) {
        const on = Math.abs(xs[i]! - x) < 0.5
        for (let j = lowerBound(ys, y0); j + 1 < ny && ys[j]! < y1 - 0.5; j++) {
          if (on && friend) joinV[at(i, j)] = 1
          else nearV[at(i, j)] = 1
        }
      }
      // Flat runs across this one.
      const i = lowerBound(xs, x) - 1
      if (!run.border && i >= 0 && i + 1 < nx) for (let j = lowerBound(ys, y0 + 0.5); j < ny && ys[j]! < y1 - 0.5; j++) crossH[at(i, j)] += CROSS
    } else {
      const y = run.a[1]
      for (let j = lowerBound(ys, y - LANE + 0.5); j < ny && ys[j]! < y + LANE - 0.5; j++) {
        const on = Math.abs(ys[j]! - y) < 0.5
        for (let i = lowerBound(xs, x0); i + 1 < nx && xs[i]! < x1 - 0.5; i++) {
          if (on && friend) joinH[at(i, j)] = 1
          else nearH[at(i, j)] = 1
        }
      }
      const j = lowerBound(ys, y) - 1
      if (!run.border && j >= 0 && j + 1 < ny) for (let i = lowerBound(xs, x0 + 0.5); i < nx && xs[i]! < x1 - 0.5; i++) crossV[at(i, j)] += CROSS
    }
  }

  // Dijkstra over grid points and the direction each was reached in. The
  // last state is the sink every end leads to.
  const count = nx * ny * 4
  const sink = count
  const cost = new Float64Array(count + 1).fill(Infinity)
  const prev = new Int32Array(count + 1).fill(-1)
  const heap = new Heap()
  const endAt = new Map<number, typeof ends>()
  const startAt = new Map<number, (typeof starts)[number]>()
  const indexOf = ([x, y]: Pt) => {
    const i = lowerBound(xs, x - 0.01)
    const j = lowerBound(ys, y - 0.01)
    return i < nx && j < ny && Math.abs(xs[i]! - x) < 0.01 && Math.abs(ys[j]! - y) < 0.01 ? at(i, j) : -1
  }
  for (const end of ends) {
    const k = indexOf(end.p)
    if (k >= 0) endAt.set(k, [...(endAt.get(k) ?? []), end])
  }
  for (const start of starts) {
    const k = indexOf(start.p)
    if (k < 0) continue
    const state = k * 4 + start.dir
    if (start.cost + OUT < cost[state]!) {
      cost[state] = start.cost + OUT
      startAt.set(state, start)
      heap.push(state, cost[state]!)
    }
  }
  const closing = new Map<number, (typeof ends)[number]>()
  while (heap.size) {
    const [state, value] = heap.pop()
    if (value > cost[state]!) continue
    if (state === sink) break
    const k = state >> 2
    const d = state & 3
    const i = k % nx
    const j = (k - i) / nx
    for (const end of endAt.get(k) ?? []) {
      if (d === (end.dir + 2) % 4) continue
      const total = value + (d === end.dir ? 0 : BEND) + into + end.cost
      if (total < cost[sink]!) {
        cost[sink] = total
        prev[sink] = state
        closing.set(state, end)
        heap.push(sink, total)
      }
    }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === (d + 2) % 4) continue
      let ni = i
      let nj = j
      let step = 0
      let extra = 0
      let near = 0
      let join = 0
      if (nd === 0) {
        if (i + 1 >= nx || blockH[k]) continue
        ni = i + 1
        step = xs[ni]! - xs[i]!
        extra = crossH[k]!
        near = nearH[k]!
        join = joinH[k]!
      } else if (nd === 2) {
        if (i === 0 || blockH[k - 1]) continue
        ni = i - 1
        step = xs[i]! - xs[ni]!
        extra = crossH[k - 1]!
        near = nearH[k - 1]!
        join = joinH[k - 1]!
      } else if (nd === 1) {
        if (j + 1 >= ny || blockV[k]) continue
        nj = j + 1
        step = ys[nj]! - ys[j]!
        extra = crossV[k]!
        near = nearV[k]!
        join = joinV[k]!
      } else {
        if (j === 0 || blockV[k - nx]) continue
        nj = j - 1
        step = ys[j]! - ys[nj]!
        extra = crossV[k - nx]!
        near = nearV[k - nx]!
        join = joinV[k - nx]!
      }
      const next = at(ni, nj) * 4 + nd
      const total = value + step * (near ? NEAR : join ? JOIN : 1) + extra + (nd === d ? 0 : BEND)
      if (total < cost[next]!) {
        cost[next] = total
        prev[next] = state
        heap.push(next, total)
      }
    }
  }
  if (cost[sink] === Infinity) return direct?.points ?? null
  if (direct && direct.cost <= cost[sink]!) return direct.points
  const last = prev[sink]!
  const end = closing.get(last)!
  const grid: Pt[] = []
  let state = last
  let first = last
  while (state >= 0) {
    const k = state >> 2
    grid.push([xs[k % nx]!, ys[Math.floor(k / nx)]!])
    first = state
    state = prev[state]!
  }
  grid.reverse()
  return clean([startAt.get(first)!.a, ...grid, end.a])
}

/* The price of a straight run across the edges already drawn. */
function crossings(a: Pt, b: Pt, runs: Run[]) {
  let total = 0
  for (const run of runs) {
    if (run.border || isVertical(a, b) === isVertical(run.a, run.b)) continue
    const [v, h] = isVertical(a, b) ? [[a, b], [run.a, run.b]] : [[run.a, run.b], [a, b]]
    const x = v[0]![0]
    const y = h[0]![1]
    if (x > Math.min(h[0]![0], h[1]![0]) + 0.5 && x < Math.max(h[0]![0], h[1]![0]) - 0.5 && y > Math.min(v[0]![1], v[1]![1]) + 0.5 && y < Math.max(v[0]![1], v[1]![1]) - 0.5) total += CROSS
  }
  return total
}

/* A binary heap of states by cost. */
class Heap {
  private items: number[] = []
  private costs: number[] = []
  get size() {
    return this.items.length
  }
  push(item: number, value: number) {
    const items = this.items
    const costs = this.costs
    let k = items.length
    items.push(item)
    costs.push(value)
    while (k > 0) {
      const up = (k - 1) >> 1
      if (costs[up]! <= value) break
      items[k] = items[up]!
      costs[k] = costs[up]!
      k = up
    }
    items[k] = item
    costs[k] = value
  }
  pop(): [number, number] {
    const items = this.items
    const costs = this.costs
    const top: [number, number] = [items[0]!, costs[0]!]
    const item = items.pop()!
    const value = costs.pop()!
    if (items.length) {
      let k = 0
      for (;;) {
        const l = 2 * k + 1
        const r = l + 1
        let m = k
        let best = value
        if (l < items.length && costs[l]! < best) {
          m = l
          best = costs[l]!
        }
        if (r < items.length && costs[r]! < best) m = r
        if (m === k) break
        items[k] = items[m]!
        costs[k] = costs[m]!
        k = m
      }
      items[k] = item
      costs[k] = value
    }
    return top
  }
}

/* Where two paths from one point part: the length they share and the point
   they part at. */
function shared(a: Pt[], b: Pt[]) {
  if (dist(a[0]!, b[0]!) > 0.5) return { length: 0, at: a[0]!, j: 0 }
  let length = 0
  let at = a[0]!
  let j = 0
  let k = 0
  while (j < a.length - 1 && k < b.length - 1) {
    const da = unit(at, a[j + 1]!)
    const db = unit(at, b[k + 1]!)
    if (Math.abs(da[0] - db[0]) > 0.01 || Math.abs(da[1] - db[1]) > 0.01) break
    const step = Math.min(dist(at, a[j + 1]!), dist(at, b[k + 1]!))
    at = towards(at, a[j + 1]!, step)
    length += step
    if (dist(at, a[j + 1]!) < 0.5) {
      at = a[j + 1]!
      j++
    }
    if (dist(at, b[k + 1]!) < 0.5) k++
  }
  return { length, at, j }
}

const total = (points: Pt[]) => points.reduce((sum, p, k) => k ? sum + dist(points[k - 1]!, p) : 0, 0)

/* Edges of one kind out of one anchor share a trunk: the longest keeps it,
   and each other leaves it at a dot, RADIUS before it turns away. Edges of
   one kind into one anchor join the same way, at a dot where they meet. */
function trunks(routes: Route[], pairs: Pair[]) {
  const groups = new Map<string, number[]>()
  routes.forEach((item, index) => {
    const start = item.points[0]!
    const key = `${pairs[index]!.source.id}|${start[0]}|${start[1]}|${kindOf(pairs[index]!.edge)}`
    groups.set(key, [...(groups.get(key) ?? []), index])
  })
  for (const list of groups.values()) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) => total(routes[b]!.points) - total(routes[a]!.points))
    const full = sorted.map((index) => routes[index]!.points)
    sorted.forEach((index, n) => {
      if (!n) return
      const mine = full[n]!
      let best = { length: 0, at: mine[0]!, j: 0 }
      for (let m = 0; m < n; m++) {
        const found = shared(mine, full[m]!)
        if (found.length > best.length) best = found
      }
      if (best.length < 1) return
      const back = Math.min(RADIUS, best.length)
      const before = best.j < mine.length - 1 && dist(best.at, mine[best.j]!) > 0.5 ? mine[best.j]! : mine[Math.max(0, best.j - 1)]!
      const dot = towards(best.at, before, back)
      const rest = mine.slice(best.j + 1)
      routes[index]!.points = clean([dot, best.at, ...rest])
      routes[index]!.dot = dot
    })
  }
  const joins = new Map<string, number[]>()
  routes.forEach((item, index) => {
    if (item.dot) return
    const end = item.points[item.points.length - 1]!
    const key = `${pairs[index]!.target.id}|${end[0]}|${end[1]}|${kindOf(pairs[index]!.edge)}`
    joins.set(key, [...(joins.get(key) ?? []), index])
  })
  for (const list of joins.values()) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) => total(routes[b]!.points) - total(routes[a]!.points))
    const full = sorted.map((index) => [...routes[index]!.points].reverse())
    sorted.forEach((index, n) => {
      if (!n) return
      const mine = full[n]!
      let best = { length: 0, at: mine[0]!, j: 0 }
      for (let m = 0; m < n; m++) {
        const found = shared(mine, full[m]!)
        if (found.length > best.length) best = found
      }
      if (best.length < ARROW + RADIUS) return
      const before = best.j < mine.length - 1 && dist(best.at, mine[best.j]!) > 0.5 ? mine[best.j]! : mine[Math.max(0, best.j - 1)]!
      const dot = towards(best.at, before, Math.min(RADIUS, best.length))
      routes[index]!.points = clean([dot, best.at, ...mine.slice(best.j + 1)].reverse())
      routes[index]!.dot = dot
      routes[index]!.arrow = false
    })
  }
}

/* The segment of a path that holds a point, or -1. */
function holding(points: Pt[], at: Pt) {
  return points.findIndex((a, j) => {
    const b = points[j + 1]
    return !!b && Math.min(a[0], b[0]) - 0.5 <= at[0] && at[0] <= Math.max(a[0], b[0]) + 0.5
      && Math.min(a[1], b[1]) - 0.5 <= at[1] && at[1] <= Math.max(a[1], b[1]) + 0.5
  })
}

const warned = new Set<string>()
function warn(key: string, message: string) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}


/* ------------------------------------------------------------------------
   Edge shapes. Routing is the same for every shape; a shape only changes how
   a route's polyline is drawn.
   ------------------------------------------------------------------------ */

/* Samples of a drawn line: x, y and the distance along it. */
type Sample = [number, number, number]

const unit = (a: Pt, b: Pt): Pt => {
  const n = dist(a, b) || 1
  return [(b[0] - a[0]) / n, (b[1] - a[1]) / n]
}

function push(out: Sample[], p: Pt) {
  const last = out[out.length - 1]
  out.push([p[0], p[1], last ? last[2] + Math.hypot(p[0] - last[0], p[1] - last[1]) : 0])
}

/* The drawn line of an orthogonal route: its runs and rounded corners. */
function dense(points: Pt[], rad: number[], step = 4): Sample[] {
  const out: Sample[] = []
  for (let j = 0; j < points.length - 1; j++) {
    const s = towards(points[j]!, points[j + 1]!, rad[j]!)
    const e = towards(points[j + 1]!, points[j]!, rad[j + 1]!)
    const n = Math.max(1, Math.ceil(dist(s, e) / step))
    for (let k = 0; k <= n; k++) push(out, [s[0] + ((e[0] - s[0]) * k) / n, s[1] + ((e[1] - s[1]) * k) / n])
    if (j + 1 < points.length - 1) {
      const q = points[j + 1]!
      const m = towards(q, points[j + 2]!, rad[j + 1]!)
      for (let k = 1; k < 4; k++) {
        const t = k / 4
        push(out, [(1 - t) ** 2 * e[0] + 2 * (1 - t) * t * q[0] + t * t * m[0], (1 - t) ** 2 * e[1] + 2 * (1 - t) * t * q[1] + t * t * m[1]])
      }
    }
  }
  return out
}

/* An orthogonal path with rounded corners and no marks. */
function orthogonal(points: Pt[]) {
  const rad = radii(points)
  let d = `M ${points[0]![0]} ${points[0]![1]}`
  for (let j = 0; j < points.length - 1; j++) {
    const e = towards(points[j + 1]!, points[j]!, rad[j + 1]!)
    d += ` L ${e[0]} ${e[1]}`
    if (j + 1 < points.length - 1) {
      const q = points[j + 1]!
      const n = towards(q, points[j + 2]!, rad[j + 1]!)
      d += ` Q ${q[0]} ${q[1]} ${n[0]} ${n[1]}`
    }
  }
  return d
}

/* Where a route parts from the others: the farthest junction dot on it, or
   the end of the stretch from its start that lies on another route. Before
   that point the route is shared, so it stays orthogonal in every shape. */
function parting(routes: Route[], i: number) {
  const points = routes[i]!.points
  const cum = [0]
  for (let k = 1; k < points.length; k++) cum.push(cum[k - 1]! + dist(points[k - 1]!, points[k]!))
  const arcOf = (at: Pt) => {
    const k = holding(points, at)
    return k < 0 ? -1 : cum[k]! + dist(points[k]!, at)
  }
  let at = 0
  for (const other of routes) if (other.dot) at = Math.max(at, arcOf(other.dot))
  const spans: [number, number][] = []
  routes.forEach((other, j) => {
    if (j === i) return
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k]!
      const b = points[k + 1]!
      for (let m = 0; m < other.points.length - 1; m++) {
        const c = other.points[m]!
        const d = other.points[m + 1]!
        const vertical = isVertical(a, b) && isVertical(c, d) && Math.abs(a[0] - c[0]) < 0.5
        const flat = !isVertical(a, b) && !isVertical(c, d) && Math.abs(a[1] - b[1]) < 0.5 && Math.abs(c[1] - d[1]) < 0.5 && Math.abs(a[1] - c[1]) < 0.5
        if (!vertical && !flat) continue
        const axis = vertical ? 1 : 0
        const dir = Math.sign(b[axis] - a[axis]) || 1
        const lo = Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]))
        const hi = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]))
        if (hi - lo < 0.5) continue
        const t0 = cum[k]! + (dir > 0 ? lo - a[axis] : a[axis] - hi)
        spans.push([t0, t0 + hi - lo])
      }
    }
  })
  let reach = 0
  for (const [lo, hi] of spans.sort((a, b) => a[0] - b[0])) if (lo <= reach + 0.5) reach = Math.max(reach, hi)
  at = Math.max(at, reach)
  let k = 0
  while (k < points.length - 2 && cum[k + 1]! < at - 0.01) k++
  const point = towards(points[k]!, points[k + 1]!, Math.min(at - cum[k]!, dist(points[k]!, points[k + 1]!)))
  return { at, k, point, dir: unit(points[k]!, points[k + 1]!) }
}

type Free = { d: string; samples: Sample[]; from: number }

/* A curve or a straight line from where the route parts to its end. Null
   when what is left is one straight run along an axis: that edge draws as
   it does orthogonally. */
function shaped(routes: Route[], i: number, shape: "curve" | "straight", boxes?: Map<string, Box>): Free | null {
  const route = routes[i]!
  const { points } = route
  const { at, k, point: P, dir } = parting(routes, i)
  const E = points[points.length - 1]!
  const dE = unit(points[points.length - 2]!, E)
  if (dist(P, E) < 1) return null
  const along = Math.abs(dir[0] * dE[0] + dir[1] * dE[1]) > 0.99
  const level = Math.abs(P[0] - E[0]) < 0.5 || Math.abs(P[1] - E[1]) < 0.5
  const ahead = (E[0] - P[0]) * dE[0] + (E[1] - P[1]) * dE[1] > 0
  if (along && level && ahead) return null
  // The shared stretch, orthogonal.
  const head = clean([...points.slice(0, k + 1), P])
  let d = head.length > 1 ? orthogonal(head) : `M ${P[0]} ${P[1]}`
  const samples = head.length > 1 ? dense(head, radii(head), 2) : [[P[0], P[1], 0] as Sample]
  const from = samples[samples.length - 1]![2]
  const add = (p: Pt) => push(samples, p)
  if (shape === "curve") {
    // A cubic to a point SETTLE short of the end, then straight into the
    // port, so the arrowhead sits on a straight line and points along it.
    const settle = Math.min(SETTLE, dist(P, E) / 2)
    const F: Pt = [E[0] - dE[0] * settle, E[1] - dE[1] * settle]
    const delta: Pt = [F[0] - P[0], F[1] - P[1]]
    const span = Math.hypot(delta[0], delta[1])
    const axial = (v: Pt) => Math.abs(delta[0] * v[0] + delta[1] * v[1])
    // Each handle is the larger of 60% of the distance along its port's axis
    // and 30% of the span, so short links still arch.
    let kS = Math.min(160, Math.max(32, 0.6 * axial(dir), 0.3 * span))
    let kE = Math.min(160, Math.max(32, 0.6 * axial(dE), 0.3 * span))
    // Ends that face the same way make an S; handles longer than the run
    // would make it double back.
    if (dir[0] * dE[0] + dir[1] * dE[1] > 0.9) {
      kS = Math.min(kS, axial(dir))
      kE = Math.min(kE, axial(dE))
    }
    const c1: Pt = [P[0] + dir[0] * kS, P[1] + dir[1] * kS]
    const c2: Pt = [F[0] - dE[0] * kE, F[1] - dE[1] * kE]
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${F[0]} ${F[1]} L ${E[0]} ${E[1]}`
    const n = Math.max(8, Math.ceil(span / 3))
    for (let m = 1; m <= n; m++) {
      const t = m / n
      const u = 1 - t
      add([
        u ** 3 * P[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * F[0],
        u ** 3 * P[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * F[1],
      ])
    }
    add(E)
    return { d, samples, from }
  }
  // Straight. Anchors are picked for elbows, so a steep line into a side
  // comes in through the anchor on the top or bottom instead, with a
  // straight SETTLE run into it, unless the edge set its side.
  let end = E
  let stub: Pt | null = null
  const box = route.ends && !route.pinned ? boxes?.get(route.ends[1]) : undefined
  if (box) {
    const v: Pt = [E[0] - P[0], E[1] - P[1]]
    const intoSide = Math.abs(dE[0]) > 0.5
    if (intoSide && Math.abs(v[1]) > 1.5 * Math.abs(v[0])) {
      const x = box.x
      const y = v[1] > 0 ? box.top : box.bottom
      const run: Pt = [x, y - Math.sign(v[1]) * SETTLE]
      // Only when the new face still lies ahead, steeply: a target stacked
      // close beside the source keeps its side.
      if (Math.abs(run[1] - P[1]) > Math.abs(run[0] - P[0])) {
        end = [x, y]
        stub = run
      }
    }
  }
  for (const p of stub ? [stub, end] : [end]) {
    d += ` L ${p[0]} ${p[1]}`
    const last = samples[samples.length - 1]!
    const n = Math.max(1, Math.ceil(dist([last[0], last[1]], p) / 3))
    for (let m = 1; m <= n; m++) add([last[0] + ((p[0] - last[0]) * m) / n, last[1] + ((p[1] - last[1]) * m) / n])
  }
  if (boxes) {
    // Kiso does not route around nodes, and a straight line takes no detour.
    const line = [P, ...(stub ? [stub] : []), end]
    for (const node of boxes.values()) {
      if (route.ends?.includes(node.id)) continue
      for (let m = 0; m < line.length - 1; m++) {
        if (crosses(line[m]!, line[m + 1]!, node)) warn(`${route.key}>${node.id}`, `Diagram: the edge ${route.key.split(":")[0]} runs through the node "${node.id}". Move the node, or set route on the edge.`)
      }
    }
  }
  return { d, samples, from }
}

/* Whether a segment passes through the inside of a box. */
function crosses(a: Pt, b: Pt, box: Box) {
  let lo = 0
  let hi = 1
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  for (const [p, q] of [[-dx, a[0] - (box.left + 1)], [dx, box.right - 1 - a[0]], [-dy, a[1] - (box.top + 1)], [dy, box.bottom - 1 - a[1]]] as const) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false
      continue
    }
    const r = q / p
    if (p < 0) lo = Math.max(lo, r)
    else hi = Math.min(hi, r)
    if (lo > hi) return false
  }
  return true
}

/* Where two sampled lines cross, as distances along the first. */
function meets(a: Sample[], b: Sample[]) {
  const out: number[] = []
  const box = (list: Sample[]) => list.reduce((r, p) => [Math.min(r[0], p[0]), Math.min(r[1], p[1]), Math.max(r[2], p[0]), Math.max(r[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity])
  const [bx0, by0, bx1, by1] = box(b)
  for (let k = 1; k < a.length; k++) {
    const p = a[k - 1]!
    const q = a[k]!
    if (Math.max(p[0], q[0]) < bx0 || Math.min(p[0], q[0]) > bx1 || Math.max(p[1], q[1]) < by0 || Math.min(p[1], q[1]) > by1) continue
    for (let m = 1; m < b.length; m++) {
      const c = b[m - 1]!
      const d = b[m]!
      const t = segmentsMeet(p, q, c, d)
      if (t !== null) out.push(p[2] + (q[2] - p[2]) * t)
    }
  }
  return out
}

function segmentsMeet(a: Sample | Pt, b: Sample | Pt, c: Sample | Pt, d: Sample | Pt) {
  const rx = b[0] - a[0]
  const ry = b[1] - a[1]
  const sx = d[0] - c[0]
  const sy = d[1] - c[1]
  const den = rx * sy - ry * sx
  if (Math.abs(den) < 1e-9) return null
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null
}

/* Sketch: the orthogonal line, hand drawn. The wobble is a function of where
   a point is, the coordinate along its run and the run's own line, so two
   edges on one stem wobble alike. It fades out near every route's ends and
   corners, every dot and every crossing mark, so dots, heads, hops and the
   joins between edges sit on the line. Same drawing on every render. */
const WOBBLE = 1.4
const STEP = 7
type Anchor = [number, number, number]

function hash(n: number) {
  let h = Math.imul(Math.round(n) ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function wobble(u: number, line: number) {
  const a = hash(line) * 6.283
  const b = hash(line + 7919) * 6.283
  return WOBBLE * (0.9 * Math.sin(u / 23 + a) + 0.45 * Math.sin(u / 9.5 + b) + 0.35 * (hash(line * 31 + Math.round(u / STEP)) - 0.5))
}

function fade(p: Pt, anchors: Anchor[]) {
  let f = 1
  for (const [x, y, r] of anchors) f = Math.min(f, Math.hypot(p[0] - x, p[1] - y) / r)
  return Math.max(0, f)
}

function sketch(points: Pt[], rad: number[], hops: Map<number, number[]>, gaps: Map<number, number[]>, anchors: Anchor[]) {
  const parts: Pt[][] = [[]]
  const add = (p: Pt) => parts[parts.length - 1]!.push(p)
  const moved = (p: Pt, vertical: boolean) => {
    const w = wobble(vertical ? p[1] : p[0], vertical ? p[0] : p[1]) * fade(p, anchors)
    return (vertical ? [p[0] + w, p[1]] : [p[0], p[1] + w]) as Pt
  }
  for (let j = 0; j < points.length - 1; j++) {
    const p = points[j]!
    const q = points[j + 1]!
    const s = towards(p, q, rad[j]!)
    const e = towards(q, p, rad[j + 1]!)
    const vertical = isVertical(p, q)
    const axis = vertical ? 1 : 0
    const dir = Math.sign(e[axis] - s[axis]) || 1
    const at = (v: number): Pt => vertical ? [s[0], v] : [v, s[1]]
    // Marks along the run: hops (a half circle, like the orthogonal line)
    // and breaks (a gap left for a crossing edge).
    const marks = [
      ...(hops.get(j) ?? []).map((t) => ({ v: s[axis] + dir * t, hop: true })),
      ...(gaps.get(j) ?? []).map((v) => ({ v, hop: false })),
    ].sort((a, b) => (a.v - b.v) * dir)
    let v = s[axis]
    // Anchors on this run, such as a dot or where another edge joins it,
    // are samples too, so the line passes through them exactly.
    const pinned = anchors.filter(([x, y]) => Math.abs((vertical ? x : y) - s[1 - axis]!) < 0.5).map((a) => a[axis]!)
    const run = (to: number) => {
      // Samples on a grid shared by every edge, plus the pinned points, so
      // shared runs match.
      const marks: number[] = []
      for (let g = (dir > 0 ? Math.floor(v / STEP) + 1 : Math.ceil(v / STEP) - 1) * STEP; (g - to) * dir < 0; g += dir * STEP) marks.push(g)
      for (const a of pinned) if ((a - v) * dir > 0.5 && (to - a) * dir > 0.5) marks.push(a)
      add(moved(at(v), vertical))
      for (const m of marks.sort((a, b) => (a - b) * dir)) add(moved(at(m), vertical))
      add(moved(at(to), vertical))
      v = to
    }
    for (const mark of marks) {
      if (mark.hop) {
        run(mark.v - dir * HOP)
        // Vertical runs hop to the right, flat runs up, as the arc does.
        const c = at(mark.v)
        for (let m = 1; m <= 8; m++) {
          const ang = (Math.PI * m) / 8
          const back = -HOP * Math.cos(ang) * dir
          const out = HOP * Math.sin(ang)
          add(vertical ? [c[0] + out, c[1] + back] : [c[0] + back, c[1] - out])
        }
        v = mark.v + dir * HOP
      } else {
        run(mark.v - dir * (GAP + 1))
        parts.push([])
        v = mark.v + dir * (GAP + 1)
      }
    }
    run(e[axis])
    if (j + 1 < points.length - 1) {
      const n = towards(q, points[j + 2]!, rad[j + 1]!)
      for (let k = 1; k < 4; k++) {
        const t = k / 4
        add([(1 - t) ** 2 * e[0] + 2 * (1 - t) * t * q[0] + t * t * n[0], (1 - t) ** 2 * e[1] + 2 * (1 - t) * t * q[1] + t * t * n[1]])
      }
    }
  }
  return parts.map(spline).join(" ")
}

/* A smooth path through points: Catmull-Rom as cubics. */
function spline(raw: Pt[]) {
  const pts = raw.filter((p, k) => k === 0 || dist(raw[k - 1]!, p) > 0.2)
  if (!pts.length) return ""
  const f = (n: number) => Math.round(n * 100) / 100
  let d = `M ${f(pts[0]![0])} ${f(pts[0]![1])}`
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[Math.max(0, k - 1)]!
    const p1 = pts[k]!
    const p2 = pts[k + 1]!
    const p3 = pts[Math.min(pts.length - 1, k + 2)]!
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/* ------------------------------------------------------------------------
   Drawing: crossings, paths and labels for any layout.
   ------------------------------------------------------------------------ */

type Straight = { route: number; seg: number; vertical: boolean; at: number; a: number; b: number; ending: boolean }
type Line = { at: number; lo: number; hi: number; route?: number; seg?: number }
type Crossing = { t: number; at: number; line: Line }

/* The Diagram's own shape and head, the measured boxes a straight edge
   needs to pick its entry face and labels keep off, and the group titles
   labels keep off as well. */
export type DrawStyle = { shape?: DiagramEdgeShape; arrow?: DiagramArrow; boxes?: Map<string, Box>; blocks?: Box[] }

export function draw(
  routes: Route[],
  frames: Frame[],
  crossings: DiagramCrossings,
  labels: DiagramLabels,
  measure: (text: string) => { width: number; height: number },
  style: DrawStyle = {},
): Drawn {
  const shapes = routes.map((route) => ({ points: route.points, rad: radii(route.points) }))
  // A trunk is the shared run of several edges: it keeps its right angles,
  // unless the drawing is sketched.
  const kinds = routes.map((route) => {
    const shape = route.look.shape ?? style.shape ?? "orthogonal"
    return !route.arrow && shape !== "sketch" ? "orthogonal" : shape
  })
  const heads = routes.map((route, i) => route.look.head ?? style.arrow ?? (kinds[i] === "sketch" ? "sketch" : "triangle"))
  const free = routes.map((_, i) => kinds[i] === "curve" || kinds[i] === "straight" ? shaped(routes, i, kinds[i] as "curve" | "straight", style.boxes) : null)
  const straights: Straight[] = []
  shapes.forEach(({ points, rad }, i) => {
    // Curves and straight lines have no runs; their crossings come below.
    if (free[i]) return
    for (let j = 0; j < points.length - 1; j++) {
      const s = towards(points[j]!, points[j + 1]!, rad[j]!)
      const e = towards(points[j + 1]!, points[j]!, rad[j + 1]!)
      const vertical = isVertical(points[j]!, points[j + 1]!)
      straights.push({
        route: i, seg: j, vertical, at: vertical ? s[0] : s[1], a: vertical ? s[1] : s[0], b: vertical ? e[1] : e[0],
        ending: routes[i]!.arrow && j === points.length - 2,
      })
    }
  })

  // Lines a run can cross: frame borders, and other edges' horizontal runs.
  // A frame's rounded corners are left out, so nothing hops on a curve.
  const across: Line[] = frames.flatMap((f) => [
    { at: f.top, lo: f.left + f.radius, hi: f.right - f.radius },
    { at: f.bottom, lo: f.left + f.radius, hi: f.right - f.radius },
  ])
  for (const s of straights) if (!s.vertical) across.push({ at: s.at, lo: Math.min(s.a, s.b), hi: Math.max(s.a, s.b), route: s.route, seg: s.seg })
  const upright: Line[] = frames.flatMap((f) => [
    { at: f.left, lo: f.top + f.radius, hi: f.bottom - f.radius },
    { at: f.right, lo: f.top + f.radius, hi: f.bottom - f.radius },
  ])

  const found = new Map<string, Crossing[]>()
  const gaps = new Map<string, number[]>()
  const plates: Rect[] = []
  if (crossings !== "none") {
    for (const s of straights) {
      const lines = s.vertical ? across : upright
      const dir = Math.sign(s.b - s.a) || 1
      const length = Math.abs(s.b - s.a)
      const list: Crossing[] = []
      for (const line of lines) {
        if (line.route === s.route) continue
        const margin = line.route === undefined ? 1 : HOP + 2
        if (s.at <= line.lo + margin || s.at >= line.hi - margin) continue
        const t = (line.at - s.a) * dir
        // Hops stay away from corners and from the edge's ends.
        if (t <= HOP + 4 || t >= length - (s.ending ? HOP + SETTLE : HOP + 4)) continue
        list.push({ t, at: line.at, line })
      }
      list.sort((a, b) => a.t - b.t)
      const kept = list.filter((item, index) => index === 0 || item.t - list[index - 1]!.t >= 2 * HOP + 2)
      if (!kept.length) continue
      found.set(`${s.route}:${s.seg}`, kept)
      if (crossings !== "gap") continue
      // A gap breaks the crossed line: a frame under a plate in the card
      // colour, an edge by leaving out that stretch of its path.
      for (const item of kept) {
        const x = s.vertical ? s.at : item.at
        const y = s.vertical ? item.at : s.at
        if (item.line.route === undefined) {
          plates.push(s.vertical
            ? { key: `${s.route}:${s.seg}:${x}:${y}`, x: x - GAP - 1, y: y - 2, width: 2 * GAP + 2, height: 4 }
            : { key: `${s.route}:${s.seg}:${x}:${y}`, x: x - 2, y: y - GAP - 1, width: 4, height: 2 * GAP + 2 })
        } else {
          const key = `${item.line.route}:${item.line.seg}`
          gaps.set(key, [...(gaps.get(key) ?? []), x])
        }
      }
    }
  }

  // Crossings that involve a curve or a straight line, found on the drawn
  // lines. They are always gaps: a hop on a slanted line reads as a bump.
  // The later edge crosses the earlier one, so the knockout under it breaks
  // the earlier line. Edges on one stem only touch where they part, which
  // the clearance at their start leaves out.
  const knocks = new Map<number, string>()
  if (crossings !== "none" && free.some(Boolean)) {
    const lines = routes.map((_, i) => free[i]?.samples ?? dense(shapes[i]!.points, shapes[i]!.rad))
    routes.forEach((route, i) => {
      const mine = lines[i]!
      const length = mine[mine.length - 1]![2]
      const list: { t: number; plate?: Rect }[] = []
      if (free[i]) {
        for (const f of frames) {
          const sides: [Pt, Pt, boolean][] = [
            [[f.left + f.radius, f.top], [f.right - f.radius, f.top], false],
            [[f.left + f.radius, f.bottom], [f.right - f.radius, f.bottom], false],
            [[f.left, f.top + f.radius], [f.left, f.bottom - f.radius], true],
            [[f.right, f.top + f.radius], [f.right, f.bottom - f.radius], true],
          ]
          for (const [a, b, upright] of sides) {
            for (const t of meets(mine, [[...a, 0], [...b, 0]])) {
              const k = mine.findIndex((p) => p[2] >= t)
              const p = mine[Math.max(0, k)]!
              const q = mine[Math.max(0, k - 1)]!
              // The break in the border widens as the line slants.
              const slant = Math.max(0.3, upright ? Math.abs(unit([q[0], q[1]], [p[0], p[1]])[0]) : Math.abs(unit([q[0], q[1]], [p[0], p[1]])[1]))
              const half = (GAP + 1) / slant
              list.push({ t, plate: upright
                ? { key: `${i}:${t}`, x: a[0] - 2, y: p[1] - half, width: 4, height: 2 * half }
                : { key: `${i}:${t}`, x: p[0] - half, y: a[1] - 2, width: 2 * half, height: 4 } })
            }
          }
        }
      }
      for (let j = 0; j < i; j++) {
        if (!free[i] && !free[j]) continue
        for (const t of meets(mine, lines[j]!)) list.push({ t })
      }
      const start = (free[i]?.from ?? 0) + HOP + 4
      const end = length - (route.arrow ? HOP + SETTLE : HOP + 4)
      const sorted = list.filter((item) => item.t > start && item.t < end).sort((a, b) => a.t - b.t)
      const kept = sorted.filter((item, index) => index === 0 || item.t - sorted[index - 1]!.t >= 2 * HOP + 2)
      const parts: string[] = []
      for (const item of kept) {
        if (item.plate) {
          plates.push(item.plate)
          continue
        }
        const near = mine.filter((p) => Math.abs(p[2] - item.t) <= GAP + 2)
        if (near.length > 1) parts.push(near.map((p, k) => `${k ? "L" : "M"} ${p[0]} ${p[1]}`).join(" "))
      }
      if (parts.length) knocks.set(i, parts.join(" "))
    })
  }

  // Sketched lines fade their wobble out near these points.
  const anchors: Anchor[] = []
  if (kinds.includes("sketch")) {
    for (const route of routes) {
      route.points.forEach((p, k) => anchors.push([p[0], p[1], k === 0 || k === route.points.length - 1 ? 18 : 12]))
      if (route.dot) anchors.push([route.dot[0], route.dot[1], 18])
    }
    shapes.forEach(({ points, rad }, i) => {
      for (let j = 0; j < points.length - 1; j++) {
        const s = towards(points[j]!, points[j + 1]!, rad[j]!)
        const vertical = isVertical(points[j]!, points[j + 1]!)
        const dir = Math.sign(vertical ? points[j + 1]![1] - s[1] : points[j + 1]![0] - s[0]) || 1
        for (const item of found.get(`${i}:${j}`) ?? []) anchors.push(vertical ? [s[0], s[1] + dir * item.t, 12] : [s[0] + dir * item.t, s[1], 12])
        for (const x of gaps.get(`${i}:${j}`) ?? []) anchors.push([x, s[1], 12])
      }
    })
  }

  const drawn: Drawn = { paths: [], labels: [], plates, dots: [] }
  // A label tries its own run first, then the others, longest first, at a
  // few spots along each, and takes the first that runs into nothing.
  const walls = [...(style.boxes?.values() ?? []), ...(style.blocks ?? [])]
  const taken: Rect[] = []
  const settle = (route: Route, i: number) => {
    const label = route.label!
    const length = (j: number) => dist(route.points[j]!, route.points[j + 1]!)
    const others = route.points.slice(0, -1).map((_, j) => j).filter((j) => j !== label.run).sort((a, b) => length(b) - length(a))
    let best: Drawn["labels"][number] | null = null
    let score = Infinity
    search: for (const run of [label.run, ...others]) {
      for (const along of [run === label.run ? label.along : 0.5, 0.3, 0.7, 0.15, 0.85]) {
        const tried = place({ ...route, label: run === label.run ? { ...label, along } : { text: label.text, run, along } }, found, i, labels, measure, frames)
        if (!tried) continue
        const count = hits(boxOf(tried, measure), i, routes, walls, taken, frames)
        if (count < score) {
          best = tried
          score = count
        }
        if (!count) break search
      }
    }
    // Nothing on the line is clear, such as a long label between two cards
    // close together: it sits flat on a plate at the nearest clear spot
    // around the middle of its run, above or below, left or right.
    if (score) {
      const p = route.points[label.run]!
      const q = route.points[label.run + 1]!
      const mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
      const size = measure(label.text)
      const near = (x: number, y: number): Drawn["labels"][number] => ({
        key: route.key, x, y, lines: [label.text], middle: true,
        plate: { key: route.key, x: x - size.width / 2 - 3, y: y - size.height / 2, width: size.width + 6, height: size.height },
      })
      // Past every card, label, run and frame, a spot is always clear, so
      // the search reaches that far.
      const xs = [...walls.flatMap((box) => [box.left, box.right]), ...taken.flatMap((rect) => [rect.x, rect.x + rect.width]), ...routes.flatMap((item) => item.points.map((pt) => pt[0])), ...frames.flatMap((frame) => [frame.left, frame.right])]
      const ys = [...walls.flatMap((box) => [box.top, box.bottom]), ...taken.flatMap((rect) => [rect.y, rect.y + rect.height]), ...routes.flatMap((item) => item.points.map((pt) => pt[1])), ...frames.flatMap((frame) => [frame.top, frame.bottom])]
      const reach = Math.max(...xs.map((x) => Math.abs(x - mid[0])), ...ys.map((y) => Math.abs(y - mid[1]))) + size.width + size.height + 8
      clear: for (let step = 4; step <= reach + 4; step += 4) {
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
          const tried = near(mid[0] + dx * step, mid[1] + dy * step)
          if (!hits(boxOf(tried, measure), i, routes, walls, taken, frames)) {
            best = tried
            break clear
          }
        }
      }
    }
    if (best) taken.push(boxOf(best, measure))
    return best
  }
  routes.forEach((route, i) => {
    const { points, rad } = shapes[i]!
    const shaped = free[i]
    if (shaped || kinds[i] === "sketch") {
      let d: string
      if (shaped) d = shaped.d
      else {
        const hops = new Map<number, number[]>()
        const breaks = new Map<number, number[]>()
        for (let j = 0; j < points.length - 1; j++) {
          if (crossings === "hop") hops.set(j, (found.get(`${i}:${j}`) ?? []).map((item) => item.t))
          if (!isVertical(points[j]!, points[j + 1]!)) breaks.set(j, gaps.get(`${i}:${j}`) ?? [])
        }
        d = sketch(points, rad, hops, breaks, anchors)
      }
      drawn.paths.push({ key: route.key, d, arrow: route.arrow, ...route.look, shape: kinds[i], head: heads[i]!, knock: knocks.get(i) })
      if (route.dot) drawn.dots.push({ key: route.key, x: route.dot[0], y: route.dot[1], ...route.look })
      if (route.label && shaped) {
        // A curve has no run to turn a label along: it sits flat, on a
        // plate, in the middle of the edge's own part.
        const list = shaped.samples
        const total = list[list.length - 1]![2]
        const mid = list.find((p) => p[2] >= shaped.from + (total - shaped.from) / 2) ?? list[list.length - 1]!
        const size = measure(route.label.text)
        drawn.labels.push({
          key: route.key, x: mid[0], y: mid[1], lines: [route.label.text], middle: true,
          plate: { key: route.key, x: mid[0] - size.width / 2 - 3, y: mid[1] - size.height / 2, width: size.width + 6, height: size.height },
        })
        taken.push(drawn.labels[drawn.labels.length - 1]!.plate!)
      } else if (route.label) {
        const placed = settle(route, i)
        if (placed) drawn.labels.push(placed)
      }
      return
    }
    let d = `M ${points[0]![0]} ${points[0]![1]}`
    for (let j = 0; j < points.length - 1; j++) {
      const p = points[j]!
      const q = points[j + 1]!
      const s = towards(p, q, rad[j]!)
      const e = towards(q, p, rad[j + 1]!)
      const vertical = isVertical(p, q)
      const dir = Math.sign(vertical ? e[1] - s[1] : e[0] - s[0]) || 1
      const along = (t: number): Pt => vertical ? [s[0], s[1] + dir * t] : [s[0] + dir * t, s[1]]
      if (crossings === "hop") {
        for (const item of found.get(`${i}:${j}`) ?? []) {
          const [x1, y1] = along(item.t - HOP)
          const [x2, y2] = along(item.t + HOP)
          d += ` L ${x1} ${y1} A ${HOP} ${HOP} 0 0 ${dir > 0 ? 1 : 0} ${x2} ${y2}`
        }
      }
      const breaks = gaps.get(`${i}:${j}`)
      if (breaks && !vertical) {
        for (const x of [...breaks].sort((a, b) => (a - b) * dir)) {
          d += ` L ${x - dir * (GAP + 1)} ${s[1]} M ${x + dir * (GAP + 1)} ${s[1]}`
        }
      }
      d += ` L ${e[0]} ${e[1]}`
      if (j + 1 < points.length - 1) {
        const n = towards(q, points[j + 2]!, rad[j + 1]!)
        d += ` Q ${q[0]} ${q[1]} ${n[0]} ${n[1]}`
      }
    }
    drawn.paths.push({ key: route.key, d, arrow: route.arrow, ...route.look, head: heads[i]!, knock: knocks.get(i) })
    if (route.dot) drawn.dots.push({ key: route.key, x: route.dot[0], y: route.dot[1], ...route.look })
    if (route.label) {
      const placed = settle(route, i)
      if (placed) drawn.labels.push(placed)
    }
  })
  return drawn
}

/* A label's box: its plate, or the room its text takes about its baseline. */
function boxOf(item: Drawn["labels"][number], measure: (text: string) => { width: number; height: number }): Rect {
  if (item.plate) return item.plate
  const sizes = item.lines.map(measure)
  const width = Math.max(...sizes.map((size) => size.width))
  const height = sizes[0]!.height
  const above = height * 0.75 + (item.lines.length - 1) * height * 1.2
  const left = item.anchor === "start" ? item.x : item.x - width / 2
  return { key: item.key, x: left, y: item.y - above, width, height: above + height * 0.25 }
}

/* What a label's box runs into: a card or a group title counts four, as
   does a label already placed, a group border two, and each run of another
   edge one. */
function hits(rect: Rect, index: number, routes: Route[], walls: Box[], taken: Rect[], frames: Frame[]) {
  const area = { left: rect.x, right: rect.x + rect.width, top: rect.y, bottom: rect.y + rect.height } as Box
  const meets = (box: { left: number; right: number; top: number; bottom: number }) => box.left < area.right && box.right > area.left && box.top < area.bottom && box.bottom > area.top
  let count = 0
  for (const wall of walls) if (meets(wall)) count += 4
  for (const other of taken) if (meets({ left: other.x, right: other.x + other.width, top: other.y, bottom: other.y + other.height })) count += 4
  routes.forEach((route, j) => {
    if (j === index) return
    for (let k = 0; k < route.points.length - 1; k++) if (through(route.points[k]!, route.points[k + 1]!, area)) count++
  })
  for (const frame of frames) {
    const corners: Pt[] = [[frame.left, frame.top], [frame.right, frame.top], [frame.right, frame.bottom], [frame.left, frame.bottom]]
    corners.forEach((a, k) => {
      if (through(a, corners[(k + 1) % 4]!, area)) count += 2
    })
  }
  return count
}

function place(route: Route, found: Map<string, Crossing[]>, index: number, mode: DiagramLabels, measure: (text: string) => { width: number; height: number }, frames: Frame[]): Drawn["labels"][number] | null {
  const label = route.label!
  const p = route.points[label.run]
  const q = route.points[label.run + 1]
  if (!p || !q) return null
  const size = measure(label.text)
  if (!isVertical(p, q)) {
    // A flat label sits above its run. When it does not fit the room, it
    // breaks at its first space into two lines, both above the arrow.
    let x = p[0] + (q[0] - p[0]) * (label.along ?? 0.5)
    // Without a room of its own, a label may take its run, less the arrow.
    let room = label.room ?? Math.abs(q[0] - p[0]) - (route.arrow && label.run === route.points.length - 2 ? ARROW : 0)
    // A run that crosses frame sides, such as an edge out of one group
    // into another, takes its label in the gap between the frames: the
    // stretch inside the fewest frames, the widest of those. The label never
    // sits across a border.
    const lo = Math.min(p[0], q[0])
    const hi = Math.max(p[0], q[0])
    const cuts = frames.flatMap((f) => [f.left, f.right].filter((at) => at > lo + 1 && at < hi - 1 && p[1] > f.top && p[1] < f.bottom))
    if (cuts.length) {
      const marks = [lo, ...cuts.sort((a, b) => a - b), hi]
      const depth = (k: number) => {
        const mid = (marks[k]! + marks[k + 1]!) / 2
        return frames.filter((f) => mid > f.left && mid < f.right && p[1] > f.top && p[1] < f.bottom).length
      }
      const width = (k: number) => marks[k + 1]! - marks[k]!
      let best = 0
      for (let k = 1; k < marks.length - 1; k++) {
        if (depth(k) < depth(best) || (depth(k) === depth(best) && width(k) > width(best))) best = k
      }
      const ends = route.arrow && label.run === route.points.length - 2 && marks[best + 1] === (q[0] > p[0] ? hi : lo)
      x = (marks[best]! + marks[best + 1]!) / 2
      room = marks[best + 1]! - marks[best]! - (ends ? ARROW : 0)
    }
    const space = label.text.indexOf(" ")
    const stack = room !== undefined && size.width > room && space > 0
    const lines = stack ? [label.text.slice(0, space), label.text.slice(space + 1)] : [label.text]
    return { key: route.key, x, y: p[1] - RADIUS, lines }
  }
  const x = p[0]
  const dir = Math.sign(q[1] - p[1]) || 1
  const length = Math.abs(q[1] - p[1])
  const ending = route.arrow && label.run === route.points.length - 2
  // Free stretches of the run: clear of its corners, the arrow, a split
  // above it and any crossing.
  const start = Math.max(RADIUS, label.from ?? 0)
  const end = length - RADIUS - (ending ? ARROW : 0)
  const blocked = (found.get(`${index}:${label.run}`) ?? []).map((item) => (item.at - p[1]) * dir)
  const free: [number, number][] = []
  let from = start
  for (const t of blocked.sort((a, b) => a - b)) {
    if (t - HOP - 3 > from) free.push([from, Math.min(t - HOP - 3, end)])
    from = Math.max(from, t + HOP + 3)
  }
  if (end > from) free.push([from, end])
  const need = size.width + 8
  const middle = start + (end - start) * (label.along ?? 0.5)
  let centre: number | null = null
  const holding = free.find(([a, b]) => a <= middle && middle <= b && b - a >= need)
  if (holding) centre = Math.min(Math.max(middle, holding[0] + need / 2), holding[1] - need / 2)
  else {
    const longest = free.filter(([a, b]) => b - a >= need).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0]
    if (longest) centre = (longest[0] + longest[1]) / 2
  }
  const rotate = mode === "vertical" || (mode === "auto" && centre !== null)
  if (rotate) {
    // Turned to read along the run, centred on the line, on a plate in the
    // card colour that breaks the line around it.
    const y = p[1] + dir * (centre ?? middle)
    return {
      key: route.key, x, y, lines: [label.text], rotate: true,
      plate: { key: route.key, x: x - size.height / 2, y: y - size.width / 2 - 3, width: size.height, height: size.width + 6 },
    }
  }
  if (mode === "horizontal") {
    // Flat by choice: on the line, at the same free spot, on a plate.
    const y = p[1] + dir * (centre ?? middle)
    return {
      key: route.key, x, y, lines: [label.text], middle: true,
      plate: { key: route.key, x: x - size.width / 2 - 3, y: y - size.height / 2, width: size.width + 6, height: size.height },
    }
  }
  // Too short to turn: beside the run.
  return { key: route.key, x: x + TRACK, y: p[1] + (q[1] - p[1]) / 2 + 4, lines: [label.text], anchor: "start" }
}
