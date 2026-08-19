# Data-heavy interfaces

These rules govern how Kiso products render technical data. They apply to
tables, definition lists, detail panels, diffs, query results, and logs.
They are requirements, not styling suggestions. A product-specific exception
must document why the data cannot follow the rule.

Compose these rules with [Table / DataTable](components/table.md) and the
existing components named below. Do not create local substitutes for Tooltip,
IconButton, Badge, or Toast.

## Numeric values

### Alignment and figures

- Right-align every column whose cells are numbers, including counts,
  percentages, durations, byte quantities, currency, and numeric null or
  unknown states. Right-align its header to the same edge.
- Apply `--type-role-numeric` and `--font-variant-numeric` to numeric cells.
  The latter resolves to `tabular-nums`, so equal digits occupy equal widths.
- Keep numeric data in the body family. Do not switch a numeric column to
  `--font-mono`; the numeric role already supplies tabular figures.
- Left-align identifiers that happen to contain only digits, such as account
  IDs and postal codes. They are labels, not quantities, and use
  `--type-role-code` when machine-readable.
- Align decimal separators within a column when values have decimals. Use one
  precision for comparable values; do not mix `1.2`, `1.25`, and `1.2500` in
  the same column unless the precision itself carries meaning.

```text
Replica       Lag       Rows
primary       0 ms     12,480
replica-01   18 ms      9,032
replica-02     —        9,032
                         ^ right edge
```

In this example, both numeric headers and cells are right-aligned and use
`--type-role-numeric` plus `--font-variant-numeric`. `replica-02` remains in
the numeric column even though its value is unknown.

### Units

- Pick one unit per column or comparison group. Put the unit in the header
  when every value shares it (`Lag (ms)`, `Size (MiB)`); do not repeat it in
  every cell.
- Put a unit directly after a standalone value with a non-breaking space:
  `18 ms`, `64 MiB`, `42%`, `12 connections`. Percent is the only unit without
  a space.
- Render a suffix in `--color-muted-foreground`. The number remains
  `--color-foreground`. The whole value still has one accessible text
  alternative, such as "18 milliseconds".
- Use SI units for decimal source values (`kB`, `MB`, `GB`) and IEC units for
  binary source values (`KiB`, `MiB`, `GiB`). Never label a binary conversion
  as `MB`. State the convention in the header or nearby help when ambiguity is
  possible.
- Convert only to improve scanning. Within a comparable column, use one unit
  chosen for the dataset (`1.2 GiB`, `0.8 GiB`), not a different unit per row
  (`1.2 GiB`, `819 MiB`). Preserve the exact source value in the accessible
  detail or copy action when rounding occurs.
- Durations use the smallest unit that avoids misleading zeroes, then one
  consistent unit for the group. For example, show `0.8 ms` and `1.3 ms`, not
  `800 µs` beside `1.3 ms`.
- A Tooltip may explain an unfamiliar unit, but the visible unit must remain
  understandable without it. Tooltip content is descriptive, never the only
  definition available on touch.

Example: a memory column stores bytes but displays `1.50 GiB` under
`Memory (GiB)`. Its copy action copies `1610612736 B`, and its accessible
detail includes both values.

## Missing and indeterminate values

**null ≠ 0 ≠ unknown — three distinct treatments.** Never normalize these
states to the same glyph, an empty cell, or a falsy branch.

| Data state | Visible treatment | Semantics | Example |
| --- | --- | --- | --- |
| value `0` | `0` in `--color-foreground`, formatted and aligned exactly like any other number | Known numeric value | `0 ms` |
| `null` | Literal `NULL` in `--type-role-code` and `--color-muted-foreground` | The field is explicitly absent / SQL `NULL` | `NULL` |
| unknown | Em dash `—` in `--color-muted-foreground`, plus the reason through Tooltip and an equivalent focus/touch detail | No value is currently known: not loaded, not measured, or unavailable | `—` with "Not reported by this replica" |

- Use uppercase `NULL`; do not render it as `null`, `N/A`, a blank, or `—`.
- Use `—` only for unknown. Give the glyph an accessible label that includes
  the reason, such as "Unknown — metric not reported"; do not let assistive
  technology announce only "dash".
- Attach Tooltip to an unknown glyph only when it expands a short visible or
  accessible explanation. Because Tooltip does not open on touch and cannot
  hold essential information, the same explanation must be available through
  an expanded row, detail view, or adjacent text.
- Preserve the column's alignment for all three treatments. `NULL` and `—` in
  a numeric column are right-aligned; in a text column they are left-aligned.
- Empty string is data, not null. Show it as `""` in `--type-role-code` when
  the distinction matters.

