# Combobox

## Purpose

Combobox lets a person choose exactly one value from a long list by typing part
of it. The person types, the list narrows, and they pick one option. Use it
when a Select would hold too many options to scan, for example one PostgreSQL
parameter out of several hundred.

The text in the input is a search, not a value. Only a picked option is a
value. Text that matches no option is never accepted.

## Anatomy

1. **Label** — visible field name, associated with the input.
2. **Input** — text field with `role="combobox"`. It shows the search text, or
   the label of the picked option.
3. **List** — elevated surface with `role="listbox"`, rendered in a portal
   under the input, or above it when there is not enough room below.
4. **Group label (optional)** — caps label over the options of one group.
5. **Option** — one selectable value, with:
   - the **label**, on the first line;
   - an optional **note**, short text on the right of the label, such as a type
     or a unit;
   - an optional **description**, one line under the label.
6. **Message** — muted line in the list for the loading and empty states.
7. **HelperText and ValidationMessage (optional)** — under the field, as on
   every form control.

## Variants

- **Default** — a flat list of options.
- **Grouped** — options carry a group; each group shows its label once, in the
  order the groups first appear.
- **Mono** — the input text and the option labels use the mono font. Use it for
  identifiers such as setting names, keys, or commands.

Combobox is not Select, FilterInput, ChipInput, or CommandPalette. Select
chooses from a short set without typing. FilterInput builds a structured query.
ChipInput collects several values. CommandPalette runs commands from anywhere
in the product.

## Sizes

Input sizes apply. In React, use `controlSize="sm" | "md" | "lg" | "xl"`. The
CSS equivalent is `data-control-size` on the input. The list matches the width
of the input. Its height fits the space available, up to 20rem, and the list
scrolls inside. On a coarse pointer each option keeps the minimum touch target.

## States

| State | Behavior |
| --- | --- |
| Default | Closed. The input shows the picked label, the search text, or a placeholder. |
| Open | Focus or click opens the list. `aria-expanded="true"`; the active option uses `--color-selected`. |
| Filtered | Typing narrows the list. While the text equals the picked label, the whole list shows, with the picked option active. |
| Hover | An option shows a quiet `--color-accent-surface-hover` emphasis. |
| Empty | No option matches. A muted line says so, for example `No setting matches "nope".` The text stays. |
| Loading | The product is resolving options. The input has `aria-busy="true"`; the list shows a Spinner and a status line, never stale options as ready. |
| Error | The input has `aria-invalid="true"`, the danger border, and a linked ValidationMessage that names the problem and the fix. |
| Disabled | The input cannot focus or open, and uses the disabled treatment. The picked label stays readable. |

Text that names no option clears the value. Text equal to an option's label
picks that option. The product validates on submit and reports free text as an
error, for example "nope is not a setting of this node. Pick one from the
list." Loading is not disabled: the person may keep typing while options load.

## Accessibility

- Associate a visible Label with the input. Use FormField, or Label with
  `htmlFor`.
- The input has `role="combobox"`, `aria-autocomplete="list"`,
  `aria-expanded`, and, while open, `aria-controls` and
  `aria-activedescendant`. Focus stays in the input while the person moves
  through options.
- The list has `role="listbox"`. Groups have `role="group"` named by their
  label. The active option has `aria-selected="true"`.
- Keyboard:
  - `ArrowDown` and `ArrowUp` open the list and move the active option;
  - `Home` and `End` jump to the first and the last option while the list is
    open;
  - `Enter` picks the active option and closes the list;
  - `Escape` closes the list and keeps the text; inside a Dialog, the first
    `Escape` closes the list and the second closes the Dialog;
  - `Tab` closes the list and moves on without picking.
- The pointer picks an option without taking focus from the input.
- Link HelperText and ValidationMessage through `aria-describedby`.
- The loading and empty messages are status text, so assistive technology
  reads them when they change.
- Forced colors: the active option keeps a visible outline.

## Tokens

The input uses the Input token mapping. The list uses the Select content
mapping: `--color-popover`, `--color-border`, `--radius-lg`, and the menu
shadow. Options use `--radius-md`, `--spacing-xs` block and `--spacing-sm`
inline padding, and `--spacing-2xs` between the lines. The active option uses
`--color-selected` and `--color-selected-foreground`; hover uses
`--color-accent-surface-hover`. Notes, descriptions, group labels, and messages
use `--color-muted-foreground` and `--type-size-label`. Error uses
`--color-danger`; focus uses `--color-focus`.

## When to use

- For one choice from a list too long to scan, typically more than about 15
  options.
- When people know part of the name or of the description they look for.
- For a remote or large dataset, with the product owning the search and the
  loading state.

## When NOT to use

- Do not use for a short set; use Select or RadioGroup.
- Do not use for several values; use ChipInput.
- Do not use for a structured query of fields and operators; use FilterInput.
- Do not use when free text is a valid answer; use Input, with suggestions in
  the HelperText if needed.
- Do not use to compare illustrated options; use DetailSelect.

## React

```tsx
<FormField label="Setting" error={error}>
  <Combobox
    options={[{ value: "work_mem", label: "work_mem", note: "memory",
      group: "Memory", description: "Memory for each sort or hash." }]}
    value={setting} onValueChange={setSetting}
    query={query} onQueryChange={setQuery}
    filter={matchNameDescriptionOrGroup}
    emptyText={q => `No setting matches "${q}".`}
    loading={loading}
    mono
  />
</FormField>
```

- `options`: `value`, `label`, and optional `description`, `note`, and
  `group`.
- `value` and `onValueChange` (or `defaultValue`): the picked value, or `null`.
- `query` and `onQueryChange` (or `defaultQuery`): the text in the input.
- `filter(option, query)`: replaces the match rule. The default,
  `defaultComboboxFilter`, matches the label and the description, without case.
- `emptyText`: a node, or a function of the query.
- `loading` and `loadingText`: the product loads; the component shows the state.
- `controlSize`, `disabled`, `aria-invalid`, `aria-describedby`, and other input
  attributes pass to the input.

The list renders in a portal through Radix Popover, so a Dialog or another
transformed or clipped parent does not cut it.
