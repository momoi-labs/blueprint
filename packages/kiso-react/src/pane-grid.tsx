"use client"

import * as React from "react"
import { clsx as cn } from "clsx"

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

/* A PaneGrid lays summary panes out on twelve columns. A row is a group of
   panes; its panes flow onto as many lines as they need, or onto one
   scrolling line. The person resizes a pane at its end edge and moves it by
   its title. Sizes are twelfths and never change on a move: a pane keeps the
   width it was given until the person resizes it. */

export type PaneGridLayout = {
  /* Pane ids, grouped by row and in reading order. */
  rows: string[][]
  /* Pane width in columns of twelve, by id. */
  sizes: Record<string, number>
}
export type PaneGridOverflow = "wrap" | "scroll"

const COLUMNS = 12
/* A drag ends on release, on cancellation, or when capture is lost. */
const RELEASE = ["pointerup", "pointercancel", "lostpointercapture"] as const
/* DashboardGrid's breakpoints, on the viewport like its media queries: above
   1024px twelve columns, above 640px six, then one. */
const BREAKPOINTS = [
  { query: "(max-width: 640px)", columns: 1 },
  { query: "(max-width: 1024px)", columns: 6 },
] as const
const pickColumns = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return COLUMNS
  return BREAKPOINTS.find(({ query }) => window.matchMedia(query).matches)?.columns ?? COLUMNS
}

type Spec = { id: string; min: number; size: number; newRow: boolean }
type Item = { id: string; size: number; min: number; col: number; span: number }
type Line = { row: number; used: number; free: number; scroll: boolean; items: Item[] }
type Row = { ids: string[]; lines: Line[] }
type Target = { ref: string | null; where: "before" | "after" | "newrow-before" | "newrow-end"; invalid?: boolean }

type Placement = {
  id: string
  row: number
  col: number
  span: number
  size: number
  min: number
  max: number
  compact: boolean
  stacked: boolean
  debug: boolean
}
type Api = {
  resize: (id: string, next: number) => void
  startResize: (id: string, event: React.PointerEvent<HTMLElement>) => void
  startMove: (id: string, event: React.PointerEvent<HTMLElement>) => void
  moveBy: (id: string, direction: -1 | 1) => void
  toggleRow: (id: string) => void
}
const PaneContext = React.createContext<{ placement: Placement; api: Api } | null>(null)

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/* Every pane appears exactly once, with a size at or above its minimum.
   Panes missing from the layout go to the end, or to a row of their own. */
function normalize(layout: PaneGridLayout | undefined, specs: Spec[]): PaneGridLayout {
  const known = new Map(specs.map((spec) => [spec.id, spec]))
  const seen = new Set<string>()
  const rows = (layout?.rows ?? [])
    .map((row) => row.filter((id) => known.has(id) && !seen.has(id) && seen.add(id)))
    .filter((row) => row.length)
  for (const spec of specs) {
    if (seen.has(spec.id)) continue
    if (spec.newRow || !rows.length) rows.push([spec.id])
    else rows[rows.length - 1]!.push(spec.id)
  }
  const sizes: Record<string, number> = {}
  for (const spec of specs) {
    sizes[spec.id] = clamp(Math.round(layout?.sizes[spec.id] ?? spec.size), spec.min, COLUMNS)
  }
  return { rows, sizes }
}

function sameLayout(a: PaneGridLayout, b: PaneGridLayout) {
  return (
    a.rows.length === b.rows.length &&
    a.rows.every((row, index) => row.length === b.rows[index]!.length && row.every((id, at) => id === b.rows[index]![at])) &&
    Object.keys(a.sizes).length === Object.keys(b.sizes).length &&
    Object.entries(a.sizes).every(([id, size]) => b.sizes[id] === size)
  )
}

/* Lay a row's panes out on lines. In order by default, so the person's
   arrangement holds; with `pack`, big panes first and small ones fill the
   holes left behind. With `scroll`, one line however wide. `fill` hands a
   line's leftover columns to its panes, for display only. */
