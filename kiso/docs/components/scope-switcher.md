# ScopeSwitcher

Shows the current scope of an application, such as organization, project and
resource, as a row of switchers in [Header](header.md). Each level opens a
list of its choices. Choosing one changes the scope and keeps the current
page.

## Purpose

A console often works inside nested scopes: an organization holds projects,
a project holds servers. People need to see the scope on every page and change
one level without losing their place. ScopeSwitcher does both in Header, so
pages stop repeating a project or server Select beside their title.

It is not a [Breadcrumb](breadcrumb.md). A Breadcrumb links to ancestor pages
and leaves the current page as text. A scope segment is a control that
replaces the current choice and keeps the page. Where the page goes after a
switch is set by the [Application shell](../patterns/application-shell.md#scope-in-header)
pattern.

### Choose the right control

| Need | Control | Why |
| --- | --- | --- |
| Change the org, project or resource the whole app works in | **ScopeSwitcher** | Scope, always visible in Header, keeps the page. |
| Go up to an ancestor page | [Breadcrumb](breadcrumb.md) | Ancestors are pages, not choices. |
| Narrow one collection on the page | [Filtering](../patterns/filtering.md), [Search](search.md) | Filters narrow content; they do not change what the page is about. |
| One form value from a set | [Select](select.md) | Form data, not app scope. |
| Actions on one object | [DropdownMenu](dropdown-menu.md) | Verbs, not a current choice. |
| Jump anywhere by query | [CommandPalette](command-palette.md) | May offer "Switch project" as a shortcut; ScopeSwitcher stays the visible path. |

## Anatomy

```
ScopeSwitcher          <nav aria-label="Scope">
└── ordered list
    ├── ScopeSegment × 1–3, in hierarchy order
    │   └── trigger    Button: current name + chevron
    └── separator      "/" between segments, decorative

Segment popup          Popover, role="dialog", named "Switch project"
├── filter             combobox input (only when searchable)
├── listbox            named "Projects"
│   ├── All option     optional, first, divided from the named choices
│   ├── group label    optional, for grouped choices
│   └── option × N     current choice selected, with a check
├── status             loading, error with Retry, empty, no matches
└── destinations       Links below a separator ("Manage projects")
```

```tsx
<ScopeSwitcher>
  <ScopeSegment level="Organization" value={org.id} options={orgs}
    onValueChange={switchOrg}
    destinations={<ScopeDestination href="/settings">Organization settings</ScopeDestination>} />
  <ScopeSegment level="Project" value={projectId} options={projects}
    all={{ value: "all", label: "All projects" }} onValueChange={switchProject}
    destinations={<ScopeDestination href="/projects">Manage projects</ScopeDestination>}
    labels={{ list: "Projects" }} />
  <ScopeSegment level="Server" value={serverId} options={servers} searchable
    all={{ value: "all", label: "All servers" }} onValueChange={switchServer}
    status={servers.status} onRetry={servers.retry}
    labels={{ list: "Servers", empty: "No servers in Checkout." }} />
</ScopeSwitcher>
```

An option has a `value`, a `label`, an optional `description`, and an
optional `group` label. Options with the same group render together under its
label, in the order the groups first appear.

`labels` overrides every fixed text: the trigger name prefix (`level`), the
popup name (`dialog`), the listbox name (`list`), the filter name (`filter`),
`loading`, `error`, `retry`, `empty`, `noMatches` (a function of the query),
and the trigger text while the current name is unknown (`unknown`). Products
translate through it; English defaults derive from `level`.

### Primitives

- **Segment trigger.** A Kiso [Button](button.md) (`ghost`, `sm` in dense
  chrome, `md` otherwise) that opens a [Popover](popover.md). It has
  `aria-haspopup="dialog"` and `aria-expanded`. Its accessible name is the
  level and the current name, "Project Checkout", so the visible text is part
  of the name.
- **Choices.** A `listbox` of `option`s inside the popup. The current choice
  has `aria-selected="true"` and a visible check. Nothing in the switcher uses
  `aria-current="page"`: the segments are a current choice, not the current
  page.
- **Separators.** Decorative. Rendered from CSS or with `aria-hidden="true"`,
  never focusable.
- **Destinations.** Real [Link](link.md)s outside the listbox, so
  open-in-new-tab works. They never show a selected state and never change
  the scope.

Choosing an option calls `onValueChange`. Options are not links: the product
decides the URL and navigates. A choice that needs open-in-new-tab is a
destination, not an option.

Why not the existing controls: Breadcrumb items are ancestor links.
DropdownMenu holds verbs and sends a single-value choice to Select, and a menu
cannot host a filter input. Select has no room for destinations, a retry or a
filter.

### All and destinations

An "All" choice, such as "All projects", is an ordinary option. It comes
first, a divider sets it apart from the named choices, and it is selected and
announced like any other. Use it when a page can show every child of the
parent level at once. It hides while a filter query is active, so a query with
no matches says so.

Destinations, such as "Manage projects" or "Organization settings", sit below
a separator after the listbox. They lead to a page about the level, so they
are links, not choices. Keep them to one or two per segment.

### Filter

`searchable` adds a filter above the listbox. Turn it on when a level can hold
more than ten choices. The filter is the popup's own combobox:

- `role="combobox"` with a visible-placeholder input named "Filter projects",
  `aria-autocomplete="list"`, `aria-controls` pointing at the listbox,
  `aria-expanded="true"` while the listbox shows, and `aria-activedescendant`
  pointing at the active option.
- Matching is case-insensitive and finds the query anywhere in the label or
  description.
- No matches: the listbox is empty, the status says "No projects match
  "billing"" in a polite live region, `aria-activedescendant` is removed, and
  `Enter` does nothing.
- The query clears when the popup closes.

Do not put an input inside a DropdownMenu instead.

## Variants

No visual variants. The number of segments and `searchable` are composition
choices.

## Sizes

The trigger follows Button `sm` or `md`; Header uses `md`, and coarse pointers
keep the 44px touch minimum in both dimensions. The popup is at least as wide
as its trigger and at most the viewport width minus `--spacing-md` on each
side. Its height is bounded by the space available below or above the
trigger: filter, status and destinations stay in place and the listbox
scrolls.

## Keyboard and focus

| Key | Where | Action |
| --- | --- | --- |
| `Tab` / `Shift+Tab` | switcher | One stop per segment trigger, in hierarchy order. Separators are skipped. |
| `Enter`, `Space`, `ArrowDown`, `ArrowUp` | trigger | Open the popup. |
| `ArrowDown` / `ArrowUp` | popup | Move the active option, wrapping at the ends. |
| `Home` / `End` | listbox | First / last option. In the filter they move the caret. |
| Printable keys | listbox | Typeahead: jump to the next option whose label starts with the typed text. |
| Printable keys | filter | Edit the query. |
| `Enter` | popup | Choose the active option, close, return focus to the trigger. |
| `Space` | listbox | Same as `Enter`. In the filter it types a space. |
| `Escape` | popup | Close without choosing, return focus to the trigger. |
| `Tab` | popup | Move through the filter or listbox, Retry and destinations. Past the last one, the popup closes and focus moves to the control after the trigger. |
| `Shift+Tab` | popup | Move back. Before the first control, the popup closes and focus returns to the trigger. |

Focus rules:

- On open, focus goes to the stable target: the filter when the segment is
  searchable, else the listbox (`tabIndex="0"` with
  `aria-activedescendant`). The target stays mounted in every state, so focus
  never lands on something that disappears.
- The active option starts on the current choice, else the first option. It
  has its own visible treatment, distinct from the selected check. Option ids
  are stable. After filtering or a change of options, the active option stays
  if still present, else moves to the current choice or the first option, and
  scrolls into view. With no options, the active option is cleared.
- Status changes while open are announced and never move focus. Retry moves
  focus to the stable target before loading starts. If a focused element is
  removed anyway, focus goes to the stable target.
- Choosing the current option only closes the popup. A composing IME never
  moves or chooses.

## States

| State | Behavior |
| --- | --- |
| default | Each trigger shows its current name; the popup is closed. |
| hover | Button hover on the trigger; quiet fill on the option under the pointer. |
| focus | `--color-focus` ring on the trigger and the filter; the active option shows its active treatment. |
| open | Trigger `aria-expanded="true"` and `data-state="open"`. |
| loading | The trigger stays enabled and keeps the current name the product already knows, for example from the URL. If it knows none, the trigger shows a [Skeleton](skeleton.md) line and is named "Project, loading". Open, the status shows a [Spinner](spinner.md) and "Loading projects", the listbox is `aria-busy="true"`, and no stale options show as ready. |
| error | The trigger keeps the current name. Open, the status says "Couldn't load projects." with a Retry [Button](button.md). Destinations stay. |
| empty | The level has no choices. The trigger shows the product's empty text, the status shows the product's message ("No servers in Checkout."), and destinations stay so the person can create one. |
| no matches | See [Filter](#filter). |
| long name | The trigger truncates with an ellipsis; its accessible name keeps the full name. Options wrap and are never truncated, so the open list always shows the full name. |
| disabled | Not used. A level that does not apply on a page is omitted, not disabled. |

The switcher loads its own data. A failed page request never disables or
hides it, so the person can change scope to leave a broken view.

## Narrow screens

Below 700px Header stays one row and the switcher collapses to one compact
trigger in the same place:

```
Header   [☰] [Brand]  ≡ db-prod-01 ▾  [Account]
                         └── Scope popup
                             ├── Organization  Acme ▾
                             ├── Project       Checkout ▾
                             └── Server        db-prod-01 ▾
```

- The compact trigger shows the deepest current name and a decorative
  stacked-levels icon. Its accessible name is "Scope: Acme / Checkout /
  db-prod-01", with `aria-haspopup="dialog"` and `aria-expanded`.
- It opens a popup named "Scope" that lists every level as the same segment
  trigger, stacked in hierarchy order, each with its level name visible.
  Each one opens its own list. Every level is two taps away at 390px.
- Opening the popup focuses the first level. `Tab` past a level's list moves
  to the next level; past the last level, the popup closes and focus moves
  on from the compact trigger. `Escape` in a level's list
  returns focus to that level; `Escape` again closes the popup and returns
  focus to the compact trigger. Choosing an option closes both and returns
  focus to the compact trigger.
- Nothing is reordered with CSS, so focus order matches what the person
  sees. The popups keep the width and height bounds above.

Showing only the deepest segment, with no path to the others, is not enough.
Use at most three segments; a deeper hierarchy belongs in
[Sidebar](sidebar.md) or the page.

## Accessibility

- `<nav>` named "Scope" by default; rename it when the product has another
  term. One switcher per page.
- Triggers are named by level and current name. The chevron is decorative.
- The popup is a non-modal dialog named "Switch project". It does not trap
  focus.
- The current choice is `aria-selected="true"` plus a check, never color
  alone.
- Status text uses one polite live region per popup.
- Respect reduced motion: the popup appears without movement.

## When to use

- A product with two or three nested scopes that most pages depend on.
- Pages that would otherwise repeat a scope Select beside their title.

## When NOT to use

- One flat scope with a single choice: show it as text or use an account
  menu.
- Filtering a list on one page. Use [Filtering](../patterns/filtering.md).
- Showing ancestor pages of a detail record. Use [Breadcrumb](breadcrumb.md).
- More than three levels.

## Tokens

The trigger consumes Button tokens. The popup uses `--color-popover`,
`--color-border`, `--radius-lg`, `--shadow-lg`, `--spacing-xs` list padding,
`--spacing-sm` / `--spacing-md` item padding, `--color-accent-surface-hover`
for the active option, `--color-primary` for the check,
`--color-muted-foreground` for separators, group labels, descriptions and
status, `--color-danger` for the error text, `--color-focus`,
`--motion-duration-fast`, and `--motion-easing-standard`. Items use the five
body typography tokens; group labels use the five label typography tokens.
No new tokens and no raw values.

## Radix/shadcn mapping

| Kiso | Reference |
| --- | --- |
| Popup, placement, dismissal, focus return | Radix [Popover](https://www.radix-ui.com/primitives/docs/components/popover) |
| Filter and list | WAI-ARIA APG [combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and [listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), with the active-descendant model Kiso's CommandPalette already uses |
| Reference products | shadcn Combobox (Popover + Command) for layout only |

Do not build it from DropdownMenu or Select, and do not reuse Breadcrumb
markup.
