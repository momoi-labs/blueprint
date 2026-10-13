import * as React from "react"
import { clsx as cn } from "clsx"
import { ChevronDown, ChevronUp, Container, Database, GitBranch, Route, Server, type LucideIcon } from "lucide-react"

import { Badge } from "./badge.js"
import { Card } from "./card.js"
import { StatusBadge, type StatusTone } from "./status-badge.js"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

/* A Diagram is columns of nodes read left to right, with edges drawn between
   columns. Nodes are Cards, so they take the theme's frame, marks and corners.
   The canvas fills the panel and wraps node text before it scrolls, so a
   long name never widens the drawing while there is room to break it. */

export type DiagramKind = "route" | "service" | "repository" | "image" | "database"

/* The same values as the shell's `data-background-style`, minus the Momoi
   signatures, which belong to one shell and not to every diagram on a page. */
export type DiagramBackground = "solid" | "dots" | "grid" | "crosses" | "construction" | "guides" | "fibers"

/* A status dashes the frame and adds a badge. Running is the default and
   draws nothing, so a healthy diagram stays quiet. */
export type DiagramStatus = "stopped" | "failed"

/* An edge's line says whether the link is live: solid by default, dashed or
   dotted when it is not serving. Its tone says how that reads: neutral,
   success or danger, the StatusBadge tones. */
export type DiagramEdgeLine = "solid" | "dashed" | "dotted"
export type DiagramEdgeTone = "neutral" | "success" | "danger"

type EdgeSpec = { key: string; from: string[]; to: string; label?: string; line?: DiagramEdgeLine; tone?: DiagramEdgeTone }

