import * as React from "react"
import { clsx as cn } from "clsx"
import { ChevronDown, ChevronUp, Container, Database, GitBranch, Route, Server, type LucideIcon } from "lucide-react"

import { Badge } from "./badge.js"
import { Card } from "./card.js"
import { chartColor } from "./chart-data.js"
import { StatusBadge, type StatusTone } from "./status-badge.js"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"
import {
  draw, route,
  type Box, type DiagramArrow, type DiagramCrossings, type DiagramEdgeLine, type DiagramEdgeRoute, type DiagramEdgeShape, type DiagramEdgeTone, type DiagramLabels,
  type Drawn, type EdgeSpec, type Frame, type Measured,
} from "./diagram-routes.js"

export type { DiagramArrow, DiagramCrossings, DiagramEdgeLine, DiagramEdgeRoute, DiagramEdgeShape, DiagramEdgeTone, DiagramLabels }

/* A Diagram is stages of nodes, columns read left to right or rows read top
   to bottom, with edges drawn between them. Nodes are Cards, so they take the theme's frame, marks and corners.
   The canvas fills the panel and wraps node text before it scrolls, so a
   long name never widens the drawing while there is room to break it. */

export type DiagramKind = "route" | "service" | "repository" | "image" | "database"

/* The same values as the shell's `data-background-style`, minus the Momoi
   signatures, which belong to one shell and not to every diagram on a page. */
export type DiagramBackground = "solid" | "dots" | "grid" | "crosses" | "construction" | "guides" | "fibers"

/* A status dashes the frame and adds a badge. Running is the default and
   draws nothing, so a healthy diagram stays quiet. */
export type DiagramStatus = "stopped" | "failed"

/* Right reads columns left to right; down reads rows top to bottom; grid
   lays nodes in shared columns and lets each edge pick its route. */
export type DiagramDirection = "right" | "down" | "grid"

/* The number of dash patterns in ui.css. Series past it reuse a dash with a
   new colour, so the pair stays unique. */
const DASHES = 5
const dashOf = (series: number) => ((Math.max(1, Math.round(series)) - 1) % DASHES) + 1

type Registry = {
  nodes: Map<string, HTMLElement>
  register: (id: string, element: HTMLElement | null) => void
  addEdge: (edge: EdgeSpec) => () => void
  /** Draws the edges again, after a group folds or opens. */
  refresh: () => void
  direction: DiagramDirection
}

const DiagramContext = React.createContext<Registry | null>(null)

function useRegistry(part: string) {
  const registry = React.useContext(DiagramContext)
  if (!registry) throw new Error(`${part} must be inside <Diagram>`)
  return registry
}

/* Each kind carries its default label, icon and tone. The tone colours the
   rail and the icon; the frame stays neutral so the kind reads at a glance
   without turning the node into a status. */
const kinds: Record<DiagramKind, { label: string; tone: "neutral" | "primary" | "info"; icon: LucideIcon }> = {
  route: { label: "Route", tone: "neutral", icon: Route },
  service: { label: "Service", tone: "primary", icon: Server },
  repository: { label: "Git repository", tone: "primary", icon: GitBranch },
  image: { label: "Container image", tone: "primary", icon: Container },
  database: { label: "Database", tone: "info", icon: Database },
}

/* Heads other than the triangle, in the same 10 by 10 box with the tip at
   x 10 and the marker's reference at x 9, so each sits where the triangle
   does. Open heads are strokes; ui.css paints them. */
const heads: Record<Exclude<DiagramArrow, "triangle" | "none">, React.ReactNode> = {
  chevron: <path d="M 2 1.5 L 9.5 5 L 2 8.5" />,
  stealth: <path d="M 0 0 L 10 5 L 0 10 L 3 5 z" />,
  dot: <circle cx="6.6" cy="5" r="3.4" />,
  sketch: <path d="M 0.6 1.8 Q 4.6 2.6 9.4 5.4 M 2 9.8 Q 5 6.8 9.6 4.9" />,
}

const statuses: Record<DiagramStatus, { label: string; tone: StatusTone }> = {
  stopped: { label: "Stopped", tone: "neutral" },
  failed: { label: "Failed", tone: "danger" },
}


/* The appearance attributes from the tokens contract. Unset means the nodes
   follow the panels around them; set, they open a nested appearance scope. */
