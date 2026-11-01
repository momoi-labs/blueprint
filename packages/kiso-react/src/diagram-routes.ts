/* Edge geometry for Diagram: routes as polylines, then crossings, paths and
   labels. Pure functions over measured boxes, so the component only measures
   and renders. */

export type DiagramEdgeLine = "solid" | "dashed" | "dotted"
export type DiagramEdgeTone = "neutral" | "success" | "danger"
export type DiagramEdgeRoute = "side" | "down" | "drop"
export type DiagramCrossings = "none" | "hop" | "gap"
export type DiagramLabels = "auto" | "horizontal" | "vertical"

export type EdgeLook = { line?: DiagramEdgeLine; tone?: DiagramEdgeTone; series?: number; flow?: boolean }
export type EdgeSpec = EdgeLook & { key: string; from: string[]; to: string; label?: string; route?: DiagramEdgeRoute }

export type Pt = [number, number]
export type Box = { id: string; left: number; right: number; top: number; bottom: number; width: number; height: number; x: number; y: number }
export type Frame = { left: number; right: number; top: number; bottom: number; radius: number }
export type Measured = { edge: EdgeSpec; target: Box; sources: Box[] }

type RouteLabel = {
  text: string
  /** The segment the label belongs to. */
  run: number
  /** Where along a horizontal run the label centres, 0 to 1. */
  along?: number
  /** Width a flat label may take before it stacks. */
  room?: number
  /** Distance from the run's start the label keeps clear of, past a split. */
  from?: number
}

export type Route = { key: string; points: Pt[]; arrow: boolean; look: EdgeLook; ends?: [string, string]; label?: RouteLabel; dot?: Pt }

export type Rect = { key: string; x: number; y: number; width: number; height: number }
export type Drawn = {
  paths: (EdgeLook & { key: string; d: string; arrow: boolean })[]
  labels: { key: string; x: number; y: number; lines: string[]; anchor?: "start"; rotate?: boolean; middle?: boolean; plate?: Rect }[]
  plates: Rect[]
  dots: (EdgeLook & { key: string; x: number; y: number })[]
}

export const RADIUS = 8
/* Edges whose runs overlap in one channel sit this far apart. */
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
/* How far a vertical run keeps from a node it passes, and two exits apart. */
const CLEAR = 12
/* The run into a node's side, the turn included, so the arrow sits on a
   straight line. The same room a group keeps where an edge comes in. */
const SIDE_RUN = 24

export const look = (edge: EdgeSpec): EdgeLook => ({ line: edge.line, tone: edge.tone, series: edge.series, flow: edge.flow })

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

/* Assigns each run along a shared channel a track, so runs that overlap sit
   apart and their dashes never paint over each other. Returns the offset of
   each run from the channel's centre. */
function tracks<T>(runs: { item: T; lane: number; left: number; right: number }[]) {
  const offsets = new Map<T, number>()
  for (const lane of new Set(runs.map((run) => run.lane))) {
    const here = runs.filter((run) => run.lane === lane).sort((a, b) => a.left - b.left)
    const ends: number[] = []
    const picked = here.map((run) => {
      let track = ends.findIndex((end) => end < run.left - TRACK)
      if (track < 0) track = ends.push(run.right) - 1
      else ends[track] = run.right
      return track
    })
    here.forEach((run, index) => offsets.set(run.item, (picked[index]! - (ends.length - 1) / 2) * TRACK))
  }
  return offsets
}

/* ------------------------------------------------------------------------
   Routes for every layout. Each edge picks its route from where its nodes
   are. The router works top to bottom; left to right is the same drawing
   turned on its diagonal, so its boxes go in transposed and its points
   come back transposed.
   ------------------------------------------------------------------------ */

export type DiagramFlow = "right" | "down" | "grid"

const flip = (box: Box): Box => ({
  ...box, left: box.top, right: box.bottom, top: box.left, bottom: box.right,
  width: box.height, height: box.width, x: box.y, y: box.x,
})
const turn = ([a, b]: Pt): Pt => [b, a]

