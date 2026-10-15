// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Menu, PanelLeftClose, PanelLeftOpen, PanelRight } from "lucide-react"
import { Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerTitle } from "./drawer.js"
import { VisuallyHidden } from "radix-ui"
import { BottomNav, BottomNavBadge, BottomNavLink } from "./bottom-nav.js"
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
    {children ?? <PanelRight className="icon" aria-hidden="true" />}
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
  headerVariant?: React.ComponentProps<typeof Header>["variant"]
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
  /** Below 1024px the sidebar opens as a drawer. Control it to close the
   *  drawer from a destination it cannot see, such as a menu in a portal. */
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
  /** Below 700px, "bottom" moves the destinations to a BottomNav. */
  phoneNavigation?: "drawer" | "bottom"
  bottomNav?: never
}

type ApplicationShellTopbarProps = ApplicationShellSharedProps & {
  layout: "topbar"
  /** A BottomNav for phones, below 700px. */
  bottomNav?: React.ReactNode
  phoneNavigation?: never
  navigation?: never
  navigationLabel?: never
  footer?: never
  collapsible?: never
  togglePlacement?: never
  collapsed?: never
  defaultCollapsed?: never
  onCollapsedChange?: never
  drawerOpen?: never
  onDrawerOpenChange?: never
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
    const { brand, primaryAction, header, headerVariant, panel, bottomNav, children, layout: _layout, ...shellProps } =
      props
    return (
      <AppShell {...shellProps} data-layout="topbar">
        <AppShellMain>
          <Header variant={headerVariant}>
            {brand}
            {primaryAction}
            {header}
          </Header>
          {children}
        </AppShellMain>
        {panel}
        {bottomNav}
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
  headerVariant,
  panel,
  children,
  layout: _layout,
  collapsible = false,
  togglePlacement = "sidebar",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  drawerOpen: controlledDrawer,
  onDrawerOpenChange,
  phoneNavigation = "drawer",
  ...shellProps
}: ApplicationShellSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed)
  // Below 1024px the sidebar is not in the page; the same brand, action,
  // navigation and footer open in a drawer from the header instead.
  const [innerDrawer, setInnerDrawer] = React.useState(false)
  const drawerOpen = controlledDrawer ?? innerDrawer
  const setDrawerOpen = (open: boolean) => {
    if (controlledDrawer === undefined) setInnerDrawer(open)
    onDrawerOpenChange?.(open)
  }
  const menuRef = React.useRef<HTMLButtonElement>(null)
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
      {isCollapsed ? <PanelLeftOpen className="icon" aria-hidden="true" /> : <PanelLeftClose className="icon" aria-hidden="true" />}
    </Button>
  ) : null

  const menu = (
    <Button
      ref={menuRef}
      variant="ghost"
      size="sm"
      className="app-shell-menu btn-icon"
      aria-expanded={drawerOpen}
      aria-label="Open navigation"
      title="Navigation"
      onClick={() => setDrawerOpen(true)}
    >
      <Menu className="icon" aria-hidden="true" />
    </Button>
  )

  return (
    <AppShell {...shellProps} data-phone-drawer="true" data-phone-navigation={phoneNavigation}>
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
        <Header variant={headerVariant} data-phone-only={header || (collapsible && togglePlacement === "header") ? undefined : "true"}>
          {menu}
          {phoneNavigation === "bottom" && <div className="app-shell-phone-brand">{brand}</div>}
          {togglePlacement === "header" && toggle}
          {header}
        </Header>
        {children}
      </AppShellMain>
      {panel}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent
          placement="side"
          className="app-shell-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            menuRef.current?.focus()
          }}
        >
          <DrawerHeader><VisuallyHidden.Root asChild><DrawerTitle>Navigation</DrawerTitle></VisuallyHidden.Root>{brand}</DrawerHeader>
          <DrawerBody
            onClick={(event) => {
              // A destination, or anything the product marks as one, leaves
              // the drawer: the page it opens is the point.
              if ((event.target as Element).closest("a[href], [data-slot='navigation-link'], [data-shell-navigate]")) setDrawerOpen(false)
            }}
          >
            {primaryAction}
            <ApplicationShellNavigation navigation={navigation} navigationLabel={navigationLabel} collapsible={false} />
            {footer && <div className="app-shell-drawer-footer">{footer}</div>}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {phoneNavigation === "bottom" && <BottomNav aria-label={navigationLabel}>
        {navigation.flatMap(group => group.destinations).map((destination, index) => (
          <BottomNavLink
            key={`${destination.href}-${index}`}
            href={destination.href}
            active={destination.active}
            onClick={(event) => {
              if (!destination.onClick) return
              event.preventDefault()
              destination.onClick()
            }}
          >
            {destination.leading && <span className="bottom-nav-icon" aria-hidden="true">{destination.leading}</span>}
            <span>{destination.label}</span>
            {(typeof destination.trailing === "string" || typeof destination.trailing === "number") && <BottomNavBadge>{destination.trailing}</BottomNavBadge>}
          </BottomNavLink>
        ))}
      </BottomNav>}
    </AppShell>
  )
}

export { AppShell, AppShellMain, AppShellPanel, AppShellPanelToggle, ApplicationShell }
export type {
  ApplicationShellDestination,
  ApplicationShellGroup,
  ApplicationShellProps,
}
