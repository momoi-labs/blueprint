# AppShell

## Purpose

AppShell places persistent [Sidebar](sidebar.md) navigation and an optional
context panel beside the main application content. It owns the page columns,
not navigation or panel state.
ApplicationShell composes the standard frame when a product wants the complete
shared chrome — either a console with a rail, or a single-surface top bar.

## Anatomy

Console with rail (default):

```
AppShell
├── Sidebar
├── AppShellMain
│   ├── Header or PageHeader (optional)
│   └── page content
└── AppShellPanel (optional)
```

Single-surface top bar (`layout="topbar"`):

```
AppShell[data-layout="topbar"]
└── AppShellMain
    ├── Header (brand, primaryAction, header)
    └── page content
```

The console slots are direct children. AppShell is a `div`; AppShellMain is a
`main` with `min-width: 0`, so wide tables and log lines cannot push the
Sidebar off screen. Sidebar owns its header, body, and footer.

ApplicationShell takes `brand`, optional `primaryAction`, optional `header`,
and page content. The default `layout="sidebar"` also takes navigation groups
and optional `footer`. A destination contains `href`, `label`, optional
`active`, optional `onClick`, and optional leading or trailing content. The
caller still decides the current destination and whether a destination follows
its link or changes a view in place.

```tsx
<ApplicationShell
  brand={<ProductBrand />}
  navigation={[{
    label: "Applications",
    destinations: apps.map((app) => ({
      href: `#app-${app.id}`,
      label: app.name,
      active: app.id === currentId,
      onClick: () => open(app.id),
    })),
  }]}
  header={<CurrentLocation />}
  footer={<ProductSettings />}
>
  {page}
</ApplicationShell>
```

```tsx
<ApplicationShell
  layout="topbar"
  brand={<ProductBrand />}
  primaryAction={<CreateProject />}
  header={<BoardChrome />}
>
  {page}
</ApplicationShell>
```

When `onClick` is present, ApplicationShell prevents link navigation and calls
it. Without `onClick`, the destination remains a normal link. Use
`navigationLabel` to distinguish this navigation landmark when the default
`Primary` label is not specific enough.

### Optional sidebar collapse

Set `collapsible` to add a toggle to the sidebar header by default.
Use `togglePlacement="header"` to place the same control at the start of the
main header. If the header slot is empty, the shell creates a header for the
toggle. Omitting `togglePlacement`, or choosing `"sidebar"`, keeps the existing
placement. The option only applies to collapsible sidebar layouts.

Both positions retain the same label, `aria-controls`, `aria-expanded` and
focus recovery. There is exactly one toggle; do not hide an internal control
with CSS. Both positions hide it at the existing narrow breakpoint. The sidebar starts
expanded; `defaultCollapsed` changes that initial state. `collapsed` and
`onCollapsedChange` provide controlled state when the product needs to store
the user's preference. Navigation updates do not reset the state. Kiso does
not write to browser storage.

```tsx
<ApplicationShell
  collapsible
  collapsed={sidebarCollapsed}
  onCollapsedChange={setSidebarCollapsed}
  brand={<ProductBrand />}
  navigation={groups}
>
  {page}
</ApplicationShell>
```

Use each destination's `leading` slot for its icon. Collapsed destinations keep
their accessible labels and active indication; destinations without icons keep
visible text. The collapsed header retains the toggle, while brand, primary
action, group labels, trailing content, and footer are hidden. Expanding brings
them back. These props apply only to `layout="sidebar"`.

The control uses the current appearance tokens. It does not choose a border
style, corner shape, accent, or theme for the product.

### Optional context panel

Place `AppShellPanel` after `AppShellMain` for settings, an inspector, or
contextual tools. It renders an `aside` at the inline end, opposite Sidebar.
Give it an accessible name with `aria-label` or `aria-labelledby`.
ApplicationShell accepts the same element through its `panel` slot in either
layout.

`hidden` removes the panel and its column from view while keeping its children
mounted. A direct Sidebar with `hidden` also releases its whole column.
Either side can hide independently. Sidebar's existing `collapsed` mode still
keeps a compact navigation rail.

```tsx
<AppShell>
  <Sidebar hidden={!navigationOpen}>{navigation}</Sidebar>
  <AppShellMain>{header}{page}</AppShellMain>
  <AppShellPanel hidden={!settingsOpen} aria-label="Settings">
    {settings}
  </AppShellPanel>
