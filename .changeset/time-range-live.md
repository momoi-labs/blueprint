---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

TimeRangeControl gets a live mode for monitoring consoles. A live value is a relative duration that follows the wall clock, or a paused absolute range with "Back to live". Presets stop at the retention, the custom form works in a chosen time zone to the second, and a polling `now` keeps open drafts. Both modes take `timeZone`, `locale`, and `labels` for every fixed string. Artifact mode, the default, is unchanged.

Chart takes optional `timeZone` and `locale` for the axis, readout, and exact table. Without them it formats exactly as before.