export type DiagramBorderStyle = "solid" | "none" | "rail" | "dash" | "bevel" | "double" | "base" | "offset" | "manga" | "brush"
export type DiagramCornerStyle = "square" | "rounded" | "asym" | "pixel"
export type DiagramCornerSize = "off" | "small" | "medium" | "large"
export type DiagramCornerMarks = "none" | "ticks" | "brackets" | "arcs" | "diagonal" | "dots"

export type DiagramFrameProps = {
  borderStyle?: DiagramBorderStyle
  cornerStyle?: DiagramCornerStyle
  cornerSize?: DiagramCornerSize
  cornerMarks?: DiagramCornerMarks
}

export type DiagramProps = Omit<React.ComponentProps<"div">, "children"> & DiagramFrameProps & {
  /** Names the drawing for assistive technology. */
  label: string
  /** `right` (default) reads DiagramColumns left to right; `down` reads
      DiagramRows top to bottom; `grid` lays bands of DiagramColumns on
      shared columns, and each edge picks its route. */
  direction?: DiagramDirection
  /** The number of shared columns in a grid. */
  columns?: number
  /** How an edge draws where it crosses a frame or another edge. */
  crossings?: DiagramCrossings
  /** `auto` turns a label on a vertical run when it fits. */
  labels?: DiagramLabels
  /** How edges are drawn: `orthogonal` (default) with rounded elbows,
      `curve`, `straight`, or `sketch`, hand drawn. A DiagramEdge's `shape`
      overrides it. */
  edges?: DiagramEdgeShape
  /** The head at the end of each edge. Unset is `triangle`, or `sketch` on a
      sketched edge. A DiagramEdge's `arrow` overrides it. */
  arrow?: DiagramArrow
  /** A footer inside the card, under a rule, such as the key of the series
      edges built from DiagramEdgeKey. */
  footer?: React.ReactNode
  /** Unset follows the page's canvas; a page with no canvas gets dots. */
  background?: DiagramBackground
  strength?: "quiet" | "visible"
  children: React.ReactNode
}

