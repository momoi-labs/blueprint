/* Edge geometry for Diagram: routes as polylines, then crossings, paths and
   labels. Pure functions over measured boxes, so the component only measures
   and renders. */

export type DiagramEdgeLine = "solid" | "dashed" | "dotted"
export type DiagramEdgeTone = "neutral" | "success" | "danger"
export type DiagramEdgeRoute = "side" | "down" | "drop"
export type DiagramCrossings = "none" | "hop" | "gap"
export type DiagramLabels = "auto" | "horizontal" | "vertical"
export type DiagramEdgeShape = "orthogonal" | "curve" | "straight" | "sketch"
export type DiagramArrow = "triangle" | "chevron" | "stealth" | "dot" | "sketch" | "none"

export type EdgeLook = { line?: DiagramEdgeLine; tone?: DiagramEdgeTone; series?: number; flow?: boolean; shape?: DiagramEdgeShape; head?: DiagramArrow }
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
  /** `arrow` says whether the path gets a head, `head` which one. `knock`
      is drawn just before the path, in the card colour, to break the lines
      it crosses. */
  paths: (EdgeLook & { key: string; d: string; arrow: boolean; head: DiagramArrow; knock?: string })[]
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
  // Straight. Ports are picked for elbows, so a steep line into a side comes
  // in through the top or bottom instead, 20px clear of the corners, with a
  // straight SETTLE run into it.
  let end = E
  let stub: Pt | null = null
  const box = route.ends ? boxes?.get(route.ends[1]) : undefined
  if (box) {
    const v: Pt = [E[0] - P[0], E[1] - P[1]]
    const intoSide = Math.abs(dE[0]) > 0.5
    const clampTo = (value: number, lo: number, hi: number) => lo > hi ? (lo + hi) / 2 : Math.min(Math.max(value, lo), hi)
    if (intoSide && Math.abs(v[1]) > 1.5 * Math.abs(v[0])) {
      const x = clampTo(E[0], box.left + 20, box.right - 20)
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

/* The Diagram's own shape and head, and the measured boxes a straight edge
   needs to pick its entry face. */
export type DrawStyle = { shape?: DiagramEdgeShape; arrow?: DiagramArrow; boxes?: Map<string, Box> }

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
      } else if (route.label) {
        const placed = place(route, found, i, labels, measure, frames)
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