```text
Setting             Value
max_connections       100   known value
retry_count              0   known zero
application_name       ""   known empty string
archive_command       NULL   explicitly absent
replication_lag          —   unknown; not reported by replica
```

## Warnings and dangerous values

Warnings and dangerous values are data annotations. Do not replace, obscure,
or silently coerce the underlying value.

### Warning

- Mark an out-of-range, degraded, or attention-worthy value with
  `--color-warning` and a visible warning icon or a [Badge](components/badge.md)
  labelled `Warning`. Color alone is never the signal.
- Keep the exact value visible. Put the condition next to it or in the row's
  accessible description: `Replication lag 8.4 s — Warning: above 5 s`.
- Use warning only when the system still operates and the person should
  investigate. An unavailable value is unknown, not warning.

### Dangerous value

- Mark a value that weakens safety, durability, privacy, or availability with
  `--color-danger` and a visible danger icon or [Badge](components/badge.md)
  labelled `Danger`. The marker is mandatory even when the value is valid.
- Keep the raw setting and value visible. Never replace `fsync = off` with
  only "Dangerous".
- Attach [Tooltip](components/tooltip.md) to the danger marker for a concise
  risk explanation. The Tooltip supplements the visible marker; it does not
  carry the only warning. Expose the same explanation on focus and in the
  row/detail view for touch.
- State the concrete consequence, not a generic alarm. Use
  `Danger — committed transactions can be lost after a crash`, not
  `Unsafe setting`.
- Do not use `--color-danger` for ordinary negative numbers, nulls, or unknown
  values. Danger describes consequence, not visual emphasis.

```text
Setting   Value   Status
fsync     off     [Danger]  Committed transactions can be lost after a crash.
```

Here `off` remains selectable and copyable. Both the value and the `Danger`
marker use `--color-danger`; the marker's Tooltip repeats the concise risk,
and the detail view contains the same explanation.

## Identifiers, code, and SQL

- Render machine-readable identifiers, hashes, connection strings, config
  keys, inline code, and SQL with `--type-role-code` / `--font-mono`.
- Keep prose, labels, and ordinary numeric columns in their normal type roles.
  Monospace marks machine-readable content; it is not a general "technical"
  aesthetic.
- Use inline code for a value that fits in the surrounding sentence or cell.
  Use a code block for multi-line SQL, logs, config, or any value where line
  breaks and indentation matter.
- Code blocks use `--color-surface`, `--color-border`, `--radius-md`,
  `--spacing-md`, and `--type-role-code`. Inline code uses
  `--color-elevated-surface`, `--radius-sm`, horizontal `--spacing-xs`, and
  `--type-role-code`.
- Preserve whitespace and allow horizontal scrolling in code blocks. Never
  soft-wrap SQL in a way that changes where tokens appear; a product may offer
  an explicit wrap toggle.
- Do not invent syntax colors. Syntax highlighting is deferred to v2. In v1,
  render all code with `--color-foreground`; comments or secondary metadata
  may use `--color-muted-foreground` only when they remain readable.

```sql
SELECT pid, application_name, state
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY pid;
```

The block uses `--type-role-code` and preserves its line breaks. A one-line
cell containing `SELECT 1` uses the same role inline.

## Truncation and full-value access

- Truncate only when a known width is necessary for comparison or layout.
  Never truncate the key identifier if removing another column or allowing
  horizontal scroll would preserve it.
- Truncate at the end with CSS `text-overflow: ellipsis`; do not truncate the
  middle unless both prefix and suffix identify the value, as with hashes.
- Keep the underlying full string in the DOM or data model. Never replace it
  with the displayed substring before copy, search, export, or accessibility
  naming.
- A truncated value must have all three paths: visible ellipsis, full value in
  [Tooltip](components/tooltip.md) on hover/focus, and a touch-safe full-value
  path through row expansion or a detail view. Tooltip alone is insufficient.
- Give the truncated element keyboard focus only if focusing it reveals the
  full value or it performs an action. Do not add inert tab stops merely to
  show Tooltip; use the row/detail path instead.
- Preserve meaningful prefixes. For `postgresql://analytics…`, keep the scheme
  and host start. For a hash, a deliberate middle form such as
  `a13f92c1…7bd0` is allowed when the product consistently uses both ends for
  recognition.

Example: a fixed-width connection column shows
`postgresql://analytics…`, its Tooltip shows the full URI, the row detail
shows the full URI on touch, and Copy copies the untruncated URI.

## Copy to clipboard

- Provide copy for identifiers, hashes, connection strings, SQL queries,
  config keys and values, and any machine-readable value a person is likely to
  paste elsewhere.