function Diagram({ label, direction = "right", columns, crossings = "none", labels = "auto", edges: shape, arrow, footer, background, strength, borderStyle, cornerStyle, cornerSize, cornerMarks, className, children, ...props }: DiagramProps) {
  const frame = React.useRef<HTMLDivElement>(null)
  const scroll = React.useRef<HTMLDivElement>(null)
  const lanes = React.useRef<HTMLDivElement>(null)
  const svg = React.useRef<SVGSVGElement>(null)
  const nodes = React.useRef(new Map<string, HTMLElement>()).current
  const [registered, setRegistered] = React.useState<EdgeSpec[]>([])
  const [version, setVersion] = React.useState(0)
  const [drawn, setDrawn] = React.useState<Drawn>({ paths: [], labels: [], plates: [], dots: [] })
  const marker = `${React.useId()}arrow`

  const register = React.useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodes.set(id, element)
    else nodes.delete(id)
    setVersion((value) => value + 1)
  }, [nodes])
  const addEdge = React.useCallback((edge: EdgeSpec) => {
    setRegistered((list) => [...list, edge])
    return () => setRegistered((list) => list.filter((item) => item !== edge))
  }, [])
  const refresh = React.useCallback(() => setVersion((value) => value + 1), [])
  const context = React.useMemo(() => ({ nodes, register, addEdge, refresh, direction }), [nodes, register, addEdge, refresh, direction])

  const labelSizes = React.useRef(new Map<string, { width: number; height: number }>())
  useIsomorphicLayoutEffect(() => {
    const root = frame.current
    const region = scroll.current
    if (!root || !region) return
    // Lay the drawing out wrapped to the panel first. If it still overflows,
    // wrapping only cramps it, so it takes its natural width and scrolls.
    const fit = () => {
      root.removeAttribute("data-overflow")
      // A node wider than its stage, such as a card with an unbroken URL in
      // a group, spills past the lanes without widening them, so its spill
      // counts as well.
      if (root.offsetWidth > region.clientWidth || root.scrollWidth > root.clientWidth + 1) root.setAttribute("data-overflow", "")
    }
    const layout = (pass: number) => {
      fit()
      const origin = root.getBoundingClientRect()
      const place = (rect: DOMRect) => ({
        left: rect.left - origin.left, right: rect.right - origin.left,
        top: rect.top - origin.top, bottom: rect.bottom - origin.top,
        width: rect.width, height: rect.height,
      })
      // A node inside a folded group is hidden, so its edges reach the
      // outermost folded group around it instead.
      const elements = new Map<string, Element>(nodes)
      const proxies = new Map<Element, string>()
      const resolve = (id: string) => {
        const element = nodes.get(id)
        if (!element) return null
        let folded: Element | null = null
        for (let item = element.closest('.diagram-group[data-open="false"]'); item; item = item.parentElement?.closest('.diagram-group[data-open="false"]') ?? null) folded = item
        if (!folded) return id
        let proxy = proxies.get(folded)
        if (!proxy) {
          proxy = `group:${proxies.size}`
          proxies.set(folded, proxy)
          elements.set(proxy, folded)
        }
        return proxy
      }
      const box = (id: string): Box | null => {
        const element = elements.get(id)
        if (!element) return null
        const rect = place(element.getBoundingClientRect())
        // A node in a DiagramNodeGroup is one part of a stacked card. Read
        // top to bottom, its edges leave and enter the card's own top and
        // bottom, so they never cross the parts above or below it.
        const card = direction !== "right" && !proxies.has(element) ? element.closest(".diagram-node-group")?.getBoundingClientRect() : undefined
        if (card) {
          rect.top = card.top - origin.top
          rect.bottom = card.bottom - origin.top
          rect.height = card.height
        }
        // A folded frame carries its title on its top border, so an edge
        // into its top ends just under the title instead of behind it.
        const name = proxies.has(element) ? element.querySelector(":scope > .diagram-group-title")?.getBoundingClientRect() : undefined
        if (name) {
          const top = name.bottom - origin.top
          rect.height -= top - rect.top
          rect.top = top
        }
        return { ...rect, id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }
      // An edge inside one folded group is not drawn, and edges that now
      // join the same ends with the same look are drawn once.
      const seen = new Set<string>()
      const measured: Measured[] = registered.flatMap((edge) => {
        const to = resolve(edge.to)
        if (!to) return []
        // Each source and target pair is drawn once per look, so edges whose
        // source lists overlap after folding do not repeat a connection.
        const looks = `${edge.series ?? ""}|${edge.line ?? ""}|${edge.tone ?? ""}|${edge.shape ?? ""}|${edge.head ?? ""}`
        const resolved = [...new Set(edge.from.map(resolve))].filter((id): id is string => !!id && id !== to)
        const folded = to !== edge.to || resolved.length !== edge.from.length || resolved.some((id, index) => id !== edge.from[index])
        const from = folded ? resolved.filter((id) => !seen.has(`${id}->${to}|${looks}`)) : resolved
        for (const id of from) seen.add(`${id}->${to}|${looks}`)
        if (!from.length) return []
        const target = box(to)
        const sources = from.flatMap((id) => {
          const found = box(id)
          return found ? [found] : []
        })
        return target && sources.length ? [{ edge: folded ? { ...edge, to, from } : edge, target, sources }] : []
      })
      const all = [...new Set([...nodes.keys()].map(resolve))].flatMap((id) => {
        const found = id ? box(id) : null
        return found ? [found] : []
      })
      const groups = Array.from(lanes.current?.querySelectorAll<HTMLElement>(".diagram-group") ?? [])
      // Open groups the routes keep their runs out of, unless they hold an
      // end. A folded group is a node already; groups inside it have no box.
      const walls = groups.flatMap((element, index) => {
        if (proxies.has(element)) return []
        const rect = place(element.getBoundingClientRect())
        return rect.width && rect.height ? [{ ...rect, id: `frame:${index}`, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }] : []
      })
      const routes = route(measured, all, direction, walls)
      // An edge that comes into a group from the side needs room between
      // the border and the node, so the line runs straight after crossing
      // the border. Only the sides where edges come in get it.
      const entering = new Map<Element, Set<string>>()
      for (const route of routes) {
        const end = route.points[route.points.length - 1]
        const before = route.points[route.points.length - 2]
        if (!route.arrow || !route.ends || !end || !before || Math.abs(end[1] - before[1]) >= 0.5) continue
        const source = elements.get(route.ends[0])
        const target = elements.get(route.ends[1])
        let group = (target?.matches(".diagram-group") ? target.parentElement : target)?.closest(".diagram-group")
        while (group && !(source && group.contains(source))) {
          entering.set(group, (entering.get(group) ?? new Set()).add(end[0] > before[0] ? "left" : "right"))
          group = group.parentElement?.closest(".diagram-group")
        }
      }
      let moved = false
      for (const group of groups) {
        const sides = [...(entering.get(group) ?? [])].sort().join(" ")
        if ((group.getAttribute("data-entry") ?? "") === sides) continue
        if (sides) group.setAttribute("data-entry", sides)
        else group.removeAttribute("data-entry")
        moved = true
      }
      // The room moved the nodes, so measure again; a second pass settles.
      if (moved && pass < 2) return layout(pass + 1)
      const frames: Frame[] = groups.map((element) => ({
        ...place(element.getBoundingClientRect()),
        radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
      }))
      // Labels are measured once and kept, since measuring makes the page lay
      // out again. New labels are measured in one batch: the probes go in
      // together and are read together. A loaded font clears what was kept.
      const sizes = labelSizes.current
      const host = svg.current
      if (host) {
        const probes = [...new Set(routes.flatMap((item) => item.label && !sizes.has(item.label.text) ? [item.label.text] : []))].map((text) => {
          const probe = document.createElementNS("http://www.w3.org/2000/svg", "text")
          probe.setAttribute("class", "diagram-edge-label")
          probe.textContent = text
          host.appendChild(probe)
          return [text, probe] as const
        })
        for (const [text, probe] of probes) {
          const { width, height } = probe.getBBox()
          sizes.set(text, { width, height })
        }
        for (const [, probe] of probes) probe.remove()
      }
      const measure = (text: string) => sizes.get(text) ?? { width: text.length * 7, height: 12 }
      setDrawn(draw(routes, frames, crossings, labels, measure, { shape, arrow, boxes: new Map(all.map((item) => [item.id, item])) }))
    }
    const measure = () => layout(0)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(region)
    nodes.forEach((element) => observer.observe(element))
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    const refont = () => {
      labelSizes.current.clear()
      measure()
    }
    fonts?.addEventListener("loadingdone", refont)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener("loadingdone", refont)
    }
  }, [direction, crossings, labels, shape, arrow, registered, nodes, version])

  return (
    <DiagramContext.Provider value={context}>
      <div
        {...props}
        data-slot="diagram"
        className={cn("card diagram", className)}
        data-direction={direction}
        data-background-style={background}
        data-background-strength={strength}
      >
        {/* A drawing too wide to wrap scrolls, so the scroll region is the
            thing a keyboard user reaches. It is a group, not an image: nodes
            carry text and controls that assistive technology must reach. */}
        <div ref={scroll} data-slot="diagram-scroll" className="diagram-scroll" role="group" aria-label={label} tabIndex={0}>
          <div ref={frame} data-slot="diagram-canvas" className="diagram-canvas">
            {/* The frame choice sits on the lanes, so it reaches every node
                and leaves the diagram's own panel to the page. */}
            <div
              ref={lanes}
              data-slot="diagram-lanes"
              className="diagram-lanes"
              data-direction={direction}
              style={direction === "grid" && columns ? { "--diagram-columns": columns } as React.CSSProperties : undefined}
              data-border-style={borderStyle}
              data-corner-style={cornerStyle}
              data-corner-size={cornerSize}
              data-corner-marks={cornerMarks}
              data-edge-labels={registered.some((edge) => edge.label) || undefined}
            >
              {children}
            </div>
            <svg ref={svg} className="diagram-edges" aria-hidden="true">
              <defs>
                {/* One arrowhead per tone: a marker paints with its own colour,
                    not the path's, so each tone needs its own. */}
                {(["neutral", "success", "danger"] as const).map((tone) => (
                  <marker key={tone} id={`${marker}-${tone}`} className="diagram-arrow" data-tone={tone}
                    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                ))}
                {[...new Set(registered.flatMap((edge) => edge.series ? [edge.series] : []))].map((series) => (
                  <marker key={series} id={`${marker}-s${series}`} className="diagram-arrow" style={{ color: chartColor(series) }}
                    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                ))}
                {/* Other heads, only those in use, the same size and tip. */}
                {[...new Set(drawn.paths.flatMap((path) => path.arrow && path.head !== "triangle" && path.head !== "none"
                  ? [`${path.head}|${path.series ? `s${path.series}` : path.tone ?? "neutral"}`] : []))].map((id) => {
                  const [head, paint] = id.split("|") as [Exclude<DiagramArrow, "triangle" | "none">, string]
                  const series = paint.startsWith("s") ? Number(paint.slice(1)) : undefined
                  const size = series ? "6" : "7"
                  return (
                    <marker key={id} id={`${marker}-${head}-${paint}`} className="diagram-arrow" data-arrow={head}
                      data-tone={series ? undefined : paint} style={series ? { color: chartColor(series) } : undefined}
                      viewBox="0 0 10 10" refX="9" refY="5" markerWidth={size} markerHeight={size} orient="auto-start-reverse">
                      {heads[head]}
                    </marker>
                  )
                })}
              </defs>
              {/* Gaps in crossed frames sit under the edges. */}
              {drawn.plates.map((plate) => (
                <rect key={plate.key} className="diagram-edge-plate" x={plate.x} y={plate.y} width={plate.width} height={plate.height} />
              ))}
              {drawn.paths.map((path) => {
                const series = path.series
                const paint = series ? `s${series}` : path.tone ?? "neutral"
                return (
                  <React.Fragment key={path.key}>
                  {/* Under the edge, a stroke in the card colour breaks the
                      lines it crosses. */}
                  {path.knock && <path className="diagram-edge-knock" d={path.knock} />}
                  <path d={path.d} data-shape={path.shape && path.shape !== "orthogonal" ? path.shape : undefined}
                    data-line={series ? undefined : path.line} data-tone={series ? undefined : path.tone}
                    data-series={series} data-dash={series ? dashOf(series) : undefined} data-flow={(series && path.flow) || undefined}
                    style={series ? { color: chartColor(series) } : undefined}
                    markerEnd={!path.arrow || path.head === "none" ? undefined : `url(#${marker}-${path.head === "triangle" ? "" : `${path.head}-`}${paint})`} />
                  </React.Fragment>
                )
              })}
              {/* A dot marks where a shared trunk splits. */}
              {drawn.dots.map((dot) => (
                <circle key={dot.key} className="diagram-junction" cx={dot.x} cy={dot.y} r="3"
                  data-tone={dot.series ? undefined : dot.tone} style={dot.series ? { color: chartColor(dot.series) } : undefined} />
              ))}
              {drawn.labels.map((item) => (
                <React.Fragment key={item.key}>
                  {item.plate && <rect className="diagram-edge-plate" x={item.plate.x} y={item.plate.y} width={item.plate.width} height={item.plate.height} />}
                  <text x={item.x} y={item.y} className="diagram-edge-label" data-anchor={item.anchor}
                    data-orient={item.rotate ? "vertical" : item.middle ? "inline" : undefined} transform={item.rotate ? `rotate(-90 ${item.x} ${item.y})` : undefined}>
                    {item.lines.length > 1
                      ? <><tspan x={item.x} dy="-1.2em">{item.lines[0]}</tspan><tspan x={item.x} dy="1.2em">{item.lines[1]}</tspan></>
                      : item.lines[0]}
                  </text>
                </React.Fragment>
              ))}
            </svg>
          </div>
        </div>
        {footer != null && (
          <div data-slot="diagram-footer" className="diagram-footer">
            <div className="diagram-footer-items">{footer}</div>
          </div>
        )}
      </div>
    </DiagramContext.Provider>
  )
}

