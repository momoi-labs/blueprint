# DropdownMenu

A contextual menu of actions anchored to a specific control. It opens on
demand, stays near its trigger, and closes after a choice or dismissal.

## Purpose

DropdownMenu offers actions *about this thing*: a row, an avatar, a kebab in
a Card header, a column of overflow actions. The trigger owns the context;
the menu does not search the whole app.

User story #20.

### Choose the right action menu

| Need | Control | Why |
| --- | --- | --- |
| Actions on a specific element | **DropdownMenu** | Anchored; contextual. |
| Global actions / navigation by query | **[CommandPalette](command-palette.md)** | Not anchored to one element. |
| Single choice that sets a value | **[Select](select.md)** | Value selection, not a list of verbs. |
| Navigate to a URL as primary affordance | **[Link](link.md)** | Real navigation; menu items may still contain links when appropriate. |

DropdownMenu vs CommandPalette (user story #20): if the person must first
find the object, then open its menu, use DropdownMenu. If they are running
a global command without a local trigger, use CommandPalette.

Header (navigation slice) may compose DropdownMenu for account or overflow
actions. [Table / DataTable](table.md) uses it for row actions.

## Anatomy

```
DropdownMenu
├── Trigger (Button, IconButton, or other focusable control)
└── Content (portaled elevated surface)
    ├── Label (optional section label)
    ├── Item × N
    │   ├── leading icon (optional)
    │   ├── label (required)
    │   ├── shortcut hint (optional)
    │   └── destructive styling (optional)
    ├── Separator (optional)
    ├── Checkbox item (optional; rare)
    ├── Radio group (optional; rare)
    └── Submenu (optional)
        ├── Sub-trigger
        └── Sub-content
```

- **Trigger.** Usually [IconButton](icon-button.md) (`ghost` `sm`) with an
  accessible name ("Actions for {row}", "Open account menu"). Never an
  unnamed icon.
- **Item.** A verb or destination ("Edit", "Duplicate", "Delete", "View
  logs"). Prefer verbs for actions.
- **Separator.** Groups related items; decorative.
- **Destructive item.** Irreversible actions; use danger treatment on the
  item label/icon, not a filled danger panel. Confirm with Modal when stakes
  are high (overlay slice).

## Variants

Presentation is one menu system; item *kinds* vary:

| Kind | When |
| --- | --- |
| `action` (default) | Runs a command or opens a follow-on UI. |
| `link` | Navigates; implement as a real link item when the reference supports it so open-in-new-tab works. |
| `destructive` | Destructive/irreversible action. |
| `checkbox` / `radio` | Rare in Kiso v1; only when the menu is the established pattern for a compact multi/one option set. Prefer Select/Checkbox in forms. |

Trigger variants come from Button/IconButton — DropdownMenu does not define
a parallel size/color system for the trigger.

Content tokens: background `--color-elevated-surface`, border
`--color-border`, text `--color-foreground`, muted hints
`--color-muted-foreground`, destructive `--color-danger`, focus/highlight
`--color-focus` / quiet `--color-surface` for the highlighted item. Radius
`--radius-md`. Padding `--spacing-xs` around the list; item padding
`--spacing-sm` / `--spacing-md`.

## Sizes

| Axis | Rule |
| --- | --- |
| Trigger | IconButton/Button `sm` in tables and dense chrome; `md` in headers. |
| Content | Min width fits labels; match trigger width only when it helps. No raw px — spacing and type roles. |
| Items | One density; do not ship `sm`/`lg` item scales. |

## States

| State | Behavior |
| --- | --- |
| default (closed) | Trigger at rest; content unmounted or hidden. |
| hover | Trigger and highlighted item show quiet emphasis. |
| focus | Trigger shows `--color-focus` when focused. Open content uses highlighted item semantics. |
| open / active | `data-state="open"` on trigger; content visible; focus moves into the menu per Radix model. |
| disabled | Trigger cannot open, or individual items disabled with `--color-disabled`. Prefer omitting unavailable items when absence is clear. |
| loading | Rare on the menu itself. A trigger IconButton may show loading after an item was chosen and the menu has closed. Do not leave a stuck open menu in a loading limbo. |
| error | Not a menu chrome state. Failures after an action use Alert/Toast (as appropriate) on the page. |

### Open / close

- Open on click / Enter / Space / ArrowDown on the trigger (per Radix).
- Close on item select, `Escape`, focus loss outside, or opening another
  overlay — preserve Radix dismiss behavior.
- Pointer: hover may highlight items; selection commits on click, not merely
  on hover.

## Accessibility

- Trigger must have an accessible name. Icon-only triggers use `aria-label`
  or `aria-labelledby`.
- Use Radix Dropdown Menu roles (`menu`, `menuitem`, etc.) — do not fake a
  menu with a div list lacking keyboard support.
- `aria-expanded` / `aria-controls` (or the library equivalents) reflect open
  state.
- Destructive items must not rely on color alone; include clear labeling
  ("Delete replica").
- Submenus: follow Radix focus movement; do not invent a second Escape
  model.
- Do not place essential instructions only inside a closed menu.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` / `Space` | Open from trigger; activate focused item when open. |
| `ArrowDown` / `ArrowUp` | Open from trigger (where supported) or move between items. |
| `Home` / `End` | Move to first / last item when supported. |
| `ArrowRight` / `ArrowLeft` | Open / close submenu when present. |
| `Escape` | Close menu; return focus to trigger. |
| Typeahead | Focus the item matching typed characters when supported. |

## When to use

- Overflow / kebab actions on a table row, Card, or list item.
- Account or session menus in Header chrome.
- A small set of contextual verbs that would clutter the layout if always
  visible (user story #20).

## When NOT to use

- **Global command search.** [CommandPalette](command-palette.md).
- **Filtering visible content.** [Search](search.md).
- **Primary page actions.** Prefer visible [Button](button.md)s in
  PageHeader; menus are secondary/overflow.
- **Choosing a single form value from many.** [Select](select.md).
- **Navigation that should look like a menu of destinations as the main IA.**
  Prefer Sidebar / Navigation (navigation slice); a DropdownMenu of links is
  fine for compact account/overflow only.
- **Tooltips.** Tooltips are non-essential hints ([Tooltip](tooltip.md));
  menus are actionable.

## Tokens

`--color-elevated-surface`, `--color-surface`, `--color-foreground`,
`--color-muted-foreground`, `--color-border`, `--color-danger`,
`--color-focus`, `--color-disabled`, plus spacing, radius, shadow, type,
motion. Trigger consumes Button/IconButton tokens. No raw hex/px.

## Radix/shadcn mapping

| Kiso | Reference |
| --- | --- |
| Behavior | Radix [Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) |
| Styling / composition | shadcn [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu) |
| Trigger | Kiso [Button](button.md) / [IconButton](icon-button.md) via `asChild` / Slot when needed |
| Destructive item | shadcn `destructive` item class → `--color-danger` text/icon, not filled |

Preserve Radix focus management, typeahead, submenu behavior, and portal
positioning. Restyle with Kiso semantic tokens only.

Do **not** map row actions to Command/cmdk. Do **not** use Select to fake an
action menu.
