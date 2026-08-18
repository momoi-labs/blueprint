# CommandPalette

A global, keyboard-first overlay for running actions and navigating the
product by searching commands and destinations.

## Purpose

CommandPalette is the "do or go anywhere" surface: open a query editor, jump
to a replica, switch project, run a frequent action — without hunting through
menus. It is invoked by a documented shortcut, filters a command list as the
person types, and is fully operable from the keyboard.

User stories #5, #19, and #20.

### Choose the right command surface

| Need | Control | Why |
| --- | --- | --- |
| Global actions and navigation | **CommandPalette** | App-scoped; search-as-you-type commands. |
| Filter items in a visible list/table | **[Search](search.md)** | Scoped to that collection; not an overlay of commands. |
| Actions on one specific element | **[DropdownMenu](dropdown-menu.md)** | Anchored to that control; contextual, not global. |

Search vs CommandPalette (user story #19): Search filters *content already
in view*. CommandPalette finds *actions and destinations* across the app.

DropdownMenu vs CommandPalette (user story #20): DropdownMenu is
*contextual* to a trigger. CommandPalette is *global*.

## Anatomy

```
CommandPalette
├── Overlay / dialog surface (modal or non-modal per product; usually modal)
├── Input (command filter; autofocused on open)
├── List
│   ├── Group (optional) × N
│   │   ├── Group heading
│   │   └── Item × N
│   │       ├── Icon (optional)
│   │       ├── Label (required)
│   │       ├── Shortcut hint (optional; visual only if not a real keybinding)
│   │       └── Description (optional)
│   └── Empty message (no matching commands)
└── Footer hints (optional; keyboard legend)
```

- **Input.** Filters commands; not a general document Search. Placeholder
  like "Type a command or destination…".
- **Item.** One command or destination. Activating runs the action or
  navigates.
- **Group.** Optional categories ("Navigation", "Replicas", "Settings").
- **Empty.** In-palette message when the filter matches nothing — not the
  page-level [EmptyState](empty-state.md).

## Variants

| Variant | Behavior |
| --- | --- |
| `commands` (default) | Mixed actions and destinations in one palette. |
| `navigation` | Destinations only (rare; prefer one palette with groups). |

Do not ship separate palettes per page unless the product truly scopes
commands; default is one app-level palette.

Surface: `--color-elevated-surface`, border `--color-border`, shadow
`--shadow-sm`, radius `--radius-lg`. Input and items use foreground /
muted-foreground roles. Active (highlighted) item uses `--color-surface` or
a quiet `--color-primary` indicator without filling the row in primary ink.

## Sizes

One size. The palette is a centered (or top-anchored) elevated panel with
max width from layout tokens / spacing rhythm — not Button `sm|md|lg`.
Item row padding `--spacing-sm` block, `--spacing-md` inline. Type:
`--type-role-body` for items; `--type-role-label` for group headings.

## States

| State | Behavior |
| --- | --- |
| default (closed) | Not in the tree, or inert. Shortcut available. |
| open | Input focused; list visible; focus trapped within the palette while open (if modal). |
| hover | Item under pointer highlighted; keyboard highlight is source of truth when last input was keyboard. |
| focus | Input focus ring `--color-focus`. Highlighted item is the active descendant, not a second tab stop per row. |
| active | Item activation (Enter / click) runs the command and usually closes the palette. |
| disabled | Individual items may be disabled with `--color-disabled` and an explanation in description; prefer omitting unavailable commands. |
| loading | Optional: Spinner in the list while command providers resolve. Keep the input usable. `aria-busy` on the list region. |
| error | Provider failure: short in-palette message or Alert pattern inside the panel; do not fail silently to an empty list that looks like "no matches". |

### Invocation (user story #5)

| Mechanism | Behavior |
| --- | --- |
| Shortcut | Default recommendation: `⌘K` (macOS) / `Ctrl+K` (Windows/Linux), documented in product chrome. Do not bind Search fields to this shortcut. |
| Explicit trigger | Optional Button/IconButton in the Header ("Search commands…") that opens the same palette. |
| Search-as-you-type | Filter updates the list as the person types. |
| Keyboard navigation | Arrow keys move the highlight; Enter activates; Escape closes. |

## Accessibility

- Prefer a modal dialog pattern (`role="dialog"`, `aria-modal="true"`) with
  an accessible name ("Command palette" / product-specific).
- Input has a visible or programmatically associated label.
- List uses `role="listbox"` (or cmdk's list semantics) with items as options;
  the active item is exposed via `aria-activedescendant` on the input **or**
  an equivalent pattern preserved from the reference library — do not invent
  a broken tab-per-item list.
- Focus moves to the Input on open; on close, focus returns to the previously
  focused element (or the trigger).
- Shortcut hints in items are decorative unless they document real bindings;
  real bindings must work even when the palette is closed (where claimed).
- `Escape` closes without running a command.
- Reduced motion: no gratuitous entrance animation beyond token durations.

### Keyboard

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Toggle open/close (product default). |
| Printable keys | Filter commands (input focused). |
| `ArrowDown` / `ArrowUp` | Move highlight through items (and across groups). |
| `Enter` | Activate highlighted item. |
| `Escape` | Close without activating. |
| `Tab` | Generally stays within the palette (focus trap) while open; do not tab into the page behind a modal palette. |

## When to use

- App-wide command and navigation entry (user stories #5, #19, #20).
- Power-user shortcuts to frequent destinations in data tools.
- Discoverability for actions that would otherwise hide in nested menus.

## When NOT to use

- **Filtering a table or list in place.** [Search](search.md).
- **Actions on one row/button/avatar.** [DropdownMenu](dropdown-menu.md).
- **Confirming a destructive action.** Modal/Dialog (overlay slice) after
  the command is chosen, if confirmation is required.
- **Form data entry.** Inputs and FormField — the palette is not a form.
- **Teaching the only path to a critical action.** Palette is acceleration;
  critical actions still need a visible control somewhere.

## Tokens

`--color-elevated-surface`, `--color-surface`, `--color-foreground`,
`--color-muted-foreground`, `--color-subtle-foreground`, `--color-border`,
`--color-primary` (highlight affordance only), `--color-focus`,
`--color-disabled`, `--shadow-sm`, plus spacing, radius, type, and motion
semantic tokens. No raw hex/px.

## Radix/shadcn mapping

| Kiso | Reference |
| --- | --- |
| Behavior | [cmdk](https://cmdk.paco.me/) via shadcn [Command](https://ui.shadcn.com/docs/components/command) |
| Dialog shell | shadcn Command Dialog example (Radix Dialog) for modal presentation |
| Input + list + groups + items | `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut` |

Preserve cmdk keyboard and filter behavior. Restyle surfaces and text to Kiso
semantic tokens. Do not treat Command as Search, and do not use Command as a
DropdownMenu replacement for row actions.
