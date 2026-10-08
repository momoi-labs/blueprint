import * as React from "react"
import { clsx as cn } from "clsx"
import { Container, Database, GitBranch, Route, Server, type LucideIcon } from "lucide-react"

import { Card } from "./card.js"
import { StatusBadge, type StatusTone } from "./status-badge.js"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

/* A Diagram is columns of nodes read left to right, with edges drawn between
   columns. Nodes are Cards, so they take the theme's frame, marks and corners.
   The canvas keeps its width on narrow screens and scrolls instead of
   reflowing, so the drawing is the same drawing everywhere. */

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
    if (!root) return
    const measure = () => {
      const origin = root.getBoundingClientRect()
      const box = (id: string) => {
        const rect = nodes.get(id)?.getBoundingClientRect()
        if (!rect) return null
        return {
          left: rect.left - origin.left,
          right: rect.right - origin.left,
          y: rect.top - origin.top + rect.height / 2,
        }
      }
      const next: Drawn = { paths: [], labels: [] }
      for (const edge of edges) {
        const target = box(edge.to)
        if (!target) continue
        const sources = edge.from.map(box).filter((b) => b !== null)
        if (!sources.length) continue
        const start = Math.max(...sources.map((s) => s.right))
        const mid = (start + target.left) / 2
        sources.forEach((source, index) => {
          const { trunk, branch } = elbow(source.right, source.y, target.left, target.y, mid)
          next.paths.push({ key: `${edge.key}:${index}:trunk`, d: trunk, arrow: false })
          next.paths.push({ key: `${edge.key}:${index}`, d: branch, line: edge.line, tone: edge.tone, arrow: true })
        })
        // The label sits on the shared run into the target, above the line.
        if (edge.label) next.labels.push({ key: edge.key, x: mid, y: target.y - RADIUS, text: edge.label })
      }
      setDrawn(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
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
        {/* The drawing keeps its width and scrolls on narrow screens, so the
            scroll region is the thing a keyboard user reaches. */}
        <div data-slot="diagram-scroll" className="diagram-scroll" role="img" aria-label={label} tabIndex={0}>
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

export type DiagramNodeProps = Omit<React.ComponentProps<"div">, "title" | "children"> & DiagramFrameProps & {
  /** Edges refer to the node by this id. Unique within the Diagram. */
  id: string
  /** The name in weight. It never wraps. */
  title: string
  /** Default icon, label and tone. `icon` and `label` override it. */
  kind?: DiagramKind
  icon?: LucideIcon
  label?: string
  /** Marks the node the screen is about. */
  accent?: boolean
  status?: DiagramStatus
  /** Free text under the title. Line breaks are kept. */
  children?: React.ReactNode
}

function DiagramNode({ id, title, kind, icon, label, accent, status, borderStyle, cornerStyle, cornerSize, cornerMarks, className, children, ...props }: DiagramNodeProps) {
  const { register } = useRegistry("DiagramNode")
  const ref = React.useCallback((element: HTMLElement | null) => register(id, element), [id, register])
  const spec = kind ? kinds[kind] : undefined
  const Icon = icon ?? spec?.icon
  const caption = label ?? spec?.label
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
      {(Icon || caption) && (
        <span className="diagram-node-kind">
          {Icon && <Icon className="icon icon-sm" strokeWidth={1.75} aria-hidden="true" focusable="false" />}
          {caption && <span className="t-caps">{caption}</span>}
        </span>
      )}
      <span className="diagram-node-title">{title}</span>
      {children != null && <span className="diagram-node-text mono">{children}</span>}
      {status && (
        <StatusBadge tone={statuses[status].tone} className="diagram-node-status">
          {statuses[status].label}
        </StatusBadge>
      )}
    </Card>
  )
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

export { Diagram, DiagramColumn, DiagramNode, DiagramEdge }