/* A stage of a Diagram read left to right. */
function DiagramColumn({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} data-slot="diagram-column" className={cn("diagram-stage diagram-column", className)} />
}

export type DiagramRowProps = React.ComponentProps<"div"> & {
  /** Where the row's nodes sit across the drawing. Center by default. */
  justify?: "center" | "start" | "end" | "between"
}

/* A stage of a Diagram read top to bottom: nodes side by side. The rows
   share the width of the widest one, so `justify` can put a node under the
   one it hangs from without a layout engine. */
function DiagramRow({ justify, className, ...props }: DiagramRowProps) {
  return <div {...props} data-slot="diagram-row" className={cn("diagram-stage diagram-row", className)} data-justify={justify} />
}

export type DiagramGroupLine = "dashed" | "solid" | "dotted"
export type DiagramGroupTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger"

export type DiagramGroupProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The caption in front of the title, such as "Cluster". */
  label?: string
  /** The name on the border, in weight. */
  title: React.ReactNode
  /** A line under a rule at the bottom of the frame. */
  footer?: React.ReactNode
  /** The frame's line: `dashed` (default), `solid` or `dotted`. */
  line?: DiagramGroupLine
  /** The frame's colour: `neutral` (default) or a tone. */
  tone?: DiagramGroupTone
  /** The title becomes a button that folds the group to its frame. */
  collapsible?: boolean
  /** Open by default. */
  defaultOpen?: boolean
}

