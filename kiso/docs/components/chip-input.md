# ChipInput

One field that collects several structured values. Each value is a chip: a
name, an optional editable value, and optional named options that belong to
that chip alone.

## Purpose

ChipInput is for a list that a person builds by typing, where every item
carries more than a label. A dependency list is the case that produced it:
`node = latest`, `npm:t3 = latest` with `allow_builds = node-pty`,
`apt:libssl-dev = latest`. The alternative is one form section per item, which
grows without limit and buries the list itself.

The component owns the box, the chips, the suggestion list, and the keyboard.
The product owns what a chip means, which suggestions match the query, and
which options a chip accepts. ChipInput never parses.

### Choose the right multi-value control

| Need | Control | Why |
| --- | --- | --- |
| Several values, each with its own options | **ChipInput** | Options stay attached to the value they configure. |
| Several values from a known, short list | [Select](select.md) with multiple, or [Checkbox](checkbox.md) group | No free text, no per-value options. |
| One value from a known set | [Select](select.md) | Single choice. |
| Free text that is not a list | [Input](input.md) or [Textarea](textarea.md) | Nothing to chip. |
| Filtering what is already on screen | [Search](search.md) | A query, not stored values. |
| Running a global action | [CommandPalette](command-palette.md) | Commands, not data. |

## Anatomy

```
ChipInput
├── ChipInputBox (the field; a border, chips, and the caret)
│   ├── Chip (repeated)
│   │   ├── ChipScope (optional; what kind of value this is)
│   │   ├── ChipName (required; the identity of the value)
│   │   ├── ChipValue (optional; edits in place)
│   │   ├── ChipOption (repeated; one option as name=value)
│   │   ├── ChipOptionAdd (optional; the segment that takes a new option)
│   │   └── ChipRemove (required when the chip can be removed)
│   └── ChipInputField (the input; always last, always present)
└── ChipInputList (optional; suggestions for the current query)
    ├── ChipInputOption (repeated)
    └── ChipInputEmpty (no match)
```

The box needs a name: a [Label](label.md) bound to `ChipInputField`, or
`aria-label` on it. Explain the syntax in [HelperText](helper-text.md), not in
the placeholder.

A chip reads left to right like a call: `npm` installs `t3` at `latest` with
`allow_builds=node-pty`. Its segments are divided the way [Button](button.md)
groups divide buttons, and the two segments people press, the value and the
options, carry the raised card fill. Use ChipScope only when the kind is a
separate fact from the name; a tool with no backend is one segment, not an
empty one.

Each option is its own segment, written the way the configuration file writes
it: `name=value`, and `name=[a, b]` when the value is a list. The brackets are
the only difference between the two, so both read as the same kind of fact.
Committing an option with an empty value removes it, and `ChipOptionAdd` sits
last as a `+`. The cost is discovery: name the accepted options in
[HelperText](helper-text.md), because the chip will not list them.

Chips are content, not chrome. Do not put an action that leaves the field
inside a chip.

## Variants

| Variant | Behavior |
| --- | --- |
| `open` (default) | Any typed entry can become a chip. Suggestions help but do not restrict. |
| `restricted` | Only a suggestion becomes a chip. A typed entry with no match stays text until it matches. |

Both render the same. The product enforces the difference when it turns a
query into a chip.

Do not add a "read-only chips" variant. Values that cannot change are
[KV](kv.md) or [Badge](badge.md).

## Sizes

One size. The box is `--size-control-md` tall when empty and grows by row as
chips wrap; chips are `--size-control-sm`. Width is a layout concern: fill the
form column.

## States

| State | Behavior | Tokens / notes |
| --- | --- | --- |
| default | Chips and a caret ready for the next value. Rules run the height of the chip between segments, and the version segment sits raised on the card surface. | `--color-card`, `--color-input`, `--color-border`. |
| hover | Quiet border emphasis on the box. A hovered version segment deepens its fill. | `--color-border-strong`, `--color-accent-surface`. |
| focus | One ring around the whole box, never around the bare input. | `--color-ring`. |
| editing a segment | The value or the options become an input sized to their content; the chip takes an accent border and a confirm control appears. | `--color-primary`, `--color-accent-surface`. |
| no options | Only the `+` segment remains, in the subtle foreground. | `--color-subtle-foreground`. |
| chip invalid | The single chip is marked, not the field. Say why next to the field. | `--color-danger-surface`, `--color-danger-border`, `--color-danger`. |
| field invalid | `aria-invalid` on the box plus [ValidationMessage](validation-message.md). | `--color-danger`. |
| disabled | The box and every chip control are unavailable; chips stay readable. | `--color-disabled-surface`, `--color-disabled`. |
| empty | Placeholder in the input showing the shape of one entry. | `--color-subtle-foreground`. |

