# Developer-oriented interfaces

Raw value vs friendly display toggling for technical data. This pattern governs
how a surface lets a developer switch between a human-friendly presentation and
the exact machine-readable value, and composes the
[data-interfaces.md](../data-interfaces.md) rules into an interaction.

User story #26.

## Purpose

Developer tools show data that has both a friendly form and a raw form: a
timestamp as "2 minutes ago" vs `2026-08-19T02:54:26Z`, a byte count as
`1.50 GiB` vs `1610612736`, a connection string as `postgresql://analytics…`
vs the full URI, a config value as `on` vs `true`. Developers often need the
exact raw value — to paste into a script, compare against a source, or debug —
while scanning benefits from the friendly form.

This pattern gives the person a consistent way to toggle between the two,
without losing the [data-interfaces.md](../data-interfaces.md) rules that govern
each form.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Display cell | [Table / DataTable](../components/table.md) cell or definition value | Shows friendly or raw form per current mode |
| Toggle control | [Switch](../components/switch.md), [Button](../components/button.md), or [Tabs](../components/tabs.md) | Switches the region between friendly and raw |
| Copy action | [IconButton](../components/icon-button.md) "Copy {value type}" | Copies the exact source value regardless of display mode |
| Full-value access | [Tooltip](../components/tooltip.md) + row/detail | Full value on hover/focus/touch (per [data-interfaces.md](../data-interfaces.md)) |
| Code rendering | `--type-role-code` / `--font-mono` | Raw values use code type; friendly values use their normal role |

## Flow

1. Person views a data-heavy surface (table, detail panel) in friendly mode by
   default. Timestamps are relative, byte counts are humanized, connection
   strings are truncated with ellipsis.
2. Person activates the toggle ("Show raw values" [Switch](../components/switch.md),
   or a [Tabs](../components/tabs.md) "Friendly / Raw", or a per-cell
   [IconButton](../components/icon-button.md)).
3. The region re-renders in raw mode: absolute timestamps, exact byte counts,
   full connection strings (or full where space allows; truncation rules still
   apply per [data-interfaces.md](../data-interfaces.md)).
4. Person can copy any value — [copy](../data-interfaces.md) always uses the
   exact source value, not the displayed form.
5. Toggling back restores friendly mode. The toggle preference may persist per
   surface or per person (documented).

## States

| State | Behavior |
| --- | --- |
| friendly (default) | Human-readable forms: relative time, humanized bytes, truncated long values with full-value access. |
| raw | Machine-readable forms: absolute time (ISO 8601), exact byte counts, full values where space allows. Numeric alignment and `--type-role-numeric` still apply. |
| mixed | Rare: some columns raw, others friendly. Use per-column toggles only when the product needs it; default is one region-wide toggle. |

## Layout sketch

### Region-wide toggle

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Replicas                          [Friendly ● Raw]  [Show raw values]│
├──────────────────────────────────────────────────────────────────────┤
│ Table (raw mode)                                                     │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name       Created                  Memory         Conn string   │  │
│ │ replica-01 2026-08-19T02:54:26Z    1610612736 B   postgresql://… │  │
│ │ replica-02 2026-08-19T01:12:08Z    2147483648 B   postgresql://… │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Friendly (default) mode

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Replicas                          [Friendly ● Raw]                    │
├──────────────────────────────────────────────────────────────────────┤
│ Table (friendly mode)                                                │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name       Created        Memory      Conn string               │  │
│ │ replica-01 2 minutes ago  1.50 GiB    postgresql://analytics…  │  │
│ │ replica-02 1 hour ago     2.00 GiB    postgresql://analytics…  │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

Copy (`[Copy]` [IconButton](../components/icon-button.md) adjacent to a value)
copies the exact source: `1610612736 B` even in friendly mode where the cell
shows `1.50 GiB`.

## Rules

### What changes between modes

| Value type | Friendly | Raw |
| --- | --- | --- |
| Timestamp | Relative ("2 minutes ago") or localized | ISO 8601 (`2026-08-19T02:54:26Z`) or source epoch |
| Byte count | Humanized (`1.50 GiB`) | Exact (`1610612736 B`) |
| Duration | Humanized (`820 ms`, `1.2 s`) | Exact source unit (ms, µs) |
| Connection string / URI | Truncated (`postgresql://analytics…`) | Full value, or full where space allows |
| Config value | Friendly (`on`, `enabled`) | Source (`true`, `1`) |
| Identifier | Same in both (identifiers are already raw) | Same |

### What does not change

- **Numeric alignment.** Raw numeric columns are still right-aligned with
  `--type-role-numeric` and `--font-variant-numeric`. See
  [data-interfaces.md](../data-interfaces.md) → Numeric values.
- **null ≠ 0 ≠ unknown.** `NULL`, `0`, and `—` are distinct in both modes.
  See [data-interfaces.md](../data-interfaces.md) → Missing and indeterminate
  values.
- **Dangerous values.** A dangerous value (`fsync = off`) keeps its
  `Danger` marker and raw visibility in both modes. The friendly form does not
  soften danger. See [data-interfaces.md](../data-interfaces.md) → Warnings and
  dangerous values.
- **Copy always uses the source value.** Whether the display is friendly or
  raw, [copy](../data-interfaces.md) copies the exact source — not the rounded,
  humanized, or truncated presentation.
- **Truncation rules.** In raw mode, long values may still truncate per the
  [data-interfaces.md](../data-interfaces.md) truncation rules (visible
  ellipsis, full value in [Tooltip](../components/tooltip.md), touch-safe
  full-value path). Raw mode does not mean "ignore layout"; it means "show the
  source form where space allows."

### Toggle mechanics

- Default is **friendly**. Raw is opt-in.
- The toggle is region-wide by default (one [Switch](../components/switch.md)
  or [Tabs](../components/tabs.md) "Friendly / Raw" above the table). Per-column
  or per-cell toggles are allowed only when the product needs mixed mode and
  the toggle is clearly scoped.
- The toggle preference may persist per surface or per person. Document which.
- Toggling does not reload data — the underlying values are the same; only
  presentation changes. Do not show a loading state for a display-mode toggle.
- In raw mode, use `--type-role-code` / `--font-mono` for values that are
  machine-readable (connection strings, config keys, timestamps in ISO). In
  friendly mode, use the normal type role (numeric role for numbers, body for
  prose timestamps).

## Accessibility

- The toggle control has an accessible name ("Show raw values", "Display mode")
  and its state is announced.
- When the display mode changes, the updated values are in the DOM; do not
  require a live-region announcement for every cell. If the person is focused
  on a cell, its new value is read on the next interaction.
- Copy [IconButton](../components/icon-button.md) accessible name includes the
  value type: "Copy memory (raw)", "Copy connection string". The copied value
  is always the source, regardless of mode.
- Full-value access ([Tooltip](../components/tooltip.md) + row/detail) must work
  in both modes per [data-interfaces.md](../data-interfaces.md) truncation
  rules.

## Related patterns

- [Large data tables](large-data-tables.md) — tables where raw/friendly toggle
  is most useful.
- [data-interfaces.md](../data-interfaces.md) — the prescriptive cell-rendering
  rules (alignment, null/unknown, truncation, copy, dangerous values) that both
  modes compose.
