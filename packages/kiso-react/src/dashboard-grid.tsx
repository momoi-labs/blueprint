"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Maximize2, X } from "lucide-react"

import { Button } from "./button.js"
import { ChartFillContext } from "./chart-fill.js"
import { Dialog, DialogBody, DialogClose, DialogContent, DialogHeader, DialogTitle } from "./dialog.js"
import { GridPane, PaneGrid, type GridPaneProps, type PaneGridProps } from "./pane-grid.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip.js"

/* A dashboard is a PaneGrid: the product seeds each panel's size and row, and
   the reader moves and resizes panels. The product persists the layout. */

type Expand = (from: Element | null) => void
const ExpandContext = React.createContext<{ register: (id: string, expand: Expand) => () => void } | null>(null)

const typing = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")

export type DashboardGridProps = PaneGridProps
export function DashboardGrid({ className, onPointerMove, onPointerLeave, ...props }: DashboardGridProps) {
  const grid = React.useRef<HTMLElement>(null)
  const panels = React.useRef(new Map<string, Expand>())
  // A click on a pane head starts a move and does not focus it, so a mouse
  // reader rarely has a focused pane. The latest input wins: after the pointer
  // moves, V expands the pane under it; after another key, the focused pane.
  const pointed = React.useRef<string | null>(null)
  const pointerLast = React.useRef(false)
  const context = React.useMemo(() => ({
    register: (id: string, expand: Expand) => {
      panels.current.set(id, expand)
      return () => { if (panels.current.get(id) === expand) panels.current.delete(id) }
    },
  }), [])
  React.useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key !== "v" && event.key !== "V") { pointerLast.current = false; return }
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented || typing(event.target)) return
      if (document.querySelector("[role='dialog'][data-state='open']")) return
      const target = event.target instanceof Element ? event.target : null
      const pane = target?.closest<HTMLElement>("[data-pane-id]")
      const focused = pane && grid.current?.contains(pane) ? pane.dataset.paneId : undefined
      const id = pointerLast.current && pointed.current ? pointed.current
        : focused ?? (target === document.body ? pointed.current : null)
      const expand = id ? panels.current.get(id) : undefined
      if (!expand) return
      event.preventDefault()
      expand(id === focused ? target : null)
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [])
  return <ExpandContext.Provider value={context}>
    <PaneGrid ref={grid} data-slot="dashboard-grid" className={cn("dashboard-grid", className)}
      onPointerMove={event => {
        pointed.current = (event.target as Element).closest<HTMLElement>("[data-pane-id]")?.dataset.paneId ?? null
        pointerLast.current = true
        onPointerMove?.(event)
      }}
      onPointerLeave={event => { pointed.current = null; onPointerLeave?.(event) }}
      {...props} />
  </ExpandContext.Provider>
}

/* PaneGrid reads `id`, `size`, `min` and `newRow` from its children, so a
   panel takes the same props as a GridPane. */
export type DashboardPanelProps = GridPaneProps & {
  /* Add an Expand control and the V shortcut. The panel's content opens in a
     dialog that fills the viewport; a Chart there takes the height it gets. */
  expandable?: boolean
}
export function DashboardPanel({ className, expandable = false, id, title, actions, children, ref, ...props }: DashboardPanelProps) {
  const grid = React.useContext(ExpandContext)
  const pane = React.useRef<HTMLElement | null>(null)
  const body = React.useRef<HTMLDivElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const expand = React.useCallback<Expand>((from) => {
    // Return focus where it was: the Expand button, a control in the pane, or
    // the head when the pointer opened it.
    opener.current = from instanceof HTMLElement && pane.current?.contains(from) ? from
      : pane.current?.querySelector<HTMLElement>("[data-slot='grid-pane-head']") ?? null
    setOpen(true)
  }, [])
  React.useEffect(() => expandable && grid ? grid.register(id, expand) : undefined, [expandable, grid, id, expand])
  const button = expandable && <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="btn-icon" size="sm" variant="ghost" aria-label={`Expand ${title}`} aria-keyshortcuts="v"
          onClick={event => expand(event.currentTarget)}>
          <Maximize2 className="icon icon-sm" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Expand</TooltipContent>
    </Tooltip>
  </TooltipProvider>
  return <>
    <GridPane data-slot="dashboard-panel" className={cn("dashboard-panel", className)} id={id} title={title}
      ref={element => {
        pane.current = element
        if (typeof ref === "function") return ref(element)
        if (ref) ref.current = element
      }}
      actions={expandable ? <>{actions}{button}</> : actions} {...props}>
      {children}
    </GridPane>
    {expandable && <Dialog open={open} onOpenChange={setOpen}>
      {open && <DialogContent className="dashboard-panel-dialog" aria-describedby={undefined}
        // The chart plot, so Left and Right inspect at once. Recharts makes the
        // plot focusable only once it has measured, so wait a few frames; any
        // other content gets the first control, as a Dialog does.
        onOpenAutoFocus={event => {
          const plot = () => body.current?.querySelector<HTMLElement>(".chart-plot [tabindex='0']")
          if (!body.current?.querySelector(".chart-plot")) return
          event.preventDefault()
          let tries = 10
          const focus = () => { const target = plot(); if (target) target.focus(); else if (tries-- > 0) requestAnimationFrame(focus) }
          focus()
        }}
        // Radix returns focus to a Dialog Trigger. The opener here is the pane
        // head or a control in it, so focus goes back by hand.
        onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus() }}
        onKeyDown={event => {
          if ((event.key === "v" || event.key === "V") && !event.ctrlKey && !event.metaKey && !event.altKey && !typing(event.target)) {
            event.preventDefault()
            setOpen(false)
          }
        }}>
        <DialogHeader className="dashboard-panel-dialog-head">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose asChild>
            <Button className="btn-icon" size="sm" variant="ghost" aria-label="Close" aria-keyshortcuts="Escape v">
              <X className="icon icon-sm" aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <DialogBody ref={body} className="dashboard-panel-dialog-body">
          <ChartFillContext.Provider value={true}>{children}</ChartFillContext.Provider>
        </DialogBody>
      </DialogContent>}
    </Dialog>}
  </>
}