An invalid chip and an invalid field are different failures. A version that
does not exist marks the chip; "add at least one dependency" marks the field.

## Accessibility

- `ChipInputField` is the combobox: `role="combobox"`, `aria-expanded`,
  `aria-controls` on the suggestion list, `aria-activedescendant` on the
  highlighted option, `aria-autocomplete="list"`. The highlight moves; DOM
  focus stays in the input.
- The suggestion list is `role="listbox"` with `role="option"` children and
  its own accessible name.
- Every chip control has a name that includes the chip: "Remove npm:t3", "Add
  npm:t3 options", "Edit npm:t3 version, currently latest". A bare "Remove" is
  ambiguous once there are six chips.
- Chip controls are real buttons in tab order. A long list is a long tab path;
  that is the cost of keeping every control reachable without a roving
  tabindex, and it is why removal is also on `Backspace`.
- Removing a chip keeps focus in the field. Confirming an edited segment
  returns focus to that segment.
- Announce a chip added or removed through the surrounding status region, not
  by moving focus.

### Keyboard

| Key | Action |
| --- | --- |
| Printable keys | Edit the query in the input. |
| `ArrowDown` / `ArrowUp` | Move the highlight through the suggestions; wraps. |
| `Enter` | Commit the highlighted suggestion, or the typed query in the `open` variant. While editing a segment, confirm it. |
| `Tab` | Commit the highlighted suggestion. With no highlight, leave the field. The box never traps the keyboard. |
| `Backspace` in an empty input | Remove the last chip. The field keeps focus, so a second press removes the next one. |
| `Escape` | Close the suggestions. While editing a segment, cancel back to its previous text. |
| `Shift+Tab` | Move back through the chip controls. |

`Enter` on an empty input does not submit the form. A form with a single
ChipInput must have an explicit submit Button.

## When to use

- A dependency, package, or tool list where each entry carries a version and
  installer options.
- Recipients, labels, or scopes where an entry can be qualified.
- Any repeated "name plus settings" list a person types rather than picks.

## When NOT to use

- **A fixed, short set of choices.** Checkbox group or Select.
- **One value.** Input or Select.
- **Filtering a visible collection.** Search.
- **Showing a list nobody edits.** KV, Badge, or Table.
- **More than a few options per chip.** A row of `name=value` segments stops
  reading at about three. If a chip needs a form, the chip is a record: use a
  Table row and edit it in a [Modal / Dialog](modal-dialog.md).

## Tokens

Box and input follow [Input](input.md): `--color-card`, `--color-input`,
`--color-border-strong`, `--color-foreground`, `--color-subtle-foreground`,
`--color-ring`, `--color-disabled`, `--color-disabled-surface`, `--radius-md`,
`--shadow-xs`, `--size-control-md`, `--spacing-xs` padding,
`--motion-duration-fast` and `--motion-easing-standard`.

Chips: `--color-secondary`, `--color-secondary-foreground`, `--radius-sm`,
`--size-control-sm`, `--type-size-label`, `--font-mono` and
`--type-size-metadata` for the segments, `--color-muted-foreground` for the
scope and for an option's name, `--color-subtle-foreground` for the `=`, the
brackets and the empty `+`, `--color-border` for the rules between segments,
`--color-card` for the value and option segments with `--color-accent-surface`
when hovered, `--color-foreground` for an option's value, `--color-link` for
the version,
`--color-primary` and `--color-accent-surface` while editing,
`--color-accent-surface-hover` on chip controls, `--color-danger-surface`,
`--color-danger-border` and `--color-danger` when a chip is invalid.

Suggestions reuse the menu surface: `--color-popover`, `--color-border`,
`--radius-lg`, `--shadow-lg`, `--color-selected` and
`--color-selected-foreground` for the highlight. Label, HelperText, and
ValidationMessage bring their own tokens. No raw hex/px.

## Radix/shadcn mapping

No Radix combobox primitive and no shadcn tag input.

| Kiso | Reference |
| --- | --- |
| Box and field | Native `input` styled like shadcn [Input](https://ui.shadcn.com/docs/components/input), inside a bordered wrapper that owns the focus ring |
| Suggestions | The [CommandPalette](command-palette.md) listbox pattern: `aria-activedescendant` over `role="option"` children, not a focus-moving menu |
| Chip options | No reference: one inline segment per option, each swapping to a native `input` like the value |
| Chip | Kiso chip classes, not [Badge](badge.md): a Badge is not interactive and does not close |

Do not map ChipInput to shadcn [Command](https://ui.shadcn.com/docs/components/command)
or to a multi-select built on Select. Both fight the free-text entry this
component exists for.