- Use an `sm` [IconButton](components/icon-button.md) adjacent to a table value
  and a labelled Button for a standalone code block. The IconButton accessible
  name and Tooltip are `Copy {value type}`, for example `Copy connection
  string`; never use the value itself as the control name.
- Copy the exact source value, not its truncated, rounded, localized, converted,
  highlighted, or unit-decorated presentation. Copying `1.50 GiB` from a byte
  field copies the documented source form, such as `1610612736 B`.
- On success, show [Toast](components/toast.md) with direct copy such as
  `Connection string copied`. The Toast is confirmation, not the only state
  change: change the IconButton accessible name to `Copied {value type}` for
  the Toast duration.
- On failure, show an error Toast using what/why/now structure:
  `Connection string was not copied. Clipboard access was blocked. Select the
  value and copy it manually.` Keep the value selectable.
- Do not disable selection to force use of the copy control. Secret values
  follow the product's authorization and reveal rules; never place an
  unauthorized secret on the clipboard or in Tooltip content.

```text
Query ID   01J8Y5R9Q2K6…   [Copy query ID]
                           └─ copies 01J8Y5R9Q2K6W1N4C3T8M7B0P
```

## Value comparison

- Compare values in a stable `Before` / `After` order. Do not reverse the
  columns between screens.
- Show the value and the change kind in text or iconography. Color is
  reinforcement only: added uses `--color-success`, removed uses
  `--color-danger`, and changed uses `--color-warning`.
- For a changed value, render both sides. Never show only the new value with a
  "changed" badge. Use `Before: 100` and `After: 200`, or a two-column row.
- For added and removed values, use the missing side's explicit state:
  `Not set` for configuration absence, or `NULL` when the underlying value is
  SQL null. Do not use unknown `—` unless the side truly cannot be read.
- Apply the normal rules to both sides: identical units and precision,
  tabular figures, code type for machine-readable values, and full-value copy.
- When comparing SQL or multi-line config, use a line diff with visible `+`
  and `−` markers and accessible labels `Added line` and `Removed line`.
  Preserve whitespace. Syntax highlighting remains deferred.

```text
Setting           Before    After     Change
max_connections       100      200    Changed
archive_mode           off       on    Changed
application_name      NULL    momoi    Added
```

Numeric cells share one right edge and precision. `Changed` has a visible
label/icon in addition to `--color-warning`; `Added` has a visible label/icon
in addition to `--color-success`.

## Responsive tables

Tables remain tables on small screens when comparison across rows and columns
is the task. Do not automatically turn each row into a card.

1. Keep the row's key identifier and primary action visible. Make the key
   identifier the first non-selection column and the primary action the last
   column; either may be sticky when the table scrolls horizontally.
2. Remove non-essential columns in a documented priority order. Hide
   decorative/redundant metadata first, then secondary metadata. Never hide a
   warning, danger marker, selection state, or the only representation of
   null/unknown.
3. Put hidden fields in progressive disclosure: row expansion, Drawer, or a
   detail view reached by a visible control with an accessible name such as
   `Show details for replica-01`.
4. Allow horizontal scrolling when the remaining columns are all necessary
   for comparison. Keep the header aligned with the body and expose the
   scrollable region with an accessible label. Do not squeeze values until
   they become ambiguous.
5. On touch, replace hover-only discovery with visible controls. Full
   truncated values and warning explanations must remain available through
   expansion/detail; Tooltip is never the only path.

Example collapse order for a replica table:

| Priority | Wide table | Narrow table |
| --- | --- | --- |
| Required | Replica (key), status/danger, primary action | Stays visible |
| Comparison | Lag, connections | Stays visible while comparison remains usable; otherwise horizontal scroll |
| Secondary | Region, last sampled, engine version | Moves into row detail in that order |

The narrow table therefore keeps `Replica`, `Status`, `Lag`, and the primary
action. `Region`, `Last sampled`, and `Engine version` appear under `Show
details for {replica}`. A danger marker never moves out of the summary row.

## Conformance checklist

A data-heavy surface conforms only when all applicable answers are yes:

- Are numeric quantities and headers right-aligned with
  `--type-role-numeric` and `--font-variant-numeric`?
- Does one comparison group use one unit and precision?
- Are `NULL`, `0`, and unknown `—` rendered as three distinct states?
- Are warning and danger visible without relying on color or Tooltip?
- Can every truncated value be reached in full on pointer, keyboard, and
  touch, and does copy use the full source value?
- Do machine-readable values use `--type-role-code` / `--font-mono` while
  ordinary numbers remain in the numeric role?
- Do comparisons show both sides and name added, removed, or changed?
- Does the narrow table retain the key identifier, primary action, and every
  warning/danger state while progressively disclosing secondary columns?