export function route(measured: Measured[], nodes: Box[], flow: DiagramFlow, frames: Box[] = []): Route[] {
  if (flow !== "right") return routeGrid(measured, nodes, frames, flow === "down", "up")
  const turned = measured.map((item) => ({ ...item, target: flip(item.target), sources: item.sources.map(flip) }))
  return routeGrid(turned, nodes.map(flip), frames.map(flip), true, "left").map((item) => ({
    ...item, points: item.points.map(turn), dot: item.dot && turn(item.dot),
  }))
}

function classify(source: Box, target: Box): DiagramEdgeRoute | null {
  const overlapY = source.top < target.bottom - 1 && target.top < source.bottom - 1
  const overlapX = source.left < target.right - 1 && target.left < source.right - 1
  if (overlapY && !overlapX) return "side"
  if (target.top >= source.bottom - 1) return overlapX ? "down" : "drop"
  return null
}

type Pair = { edge: EdgeSpec; source: Box; target: Box; kind: DiagramEdgeRoute; labelled: boolean; blocked?: boolean }

/* Picks a point for each exit along a source's bottom: as close to an even
   spread as it can, in the order of their targets, and clear of every node
   its straight run passes, so a trunk never runs through a node. */
const holds = (frame: Box, box: Box) => frame.left <= box.left + 1 && frame.right >= box.right - 1 && frame.top <= box.top + 1 && frame.bottom >= box.bottom - 1

function placeExits(source: Box, ports: { extent: number; skip: Set<string>; x: number; target: Box; straight: boolean }[], nodes: Box[], frames: Box[]) {
  const pad = Math.min(CLEAR, source.width / 4)
  const placed: number[] = []
  ports.forEach((port, index) => {
    let free: [number, number][] = [[source.left + pad, source.right - pad]]
    // Groups count as well, but only those that hold neither end.
    const walls = [...nodes, ...frames.filter((frame) => !holds(frame, source) && !holds(frame, port.target))]
    for (const node of walls) {
      if (node.id === source.id || port.skip.has(node.id)) continue
      if (node.bottom <= source.bottom || node.top >= port.extent) continue
      const lo = node.left - CLEAR
      const hi = node.right + CLEAR
      free = free.flatMap(([a, b]) => {
        if (hi <= a || lo >= b) return [[a, b] as [number, number]]
        return [[a, lo], [hi, b]].filter(([x, y]) => y! > x!) as [number, number][]
      })
    }
    // A trunk that runs past its target into a side stays SIDE_RUN away from
    // that side, so the run into it is long enough to read as an arrow.
    if (port.straight) {
      const { target } = port
      for (const [lo, hi] of [[target.left - SIDE_RUN, target.left + RADIUS], [target.right - RADIUS, target.right + SIDE_RUN]] as const) {
        free = free.flatMap(([a, b]) => {
          if (hi <= a || lo >= b) return [[a, b] as [number, number]]
          return [[a, lo], [hi, b]].filter(([x, y]) => y! > x!) as [number, number][]
        })
      }
    }
    const ideal = source.left + (source.width * (index + 1)) / (ports.length + 1)
    const floor = index ? placed[index - 1]! + CLEAR : -Infinity
    let best: number | null = null
    for (const [a, b] of free) {
      if (b < floor) continue
      const x = Math.min(Math.max(ideal, a, floor), b)
      if (best === null || Math.abs(x - ideal) < Math.abs(best - ideal)) best = x
    }
    placed.push(best ?? Math.max(ideal, floor))
  })
  return placed
}

/* In a stage layout, rows or columns, an edge to a later stage turns in
   the channel under its source when no node stands in the way. Otherwise it
   runs straight past the nodes between, as in a grid: a drop into the
   target's side, or straight into its top. Plain edges from one source
   share one trunk, as series edges do. */
