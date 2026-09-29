# FilterInput

Build a structured search by typing. A complete condition becomes a chip with
three editable segments: field, operator, and value. `IN` values share one
segment. Parentheses visibly group chips, including nested groups.

Use FilterInput for searches that need typed comparisons or Boolean groups.
Use [Search](search.md) for a plain text query and [ChipInput](chip-input.md) for
structured lists such as dependencies. Existing ChipInput APIs and behavior do
not change.

## Ownership and API

The controlled `value` contains confirmed conditions and groups.
`onValueChange` receives each valid change. The product owns the field schema,
allowed operators and values, query execution, loading, pagination, and errors
from its data source. FilterInput never generates or executes SQL.

| Prop | Contract |
| --- | --- |
| `label` | Required visible label, associated with the trailing input. |
| `fields` | Field definitions with `key`, optional `label`, `type`, optional `values`, `operators`, and `nullable`. |
| `value`, `onValueChange` | Controlled `FilterNode[]` and its change callback. |
| `onDraftChange` | Optional notification of trailing uncommitted text, including whole-expression editing. |
| `disabled` | Disables the input, suggestions, segment editing, connectors, removal, and actions. |
| `id`, `placeholder`, `className` | Input ID, optional syntax example, and root layout styling. |

Field keys are identifiers without spaces or syntax punctuation. Use `label`
for a friendly display name. `text` fields accept `=`, `!=`, `IN`, and
`CONTAINS`; `number` fields accept equality, inequality, ordering, and `IN`.
`nullable` adds `IS NULL`. `operators` restricts the field's supported operators.
`values` restricts values to the supplied list and supplies autocomplete.
Numbers must be finite; the product can apply additional domain constraints.

Conditions contain `kind: "condition"`, `field`, `operator`, `value`, and
`join`. Groups contain `kind: "group"`, `children`, and `join`. The first
node's join is ignored. Later nodes join the preceding expression with `AND`
or `OR`. Within each group, AND binds before OR. Explicit groups always keep
their parentheses. IN values are arrays, number values are numbers, and
IS NULL has a null value. An empty root means no filters; empty child groups
are invalid.

The separate `parseFilterExpression(text, fields)` helper returns either
`{ ok: true, value }` or `{ ok: false, error }`. It never returns a partially
parsed query. Pass `{ allowLeadingJoin: true }` only when appending to an
existing expression. `serializeFilterExpression` converts confirmed nodes back
to editable text. `getFilterSuggestions` exposes the same completion logic for
product adapters. These helpers do not alter ChipInput.

## Typing and syntax

| Input | Meaning |
| --- | --- |
| `status=active` or `status:active` | Equality. |
| `status!=paused` | Inequality. |
| `lag>=100` | Numeric comparison; `>`, `<`, and `<=` also work. |
| `owner CONTAINS Mina` or `owner~Mina` | Text containment; matching rules belong to the product. |
| `region IN (eu, us)` | Any listed value. Brackets are also accepted. |
| `owner IS NULL` | Missing value for a nullable field. |
| `(status=active OR status=paused) AND region=eu` | Grouped conditions. |

Whitespace after a complete scalar condition creates a chip. Closing an IN
list or complete group also commits it. Enter confirms complete text without
a trailing delimiter. Adjacent conditions use AND. Operators and field keys
are case-insensitive; text values retain their case.

Quote spaces, reserved words, or commas inside a value, for example
`owner="Ana Silva"` or `owner IN ("Doe, Jane", Mina)`. Single and double quotes
work; backslash escapes protect quotes and backslashes. A trailing comma before
the list closes is ignored: `(eu, us, )` equals `(eu, us)`. Duplicate list
values collapse. Empty lists and missing values between commas remain invalid.

Incomplete text remains a draft. An unfinished group never commits only its
first condition. Invalid input displays a correction beside the field when
confirmation is attempted; it does not replace confirmed filters. Input method
composition does not create chips until composition ends. Editing inside the
draft does not auto-commit while the caret is away from its end.

## Editing and removal

Click a chip segment to edit only that field, operator, or value. Click a
group's opening parenthesis to edit that group's expression. Enter or Save
confirms; Escape or Cancel restores the saved value. Only one editor is active
at a time. Results continue to use the saved filter until confirmation.

Changing a scalar operator to IN wraps the existing value in an array. Changing
a multi-value IN to a scalar operator asks for a replacement value instead of
discarding extra values. Changing to IS NULL removes the value. Unsupported
field/operator/value combinations remain editable with a validation message.

Click a connector to switch AND/OR. Edit expression restores the entire query
as text so existing conditions can be regrouped. Enter saves that draft;
Escape cancels it. Clear filters removes both confirmed filters and drafts.
Removing the last condition in a group removes that empty group as well.

## Keyboard and accessibility

| Key or action | Behavior |
| --- | --- |
| ArrowDown / ArrowUp | Open or navigate contextual suggestions. |
| Tab | Accept a visible suggestion. With suggestions dismissed, continue normal focus navigation. |
| Shift+Tab | Move backward without accepting a suggestion. |
| Enter | Confirm valid text, or accept a suggestion for incomplete text. Never implicitly submit the surrounding form. |
| Escape | Dismiss suggestions; cancel a segment, group, or whole-expression edit. |
| Backspace in an empty trailing input | Restore the last condition or group as text for editing. |
| Click empty box space | Focus the trailing input. |

The trailing input is a labeled combobox. The listbox, active descendant, and
expanded state describe only visible suggestions. Chip controls are native
buttons with names that include their condition. Groups have accessible names.
Errors use `aria-invalid`, associated descriptions, and alert text. A polite
status announces committed changes. Confirmation restores focus to the edited
segment; removal returns it to the trailing input.

Provide an explicit product search action when results require submission. Do
not silently discard pending text on submit; observe `onDraftChange` or ask the
person to finish the draft first. This component does not persist filter state.

## Layout, states, and tokens

One continuous-typing interaction. Required states are empty, draft with
suggestions, confirmed chips, IN list, nested groups, editing, invalid draft,
and disabled. An empty result set belongs to the collection, not this control.

The box grows vertically as chips wrap. Groups wrap internally; they must not
force horizontal page scrolling on narrow screens. Touch targets use
`--size-touch-min` on coarse pointers. Desktop segments use
`--size-control-sm`. Maintain visible keyboard focus in both themes.

Compose the existing chip, input, button, and menu surfaces. Consume
`--color-card`, `--color-foreground`, `--color-muted-foreground`,
`--color-link`, `--color-border`, `--color-border-strong`,
`--color-accent-surface`, `--color-accent-surface-hover`, `--color-selected`,
`--color-selected-foreground`, `--color-ring`, and `--color-disabled`.
Use the existing spacing, radius, font, and shadow tokens. No new palette or
spacing scale is introduced.

## Boundaries

This is a small filter grammar, not SQL or a query-language interpreter. It
supports explicit Boolean groups but not NOT groups, field-to-field comparisons,
functions, or arbitrary SQL. The parser limits recursive nesting to 64 levels.

Validate the field schema and user filters again at the application boundary.
A server adapter maps allowed field identifiers and binds values as parameters.
Never concatenate editable values into executable SQL.