/* A frame around one or more nodes, each still its own card, or around
   other groups, with its name on the top border, a line and a colour.
   Edges reach each node inside it. A DiagramNodeGroup is one card split by
   rules; a DiagramGroup is a frame around cards. */
/* A collapsible group folds to one line: the title stays on the border, its
   nodes show only their icon and title side by side, and edges to those
   nodes reach the frame instead. The footer leaves while folded. The nodes
   stay mounted, so they keep their state. */
function DiagramGroup({ label, title, footer, line, tone, collapsible = false, defaultOpen = true, className, style, children, ...props }: DiagramGroupProps) {
  const name = React.useId()
  const body = React.useId()
  const registry = React.useContext(DiagramContext)
  const [open, setOpen] = React.useState(defaultOpen)
  // Folded, the frame keeps its size across the flow and gives up the rest,
  // like a DiagramFold, so the stages beside it do not move: top to bottom
  // and in a grid it keeps its width, left to right its height. The size
  // belongs to the layout it was measured in; in another layout the folded
  // frame takes its natural size.
  const [size, setSize] = React.useState<{ direction?: DiagramDirection; width: number; height: number }>()
  const kept = size && size.direction === registry?.direction
    ? size.direction === "right" ? { minBlockSize: size.height } : { inlineSize: size.width }
    : undefined
  const frame = React.useRef<HTMLDivElement>(null)
  const shown = !collapsible || open
  const text = <>
    {label && <><span className="t-caps">{label}</span><span aria-hidden="true">·</span></>}
    <strong>{title}</strong>
  </>
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <div ref={frame} role="group" aria-labelledby={name} {...props} data-slot="diagram-group" className={cn("diagram-group", className)}
      data-line={line} data-tone={tone} data-open={collapsible ? open : undefined}
      style={!shown && kept ? { ...style, ...kept } : style}>
      <span className="diagram-group-title">
        {collapsible ? (
          <button type="button" id={name} className="diagram-group-toggle" aria-expanded={open} aria-controls={body}
            onClick={() => {
              const rect = frame.current?.getBoundingClientRect()
              if (open && rect) setSize({ direction: registry?.direction, width: rect.width, height: rect.height })
              setOpen(!open)
              registry?.refresh()
            }}>
            {text}
            <Chevron className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />
          </button>
        ) : <span id={name} className="diagram-group-name">{text}</span>}
      </span>
      <div id={body} className="diagram-group-body">{children}</div>
      {footer != null && shown && <div className="diagram-group-foot">{footer}</div>}
    </div>
  )
}