function layRow(
  ids: string[],
  specs: Map<string, Spec>,
  sizes: Record<string, number>,
  columns: number,
  options: { fill: boolean; pack: boolean; scroll: boolean },
): Omit<Line, "row">[] {
  const scale = (value: number) => clamp(Math.ceil((value * columns) / COLUMNS), 1, columns)
  let items = ids.map((id) => ({ id, size: scale(sizes[id]!), min: scale(specs.get(id)!.min), col: 1, span: 0 }))
  if (options.pack && !options.scroll) items = [...items].sort((a, b) => b.size - a.size)
  const lines: Omit<Line, "row">[] = []
  for (const item of items) {
    let line = options.pack && !options.scroll ? lines.find((line) => line.used + item.size <= columns) : lines[lines.length - 1]
    if (!line || (!options.scroll && line.used + item.size > columns)) {
      line = { used: 0, free: 0, scroll: false, items: [] }
      lines.push(line)
    }
    line.items.push(item)
    line.used += item.size
  }
  for (const line of lines) {
    line.scroll = options.scroll && line.used > columns
    line.free = Math.max(0, columns - line.used)
    const extra = line.items.map(() => 0)
    if (options.fill && !line.scroll) for (let left = line.free, at = 0; left > 0; left--, at++) extra[at % extra.length]!++
    let col = 1
    line.items.forEach((item, index) => {
      item.col = col
      item.span = item.size + extra[index]!
      col += item.span
    })
  }
  return lines
}

export type PaneGridProps = Omit<React.ComponentProps<"section">, "title"> & {
  /* Optional heading above the panes. */
  title?: React.ReactNode
  /* Controlled layout. Omit it and the grid keeps its own. */
  layout?: PaneGridLayout
  defaultLayout?: PaneGridLayout
  onLayoutChange?: (layout: PaneGridLayout) => void
  /* Rows align heights; masonry places natural-height panes in the shortest space. */
  flow?: "rows" | "masonry"
  /* What a row does when its panes exceed twelve columns. */
  overflow?: PaneGridOverflow
  /* Hand a line's leftover columns to its panes. */
  fill?: boolean
  /* Order each row's panes by size so lines fill up. */
  pack?: boolean
  /* With `overflow="scroll"`, how many screens a row may span. */
  scrollPages?: number
  /* Show each row's columns, the free columns and each pane's size bounds.
     A development aid for products tuning their panes. */
  debug?: boolean
}

