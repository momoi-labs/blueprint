# TimeRangeControl

## Purpose and anatomy

Select the visible interval of time-based panels. It is not a refresh-rate
picker. `mode` chooses one of two behaviors:

- `"artifact"` (default) scopes a collected run, such as a PG Probe report.
  The run has fixed bounds. A labelled Button opens a compact Popover with a
  vertical preset list; Custom range reveals exact start/end fields.
- `"live"` scopes a monitoring console that polls. A range can follow the
  wall clock ("Last 15 minutes") or stay at fixed times. A pause button sits
  next to the range button, and the Popover shows the range on a timeline
  with its fields and presets side by side.

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
`resumeDuration` is the relative duration that resuming returns to. Both are
required positive milliseconds. The consumer owns `resumeDuration`, usually
the person's last relative choice capped at `maxDuration`. The control keeps
no history, so resuming also works after an absolute URL or a remount. Live
mode has no `bounds`. `className` applies to the wrapper around both buttons.

### Trigger

The trigger is a group of two buttons.

- The pause button is icon-only with an accessible name and a tooltip:
  "Pause" on a live value, "Resume live" on a paused one. Pause applies
  `{ kind: "absolute", from: now - duration, to: now }`. Resume applies
  `{ kind: "relative", duration: resumeDuration }`. Pause is disabled when
  the value cannot be resolved.
- The range button opens the popover. On a relative value it shows the label
  of the preset with the same duration. Without a match, it reads "Last N
  days", "Last N hours", or "Last N minutes", in the largest unit that
  divides the duration, with "Last N seconds" as the fallback and the
  singular unit for 1. It never shows absolute times for a relative value.
- On an absolute value it shows a short range to the second with the zone's
  short name, for example "11:18:05 to 11:21:30 GMT-3". Both ends show their
  date when the range crosses a day in the selected zone.
- The range button shows the state with an icon, a live signal or a pause
  sign, and names it in its accessible name. Color alone never carries it.
- The accessible name carries both full timestamps, with date, time to the
  second, and UTC offset. A relative value resolves them from `now`. A time
  that cannot be resolved reads "Time unavailable".
- Its tooltip shows the range on a timeline on a neutral surface: a bar for
  the retention window, from `now - maxDuration` to now, with the range
  highlighted; the start and end times; and the date, zone, and retention.
  The bar is decorative; the accessible name carries the same facts.

### Popover

The popover has two columns. Below about 34rem of available width they
stack.

The first column holds, in order:

1. The state, "Live" or "Paused", with its icon, and one action: "Pause" on
   a live value, "Back to live" on a paused one. They apply the same values
   as the pause button.
2. The timeline: the same bar as the tooltip, which a person can drag (see
   Timeline).
3. A separator, the From and To fields, and their actions (see Fields).
4. A separator and the time zone row, which names the selected zone and
   opens the time zone view.

The second column is the preset list. Presets apply at once and close the
popover. A preset longer than `maxDuration` is left out. Available data never
hides a preset: a server with two minutes of samples still offers Last 15
minutes. Presets show only their label, and the current one shows a check
and `aria-pressed`. There is no "Entire run": the longest preset already
means "all we keep".

### Fields

From and To are text fields. Each accepts:

- `now`, or `now-` followed by a whole number and `s`, `m`, `h`, or `d`, such
  as `now-15m`.
- A time of day, `HH:mm` or `HH:mm:ss`, meaning that time today in the
  selected zone.
- A date and time, `YYYY-MM-DD HH:mm` or `YYYY-MM-DD HH:mm:ss`, in the
  selected zone.

A relative value shows as `now-30m` and `now`, in the largest unit that
divides the duration. An absolute value shows as dates and times in the
selected zone. The shown start rounds up and the shown end rounds down to
the whole second, so a range at the edge of retention stays inside it. The
hint under each field shows the time it resolves to, with the date and zone,
and notes when it follows the clock. Invalid text turns the hint into the
accepted formats.

Editing a field does not apply it. After an edit, "Reset" and "Apply range"
appear. Enter applies. Escape resets the edit.

Apply resolves both fields with the `now` of that moment. Start relative and
end `now` apply a relative value. Any other pair applies an absolute value.
Text that still matches an absolute value's shown text keeps that end's
exact instant, milliseconds included. Apply checks that the start precedes
the end and both fit inside `[now - maxDuration, now]`. Invalid input keeps
the popover open with an error tied to the field. Impossible dates, such as
February 30, are invalid.

A wall time inside a daylight-saving gap moves forward to the first valid
instant. A wall time inside an overlap takes the earlier instant.

An edit belongs to the zone it was typed in: changing the zone discards it,
and the fields show the value in the new zone.

### Calendar