export type DiagramNodeGroupProps = React.ComponentProps<"div"> & DiagramFrameProps

/* A group draws several nodes as one card, split by a rule, such as the
   container that receives requests with the other containers under it.
   Edges still reach each node on its own. The group carries the frame, so
   its frame props replace the nodes' own. */
function DiagramNodeGroup({ borderStyle, cornerStyle, cornerSize, cornerMarks, className, ...props }: DiagramNodeGroupProps) {
  return (
    <Card
      {...props}
      data-slot="diagram-node-group"
      className={cn("diagram-node-group", className)}
      data-border-style={borderStyle}
      data-corner-style={cornerStyle}
      data-corner-size={cornerSize}
      data-corner-marks={cornerMarks}
    />
  )
}

export type DiagramNodeProps = Omit<React.ComponentProps<"div">, "title" | "children"> & DiagramFrameProps & {
  /** Edges refer to the node by this id. Unique within the Diagram. */
  id: string
  /** The name in weight. It never wraps. A node that only holds parts, such
      as a DiagramFold, leaves it out. */
  title?: React.ReactNode
  /** Default icon, label and tone. `icon` and `label` override it. */
  kind?: DiagramKind
  icon?: LucideIcon
  /** The caption above the title. Without one, the icon leads the title. */
  label?: string
  /** Marks the node the screen is about. */
  accent?: boolean
  status?: DiagramStatus
  /** Text renders under the title in mono, with its line breaks kept.
      Elements, such as facts or a fold, render as they are. */
  children?: React.ReactNode
}