export function PaneGrid({
  title,
  layout: controlled,
  defaultLayout,
  onLayoutChange,
  overflow = "wrap",
  flow = "rows",
  fill = false,
  pack = false,
  scrollPages = 2,
  debug = false,
  className,
  children,
  ...props
}: PaneGridProps) {
  const elements = new Map<string, React.ReactElement<GridPaneProps>>()
  const specs: Spec[] = []
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement<GridPaneProps>(child) || typeof child.props.id !== "string") continue
    elements.set(child.props.id, child)
    specs.push({ id: child.props.id, min: child.props.min ?? 1, size: child.props.size ?? 6, newRow: !!child.props.newRow })
  }
  const specMap = new Map(specs.map((spec) => [spec.id, spec]))

  const [internal, setInternal] = React.useState(() => normalize(defaultLayout, specs))
  const layout = normalize(controlled ?? internal, specs)
  const update = (next: PaneGridLayout) => {
    if (sameLayout(next, layout)) return
    if (!controlled) setInternal(next)
    onLayoutChange?.(next)
  }

  const bodyRef = React.useRef<HTMLDivElement>(null)
  const dropRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const [columns, setColumns] = React.useState(COLUMNS)
  useIsomorphicLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === "undefined") return
    const measure = () => setWidth(body.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [])
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const update = () => setColumns(pickColumns())
    update()
    const lists = BREAKPOINTS.map(({ query }) => window.matchMedia(query))
    lists.forEach((list) => list.addEventListener("change", update))
    return () => lists.forEach((list) => list.removeEventListener("change", update))
  }, [])
  const compact = columns !== COLUMNS
  const stacked = columns === 1
  const scrolling = overflow === "scroll" && !stacked
  const masonry = flow === "masonry" && overflow === "wrap"
  const scrollMax = columns * Math.max(1, scrollPages)

  let gridRow = 0
  const rows: Row[] = layout.rows.map((ids) => {
    const lines = layRow(ids, specMap, layout.sizes, columns, { fill: fill && !masonry, pack, scroll: scrolling }).map((line) => ({ ...line, row: ++gridRow }))
    return { ids, lines }
  })

  // Pixel tracks keep natural heights while sharing the same column grid.
  // Observe direct children only: nested PaneGrids own their measurements.
  useIsomorphicLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || !masonry) return
    const panes = Array.from(body.children).filter((node): node is HTMLElement =>
      node instanceof HTMLElement && node.hasAttribute("data-pane-id"))
    const byId = new Map(panes.map(pane => [pane.dataset.paneId!, pane]))
    const measure = () => {
      const gap = parseFloat(getComputedStyle(body).columnGap) || 0
      const heights = new Map(panes.map(pane => [pane.dataset.paneId!, pane.getBoundingClientRect().height]))
      let base = 0
      rows.forEach((row, index) => {
        const bottoms = Array<number>(columns).fill(base)
        const items = row.lines.flatMap(line => line.items)
        if (pack) items.sort((a, b) => b.size - a.size)
        for (const item of items) {
          const pane = byId.get(item.id)
          if (!pane) continue
          let col = 0
          let top = Infinity
          for (let start = 0; start <= columns - item.span; start++) {
            const candidate = Math.max(...bottoms.slice(start, start + item.span))
            if (candidate < top) { col = start; top = candidate }
          }
          const height = Math.ceil(heights.get(item.id) ?? 0)
          pane.style.setProperty("--masonry-r", String(Math.ceil(top) + 1))
          pane.style.setProperty("--masonry-c", String(col + 1))
          pane.style.setProperty("--masonry-h", String(Math.max(1, height)))
          for (let at = col; at < col + item.span; at++) bottoms[at] = top + height + gap
        }
        const rule = body.querySelector<HTMLElement>(`:scope > [data-pane-row="${index}"]`)
        rule?.style.setProperty("--masonry-r", String(Math.ceil(base) + 1))
        base = Math.max(...bottoms)
      })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    observer.observe(body)
    panes.forEach(pane => observer.observe(pane))
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  })

  /* Handlers read the latest render through this ref, so a drag that spans
     several renders never acts on a stale layout. */
  const state = React.useRef({ layout, rows, columns, compact, stacked, scrolling, masonry, scrollMax, update })
  state.current = { layout, rows, columns, compact, stacked, scrolling, masonry, scrollMax, update }

  const specsRef = React.useRef(specMap)
  specsRef.current = specMap

  const api = React.useMemo<Api>(() => {
    const paneElement = (id: string) => bodyRef.current?.querySelector<HTMLElement>(`:scope > [data-pane-id="${CSS.escape(id)}"], :scope > .pane-grid-scroll > [data-pane-id="${CSS.escape(id)}"]`)
    const lineOf = (id: string) => {
      for (const row of state.current.rows) for (const line of row.lines) if (line.items.some((item) => item.id === id)) return line
      return undefined
    }
    const gaps = () => {
      const style = bodyRef.current ? getComputedStyle(bodyRef.current) : null
      return { x: parseFloat(style?.columnGap ?? "0") || 0, y: parseFloat((state.current.masonry ? style?.columnGap : style?.rowGap) ?? "0") || 0 }
    }
    const maxOf = (id: string) => {
      const { layout, columns, scrolling, masonry, scrollMax } = state.current
      const line = lineOf(id)
      const size = layout.sizes[id]!
      if (masonry) return columns
      if (!line) return size
      return scrolling ? Math.min(columns, size + scrollMax - line.used) : size + line.free
    }

    const resize = (id: string, next: number) => {
      const { layout, compact, update } = state.current
      if (compact) return
      const spec = specsRef.current.get(id)
      if (!spec) return
      const size = clamp(Math.round(next), spec.min, maxOf(id))
      if (size === layout.sizes[id]) return
      update({ rows: layout.rows, sizes: { ...layout.sizes, [id]: size } })
    }

    const startResize = (id: string, event: React.PointerEvent<HTMLElement>) => {
      const { layout, columns, compact } = state.current
      const body = bodyRef.current
      const pane = paneElement(id)
      if (compact || !body || !pane) return
      event.preventDefault()
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)
      const startX = event.clientX
      const startSize = layout.sizes[id]!
      const columnWidth = (body.clientWidth - gaps().x * (columns - 1)) / columns + gaps().x
      handle.classList.add("dragging")
      pane.classList.add("resizing")
      const move = (moved: PointerEvent) => resize(id, startSize + Math.round((moved.clientX - startX) / columnWidth))
      const stop = () => {
        handle.classList.remove("dragging")
        pane.classList.remove("resizing")
        handle.removeEventListener("pointermove", move)
        for (const type of RELEASE) handle.removeEventListener(type, stop)
      }
      handle.addEventListener("pointermove", move)
      for (const type of RELEASE) handle.addEventListener(type, stop)
    }

    /* Where a dragged pane lands: before or after a pane on one of a row's
       lines, in the whole gap above a row as a row of its own, or after the
       last row. */
    const hitTest = (x: number, y: number, self: string): Target | null => {
      const { rows, stacked, masonry } = state.current
      const rect = (id: string) => paneElement(id)?.getBoundingClientRect()
      for (const row of rows) {
        const bands = row.lines.map((line) => {
          const rects = line.items.map((item) => rect(item.id)).filter((box): box is DOMRect => !!box)
          return { line, top: Math.min(...rects.map((box) => box.top)), bottom: Math.max(...rects.map((box) => box.bottom)) }
        })
        if (!bands.length) continue
        const top = Math.min(...bands.map(band => band.top))
        const bottom = Math.max(...bands.map(band => band.bottom))
        if (y < top) return { ref: row.ids[0]!, where: "newrow-before" }
        if (y > bottom) continue
        if (masonry) {
          const candidates = row.ids.filter(id => id !== self).flatMap(id => {
            const box = rect(id)
            if (!box) return []
            const dx = Math.max(box.left - x, 0, x - box.right)
            const dy = Math.max(box.top - y, 0, y - box.bottom)
            return [{ id, box, distance: Math.hypot(dx, dy) }]
          }).sort((a, b) => a.distance - b.distance)
          const nearest = candidates[0]
          if (!nearest) return null
          const before = stacked ? y < nearest.box.top + nearest.box.height / 2 : x < nearest.box.left + nearest.box.width / 2
          return { ref: nearest.id, where: before ? "before" : "after" }
        }
        const band = bands.reduce((near, next) =>
          Math.abs((next.top + next.bottom) / 2 - y) < Math.abs((near.top + near.bottom) / 2 - y) ? next : near)
        const items = band.line.items.filter((item) => item.id !== self)
        if (!items.length) {
          const others = row.ids.filter((id) => id !== self)
          return others.length ? { ref: others[others.length - 1]!, where: "after" } : null
        }
        for (const item of items) {
          const box = rect(item.id)
          if (!box) continue
          const before = stacked ? y < box.top + box.height / 2 : x < box.left + box.width / 2
          if (before) return { ref: item.id, where: "before" }
        }
        return { ref: items[items.length - 1]!.id, where: "after" }
      }
      return { ref: null, where: "newrow-end" }
    }

    const paint = (target: Target | null) => {
      const drop = dropRef.current
      const body = bodyRef.current
      if (!drop || !body) return
      if (!target) {
        drop.hidden = true
        return
      }
      const gap = gaps().y
      const box = body.getBoundingClientRect()
      drop.hidden = false
      drop.dataset.invalid = String(!!target.invalid)
      const ref = target.ref ? paneElement(target.ref)?.getBoundingClientRect() : null
      const across = (top: number) => {
        drop.dataset.axis = "y"
        Object.assign(drop.style, { left: "0px", width: `${box.width}px`, height: "", top: `${top}px` })
      }
      if (target.where === "newrow-end") across(box.height + gap / 2)
      else if (!ref) drop.hidden = true
      else if (target.where === "newrow-before") {
        const row = state.current.rows.find(row => row.ids.includes(target.ref!))
        const top = row ? Math.min(...row.ids.map(id => paneElement(id)?.getBoundingClientRect().top ?? ref.top)) : ref.top
        across(top - box.top - gap / 2 - 1.5)
      }
      else if (state.current.stacked) across((target.where === "before" ? ref.top - gap / 2 : ref.bottom + gap / 2) - box.top - 1.5)
      else {
        drop.dataset.axis = "x"
        const left = (target.where === "before" ? ref.left - gap / 2 : ref.right + gap / 2) - box.left - 1.5
        Object.assign(drop.style, { top: `${ref.top - box.top}px`, height: `${ref.height}px`, left: `${left}px`, width: "" })
      }
    }

    const plan = (id: string, target: Target): string[][] | null => {
      const rows = state.current.layout.rows.map((row) => row.filter((other) => other !== id))
      if (target.where === "before" || target.where === "after") {
        const row = rows.find((row) => target.ref !== null && row.includes(target.ref))
        if (!row) return null
        row.splice(row.indexOf(target.ref!) + (target.where === "after" ? 1 : 0), 0, id)
      } else if (target.where === "newrow-before") {
        const at = rows.findIndex((row) => target.ref !== null && row.includes(target.ref))
        if (at < 0) return null
        rows.splice(at, 0, [id])
      } else rows.push([id])
      return rows.filter((row) => row.length)
    }

    const exceeds = (id: string, target: Target) => {
      const { layout, scrolling, scrollMax, columns } = state.current
      if (!scrolling || (target.where !== "before" && target.where !== "after")) return false
      const row = layout.rows.find((row) => target.ref !== null && row.includes(target.ref))
      if (!row) return false
      const scale = (value: number) => clamp(Math.ceil((value * columns) / COLUMNS), 1, columns)
      return row.filter((other) => other !== id).reduce((sum, other) => sum + scale(layout.sizes[other]!), 0) + scale(layout.sizes[id]!) > scrollMax
    }

    const startMove = (id: string, event: React.PointerEvent<HTMLElement>) => {
      const pane = paneElement(id)
      if (!pane) return
      if ((event.target as HTMLElement).closest("button, a, input, select, textarea, [role='button']:not(.grid-pane-head)")) return
      event.preventDefault()
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)
      const start = { x: event.clientX, y: event.clientY }
      let active = false
      let target: Target | null = null
      const move = (moved: PointerEvent) => {
        if (!active) {
          if (Math.hypot(moved.clientX - start.x, moved.clientY - start.y) < 6) return
          active = true
          pane.classList.add("dragging")
          if (bodyRef.current) bodyRef.current.dataset.dragging = "true"
        }
        target = hitTest(moved.clientX, moved.clientY, id)
        if (target) target.invalid = exceeds(id, target)
        paint(target)
      }
      const stop = () => {
        handle.removeEventListener("pointermove", move)
        for (const type of RELEASE) handle.removeEventListener(type, stop)
        pane.classList.remove("dragging")
        delete bodyRef.current?.dataset.dragging
        paint(null)
        if (!active || !target || target.invalid) return
        const rows = plan(id, target)
        if (rows) state.current.update({ rows, sizes: state.current.layout.sizes })
      }
      handle.addEventListener("pointermove", move)
      for (const type of RELEASE) handle.addEventListener(type, stop)
    }

    const moveBy = (id: string, direction: -1 | 1) => {
      const { layout, update } = state.current
      const order = layout.rows.flat()
      const at = order.indexOf(id)
      const to = at + direction
      if (at < 0 || to < 0 || to >= order.length) return
      const other = order[to]!
      const rows = layout.rows.map((row) => row.map((entry) => (entry === id ? other : entry === other ? id : entry)))
      update({ rows, sizes: layout.sizes })
    }

    /* A pane at the start of a row rejoins the row above; anywhere else it
       starts a row of its own with the panes after it. */
    const toggleRow = (id: string) => {
      const { layout, update } = state.current
      const rows = layout.rows.map((row) => [...row])
      const at = rows.findIndex((row) => row.includes(id))
      if (at < 0) return
      const index = rows[at]!.indexOf(id)
      if (index > 0) rows.splice(at + 1, 0, rows[at]!.splice(index))
      else if (at > 0) rows[at - 1]!.push(...rows.splice(at, 1)[0]!)
      else return
      update({ rows, sizes: layout.sizes })
    }

    return { resize, startResize, startMove, moveBy, toggleRow }
  }, [])

  const placements = new Map<string, Placement>()
  for (const row of rows) {
    for (const line of row.lines) {
      for (const item of line.items) {
        const max = masonry ? columns : scrolling ? Math.min(columns, item.size + scrollMax - line.used) : item.size + line.free
        placements.set(item.id, { id: item.id, row: line.scroll ? 1 : line.row, col: item.col, span: item.span, size: item.size, min: item.min, max, compact, stacked, debug })
      }
    }
  }
  const renderPane = (id: string) => {
    const element = elements.get(id)
    const placement = placements.get(id)
    if (!element || !placement) return null
    return (
      <PaneContext.Provider key={id} value={{ placement, api }}>
        {element}
      </PaneContext.Provider>
    )
  }

  return (
    <section data-slot="pane-grid" className={cn("pane-grid", className)} {...props}>
      {title != null && <h2 data-slot="pane-grid-title" className="pane-grid-title t-h2">{title}</h2>}
      <div
        ref={bodyRef}
        data-slot="pane-grid-body"
        className="pane-grid-body"
        data-columns={columns}
        data-compact={compact ? "true" : undefined}
        data-overflow={overflow}
        data-flow={masonry ? "masonry" : "rows"}
        data-debug={debug ? "true" : undefined}
        style={{ "--pane-cols": columns, "--pane-grid-width": `${width}px` } as React.CSSProperties}
      >
        {/* One flat list keyed by pane id, so a pane that changes row keeps
            its DOM node and its focus. */}
        {rows.flatMap((row, index) => [
          (index > 0 || debug) && (
            <div key={`rule-${index}`} className="pane-grid-rule" data-pane-row={index} aria-hidden="true" style={{ "--r": row.lines[0]!.row } as React.CSSProperties}>
              {debug && `row ${index + 1} · ${row.lines.map((line) => `${line.used}/${columns}${line.scroll ? " ⇆ scroll" : ""}`).join(" + ")}`}
            </div>
          ),
          ...(masonry ? row.ids.map(renderPane) : row.lines.flatMap((line) =>
            line.scroll
              ? [
                  <div key={`scroll-${line.items[0]!.id}`} className="pane-grid-scroll" style={{ "--r": line.row, "--n": line.used } as React.CSSProperties}>
                    {line.items.map((item) => renderPane(item.id))}
                  </div>,
                ]
              : [
                  ...line.items.map((item) => renderPane(item.id)),
                  debug && !masonry && line.free > 0 && !fill && (
                    <div key={`free-${line.row}`} className="pane-grid-free" aria-hidden="true" style={{ "--r": line.row, "--c": line.used + 1, "--s": line.free } as React.CSSProperties}>
                      free {line.free}
                    </div>
                  ),
                ],
          )),
        ])}
        <div ref={dropRef} className="pane-grid-drop" aria-hidden="true" hidden />
      </div>
    </section>
  )
}

