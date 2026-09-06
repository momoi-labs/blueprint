// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

function Split({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="split"
      className={cn("split", className)}
      {...props}
    />
  )
}

function Pane({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pane"
      className={cn("pane", className)}
      {...props}
    />
  )
}

/* The divider owns the size so that dropping one between two panes is the
   whole setup — no state to lift for a drag. Where it puts that size is what
   `.split > .pane` already expects: `flex-basis` on the pane before it.
   `onSizeChange` reports the percentage for anyone who wants to persist it. */
function Splitter({
  className,
  defaultSize = 50,
  min = 25,
  max = 75,
  step = 2,
  onSizeChange,
  onPointerDown,
  onPointerMove,
  onLostPointerCapture,
  onKeyDown,
  "aria-label": ariaLabel = "Resize panes",
  ...props
}: React.ComponentProps<"div"> & {
  defaultSize?: number
  min?: number
  max?: number
  step?: number
  onSizeChange?: (size: number) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState(defaultSize)
  const [dragging, setDragging] = React.useState(false)

  useIsomorphicLayoutEffect(() => {
    const pane = ref.current?.previousElementSibling
    if (pane instanceof HTMLElement) pane.style.flexBasis = `${size}%`
  }, [size])

  function resize(next: number) {
    const value = Math.min(max, Math.max(min, next))
    if (value === size) return
    setSize(value)
    onSizeChange?.(value)
  }

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max}
      data-slot="splitter"
      className={cn("splitter", dragging && "dragging", className)}
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (!dragging) return
        const box = event.currentTarget.parentElement?.getBoundingClientRect()
        if (box) resize(((event.clientX - box.left) / box.width) * 100)
      }}
      /* Covers the pointer being released and the drag being cancelled. */
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event)
        setDragging(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === "ArrowLeft") resize(size - step)
        else if (event.key === "ArrowRight") resize(size + step)
        else if (event.key === "Home") resize(min)
        else if (event.key === "End") resize(max)
        else return
        event.preventDefault()
      }}
    />
  )
}

export { Split, Pane, Splitter }