function routeGrid(measured: Measured[], nodes: Box[], frames: Box[], stages: boolean, backward: "up" | "left"): Route[] {
  // A node between the two, across the span from lo to hi.
  const between = (source: Box, target: Box, lo: number, hi: number) => nodes.some((node) => node.id !== source.id && node.id !== target.id
    && node.top >= source.bottom - 1 && node.bottom <= target.top + 1 && node.right > lo && node.left < hi)
  const pairs: Pair[] = []
  for (const { edge, target, sources } of measured) {
    sources.forEach((source, index) => {
      if (source.id === target.id) return
      let kind = edge.route ?? classify(source, target)
      let blocked = false
      if (stages && !edge.route && kind === "drop" && !between(source, target, Math.min(source.left, target.left), Math.max(source.right, target.right))) kind = "down"
      else if (stages && !edge.route && kind === "down") blocked = between(source, target, Math.max(source.left, target.left), Math.min(source.right, target.right))
      if (kind) pairs.push({ edge, source, target, kind, labelled: index === 0, blocked })
      else warn(`${edge.key}:${backward}`, `Diagram: the edge ${source.id} -> ${target.id} goes ${backward}, so it is not drawn. Put the target ${backward === "up" ? "lower" : "further right"}.`)
    })
  }

  // Edges down from one source with one series share an exit and a trunk.
  const groups = new Map<string, Pair[]>()
  for (const pair of pairs.filter((item) => item.kind !== "side")) {
    const key = `${pair.source.id}\n${pair.edge.series ?? (stages ? "plain" : `#${pair.edge.key}`)}`
    groups.set(key, [...(groups.get(key) ?? []), pair])
  }
  for (const list of groups.values()) list.sort((a, b) => a.target.top - b.target.top || a.target.y - b.target.y)
  const exitOf = new Map<Pair[], number>()
  for (const sourceId of new Set(pairs.map((pair) => pair.source.id))) {
    const ports = [...groups.values()].filter((list) => list[0]!.source.id === sourceId)
    const mean = (list: Pair[]) => list.reduce((sum, pair) => sum + pair.target.x, 0) / list.length
    ports.sort((a, b) => mean(a) - mean(b))
    const source = ports[0]?.[0]!.source
    if (!source) continue
    const xs = placeExits(source, ports.map((list) => {
      const far = list[list.length - 1]!
      const straight = (!stages && list.length > 1) || far.kind === "drop" || list.some((pair) => pair.blocked)
      return { extent: straight ? far.target.y : (source.bottom + far.target.top) / 2, skip: new Set([far.target.id]), x: mean(list), target: far.target, straight }
    }), nodes, frames)
    ports.forEach((list, index) => exitOf.set(list, xs[index]!))
  }

  const joined = (plan: { pair: Pair }) => stages && pairs.filter((pair) => pair.edge === plan.pair.edge && pair.target === plan.pair.target).length > 1
  // How each pair arrives: through the top, or into a side.
  type Plan = { pair: Pair; x: number; enter: "top" | "left" | "right"; fixed?: number; near?: boolean }
  const plans: Plan[] = []
  for (const [list, x] of exitOf) {
    list.forEach((pair, index) => {
      const far = index === list.length - 1
      const { target } = pair
      if (pair.kind === "down" && (!far || list.length === 1 || stages) && !pair.blocked) {
        plans.push({ pair, x, enter: "top", near: !far && (!stages || list.length > 1) })
      } else if (pair.kind === "down" && x >= target.left + RADIUS && x <= target.right - RADIUS) {
        plans.push({ pair, x, enter: "top", fixed: x })
      } else {
        plans.push({ pair, x, enter: x < target.x ? "left" : "right", near: !far })
      }
    })
  }
  for (const pair of pairs.filter((item) => item.kind === "side")) {
    plans.push({ pair, x: pair.source.x, enter: pair.source.x < pair.target.x ? "left" : "right" })
  }

  // Entries spread along each side they use. On the top, in the order of
  // their exits. On a side, edges from above come first, the nearest on top,
  // then edges from beside, so none of them crosses another.
  const entry = new Map<Plan, number>()
  for (const id of new Set(plans.map((plan) => plan.pair.target.id))) {
    const here = plans.filter((plan) => plan.pair.target.id === id)
    const target = here[0]!.pair.target
    // In a stage layout the sources of one edge join and come in at one
    // point, so a fan-in reads as one edge.
    const slots = new Map<unknown, Plan[]>()
    for (const plan of here.filter((item) => item.enter === "top" && item.fixed === undefined)) {
      const slot = joined(plan) ? plan.pair.edge : plan
      slots.set(slot, [...(slots.get(slot) ?? []), plan])
    }
    const xOf = (list: Plan[]) => list.reduce((sum, plan) => sum + plan.x, 0) / list.length
    const top = [...slots.values()].sort((a, b) => xOf(a) - xOf(b))
    top.forEach((list, index) => list.forEach((plan) => entry.set(plan, target.left + (target.width * (index + 1)) / (top.length + 1))))
    // A single edge into the top whose exit already sits over the target
    // comes straight down, with no step.
    const only = top.length === 1 && top[0]!.length === 1 ? top[0]![0]! : undefined
    if (only && only.x >= target.left + RADIUS && only.x <= target.right - RADIUS) entry.set(only, only.x)
    for (const plan of here.filter((item) => item.fixed !== undefined)) entry.set(plan, plan.fixed!)
    for (const side of ["left", "right"] as const) {
      const list = here.filter((plan) => plan.enter === side)
      const fromAbove = list.filter((plan) => plan.pair.kind !== "side").sort((a, b) => side === "left" ? b.x - a.x : a.x - b.x)
      const fromBeside = list.filter((plan) => plan.pair.kind === "side").sort((a, b) => a.pair.source.y - b.pair.source.y)
      ;[...fromAbove, ...fromBeside].forEach((plan, index, all) => entry.set(plan, target.top + (target.height * (index + 1)) / (all.length + 1)))
    }
  }

  // Lanes: a down route turns midway between its source and its target. In
  // a stage layout a trunk's down routes share the channel under the source
  // and one track in it, so they part at one fork.
  const listOf = new Map<Pair, Pair[]>()
  for (const list of exitOf.keys()) for (const pair of list) listOf.set(pair, list)
  const downs = plans.filter((plan) => plan.enter === "top" && plan.fixed === undefined)
  // A lane keeps out of the nodes and of the groups that hold neither of
  // its ends, across the width it runs. When the middle is taken, it moves
  // to the middle of the widest gap left.
  const trackOf = (plan: Plan): unknown => !stages ? plan : joined(plan) ? plan.pair.edge : listOf.get(plan.pair)
  const lanes = new Map<Plan, number>()
  for (const key of new Set(downs.map(trackOf))) {
    const here = downs.filter((plan) => trackOf(plan) === key)
    const ends = here.flatMap((plan) => [plan.pair.source, plan.pair.target])
    const top = Math.max(...here.map((plan) => plan.pair.source.bottom))
    const bottom = Math.min(...here.map((plan) => plan.pair.target.top))
    const mid = (top + bottom) / 2
    const lo = Math.min(...here.flatMap((plan) => [plan.x, entry.get(plan)!])) - CLEAR
    const hi = Math.max(...here.flatMap((plan) => [plan.x, entry.get(plan)!])) + CLEAR
    const walls = [
      ...nodes.filter((node) => !ends.some((end) => end.id === node.id)),
      ...frames.filter((frame) => !ends.some((end) => holds(frame, end))),
    ]
    let free: [number, number][] = [[top + RADIUS, bottom - RADIUS]]
    for (const wall of walls) {
      if (wall.right <= lo || wall.left >= hi) continue
      const a = wall.top - TRACK
      const b = wall.bottom + TRACK
      free = free.flatMap(([x, y]) => b <= x || a >= y ? [[x, y] as [number, number]] : ([[x, a], [b, y]] as [number, number][]).filter(([m, n]) => n > m))
    }
    const widest = [...free].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0]
    const lane = free.some(([a, b]) => a <= mid && mid <= b) || !widest ? mid : (widest[0] + widest[1]) / 2
    for (const plan of here) lanes.set(plan, lane)
  }
  const spans = new Map<unknown, { lane: number; left: number; right: number }>()
  for (const plan of downs) {
    const ex = entry.get(plan)!
    const lane = Math.round(lanes.get(plan)! / 2)
    const span = spans.get(trackOf(plan))
    const left = Math.min(plan.x, ex, span?.left ?? Infinity)
    const right = Math.max(plan.x, ex, span?.right ?? -Infinity)
    spans.set(trackOf(plan), { lane, left, right })
  }
  const offsets = tracks([...spans].map(([item, span]) => ({ item, ...span })))

  const routes: Route[] = []
  const splits = new Map<Pair[], number>()
  for (const plan of plans) {
    const { pair } = plan
    const { edge, source, target } = pair
    const key = `${edge.key}:${source.id}`
    const ends: [string, string] = [source.id, target.id]
    let points: Pt[]
    const at = entry.get(plan)!
    if (pair.kind === "side") {
      const tx = plan.enter === "left" ? target.left : target.right
      const sx = plan.enter === "left" ? source.right : source.left
      // A side edge steps only when it must. It runs level at the height
      // nearest its spread entry that both nodes share and that keeps clear
      // of the other edges on the two sides it uses: those entering the
      // target's side, and those entering the source's side it leaves by.
      let at = entry.get(plan)!
      const lo = Math.max(source.top, target.top) + RADIUS
      const hi = Math.min(source.bottom, target.bottom) - RADIUS
      const exitSide = plan.enter === "left" ? "right" : "left"
      const taken = plans.filter((item) => item !== plan && (
        (item.pair.target.id === target.id && item.enter === plan.enter) ||
        (item.pair.target.id === source.id && item.enter === exitSide)
      )).map((item) => entry.get(item)!)
      if (lo <= hi) {
        const clamp = (y: number) => Math.min(Math.max(y, lo), hi)
        const tries = [at, ...taken.flatMap((y) => [y - CLEAR, y + CLEAR])].map(clamp)
        const level = tries.filter((y) => taken.every((other) => Math.abs(other - y) >= CLEAR))
          .sort((a, b) => Math.abs(a - at) - Math.abs(b - at))[0]
        if (level !== undefined) at = level
      }
      const inside = at >= source.top + RADIUS && at <= source.bottom - RADIUS
      const mx = (sx + tx) / 2
      points = clean(inside ? [[sx, at], [tx, at]] : [[sx, source.y], [mx, source.y], [mx, at], [tx, at]])
      routes.push({
        key, points, arrow: true, look: look(edge), ends,
        label: pair.labelled && edge.label ? { text: edge.label, run: points.length - 2, along: points.length === 2 ? 0.5 : 0, room: Math.abs(tx - sx) - ARROW } : undefined,
      })
      continue
    }
    if (plan.enter === "top" && plan.fixed === undefined) {
      const my = lanes.get(plan)! + (offsets.get(trackOf(plan)) ?? 0)
      points = clean([[plan.x, source.bottom], [plan.x, my], [at, my], [at, target.top]])
    } else if (plan.enter === "top") {
      points = [[plan.x, source.bottom], [plan.x, target.top]]
    } else {
      points = clean([[plan.x, source.bottom], [plan.x, at], [plan.enter === "left" ? target.left : target.right, at]])
    }
    let dot: Pt | undefined
    if (plan.near && points.length > 2) {
      // A nearer edge leaves the shared trunk at a dot, just before its turn.
      const turn = points[1]!
      dot = [plan.x, turn[1] - RADIUS]
      points = [dot, ...points.slice(1)]
      const list = [...exitOf.keys()].find((item) => item.includes(pair))!
      splits.set(list, Math.max(splits.get(list) ?? 0, dot[1] - source.bottom + RADIUS))
    }
    const run = longestVertical(points)
    routes.push({ key, points, arrow: true, look: look(edge), ends, dot, label: pair.labelled && edge.label ? { text: edge.label, run } : undefined })
  }
  // The far edge's label keeps clear of the stub above its splits.
  for (const [list, from] of splits) {
    const far = list[list.length - 1]!
    const route = routes.find((item) => item.key === `${far.edge.key}:${far.source.id}`)
    if (route?.label && route.label.run === 0) route.label.from = from + 4
  }
  if (stages) fork(routes, plans, listOf)
  checkNodes(routes, nodes)
  return routes
}