function DiagramNode({ id, title, kind, icon, label, accent, status, borderStyle, cornerStyle, cornerSize, cornerMarks, className, children, ...props }: DiagramNodeProps) {
  const { register } = useRegistry("DiagramNode")
  const ref = React.useCallback((element: HTMLElement | null) => register(id, element), [id, register])
  const spec = kind ? kinds[kind] : undefined
  const Icon = icon ?? spec?.icon
  const caption = label ?? spec?.label
  const glyph = Icon && <Icon className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />
  const items = React.Children.toArray(children)
  const text = items.filter((item) => typeof item === "string" || typeof item === "number")
  const parts = items.filter((item) => typeof item !== "string" && typeof item !== "number")
  return (
    <Card
      {...props}
      ref={ref}
      data-slot="diagram-node"
      className={cn("diagram-node", className)}
      data-kind={kind}
      data-tone={spec?.tone ?? "neutral"}
      data-accent={accent || undefined}
      data-status={status}
      data-border-style={borderStyle}
      data-corner-style={cornerStyle}
      data-corner-size={cornerSize}
      data-corner-marks={cornerMarks}
    >
      {caption && (
        <span className="diagram-node-kind">
          {glyph}
          <span className="t-caps">{caption}</span>
        </span>
      )}
      {title != null && (
        <span className="diagram-node-title" data-lead={(!caption && !!glyph) || undefined}>
          {!caption && glyph}
          {title}
        </span>
      )}
      {text.length > 0 && <span className="diagram-node-text mono">{text}</span>}
      {status && (
        <StatusBadge tone={statuses[status].tone} className="diagram-node-status">
          {statuses[status].label}
        </StatusBadge>
      )}
      {parts}
    </Card>
  )
}

export type DiagramFactProps = Omit<React.ComponentProps<"div">, "children"> & {
  icon?: LucideIcon
  label: string
  /** The value, right-aligned in mono. */
  children?: React.ReactNode
  /** Said, muted, when there is no value. */
  empty?: string
}

/* One fact about a node as a line: its icon and name, the value on the
   right. Long values wrap under the name before they widen the node. */
function DiagramFact({ icon: Icon, label, empty, className, children, ...props }: DiagramFactProps) {
  const value = children ?? null
  return (
    <div {...props} data-slot="diagram-fact" className={cn("diagram-fact", className)}>
      <span className="diagram-fact-label">
        {Icon && <Icon className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />}
        {label}
      </span>
      {value != null && value !== false
        ? <span className="diagram-fact-value mono">{value}</span>
        : <span className="diagram-fact-value muted">{empty}</span>}
    </div>
  )
}

export type DiagramFoldProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  /** The number of things the fold holds, shown next to the title. */
  count?: number
  /** Open by default. */
  defaultOpen?: boolean
}

/* A part of a node that folds under a header. Folded, its body stays in the
   layout with no height, so the node keeps its width and the edges do not
   move sideways. */
function DiagramFold({ title, count, defaultOpen = true, className, children, ...props }: DiagramFoldProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const body = React.useId()
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <div {...props} data-slot="diagram-fold" className={cn("diagram-fold", className)} data-open={open}>
      <button type="button" className="diagram-fold-head" aria-expanded={open} aria-controls={body} onClick={() => setOpen(!open)}>
        <span className="diagram-fold-title">
          {title}
          {count != null && <Badge className="badge-count">{count}</Badge>}
        </span>
        <Chevron className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />
      </button>
      <div id={body} className="diagram-fold-body">{children}</div>
    </div>
  )
}

export type DiagramFilterOption = { value: string; label: string; count: number }

export type DiagramFilterProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  options: DiagramFilterOption[]
  /** The option shown alone, or null for all of them. */
  value: string | null
  onValueChange: (value: string | null) => void
}

/* Chips that show one kind of line at a time. The first chip shows all of
   them with their total. Render it only when there is more than one kind. */
function DiagramFilter({ options, value, onValueChange, className, ...props }: DiagramFilterProps) {
  const total = options.reduce((sum, option) => sum + option.count, 0)
  return (
    <div role="group" aria-label="Show" {...props} data-slot="diagram-filter" className={cn("diagram-filter", className)}>
      <button type="button" aria-pressed={value === null} onClick={() => onValueChange(null)}>All {total}</button>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onValueChange(option.value)}>
          {option.label} {option.count}
        </button>
      ))}
    </div>
  )
}