type Registry = {
  nodes: Map<string, HTMLElement>
  register: (id: string, element: HTMLElement | null) => void
  addEdge: (edge: EdgeSpec) => () => void
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

const statuses: Record<DiagramStatus, { label: string; tone: StatusTone }> = {
  stopped: { label: "Stopped", tone: "neutral" },
  failed: { label: "Failed", tone: "danger" },
}

const RADIUS = 8

/* An edge is two paths. The trunk is the horizontal run out of the source,
   shared by every edge that leaves it, so it is always drawn solid and
   neutral: two styles on one line would paint over each other. The branch
   is the rest, the turn onto the merge column, the vertical run and the
   straight run into the target, and it carries the edge's line and tone. */
function elbow(sx: number, sy: number, tx: number, ty: number, mid: number) {
  const dy = ty - sy
  if (Math.abs(dy) < 1) return { trunk: `M ${sx} ${sy} H ${mid}`, branch: `M ${mid} ${sy} H ${tx}` }
  const r = Math.max(0, Math.min(RADIUS, Math.abs(dy) / 2, mid - sx, tx - mid))
  const d = Math.sign(dy)
  return {
    trunk: `M ${sx} ${sy} H ${mid - r}`,
    branch: [
      `M ${mid - r} ${sy}`,
      `Q ${mid} ${sy} ${mid} ${sy + d * r}`,
      `V ${ty - d * r}`,
      `Q ${mid} ${ty} ${mid + r} ${ty}`,
      `H ${tx}`,
    ].join(" "),
  }
}

type Drawn = {
  paths: { key: string; d: string; arrow: boolean; line?: DiagramEdgeLine; tone?: DiagramEdgeTone }[]
  labels: { key: string; x: number; y: number; text: string }[]
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
  /** Unset follows the page's canvas; a page with no canvas gets dots. */
  background?: DiagramBackground
  strength?: "quiet" | "visible"
  children: React.ReactNode
}

function Diagram({ label, background, strength, borderStyle, cornerStyle, cornerSize, cornerMarks, className, children, ...props }: DiagramProps) {
  const frame = React.useRef<HTMLDivElement>(null)
  const scroll = React.useRef<HTMLDivElement>(null)
  const nodes = React.useRef(new Map<string, HTMLElement>()).current
  const [edges, setEdges] = React.useState<EdgeSpec[]>([])
  const [version, setVersion] = React.useState(0)
  const [drawn, setDrawn] = React.useState<Drawn>({ paths: [], labels: [] })
  const marker = `${React.useId()}arrow`

  const register = React.useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodes.set(id, element)
    else nodes.delete(id)
    setVersion((value) => value + 1)
  }, [nodes])
  const addEdge = React.useCallback((edge: EdgeSpec) => {
    setEdges((list) => [...list, edge])
    return () => setEdges((list) => list.filter((item) => item !== edge))
  }, [])
  const context = React.useMemo(() => ({ nodes, register, addEdge }), [nodes, register, addEdge])

  useIsomorphicLayoutEffect(() => {
    const root = frame.current
    const region = scroll.current
    if (!root || !region) return
    // Lay the drawing out wrapped to the panel first. If it still overflows,
    // wrapping only cramps it, so it takes its natural width and scrolls.
    const fit = () => {
      root.removeAttribute("data-overflow")
      if (root.offsetWidth > region.clientWidth) root.setAttribute("data-overflow", "")
    }
    const measure = () => {
      fit()
      const origin = root.getBoundingClientRect()
      const box = (id: string) => {
        const rect = nodes.get(id)?.getBoundingClientRect()
        if (!rect) return null
        return {
          left: rect.left - origin.left,
          right: rect.right - origin.left,
          top: rect.top - origin.top,
          height: rect.height,
          y: rect.top - origin.top + rect.height / 2,
        }
      }
      // Each edge into a target gets its own entry point, spread down the
      // target's side in the order of their sources, so their arrows and
      // labels never land on the same spot. One edge enters at the middle.
      const measured = edges.flatMap((edge) => {
        const target = box(edge.to)
        const sources = edge.from.map(box).filter((b) => b !== null)
        return target && sources.length ? [{ edge, target, sources }] : []
      })
      const entries = new Map<EdgeSpec, number>()
      const top = (item: (typeof measured)[number]) => Math.min(...item.sources.map((s) => s.y))
      for (const id of new Set(measured.map((item) => item.edge.to))) {
        const group = measured.filter((item) => item.edge.to === id).sort((a, b) => top(a) - top(b))
        group.forEach((item, index) => {
          entries.set(item.edge, item.target.top + (item.target.height * (index + 1)) / (group.length + 1))
        })
      }
      const next: Drawn = { paths: [], labels: [] }
      for (const { edge, target, sources } of measured) {
        const ty = entries.get(edge) ?? target.y
        const start = Math.max(...sources.map((s) => s.right))
        const mid = (start + target.left) / 2
        sources.forEach((source, index) => {
          const { trunk, branch } = elbow(source.right, source.y, target.left, ty, mid)
          next.paths.push({ key: `${edge.key}:${index}:trunk`, d: trunk, arrow: false })
          next.paths.push({ key: `${edge.key}:${index}`, d: branch, line: edge.line, tone: edge.tone, arrow: true })
        })
        // The label sits on the edge's own run into the target, above the line.
        if (edge.label) next.labels.push({ key: edge.key, x: mid, y: ty - RADIUS, text: edge.label })
      }
      setDrawn(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(region)
    nodes.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [edges, nodes, version])

  return (
    <DiagramContext.Provider value={context}>
      <div
        {...props}
        data-slot="diagram"
        className={cn("card diagram", className)}
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
              data-slot="diagram-lanes"
              className="diagram-lanes"
              data-border-style={borderStyle}
              data-corner-style={cornerStyle}
              data-corner-size={cornerSize}
              data-corner-marks={cornerMarks}
              data-edge-labels={edges.some((edge) => edge.label) || undefined}
            >
              {children}
            </div>
            <svg className="diagram-edges" aria-hidden="true">
              <defs>
                {/* One arrowhead per tone: a marker paints with its own colour,
                    not the path's, so each tone needs its own. */}
                {(["neutral", "success", "danger"] as const).map((tone) => (
                  <marker key={tone} id={`${marker}-${tone}`} className="diagram-arrow" data-tone={tone}
                    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                ))}
              </defs>
              {drawn.paths.map((path) => (
                <path key={path.key} d={path.d} data-line={path.line} data-tone={path.tone}
                  markerEnd={path.arrow ? `url(#${marker}-${path.tone ?? "neutral"})` : undefined} />
              ))}
              {drawn.labels.map((item) => (
                <text key={item.key} x={item.x} y={item.y} className="diagram-edge-label">{item.text}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </DiagramContext.Provider>
  )
}

function DiagramColumn({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} data-slot="diagram-column" className={cn("diagram-column", className)} />
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
  line?: DiagramEdgeLine
  tone?: DiagramEdgeTone
}

/* An edge renders nothing itself: it registers with the Diagram, which draws
   it once the nodes are measured. */
function DiagramEdge({ from, to, label, line, tone }: DiagramEdgeProps) {
  const { addEdge } = useRegistry("DiagramEdge")
  // Ids never contain a newline, so the join is a stable dependency.
  const sources = (Array.isArray(from) ? from : [from]).join("\n")
  React.useEffect(
    () => addEdge({ key: `${sources}->${to}`, from: sources.split("\n"), to, label, line, tone }),
    [addEdge, sources, to, label, line, tone],
  )
  return null
}

export { Diagram, DiagramColumn, DiagramNodeGroup, DiagramNode, DiagramFact, DiagramFold, DiagramFilter, DiagramSection, DiagramLine, DiagramEdge }