/* The segment of a path that holds a point, or -1. */
function holding(points: Pt[], at: Pt) {
  return points.findIndex((a, j) => {
    const b = points[j + 1]
    return !!b && Math.min(a[0], b[0]) - 0.5 <= at[0] && at[0] <= Math.max(a[0], b[0]) + 0.5
      && Math.min(a[1], b[1]) - 0.5 <= at[1] && at[1] <= Math.max(a[1], b[1]) + 0.5
  })
}

/* Sets a route's path. Its label moves to the longest run of the new path,
   since the old index no longer points at the same run. */
function reshape(route: Route, points: Pt[]) {
  route.points = points
  if (route.label) route.label = { text: route.label.text, run: longestVertical(points) }
}

/* In a stage layout a trunk parts in the channel. When its branches all
   turn one way, they part where the nearest one turns into its target, and
   each branch starts there; when they go both ways, they part at the fork.
   A trunk whose edges differ in look is drawn plain up to where the last
   branch leaves it, whatever way the branches go. */
function fork(routes: Route[], plans: { pair: Pair; enter: string; fixed?: number }[], listOf: Map<Pair, Pair[]>) {
  const keyOf = (pair: Pair) => `${pair.edge.key}:${pair.source.id}`
  for (const list of new Set(listOf.values())) {
    if (list.length < 2) continue
    const here = list.map((pair) => ({ pair, route: routes.find((item) => item.key === keyOf(pair))! })).filter((item) => item.route)
    const farPair = list[list.length - 1]!
    const same = list.every(({ edge }) => edge.line === list[0]!.edge.line && edge.tone === list[0]!.edge.tone && edge.series === list[0]!.edge.series && edge.flow === list[0]!.edge.flow)
    const lane = here.filter(({ pair }) => plans.find((plan) => plan.pair === pair)?.enter === "top")
    if (lane.length !== here.length || lane.length < 2) {
      // Branches that leave a straight trunk at their own dots: the far
      // edge gives up the trunk above the last dot when the looks differ.
      const far = here.find(({ pair }) => pair === farPair)?.route
      if (same || !far) continue
      const start = far.points[0]!
      const dots = here.flatMap(({ route: item }) => item !== far && item.dot ? [item.dot] : [])
      const split = dots.sort((a, b) => dist(start, b) - dist(start, a))[0]
      const j = split ? holding(far.points, split) : -1
      if (!split || j < 0) continue
      routes.push({ key: `${keyOf(list[0]!)}:trunk`, points: clean([...far.points.slice(0, j + 1), split]), arrow: false, look: {} })
      reshape(far, clean([split, ...far.points.slice(j + 1)]))
      continue
    }
    // Every branch here runs down from the exit to the lane, along it, and
    // down into its target: a start, a turn into the lane, a turn out.
    const full = here.map(({ pair, route: item }) => ({
      pair, item, points: pair === farPair ? item.points : [[item.points[0]![0], pair.source.bottom] as Pt, ...item.points.slice(1)],
    }))
    const exit = full[0]!.points[0]!
    const my = Math.min(...full.map(({ points }) => points[1]![1]))
    const sides = new Set(full.map(({ points }) => Math.sign(Math.round(points[points.length - 1]![0] - exit[0]))))
    let split: Pt
    if (sides.size > 1 || sides.has(0)) split = [exit[0], my - RADIUS]
    else {
      const dir = [...sides][0]!
      const nearest = full.reduce((a, b) => Math.abs(a.points[a.points.length - 1]![0] - exit[0]) <= Math.abs(b.points[b.points.length - 1]![0] - exit[0]) ? a : b)
      split = [nearest.points[nearest.points.length - 1]![0] - dir * RADIUS, my]
    }
    for (const { pair, item, points } of full) {
      item.dot = undefined
      const j = holding(points, split)
      if (!(pair === farPair && same) && j >= 0) reshape(item, clean([split, ...points.slice(j + 1)]))
      else if (points !== item.points) reshape(item, points)
    }
    full.find(({ pair }) => pair === farPair)!.item.dot = split
    if (!same) {
      const trunk = full.find(({ pair }) => pair === farPair)!.points
      const j = holding(trunk, split)
      if (j >= 0) routes.push({ key: `${keyOf(list[0]!)}:trunk`, points: clean([...trunk.slice(0, j + 1), split]), arrow: false, look: {} })
    }
  }
}