export type DiagramSectionProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Without a title the lines sit flat, with no tree. */
  title?: React.ReactNode
  icon?: LucideIcon
  count?: number
  /** A control at the end of the heading, such as an add button. */
  action?: React.ReactNode
}

/* One kind of thing a node lists: a heading with its count and action, and
   its lines hanging from the heading as a tree. */
function DiagramSection({ title, icon: Icon, count, action, className, children, ...props }: DiagramSectionProps) {
  return (
    <div {...props} data-slot="diagram-section" className={cn("diagram-section", className)} data-flat={title == null || undefined}>
      {title != null && (
        <div className="diagram-section-head">
          <span className="diagram-section-title">
            {Icon && <Icon className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />}
            {title}
            {count != null && <Badge className="badge-count">{count}</Badge>}
          </span>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export type DiagramLineProps = Omit<React.ComponentProps<"div">, "onClick"> & {
  /** Right-aligned detail, such as a target or a state. */
  end?: React.ReactNode
  /** Makes the line a button. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

/* One line of a section: a name in mono and, on the right, where it goes. */
function DiagramLine({ end, onClick, className, children, ...props }: DiagramLineProps) {
  const content = <>
    <span className="diagram-line-name mono">{children}</span>
    {end != null && <span className="diagram-line-end">{end}</span>}
  </>
  if (onClick) {
    return (
      <button {...(props as React.ComponentProps<"button">)} type="button" data-slot="diagram-line" className={cn("diagram-line", className)} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div {...props} data-slot="diagram-line" className={cn("diagram-line", className)}>{content}</div>
}

export type DiagramEdgeProps = {
  /** One source id, or several that merge into the target. */
  from: string | string[]
  to: string
  /** Mono text on the run into the target, such as a port or a variable. */
  label?: string
  /** In a grid, forces the route the edge would otherwise pick from where
      its nodes are: `side`, `down` or `drop`. */
  route?: DiagramEdgeRoute
  /** Overrides the Diagram's `edges` for this edge. */
  shape?: DiagramEdgeShape
  /** Overrides the Diagram's `arrow` for this edge. */
  arrow?: DiagramArrow
} & (
  | { line?: DiagramEdgeLine; tone?: DiagramEdgeTone; series?: never; flow?: never }
  /** A kind of link, such as replication or backups: the chart colour of the
      slot and a dash of its own. `flow` moves the dash toward the target. */
  | { series: number; flow?: boolean; line?: never; tone?: never }
)

/* An edge renders nothing itself: it registers with the Diagram, which draws
   it once the nodes are measured. */
function DiagramEdge({ from, to, label, route, line, tone, series, flow, shape, arrow }: DiagramEdgeProps) {
  const { addEdge } = useRegistry("DiagramEdge")
  // Ids never contain a newline, so the join is a stable dependency.
  const sources = (Array.isArray(from) ? from : [from]).join("\n")
  React.useEffect(
    () => addEdge({ key: `${sources}->${to}${series ? `#${series}` : ""}`, from: sources.split("\n"), to, label, route, line, tone, series, flow, shape, head: arrow }),
    [addEdge, sources, to, label, route, line, tone, series, flow, shape, arrow],
  )
  return null
}

export type DiagramEdgeKeyProps = Omit<React.ComponentProps<"span">, "children"> & {
  series: number
  /** What the series means, such as "WAL to storage". */
  children: React.ReactNode
}

/* A sample of a series edge, its colour and dash, with what it means. The
   product lays these out as the drawing's key; the sample never moves. */
function DiagramEdgeKey({ series, className, children, ...props }: DiagramEdgeKeyProps) {
  return (
    <span {...props} data-slot="diagram-edge-key" className={cn("diagram-edge-key", className)}>
      <svg viewBox="0 0 28 6" aria-hidden="true" focusable="false" style={{ color: chartColor(series) }}>
        <path d="M 2 3 H 26" data-series={series} data-dash={dashOf(series)} />
      </svg>
      {children}
    </span>
  )
}

export { Diagram, DiagramColumn, DiagramRow, DiagramGroup, DiagramEdgeKey, DiagramNodeGroup, DiagramNode, DiagramFact, DiagramFold, DiagramFilter, DiagramSection, DiagramLine, DiagramEdge }
