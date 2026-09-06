// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { clsx as cn } from "clsx"

function KV({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="kv"
      className={cn("kv", className)}
      {...props}
    />
  )
}

function KVKey({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="kv-key"
      className={cn("", className)}
      {...props}
    />
  )
}

function KVValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="kv-value"
      className={cn("", className)}
      {...props}
    />
  )
}

export { KV, KVKey, KVValue }
