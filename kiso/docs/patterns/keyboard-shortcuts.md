# Keyboard shortcuts

Discoverable keyboard shortcuts for frequent actions and navigation. This
pattern governs how shortcuts are defined, invoked, and — critically —
discovered, so that keyboard efficiency does not become hidden knowledge.

User story #24.

## Purpose

Keyboard shortcuts let a person who prefers the keyboard move faster: jump to
search, open the [command palette](command-palette.md), create a new record,
refresh, navigate rows. They are acceleration on top of visible controls, never
the only path to an action.

The central problem is **discoverability**. A shortcut that no one knows exists
does not exist. This pattern mandates a discoverability mechanism so shortcuts
are findable without reading documentation.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Shortcut hint | inline text or [Tooltip](../components/tooltip.md) near the control | Shows the binding next to the action it triggers |
| Shortcut legend | [Modal / Dialog](../components/modal-dialog.md) or [Popover](../components/popover.md) opened by `?` | Lists all shortcuts in one place |
| Command palette | [CommandPalette](../components/command-palette.md) items with shortcut hints | Shortcuts visible where commands live |
| Footer hints | palette / dialog footer | Reminds `Enter`, `↑↓`, `Esc` |

## Flow

1. Person works in the product with the keyboard.
2. Person presses `?` (or `Shift+/`) anywhere a shortcut legend is available.
3. A [Modal / Dialog](../components/modal-dialog.md) or
   [Popover](../components/popover.md) opens listing shortcuts, grouped by
   category (Navigation, Actions, Tables).
4. Person closes the legend (`Escape` or click) and uses a shortcut.
5. Shortcuts also appear as hints next to their controls (in
   [DropdownMenu](../components/dropdown-menu.md) items, next to
   [Button](../components/button.md)s, in the [command palette](command-palette.md)).

## States

| State | Behavior |
| --- | --- |
| idle | Shortcuts active but not shown. Person can invoke any binding. |
| legend open | Shortcut legend visible; focus trapped (if dialog) or moved to the legend. `Escape` closes. |
| conflict | Two actions claim the same binding. The product must resolve this — the legend shows the winner; the loser gets a different binding or no binding. |

## Layout sketch

### Shortcut legend (`?`)

```text
┌──────────────────────────────────────────────┐
│ Keyboard shortcuts                           │
├──────────────────────────────────────────────┤
│  Navigation                                  │
│  ⌘K   Open command palette                   │
│  ⌘/   Focus search                           │
│  g r  Go to Replicas                         │
│  g q  Go to Queries                          │
│  g s  Go to Settings                         │
│                                              │
│  Actions                                     │
│  c     Create new (context-aware)            │
│  r     Refresh current view                  │
│  ⌘S   Save (in an editor)                    │
│                                              │
│  Tables                                      │
│  ↑ ↓  Move between rows                      │
│  j k  Move between rows (vim)                │
│  x     Select row                            │
│  ?     Show this legend                      │
│                                              │
│                        [Close]      [Esc]    │
└──────────────────────────────────────────────┘
```

### Inline hints

```text
[DropdownMenu]
  ▸ New query          ⌘N
  ▸ Duplicate          ⌘D
  ▸ Delete             ⌫
```

Hints appear right-aligned in menu items, in `--color-muted-foreground`. They
are decorative; the accessible name of the item does not depend on them.

## Rules

### Discoverability (mandatory)

- **Provide a shortcut legend**, opened by `?` (or `Shift+/`). This is the
  primary discoverability mechanism. Without it, shortcuts are hidden knowledge.
- **Show hints next to controls** where space allows: in
  [DropdownMenu](../components/dropdown-menu.md) items, next to
  [Button](../components/button.md)s in toolbars, and in
  [command palette](command-palette.md) items.
- **Mention the legend in onboarding** or first-run help so a new person learns
  that `?` exists.
- Do not rely on [Tooltip](../components/tooltip.md) as the only discoverability
  path — Tooltip is not available on touch and is progressive enhancement.

### Defining shortcuts

- Use platform conventions: `⌘` on macOS, `Ctrl` on Windows/Linux. Single-key
  shortcuts (no modifier) are allowed for context-specific actions (table row
  navigation with `j`/`k`) but must not conflict with text entry — only active
  when the focus is not in a text field.
- Reserve `⌘K` / `Ctrl+K` for the [command palette](command-palette.md). Do
  not bind it to list [Search](search.md).
- Reserve `?` for the shortcut legend. Do not bind it to an action.
- Do not override browser or OS shortcuts (`⌘W`, `⌘R`, `⌘T`, etc.) unless the
  product explicitly opts into a contained context (e.g. a code editor) and
  documents the override.
- Two-key sequences (like `g` then `r`) are allowed for navigation but must
  show a brief "waiting for second key" state and time out cleanly.

### Scope

- Global shortcuts (navigation, command palette, legend) work everywhere.
- Context shortcuts (table row navigation, editor commands) are active only in
  their context. When the person leaves the context, the binding is released.
- A shortcut that is context-only should not appear in the global legend as if
  it were global; group it under its context ("Tables", "Editor").

### Conflicts

- No two actions may share the same binding in the same scope. The product
  resolves conflicts; the legend shows the winner.
- If a user-customizable shortcut system exists (future), the legend reflects
  the current bindings, not the defaults.

## Accessibility

- Shortcuts are keyboard input; they are inherently accessible to keyboard
  users. Ensure they do not trap focus or override assistive technology
  behavior.
- The legend is a real dialog or popover with focus management: focus moves in
  on open, `Escape` closes, focus returns to the trigger.
- Shortcut hints in menu items are decorative (`aria-hidden` on the hint text)
  — the item's accessible name is the action label, not the key combination.
- Single-key shortcuts must be inert when focus is in a text field, so they do
  not intercept typing. The exception is `Escape` (which may blur the field or
  close an overlay).
- Do not make a shortcut the only way to perform an action. Every shortcut-
  accessible action has a visible control (button, menu item, link) as well.

## Related patterns

- [Command palette](command-palette.md) — `⌘K` / `Ctrl+K` is the flagship
  shortcut; the palette lists commands with their hints.
- [Search](search.md) — a shortcut (`⌘/` or `/`) may focus the Search field.
