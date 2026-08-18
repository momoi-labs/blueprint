# Select

## Purpose

Select lets a person choose exactly one value from a predefined set. It hides
the option list until opened, so use it when showing every option at once would
create unnecessary noise.

## Anatomy

1. **Trigger** — displays the selected value or placeholder and opens the list.
2. **Value** — current selection.
3. **Icon** — indicates that the list can open; decorative when the trigger is
   already named.
4. **Content** — elevated option surface positioned relative to the trigger.
5. **Viewport** — scrollable option container.
6. **Item** — one selectable value, with optional selection indicator.
7. **Group and group label (optional)** — organizes a long, meaningful set.
8. **Scroll controls (optional)** — reveal overflow without replacing ordinary
   scrolling.

## Variants

- **Default** — flat list of mutually exclusive options.
- **Grouped** — labeled groups where categories help scanning.
- **Required** — placeholder is not a valid submitted value.
- **Disabled options** — exceptional choices that are visible but unavailable;
  prefer omitting irrelevant options when their absence is not confusing.

Select is not Switch or Checkbox: Select chooses one value from many; Switch
changes one immediate on/off setting; Checkbox represents an independent
boolean or membership in a multi-select set.

## Sizes

- **Small** — dense toolbars and compact forms.
- **Medium** — default.
- **Large** — rare, high-emphasis selection.

Trigger sizes align with Input sizes. Content width is at least sufficient for
its items and may match the trigger. Use spacing and size tokens, not raw values.

## States

| State | Behavior |
| --- | --- |
| Default | Closed trigger shows selection or placeholder. |
| Hover | Trigger and enabled item show a quiet interactive emphasis. |
| Focus | Trigger or focused item has a visible `--color-focus` indicator. |
| Active/open | Trigger exposes `data-state="open"`; content is visible and the current keyboard item is distinct from the selected item. |
| Disabled | Trigger cannot open; disabled items cannot be selected. Uses `--color-disabled`. |
| Loading | Trigger remains stable, shows Spinner/status, and does not present stale options as ready. |
| Error | Trigger uses `aria-invalid="true"`, danger treatment, and linked ValidationMessage. |

Loading is not disabled. Loading says options are being resolved; disabled says
selection is unavailable. If loading prevents opening, announce why and retain
the current value.

## Accessibility

- Associate the trigger with Label through `for`/`id` where the implementation
  supports it, or an equivalent `aria-labelledby` relationship without
  duplicating the accessible name.
- The Radix implementation supplies button/listbox semantics, active descendant
  management, portalling, and typeahead. Preserve them.
- Link HelperText and ValidationMessage via `aria-describedby`; expose invalid,
  required, disabled, and busy states programmatically.
- Keyboard: `Enter`, `Space`, or supported arrow keys open; arrows move through
  options; typeahead searches; `Enter`/`Space` selects; `Escape` closes and
  returns focus; `Home`/`End` move to bounds where supported.
- Focus returns to the trigger after selection or dismissal. Selection is not
  committed merely by moving focus through items.

## When to use

- For one choice from a known set where a collapsed list saves meaningful space.
- When options are short, comparable labels.
- When Radix Select's custom presentation is needed consistently across themes.

## When NOT to use

- Do not use for multiple choices; use Checkbox controls or a dedicated
  multi-select pattern.
- Do not use for one boolean setting; use Switch.
- Do not hide two or three important options when visible choices would be
  faster to compare.
- Do not use as autocomplete for a very large or remote dataset without a
  dedicated combobox/search pattern.

## Tokens

Trigger uses semantic control tokens. Content uses `--color-elevated-surface`,
`--color-foreground`, `--color-border`, semantic shadow and radius tokens;
focused/selected items use `--color-accent` or `--color-primary` according to
hierarchy, focus uses `--color-focus`, and error uses `--color-danger`.

## Radix/shadcn mapping

Maps to [Radix Select](https://www.radix-ui.com/primitives/docs/components/select)
and [shadcn/ui Select](https://ui.shadcn.com/docs/components/select). Keep the
Radix parts and behavior as the reference contract; shadcn supplies the common
composition and styling baseline.
