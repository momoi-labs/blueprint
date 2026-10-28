# TimeRangeControl

## Purpose and anatomy

Select the visible interval of time-based panels. A labelled Button opens a
compact Popover with a vertical preset list. Custom range reveals exact
start/end fields. It is not a date-only calendar or a refresh-rate picker.

`mode` chooses one of two behaviors:

- `"artifact"` (default) scopes a collected run, such as a PG Probe report.
  The run has fixed bounds.
- `"live"` scopes a monitoring console that polls. A range can follow the
  wall clock ("Last 15 minutes") or stay at fixed times.

## Artifact mode

`bounds` and controlled `value` are `{ from, to }` epoch-millisecond pairs.
Both must be finite, valid dates with start before end; value must fit inside
bounds. `onValueChange` receives an applied range. The consumer filters panels
and recalculates their summaries from that interval. A Chart's
`onRangeSelect` can set the same value, so a reader can drag across a plot
to zoom in.

Presets default to the last 5, 15, and 30 minutes relative to the end of the
run. Durations are positive milliseconds; clip their start to the run start.
Each preset shows its interval. "Entire run" restores bounds. Selecting a
preset applies it and closes the popover. Custom fields include
milliseconds. Times are in UTC unless the consumer passes `timeZone`; the
local machine's time zone and daylight-saving changes cannot shift the
selection. The trigger shows a short interval and the zone name.

Editing a field does not apply it. Apply validates that the start precedes
the end and both fit inside the collection window. Invalid input keeps the
popover open with field-associated feedback. Escape or outside dismissal
cancels edits. Reopening starts with the applied value. `disabled` disables
the trigger while a run is unavailable. Invalid props throw a `RangeError`.

## Live mode

### Value

`value` is `{ kind: "relative", duration }` or
`{ kind: "absolute", from, to }`, in epoch milliseconds. A relative value is
live: it follows the wall clock. An absolute value is paused. The control
never resolves a relative value for the consumer. The consumer passes `now`,
the wall-clock epoch milliseconds of its last query, and resolves
`[now - duration, now]` itself. Anchor on the wall clock, never on the newest
sample, so a sparse stream does not keep old rows inside "the last 15
minutes".

`maxDuration` is the retention: the longest span the product keeps.
`resumeDuration` is the relative duration "Back to live" returns to. Both are
required positive milliseconds. The consumer owns `resumeDuration`, usually
the person's last relative choice capped at `maxDuration`. The control keeps
no history, so "Back to live" also works after an absolute URL or a remount.
Live mode has no `bounds`.

### Trigger

- Relative: the label of the preset with the same duration. Without a
  match, it reads "Last N days", "Last N hours", or "Last N minutes", in the
  largest unit that divides the duration, with "Last N seconds" as the
  fallback and the singular unit for 1. It never shows absolute times.
- Absolute: a short range to the second with the zone's short name, for
  example "11:18:05 to 11:21:30 GMT-3". Both ends show their date when the
  range crosses a day in the selected zone.
- The trigger shows the state with an icon, a live signal or a pause sign,
  and names it in its accessible name. Color alone never carries it.
- The accessible name and a tooltip carry both full timestamps, with date,
  time to the second, and UTC offset. A relative value resolves them from
  `now`. A time that cannot be resolved reads "Time unavailable".

### Popover

- Presets apply at once and close the popover. A preset longer than
  `maxDuration` is left out. Available data never hides a preset: a server
  with two minutes of samples still offers Last 15 minutes. Presets show
  only their label, and the current one shows a check and `aria-pressed`.
- There is no "Entire run". The longest preset already means "all we keep".
- While paused, a status line names the paused range and "Back to live"
  calls `onValueChange({ kind: "relative", duration: resumeDuration })`.
- A time zone row names the selected zone and opens the time zone view.
- Custom range opens the custom form.

### Custom form

Fields read and write wall-clock time in the selected zone, to the second.
Values stay epoch milliseconds. The form opens with the applied value: an
absolute range as is, a relative one resolved from `now`. A field the person
does not edit keeps the value's milliseconds. The shown start rounds up and
the shown end rounds down to the whole second, so an edited range at the
edge of retention stays inside it.

Validation runs on Apply only. Apply checks that the start precedes the end
and both fit inside `[now - maxDuration, now]`, with the `now` of that
moment. Native field constraints compare wall times, which a
daylight-saving overlap can reverse, so they never block Apply. Invalid input
keeps the popover open with field-associated feedback.

A wall time inside a daylight-saving gap moves forward to the first valid
instant. A wall time inside an overlap takes the earlier instant.

### Polling

A new `now` changes no applied value. It keeps an absolute value, keeps an
open custom form's draft, and keeps the open view. An absolute value that
has fallen out of retention stays selected; the consumer shows its own empty
state. Live mode never throws during render, whatever `now`, `value`, or
data it gets. Invalid presets are left out.

### Time zone

`timeZone` is an IANA name and `onTimeZoneChange` reports a new choice.
Pass both to control the zone; without `timeZone`, the control keeps the
choice itself. Live mode defaults to the browser's zone; artifact mode
defaults to UTC. The live popover's time zone view offers the browser's
zone, UTC, and a searchable list from `Intl.supportedValuesOf("timeZone")`.
Choosing a zone returns to the presets.

## Locale and text

`locale` sets every live date format through `Intl.DateTimeFormat`. It
defaults to the document's language. Artifact text stays in its fixed
`YYYY-MM-DD HH:mm:ss.sss` form.

`labels` replaces every fixed string: section and button names, field
labels, errors, the live and paused state words, the time zone view, the
relative label template `relative(count, unit)`, the range templates, and
the trigger's accessible name `triggerName`. Defaults are English. Errors for
invalid artifact props stay in English.

## Accessibility

Compose [Button](button.md), [Popover](popover.md), and labelled
[Input](input.md) controls; live mode adds [Tooltip](tooltip.md) and
[Search](search.md). Tab follows the visible preset buttons or custom form
fields and Apply. Native date/time inputs retain platform keyboard behavior.
Escape dismisses; Radix restores focus to the trigger. Errors use an alert
and field descriptions. Touch can use every action.

In artifact mode, the trigger's accessible name includes both full
timestamps, and visible dates appear when the interval crosses a day. In
live mode, the tooltip repeats the accessible name's timestamps; nothing
lives only in it.

## Tokens and implementation

Use existing Button, Input, and Popover tokens. Use `--spacing-xs` between
presets and `--spacing-md` between regions. The trigger wraps long ranges;
the popover fits the viewport. No new calendar, time zone, or date
dependency: time zones use `Intl` only.

## Custom range form

The custom range editor composes [Form](form.md) with
[FormActions](form-actions.md). Apply range is the explicit submit action;
validation stays next to the range fields. Presets still apply immediately.
