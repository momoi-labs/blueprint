// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"

type TableProps = React.ComponentProps<"table"> & {
  density?: "compact" | "comfortable" | "spacious"
  header?: "tinted" | "plain"
}

function TableFrame({
  className,
  frame = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { frame?: "default" | "none" }) {
  return <div data-slot="table-frame" data-frame={frame} className={cn("table-wrap", className)} {...props}>
    <div className="table-surface">{children}</div>
  </div>
}

function Table({ className, density, header, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="table-scroll"
    >
      <table
        data-slot="table"
        data-density={density}
        data-header={header}
        className={cn("table", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      data-slot="table-head"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("muted", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableFrame,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
export type { TableProps }
