// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx as cn } from "clsx"

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

/* Within this much of the end counts as "at the bottom". A log that is being
   written to rarely lands on an exact scroll position. */
const BOTTOM_THRESHOLD = 8

type LogViewHandle = {
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

/* The frame is `.logview` and the scroller is `.log-scroll` inside it, so the
   component owns the scroller and with it follow-tail: new lines pin the view
   to the end until the reader scrolls away, and returning to the end resumes.
   Pass `follow` to drive that from a control of your own — the console has a
   "Follow" switch — and read `onFollowChange` to keep it in step. */
function LogView({
  className,
  children,
  follow,
  onFollowChange,
  ref,
  ...props
}: Omit<React.ComponentProps<"div">, "ref"> & {
  follow?: boolean
  onFollowChange?: (follow: boolean) => void
  ref?: React.Ref<LogViewHandle>
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  const following = follow ?? atBottom

  React.useImperativeHandle(ref, () => ({
    scrollToBottom(behavior) {
      const el = scroller.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior })
    },
  }), [])

  /* Before paint, so a new line never shows up above the fold first. */
  useIsomorphicLayoutEffect(() => {
    const el = scroller.current
    if (el && following) el.scrollTop = el.scrollHeight
  }, [children, following])

  return (
    <div
      data-slot="log-view"
      data-follow={following}
      className={cn("logview", className)}
      {...props}
    >
      <div
        ref={scroller}
        data-slot="log-view-scroll"
        className="log-scroll"
        onScroll={(event) => {
          const el = event.currentTarget
          const bottom =
            el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
          setAtBottom(bottom)
          if (bottom !== following) onFollowChange?.(bottom)
        }}
      >
        {children}
      </div>
    </div>
  )
}

function LogViewLine({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="log-view-line"
      className={cn("", className)}
      {...props}
    />
  )
}

function LogViewTime({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="log-view-time"
      className={cn("log-time", className)}
      {...props}
    />
  )
}

const logViewLevelVariants = cva("", {
  variants: {
    level: { info: "log-info", warn: "log-warn", error: "log-error" },
  },
  defaultVariants: { level: "info" },
})

function LogViewLevel({
  className,
  level = "info",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof logViewLevelVariants>) {
  return (
    <span
      data-slot="log-view-level"
      data-level={level}
      className={cn(logViewLevelVariants({ level }), className)}
      {...props}
    />
  )
}

export {
  LogView,
  LogViewLine,
  LogViewTime,
  LogViewLevel,
  logViewLevelVariants,
  type LogViewHandle,
}
