// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Button } from "./button.js"
import { Header } from "./header.js"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"
import {
  Navigation,
  NavigationGroup,
  NavigationItem,
  NavigationLink,
  NavigationList,
} from "./navigation.js"
import { Sidebar, SidebarBody, SidebarFooter, SidebarHeader } from "./sidebar.js"

function AppShell({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "inset" }) {
  return (
    <div
      data-slot="app-shell"
      data-variant={variant}
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

function AppShellPanel({ className, ...props }: React.ComponentProps<"aside">) {
  return <aside data-slot="app-shell-panel" className={cn("app-shell-panel", className)} {...props} />
}

function AppShellPanelToggle({
  className,
  placement = "header",
  children,
  "aria-label": label,
  ...props
}: React.ComponentProps<typeof Button> & {
  placement?: "header" | "floating"
  "aria-controls": string
  "aria-expanded": boolean
}) {
  return <Button variant="ghost" size="sm" data-slot="app-shell-panel-toggle"
    data-placement={placement} className={cn("app-shell-panel-toggle", className)}
    aria-label={label ?? (props["aria-expanded"] ? "Close panel" : "Open panel")}
    title={label ?? (props["aria-expanded"] ? "Close panel" : "Open panel")} {...props}>
    {children ?? <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" /><path d="M10.5 2v12" />
    </svg>}
  </Button>
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

type ApplicationShellSharedProps = Omit<
  React.ComponentProps<typeof AppShell>,
  "children"
> & {
  brand: React.ReactNode
  primaryAction?: React.ReactNode
  header?: React.ReactNode
  panel?: React.ReactNode
  children: React.ReactNode
}

type ApplicationShellSidebarProps = ApplicationShellSharedProps & {
  layout?: "sidebar"
  navigation: readonly ApplicationShellGroup[]
  navigationLabel?: string
  footer?: React.ReactNode
  collapsible?: boolean
  togglePlacement?: "sidebar" | "header"
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

type ApplicationShellTopbarProps = ApplicationShellSharedProps & {
  layout: "topbar"
  navigation?: never
  navigationLabel?: never
  footer?: never
  collapsible?: never
  togglePlacement?: never
  collapsed?: never
  defaultCollapsed?: never
  onCollapsedChange?: never
}

type ApplicationShellProps =
  | ApplicationShellSidebarProps
  | ApplicationShellTopbarProps

function ApplicationShellNavigation({
  navigation,
  navigationLabel,
  collapsible = false,
}: {
  navigation: readonly ApplicationShellGroup[]
  navigationLabel: string
  collapsible?: boolean
}) {
  return (
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
                    className={collapsible && destination.leading ? "sidebar-link-with-icon" : undefined}
                    title={collapsible && typeof destination.label === "string" ? destination.label : undefined}
                    onClick={(event) => {
                      if (!destination.onClick) return
                      event.preventDefault()
                      destination.onClick()
                    }}
                  >
                    {collapsible ? <>
                      {destination.leading && <span className="sidebar-link-icon" aria-hidden="true">{destination.leading}</span>}
                      <span className="sidebar-link-label grow truncate">{destination.label}</span>
                      {destination.trailing && <span className="sidebar-link-trailing">{destination.trailing}</span>}
                    </> : <>
                      {destination.leading}
                      <span className="grow truncate">{destination.label}</span>
                      {destination.trailing}
                    </>}
                  </NavigationLink>
                </NavigationItem>
              ))}
            </NavigationList>
          ) : (
            group.empty
          )}
        </NavigationGroup>
      ))}
    </Navigation>
  )
}

function ApplicationShell(props: ApplicationShellProps) {
  if (props.layout === "topbar") {
    const { brand, primaryAction, header, panel, children, layout: _layout, ...shellProps } =
      props
    return (
      <AppShell {...shellProps} data-layout="topbar">
        <AppShellMain>
          <Header>
            {brand}
            {primaryAction}
            {header}
          </Header>
          {children}
        </AppShellMain>
        {panel}
      </AppShell>
    )
  }

  return <ApplicationShellSidebar {...props} />
}

function ApplicationShellSidebar({
  brand,
  primaryAction,
  navigation,
  navigationLabel = "Primary",
  footer,
  header,
  panel,
  children,
  layout: _layout,
  collapsible = false,
  togglePlacement = "sidebar",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  ...shellProps
}: ApplicationShellSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed)
  const isCollapsed = collapsible && (collapsed ?? internalCollapsed)
  const sidebarId = React.useId()
  const sidebarRef = React.useRef<HTMLElement>(null)
  const toggleRef = React.useRef<HTMLButtonElement>(null)

  useIsomorphicLayoutEffect(() => {
    const sidebar = sidebarRef.current
    const focused = sidebar?.ownerDocument.activeElement
    if (isCollapsed && focused && sidebar?.contains(focused) && !focused.getClientRects().length) {
      toggleRef.current?.focus()
    }
  }, [isCollapsed])

  function toggleSidebar() {
    const next = !isCollapsed
    if (collapsed === undefined) setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  const toggle = collapsible ? (
    <Button
      ref={toggleRef}
      variant="ghost"
      size="sm"
      className="sidebar-toggle btn-icon"
      aria-controls={sidebarId}
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={toggleSidebar}
    >
      <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1.5" y="2" width="13" height="12" rx="1.5" />
        <path d="M5.5 2v12" />
        <path d={isCollapsed ? "m8.5 5.5 2.5 2.5-2.5 2.5" : "m11 5.5-2.5 2.5 2.5 2.5"} />
      </svg>
    </Button>
  ) : null

  return (
    <AppShell {...shellProps}>
      <Sidebar ref={sidebarRef} id={sidebarId} collapsed={isCollapsed}>
        <SidebarHeader className={collapsible && togglePlacement === "sidebar" ? "sidebar-header-collapsible" : undefined}>
          {collapsible ? <>
            <div className="sidebar-expanded-content">
              {brand}
              {primaryAction}
            </div>
            {togglePlacement === "sidebar" && toggle}
          </> : <>{brand}{primaryAction}</>}
        </SidebarHeader>
        <SidebarBody>
          <ApplicationShellNavigation
            navigation={navigation}
            navigationLabel={navigationLabel}
            collapsible={collapsible}
          />
        </SidebarBody>
        {footer && <SidebarFooter className={collapsible ? "sidebar-expanded-content" : undefined}>{footer}</SidebarFooter>}
      </Sidebar>
      <AppShellMain>
        {(header || (collapsible && togglePlacement === "header")) && <Header>
          {togglePlacement === "header" && toggle}
          {header}
        </Header>}
        {children}
      </AppShellMain>
      {panel}
    </AppShell>
  )
}

export { AppShell, AppShellMain, AppShellPanel, AppShellPanelToggle, ApplicationShell }
export type {
  ApplicationShellDestination,
  ApplicationShellGroup,
  ApplicationShellProps,
}