When retention covers more than one calendar day in the selected zone, each
field has a calendar button. It opens a month grid that picks the field's
date and keeps its time. A relative expression first resolves to its time
with the current `now`; the field then holds a date and time. Only days
inside retention can be picked; the others are marked unavailable, with the
reason in their accessible name, and month navigation stops at retention.
The first day of the week follows `locale`, or Monday when the browser
does not report it. Picking a day is an edit: it
waits for Apply.

The grid follows the date picker dialog pattern. Arrow keys move by day and
week, Home and End go to the week's start and end, Page Up and Page Down
change the month, Enter or Space picks, and Escape closes the calendar and
returns focus to its button.

### Timeline

The bar spans `[now - maxDuration, now]`. Its axis names the window's start,
with the date when retention is a day or more, and "now". A live range ends
at now in the accent color; a paused range uses the muted color. A paused
range older than retention shows a note in place of the bar segment.

Dragging the segment moves the range and keeps its duration. Dragging an
end changes it. The range stays inside the window and keeps at least one
second, or the whole retention when it is shorter. A drag previews against
the `now` at its start and applies once, on release, checked against the
current retention. Releasing with the end within 1.5% of retention from now
applies a relative value. Its duration rounds to the minute when that stays
between one minute and `maxDuration`; otherwise it rounds to the second and
stays between one second, or the whole retention when it is shorter, and
`maxDuration`. Escape, a cancelled pointer, or a lost pointer capture cancels
a drag without applying.

The bar has three sliders, in this order, each with `role="slider"`,
epoch-millisecond `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`, and
an `aria-valuetext` with the times:

- "Range start": from the window start to the end minus the minimum span.
- "Move range": its value is the start, from the window start to now minus
  the duration.
- "Range end": from the start plus the minimum span to now.

Arrow keys step by 1/120 of retention, rounded to the whole second and at
least one second. Shift, Page Up, and Page Down step ten times as far. Home
and End go to the slider's limits. Each key step applies. Every slider shows
a focus ring and stays reachable when the range is narrow.

### Escape

Escape acts on the innermost thing: an open calendar, then a drag in
progress, then an edit in the fields while focus is in them, then the
popover. Closing the popover
returns focus to the range button.

### Polling

A new `now` changes no applied value. It keeps an absolute value, keeps an
edit in the fields, and keeps the open view. A new `value` from the consumer
also keeps an edit. Fields without an edit follow the value. Reset, a
preset, pause or resume, and a drag or slider step discard the edit. An absolute value that has fallen out of retention stays
selected; the consumer shows its own empty state. Live mode never throws
during render, whatever `now`, `value`, or data it gets. Invalid presets are
left out.

### Time zone

`timeZone` is an IANA name and `onTimeZoneChange` reports a new choice.
Pass both to control the zone; without `timeZone`, the control keeps the
choice itself. Live mode defaults to the browser's zone; artifact mode
defaults to UTC. The live popover's time zone view offers the browser's
zone, UTC, and a searchable list from `Intl.supportedValuesOf("timeZone")`.
Choosing a zone returns to the main view.

## Locale and text

`locale` sets every live date format through `Intl.DateTimeFormat`. It
defaults to the document's language. Artifact text stays in its fixed
`YYYY-MM-DD HH:mm:ss.sss` form. Live field text keeps the fixed formats
above in every locale.

`labels` replaces every fixed string: section and button names, field
labels, hints and errors, the live and paused state words, the pause
button's names, the slider names, the calendar's names, the time zone view,
the relative label template `relative(count, unit)`, the range templates,
and the trigger's accessible name `triggerName`. Defaults are English.
Errors for invalid artifact props stay in English.

## Accessibility

Compose [Button](button.md), [Popover](popover.md), and labelled
[Input](input.md) controls; live mode adds [Tooltip](tooltip.md),
[Search](search.md), and [Separator](separator.md). Tab follows the visible
buttons, sliders, and fields. Native date/time inputs in artifact mode
retain platform keyboard behavior. Escape dismisses; Radix restores focus to
the trigger. Errors use an alert and field descriptions. Touch can use every
action: the popover repeats everything the tooltip shows.

In artifact mode, the trigger's accessible name includes both full
timestamps, and visible dates appear when the interval crosses a day. In
live mode, the accessible name carries what the tooltip's timeline shows;
nothing lives only in the tooltip.

## Tokens and implementation

Use existing Button, Input, Popover, Tooltip, and Separator tokens. Use
`--spacing-xs` between presets and `--spacing-md` between regions. The
trigger wraps long ranges; the popover fits the viewport. No new calendar,
time zone, or date dependency: time zones use `Intl` only, and the live
calendar is internal to this component.

## Custom range form

The artifact custom range editor composes [Form](form.md) with
[FormActions](form-actions.md). Apply range is the explicit submit action;
validation stays next to the range fields. Presets still apply immediately.
