import { useState } from "react";
import { TimeRangeControl, type ChartSeries, type LiveTimeRange, type TimeRange } from "@momoi-labs/kiso-react";

/* Ninety days of workspace activity up to today, shared by the Overview
   and the Reports page: tasks completed and opened each day. */
const dayMs = 86_400_000;
const retention = 90 * dayMs;
const today = Math.floor(Date.now() / dayMs) * dayMs;
export const activitySeries: ChartSeries[] = [
  { key: "completed", label: "Completed", slot: 1 },
  { key: "opened", label: "Opened", slot: 2 },
];
export const activity = Array.from({ length: 91 }, (_, index) => ({
  timestamp: today - (90 - index) * dayMs,
  values: {
    completed: Math.round(8 + index / 30 + Math.sin(index / 4) * 3),
    opened: Math.round(7 + Math.cos(index / 3) * 2),
  },
}));
export const backlogSeries: ChartSeries[] = [
  { key: "todo", label: "To do", slot: 1 },
  { key: "doing", label: "In progress", slot: 2 },
  { key: "review", label: "In review", slot: 3 },
];
export const backlog = activity.map(({ timestamp }, index) => ({
  timestamp,
  values: {
    todo: Math.round(32 + Math.sin(index / 9) * 8),
    doing: Math.round(14 + Math.cos(index / 4) * 3),
    review: Math.round(5 + Math.sin(index / 5) * 2),
  },
}));
const rangePresets = [
  { label: "Last 7 days", duration: 7 * dayMs },
  { label: "Last 30 days", duration: 30 * dayMs },
  { label: "Last 90 days", duration: 90 * dayMs },
];

/* The range a page's panels share. It follows the clock ("Last 30 days")
   until the reader picks fixed dates or drags across a chart. The page
   loads once, so `now` is the moment it opened. */
export function useReportRange() {
  const [now] = useState(Date.now);
  const [value, setValue] = useState<LiveTimeRange>({ kind: "relative", duration: 30 * dayMs });
  const [resume, setResume] = useState(30 * dayMs);
  const [timeZone, setTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const change = (next: LiveTimeRange) => {
    setValue(next);
    if (next.kind === "relative") setResume(next.duration);
  };
  const range = value.kind === "relative" ? { from: now - value.duration, to: now } : value;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, month: "2-digit", day: "2-digit" });
  return {
    control: <TimeRangeControl mode="live" value={value} now={now} maxDuration={retention} resumeDuration={resume}
      presets={rangePresets} onValueChange={change} timeZone={timeZone} onTimeZoneChange={setTimeZone} />,
    within: <T extends { timestamp: number }>(samples: T[]) =>
      samples.filter(sample => sample.timestamp >= range.from && sample.timestamp <= range.to),
    formatDay: (time: number) => day.format(time),
    select: (selected: TimeRange) => change({ kind: "absolute", ...selected }),
  };
}
export const whole = (value: number) => value.toFixed(0);
export const openByOwner = [
  { key: "alex", label: "Alex Morgan", value: 14 },
  { key: "sam", label: "Sam Lee", value: 11 },
  { key: "priya", label: "Priya Shah", value: 9 },
  { key: "jo", label: "Jo Park", value: 6 },
];
