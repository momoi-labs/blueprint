# Command palette

Keyboard-driven global navigation and actions. This pattern composes the
[CommandPalette](../components/command-palette.md) component as the app-wide
"do or go anywhere" surface, invoked by a documented shortcut, filtering
commands and destinations as the person types.

User story #23.

## Purpose

The command palette lets a person run frequent actions and jump to destinations
without hunting through menus: open a query editor, jump to a replica, switch
project, run a saved action. It is keyboard-first, invoked by a shortcut, and
filters a command list as the person types.

It is **not** list [Search](search.md) (which filters content in view) and not
a [DropdownMenu](../components/dropdown-menu.md) (which is contextual to one
trigger). The palette is global.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Overlay | [CommandPalette](../components/command-palette.md) dialog surface | Modal or non-modal elevated panel |
| Filter input | CommandPalette Input (autofocused) | Filters commands as the person types |
| Command list | CommandPalette List with Groups + Items | Actions and destinations, grouped |
| Empty | CommandPalette in-palette empty message | "No commands match 'xyz'" — not page-level EmptyState |
| Footer hints | optional keyboard legend | Reminds the person of `Enter`, `↑↓`, `Esc` |
| Explicit trigger | [Button](../components/button.md) or [IconButton](../components/icon-button.md) in [Header](../components/header.md) | Opens the same palette for non-keyboard users |

## Flow

1. Person presses `⌘K` (macOS) / `Ctrl+K` (Windows/Linux), or activates the
   explicit trigger in the header.
2. The palette opens; focus moves to the Input. The list shows all commands
   (or a default group).
3. Person types. The list filters as they type (search-as-you-type).
4. Person navigates with `↑` / `↓` across groups; the highlighted item is the
   active descendant.
5. Person activates with `Enter` (or click). The command runs or navigation
   occurs, and the palette closes.
6. `Escape` closes without activating. Focus returns to the previously focused
   element (or the trigger).

If the chosen command is a [destructive action](destructive-actions.md), the
palette closes and a [confirmation](confirmations.md) dialog opens — the palette
is acceleration, not a bypass for the gate.

## States

| State | Behavior |
| --- | --- |
| closed | Palette not in tree (or inert). Shortcut and explicit trigger available. |
| open | Input focused; list visible; focus trapped within the palette (if modal). |
| filtering | List updates as the person types. Active descendant resets to the first match. |
| no matches | In-palette empty message: "No commands match 'xyz'". Not the page-level [EmptyState](../components/empty-state.md). |
| loading | Optional [Spinner](../components/spinner.md) in the list while command providers resolve. Input stays usable. `aria-busy` on the list. |
| error | Provider failure: short in-palette message or [Alert](../components/alert.md) pattern inside the panel. Do not fail silently to an empty list that looks like "no matches". |

## Layout sketch

```text
┌──────────────────────────────────────────────┐
│  ⌘K  Type a command or destination…          │
├──────────────────────────────────────────────┤
│  Navigation                                  │
│  ▸ Queries                                   │
│    Replicas                                  │
│    Settings                                  │
│  Replicas                                    │
│  ▸ Open prod-eu                              │
│    Open staging                              │
│    Open analytics                            │
│  Actions                                     │
│  ▸ New query                                 │
│    Switch project                            │
│    Refresh all replicas                      │
├──────────────────────────────────────────────┤
│  ↑↓ navigate   ↵ run   esc close             │
└──────────────────────────────────────────────┘
```

The palette is centered or top-anchored, elevated (`--color-elevated-surface`,
`--shadow-sm`, `--radius-lg`). The active (highlighted) item uses a quiet
`--color-surface` or `--color-primary` indicator — not a filled primary row.

## Rules

- **Invocation:** default `⌘K` / `Ctrl+K`, documented in product chrome. Do
  not bind list [Search](search.md) fields to this shortcut.
- **One app-level palette.** Do not ship separate palettes per page unless the
  product truly scopes commands. Default is one palette with groups
  (Navigation, Replicas, Actions, Settings).
- **Commands vs destinations.** Both live in the palette. Destinations navigate
  (open a route); commands run an action (new query, switch project). Group
  them so the person can scan.
- **Shortcut hints** in items are decorative unless they document real bindings.
  If an item shows `⌘N`, that binding must work even when the palette is closed.
- **Destructive commands still confirm.** A "Delete replica" command closes the
  palette and opens a [confirmation](confirmations.md) dialog — it does not
  delete on `Enter` from the palette.
- **Discoverability:** the palette is acceleration, not the only path. Critical
  actions still need a visible control somewhere (header, page action, row
  menu). Do not hide a primary action only in the palette.
- **Explicit trigger:** provide a [Button](../components/button.md) or
  [IconButton](../components/icon-button.md) in the
  [Header](../components/header.md) ("Search commands…") that opens the same
  palette, so non-keyboard users can reach it.
- Do not use the palette for form data entry. It is not a form.

## Accessibility

- Prefer a modal dialog pattern (`role="dialog"`, `aria-modal="true"`) with
  an accessible name ("Command palette").
- Input has a visible or programmatically associated label.
- List uses `role="listbox"` (or cmdk's list semantics) with items as options;
  the active item is exposed via `aria-activedescendant` on the Input — do not
  invent a broken tab-per-item list.
- Focus moves to the Input on open; on close, focus returns to the previously
  focused element (or the trigger).
- `Escape` closes without running a command.
- Reduced motion: no gratuitous entrance animation beyond token durations.

### Keyboard

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Toggle open/close. |
| Printable keys | Filter commands (input focused). |
| `↑` / `↓` | Move highlight through items (and across groups). |
| `Enter` | Activate highlighted item. |
| `Escape` | Close without activating. |
| `Tab` | Stays within the palette (focus trap) while open; do not tab into the page behind a modal palette. |

## Related patterns

- [Search](search.md) — filters content in view; the palette is global actions.
- [Keyboard shortcuts](keyboard-shortcuts.md) — the palette's `⌘K` is one
  shortcut; this pattern covers the rest.
- [Destructive actions](destructive-actions.md) — palette commands that are
  destructive still confirm.
