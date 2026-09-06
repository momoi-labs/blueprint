// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { clsx as cn } from "clsx"

function AppShell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell"
      className={cn("app-shell", className)}
      {...props}
    />
  )
}

/* `grow` carries the `min-width: 0` the main column needs so a wide table or
   log line cannot push the sidebar off the screen. */
function AppShellMain({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="app-shell-main"
      className={cn("grow", className)}
      {...props}
    />
  )
}

export { AppShell, AppShellMain }
