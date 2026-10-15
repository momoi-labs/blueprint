import * as React from "react"
import { clsx as cn } from "clsx"
import { Ellipsis } from "lucide-react"

import { Button } from "./button.js"
import { Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./drawer.js"

export type LifecycleProps = Omit<React.ComponentProps<"div">, "children"> & {
  status: React.ReactNode
  actions?: React.ReactNode
  destructive?: React.ReactNode
  /** The title of the sheet that holds the actions on a phone. */
  actionsLabel?: string
}

/* The header row of a detail screen: what the thing is, what you can do to
   it, and the one action you do not want to hit by accident. Status is read,
   the verbs are pressed, and the destructive action sits outside both with a
   wider gap. A screen with no verbs passes none, and the middle group is
   dropped rather than rendered as an empty bordered box.

   On a phone the verbs and the destructive action do not fit beside the
   status, so they move to a sheet behind one button. A verb that opens a
   dialog of its own closes the sheet first, so the dialog takes the screen. */
export function Lifecycle({ status, actions, destructive, actionsLabel = "Actions", className, ...props }: LifecycleProps) {
  const [open, setOpen] = React.useState(false)
  return <div {...props} data-slot="lifecycle" className={cn("lifecycle", className)}>
    <div className="cluster cluster-status" role="group" aria-label="Status">{status}</div>
    {actions ? <div className="cluster cluster-verbs" role="group" aria-label="Actions">{actions}</div> : null}
    {destructive}
    {actions || destructive ? (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="sm" className="lifecycle-more btn-icon" aria-label={`More ${actionsLabel.toLowerCase()}`} title={actionsLabel}>
            <Ellipsis className="icon" aria-hidden="true" />
          </Button>
        </DrawerTrigger>
        <DrawerContent placement="bottom">
          <DrawerHeader><DrawerTitle>{actionsLabel}</DrawerTitle></DrawerHeader>
          <DrawerBody>
            <div
              className="lifecycle-sheet"
              onClick={(event) => {
                if ((event.target as Element).closest("button:not(:disabled), a[href]")) setOpen(false)
              }}
            >
              {actions}
              {destructive}
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    ) : null}
  </div>
}