function longestVertical(points: Pt[]) {
  let best = points.length - 2
  let length = -1
  for (let j = 0; j < points.length - 1; j++) {
    const a = points[j]!
    const b = points[j + 1]!
    if (isVertical(a, b) && dist(a, b) > length) {
      best = j
      length = dist(a, b)
    }
  }
  return best
}

const warned = new Set<string>()
function warn(key: string, message: string) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/* Kiso does not route around nodes. A run through one says the layout needs
   a change, so it is reported once. */
function checkNodes(routes: Route[], nodes: Box[]) {
  for (const route of routes) {
    for (let j = 0; j < route.points.length - 1; j++) {
      const [ax, ay] = route.points[j]!
      const [bx, by] = route.points[j + 1]!
      for (const node of nodes) {
        if (route.ends?.includes(node.id)) continue
        const hit = Math.max(ax, bx) > node.left + 1 && Math.min(ax, bx) < node.right - 1
          && Math.max(ay, by) > node.top + 1 && Math.min(ay, by) < node.bottom - 1
        if (hit) warn(`${route.key}>${node.id}`, `Diagram: the edge ${route.key.split(":")[0]} runs through the node "${node.id}". Move the node, or set route on the edge.`)
      }
    }
  }
}

/* ------------------------------------------------------------------------
   Drawing: crossings, paths and labels for any layout.
   ------------------------------------------------------------------------ */

type Straight = { route: number; seg: number; vertical: boolean; at: number; a: number; b: number; ending: boolean }
type Line = { at: number; lo: number; hi: number; route?: number; seg?: number }
type Crossing = { t: number; at: number; line: Line }

export function draw(
  routes: Route[],
  frames: Frame[],
  crossings: DiagramCrossings,
  labels: DiagramLabels,
  measure: (text: string) => { width: number; height: number },
): Drawn {
  const shapes = routes.map((route) => ({ points: route.points, rad: radii(route.points) }))
  const straights: Straight[] = []
  shapes.forEach(({ points, rad }, i) => {
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

  const drawn: Drawn = { paths: [], labels: [], plates, dots: [] }
  routes.forEach((route, i) => {
    const { points, rad } = shapes[i]!
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
    drawn.paths.push({ key: route.key, d, arrow: route.arrow, ...route.look })
    if (route.dot) drawn.dots.push({ key: route.key, x: route.dot[0], y: route.dot[1], ...route.look })
    if (route.label) {
      const placed = place(route, found, i, labels, measure, frames)
      if (placed) drawn.labels.push(placed)
    }
  })
  return drawn
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
  const middle = (start + end) / 2
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
