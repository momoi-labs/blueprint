---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

TimeRangeControl gets a live mode for monitoring consoles. A live value is a relative duration that follows the wall clock, or a paused absolute range. A pause button sits next to the range button. The popover shows the range on a draggable timeline over the retention, From and To fields that accept `now-15m`, times, and dates, a calendar when retention spans days, and the presets beside them. A polling `now` keeps edits. Both modes take `timeZone`, `locale`, and `labels` for every fixed string. Artifact mode, the default, is unchanged.

Chart takes optional `timeZone` and `locale` for the axis, readout, and exact table. Without them it formats exactly as before.