</AppShell>
```

The caller owns open state and toggle Buttons. Keep the toggles outside the
regions they hide, connect them with `aria-controls` and `aria-expanded`, and
return focus to the matching toggle before hiding a focused region. The panel
does not trap focus or close when the user interacts with the main content.
Closing it must not discard form values.

`AppShellPanelToggle` is a Button with required `aria-controls` and
`aria-expanded` props. Its default `placement="header"` stays in normal flow.
`placement="floating"` puts it halfway down the viewport's inline end. While
expanded, it follows the panel's outer edge; while closed, it returns to the
viewport edge. Use floating placement in a full-page shell. Embedded previews
should keep header placement.

Place the toggle in AppShellMain, directly or inside its Header, outside the
panel it controls. Floating placement reserves a strip beside the main content
so the button cannot cover content, actions, or its scrollbar. The strip stays
available while the panel is closed and disappears with header placement.
On narrow screens the strip and button use the minimum touch width. Prefer an
icon with an accessible name there.

Reuse the same Button to open and close. It retains native Enter/Space behavior and
accepts a custom label and children. On narrow screens, floating placement
stays at the viewport edge; applications adapting the panel to a Drawer use
the Drawer's close control while its modal overlay is open.

```tsx
<AppShellPanelToggle
  placement="floating"
  aria-controls="settings-panel"
  aria-expanded={settingsOpen}
  onClick={() => setSettingsOpen(open => !open)}
/>
```

The panel width defaults to `--size-sidebar`. Set `--app-shell-panel-width`
on the host shell to allocate a different width. On desktop it stays at the
top of the viewport and scrolls within its own column. At 1023px and below,
it stacks after the main content with a maximum height of 50vh. Applications
that need an overlay on narrow screens can render the same controls in
[Drawer](drawer.md), with its modal focus and dismissal behavior.

## Variants

`layout="sidebar"` (default) mounts Sidebar with brand and primary action in
SidebarHeader, navigation in SidebarBody, and optional footer. The optional
`header` slot stays in the main column.

`layout="topbar"` omits Sidebar entirely. Brand, optional primary action, and
the optional `header` slot render together in Header. Do not pass `navigation`
or `footer` in this mode — there is no rail to host them.

Compose [Header](header.md) and [PageHeader](page-header.md) inside the main
slot as the page requires when using AppShell directly.

### Inset content

`variant="inset"` adds space around the shell and a border around its main
content. `variant="default"` keeps the existing edge-to-edge layout. Both
AppShell and ApplicationShell accept this option, independently of `layout`.

Set `data-app-shell="inset"` on `html` to choose the frame across an
application. Omit `variant` to follow that preference. An explicit `variant`
overrides it for one shell. Without either setting, the default stays
edge-to-edge. The gallery saves this choice under Appearance > Layout > Application
frame.

An embedded preview can mark its content wrapper with
`data-slot="app-shell-main"` to receive the frame without nesting main landmarks.

The inset frame uses the current Appearance settings for border style, corner
size, and corner marks. Colors follow the active theme and palette. It does
not force rounded corners. The surrounding area uses `--color-sidebar`; the
main area uses `--color-background` and `--color-border`.
The main frame and its outer corner marks paint above both adjacent rails.

```tsx
<ApplicationShell
  variant="inset"
  collapsible
  brand={<ProductBrand />}
  navigation={groups}
>
  <div className="page">
    <PageHeader variant="editorial">
      <PageHeaderTitle>Your homelab</PageHeaderTitle>
      <PageHeaderDescription>
        Applications, machines, and images in one place.
      </PageHeaderDescription>
    </PageHeader>
    {content}
  </div>