export type GridPaneProps = Omit<React.ComponentProps<"article">, "title" | "id"> & {
  /* Stable id, the key in the grid's layout. */
  id: string
  /* Heading and drag handle. Names the move and resize controls too. */
  title: string
  /* Narrowest width in columns of twelve. */
  min?: number
  /* Initial width in columns of twelve. */
  size?: number
  /* Start a row when the grid has no layout for this pane yet. */
  newRow?: boolean
  /* Compact controls beside the title. */
  actions?: React.ReactNode
}

export function GridPane({ id, title, min: _min, size: _size, newRow: _newRow, actions, className, style, children, ...props }: GridPaneProps) {
  const context = React.useContext(PaneContext)
  if (!context) throw new Error("GridPane must be a child of PaneGrid.")
  const { placement, api } = context
  return (
    <article
      data-slot="grid-pane"
      data-pane-id={id}
      className={cn("grid-pane card", className)}
      style={{ "--r": placement.row, "--c": placement.col, "--s": placement.span, ...style } as React.CSSProperties}
      {...props}
    >
      <div
        data-slot="grid-pane-head"
        className="grid-pane-head"
        role="button"
        tabIndex={0}
        aria-label={`Move ${title}`}
        onPointerDown={(event) => api.startMove(id, event)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === "ArrowLeft" || (placement.stacked && event.key === "ArrowUp")) api.moveBy(id, -1)
          else if (event.key === "ArrowRight" || (placement.stacked && event.key === "ArrowDown")) api.moveBy(id, 1)
          else if (event.key === "Enter" || event.key === " ") api.toggleRow(id)
          else return
          event.preventDefault()
        }}
      >
        <svg className="icon icon-sm grid-pane-grip" viewBox="0 0 16 16" aria-hidden="true">
          {[4, 8, 12].map((y) => [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="currentColor" stroke="none" />))}
        </svg>
        <h3 data-slot="grid-pane-title" className="grid-pane-title t-h3">{title}</h3>
        {placement.debug && <span className="grid-pane-meta">size={placement.size} · min={placement.min} · max={placement.max}</span>}
        {actions != null && <div data-slot="grid-pane-actions" className="grid-pane-actions">{actions}</div>}
      </div>
      <div data-slot="grid-pane-body" className="grid-pane-body">{children}</div>
      {!placement.compact && (
        <div
          data-slot="grid-pane-resizer"
          className="grid-pane-resizer"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={`Resize ${title}`}
          aria-valuenow={placement.size}
          aria-valuemin={placement.min}
          aria-valuemax={placement.max}
          aria-disabled={placement.min === placement.max || undefined}
          onPointerDown={(event) => api.startResize(id, event)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") api.resize(id, placement.size + 1)
            else if (event.key === "ArrowLeft") api.resize(id, placement.size - 1)
            else if (event.key === "Home") api.resize(id, placement.min)
            else if (event.key === "End") api.resize(id, placement.max)
            else return
            event.preventDefault()
          }}
        />
      )}
    </article>
  )
}
