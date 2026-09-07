// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { clsx as cn } from "clsx"
import { Header } from "./header.js"
import {
  Navigation,
  NavigationGroup,
  NavigationItem,
  NavigationLink,
  NavigationList,
} from "./navigation.js"
import { Sidebar, SidebarBody, SidebarFooter, SidebarHeader } from "./sidebar.js"

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

type ApplicationShellDestination = {
  href: string
  active?: boolean
  onClick?: () => void
  label: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

type ApplicationShellGroup = {
  label?: string
  destinations: readonly ApplicationShellDestination[]
  empty?: React.ReactNode
}

type ApplicationShellProps = Omit<React.ComponentProps<typeof AppShell>, "children"> & {
  brand: React.ReactNode
  primaryAction?: React.ReactNode
  navigation: readonly ApplicationShellGroup[]
  navigationLabel?: string
  footer?: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
}

function ApplicationShell({
  brand,
  primaryAction,
  navigation,
  navigationLabel = "Primary",
  footer,
  header,
  children,
  ...props
}: ApplicationShellProps) {
  return (
    <AppShell {...props}>
      <Sidebar>
        <SidebarHeader>
          {brand}
          {primaryAction}
        </SidebarHeader>
        <SidebarBody>
          <Navigation aria-label={navigationLabel}>
            {navigation.map((group, groupIndex) => (
              <NavigationGroup key={group.label ?? groupIndex} label={group.label}>
                {group.destinations.length > 0 ? (
                  <NavigationList>
                    {group.destinations.map((destination, destinationIndex) => (
                      <NavigationItem key={`${destination.href}-${destinationIndex}`}>
                        <NavigationLink
                          href={destination.href}
                          active={destination.active}
                          onClick={(event) => {
                            if (!destination.onClick) return
                            event.preventDefault()
                            destination.onClick()
                          }}
                        >
                          {destination.leading}
                          <span className="grow truncate">{destination.label}</span>
                          {destination.trailing}
                        </NavigationLink>
                      </NavigationItem>
                    ))}
                  </NavigationList>
                ) : group.empty}
              </NavigationGroup>
            ))}
          </Navigation>
        </SidebarBody>
        {footer && <SidebarFooter>{footer}</SidebarFooter>}
      </Sidebar>
      <AppShellMain>
        {header && <Header>{header}</Header>}
        {children}
      </AppShellMain>
    </AppShell>
  )
}

export { AppShell, AppShellMain, ApplicationShell }
export type {
  ApplicationShellDestination,
  ApplicationShellGroup,
  ApplicationShellProps,
}
