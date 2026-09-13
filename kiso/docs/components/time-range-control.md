# TimeRangeControl

## Purpose and anatomy

Select the visible interval within a collected run. A labelled Button opens a
compact Popover with a vertical preset list. Custom range reveals exact
start/end fields. This control scopes an
artifact's timestamps, not a live polling schedule or date-only calendar.

## Data and behavior

`bounds` and controlled `value` are `{ from, to }` epoch-millisecond pairs.
Both must be finite, valid dates with start before end; value must fit inside
bounds. `onValueChange` receives an applied range. The consumer filters panels
and recalculates their summaries from that interval.

Presets default to the last 5, 15, and 30 minutes relative to the end of the
run. Durations are positive milliseconds; clip their start to the run start.
"Entire run" restores bounds. Selecting a preset applies it and closes the
popover. Custom fields are explicitly UTC, including milliseconds; local
machine timezone and daylight-saving changes cannot shift the selection.

Editing a field does not apply it. Apply validates that the start precedes
the end and both fit inside the collection window. Invalid input keeps the
popover open with field-associated feedback. Escape or outside dismissal
cancels edits. Reopening starts with the applied value. `disabled` disables
the trigger while a run is unavailable.

## Accessibility

Compose [Button](button.md), [Popover](popover.md), and labelled
[Input](input.md) controls. Tab follows the visible preset buttons or custom form fields and Apply. Native
date/time inputs retain platform keyboard behavior. Escape dismisses; Radix
restores focus to the trigger. Errors use an alert and field descriptions.
The trigger shows a short interval and UTC. Its accessible name includes
both full timestamps; visible dates appear when the interval crosses a day. Touch can use every action.

## Tokens and implementation

Use existing Button, Input, and Popover tokens. Use `--spacing-xs` between
presets and `--spacing-md` between regions. The trigger wraps long ranges;
the popover fits the viewport. No new calendar, timezone, or date dependency.