</ApplicationShell>
```

PageHeader's variant controls the heading. AppShell's variant controls the
frame. Either can be used alone.

## Sizes

The Sidebar column uses `--size-sidebar`; the main column takes the remaining
width with a zero minimum. The shell has a minimum height of one viewport.
The collapsed rail leaves room for touch targets and navigation padding.
At widths of 1023px or less, a sidebar layout becomes one column. Sidebar
stacks above the content with a scrollable body and a maximum height of 40vh.
Labels remain visible, and the desktop collapse toggle is hidden. Resizing
back to desktop restores the collapse state.

`layout="topbar"` is a single main column at every width. It does not rely on
the 1023px media query to collapse a sidebar track.

The inset variant reserves `--spacing-lg` around the shell within its viewport
height. On desktop, a top-level inset shell keeps its frame, header, and sidebar
in place while its page container scrolls. Wrap page content in one container,
such as `.page`, beside the optional Header. This keeps the top border and
corner marks visible during scrolling. Embedded shells keep their natural
height. On narrow screens, navigation stacks above the main content and the
document scrolls as in the default variant.

## States

The shell stays in place while page content loads, fails, or becomes empty.
Those states belong inside AppShellMain. There is no disabled or active shell.

## Accessibility

- Use one main landmark for the page. Do not nest another `main` inside
  AppShellMain.
- Give the Sidebar's navigation an accessible name and provide a skip link to
  the main content.
- Keep navigation available when the Sidebar is hidden. AppShell does not
  create a mobile menu or manage its focus.
- A top-bar layout has no Sidebar navigation landmark; put destinations in the
  Header or elsewhere in the product chrome.
- The collapse Button names its action and exposes `aria-expanded` and
  `aria-controls`. If collapsing would hide the focused control, focus moves
  to the toggle. Enter and Space activate it through native Button behavior.

### Keyboard

No shell keymap. Tab follows the controls in DOM order; navigation and Drawer
retain their own keyboard behavior.

## When to use

- An application with persistent navigation beside a changing page.
- A console containing tables, detail panes, and logs in its main column.
- A single-surface product whose chrome is one top bar (`layout="topbar"`).
- Use ApplicationShell when the product follows one of the two standard frames.
- Use AppShell directly when its Sidebar or Header composition differs.

## When NOT to use

- A standalone login or centered form. Use [Card](card.md) within the page.
- Two resizable content panes. Use [Split](split.md) inside the main content.
- Hiding a required rail with CSS. Prefer `layout="topbar"` or AppShell
  composed without Sidebar.

## Radix/shadcn mapping

No dedicated Radix primitive. Compose Sidebar and a semantic main region.
AppShell supplies Kiso's column layout; it does not add a Sidebar provider,
routing, or collapse state. ApplicationShell owns optional collapse state, or
accepts it from the product.


## Canvas appearance

The [appearance attributes](../tokens.md#frames-scopes-and-backgrounds) style
an inset main frame independently from its inner panels. AppShell owns one
background behind its content column. The background excludes the navigation
and context panel and follows their expanded or hidden state.

Momoi uses the symbol alone, with equal edge insets and the same frame margin
as other patterns. Translucent fill changes background paint only. Text, fields and
portalled overlays stay opaque. An embedded AppShell does not repeat the
background unless it has `data-background-canvas`.

The CSS works with the existing direct-child anatomy. No React provider,
extra wrapper, or gallery stylesheet is required.

`data-paper-tone="accent"` tints the canvas, cards and application rails with the current accent
surface. `data-background-placement` selects `inside`, `outside` or `both`.
Translucent panel fill works with every background; text and native fields
remain opaque. Outside patterns keep an opaque main backing, except for the
Momoi signature that can extend behind translucent content.

## Plain header

`headerVariant="plain"` forwards to Header in sidebar and topbar layouts.
It removes only the header fill and separator, including in inset frames.
Omission keeps the existing header treatment.
