# Search

A standalone field that filters or finds within a visible collection. It does
not navigate the app or run global commands.

## Purpose

Search narrows what the person already has in view — rows in a
[Table / DataTable](table.md), items in a list, entries in a panel. The
collection owns the data; Search only supplies the query string (and optional
clear).

User stories #9 and #19.

### Choose the right finder

| Need | Control | Why |
| --- | --- | --- |
| Filter visible / listed content | **Search** | Query stays scoped to this collection. |
| Global actions, jump-to, command runner | **[CommandPalette](command-palette.md)** | App-wide; keyboard-first command UI. |
| Single-line form value that happens to be a query stored as data | [Input](input.md) `type="search"` inside FormField | Persisted field, not live filtering chrome. |
| One value from a known set | [Select](select.md) | Not free-text filter. |

Search composes *with* lists and tables; it is **not** built into them
(user story #9).

## Anatomy

```
Search
├── leading icon (optional; decorative magnifying glass)
├── Input (type="search"; required)
├── Clear (optional IconButton; visible when value non-empty)
└── Spinner (optional; while results are resolving)
```

Label is usually visually hidden but programmatically present ("Filter
replicas", "Search queries") — either a `<label>` or `aria-label` on the
input. Do not rely on placeholder alone as the name.

HelperText / [ValidationMessage](validation-message.md) are uncommon for
live filters; if the query can be invalid (regex mode, etc.), wrap with
FormField patterns.

## Variants

| Variant | Behavior |
| --- | --- |
| `instant` (default) | Filters as the person types (debounced). Good for client-side or fast indexes. |
| `submit` | Applies on Enter or an explicit "Search" Button. Good for expensive server queries. |

Appearance follows Input: `--color-surface`, `--color-border`,
`--color-foreground`, placeholder `--color-subtle-foreground`. Leading icon
`--color-muted-foreground`.

Do not add a "global" variant — that is CommandPalette.

## Sizes

Align with [Input](input.md):

| Size | Use |
| --- | --- |
| `sm` | Table toolbars, dense chrome. |
| `md` (default) | Most collection filters. |
| `lg` | Rare; full-page find entry points. |

Width is a layout concern (toolbar flex): prefer filling the filter slot,
not a fixed pixel width.

## States

| State | Behavior | Tokens / notes |
| --- | --- | --- |
| default | Empty or valued; ready to type. | Input default tokens. |
| hover | Quiet border emphasis; no layout shift. | |
| focus | Visible `--color-focus` ring on the input. | |
| active | Native caret / selection. | |
| disabled | Native `disabled`; not focusable. | `--color-disabled`. |
| loading | Value remains; show Spinner; `aria-busy` on the search region or input when results are in flight. Do not clear the query. | Distinct from disabled. |
| error | Rare. `aria-invalid` + [ValidationMessage](validation-message.md) only when the query syntax itself is invalid — not when there are zero hits. | Zero hits → collection [EmptyState](empty-state.md) `no-results`, not Search error. |

Clear control: [IconButton](icon-button.md) `ghost` `sm`, `aria-label`
"Clear search". After clear, keep focus in the input and refresh results.

## Accessibility

- Accessible name always present (`label` / `aria-label` / `aria-labelledby`).
  Placeholder is not the name.
- Use native `type="search"` so platform clear and semantics work where
  available; if a custom Clear is used, keep it named and keyboard reachable.
- Debounced instant search should update results without trapping focus.
  When results update, prefer updating the collection region; use a polite
  status only when the change would otherwise be silent ("12 replicas").
- Do not move focus into the table on every keystroke.
- Submit variant: Enter submits; a visible Button must also exist if Enter
  is not obvious in context.

### Keyboard

| Key | Action |
| --- | --- |
| Printable keys | Edit the query. |
| `Enter` | `submit` variant: apply query. `instant`: may force an immediate apply (flush debounce); do not navigate away. |
| `Escape` | Optional: clear the query if non-empty, or leave unchanged — pick one per surface and keep it consistent. Does not open CommandPalette. |
| `Tab` / `Shift+Tab` | Move to Clear (if present) and the rest of the page. |

`⌘K` / `Ctrl+K` is **not** Search's shortcut — that belongs to
[CommandPalette](command-palette.md) unless the product explicitly documents
a different global binding.

## When to use

- Filtering rows in a Table/DataTable toolbar.
- Filtering a list or catalog panel.
- Any "narrow what I see here" affordance (user stories #9, #19).

## When NOT to use

- **Global jump / run command.** CommandPalette.
- **Contextual actions on one element.** [DropdownMenu](dropdown-menu.md).
- **Choosing one known option.** Select.
- **Storing a search string as form data** without live filtering — Input in
  FormField may be enough; do not force Search chrome.
- **Replacing empty or error states.** EmptyState / Alert on the collection.

## Tokens

Same semantic set as Input: `--color-surface`, `--color-foreground`,
`--color-subtle-foreground`, `--color-muted-foreground`, `--color-border`,
`--color-focus`, `--color-disabled`, `--spacing-sm` block and `--spacing-md`
inline padding, `--radius-md`, the five property-qualified body typography
tokens, `--motion-duration-fast`, and `--motion-easing-standard`.
Spinner and IconButton bring their own tokens. No raw hex/px.

## Radix/shadcn mapping

No Radix Search primitive.

| Kiso | Reference |
| --- | --- |
| Field | Native `input type="search"` styled like shadcn [Input](https://ui.shadcn.com/docs/components/input) |
| Clear / icon chrome | Compose Kiso IconButton + decorative icon; shadcn Input with icon examples as layout reference only |
| In toolbars | shadcn Data Table toolbar filter input → restyle to Kiso tokens |

Do **not** map Search to shadcn [Command](https://ui.shadcn.com/docs/components/command)
or cmdk. That reference is [CommandPalette](command-palette.md).
