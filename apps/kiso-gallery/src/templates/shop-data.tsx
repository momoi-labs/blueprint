import { useState } from "react";
import { TimeRangeControl, type ChartSeries, type LiveTimeRange, type TimeRange } from "@momoi-labs/kiso-react";

export type Product = { sku: string; name: string; category: string; price: number; stock: number; reorder: number; sold: number; note: string };
export const products: Product[] = [
  { sku: "SHU-0406", name: "Shuriken, four point", category: "Throwing", price: 24, stock: 182, reorder: 60, sold: 96, note: "Pack of 6. Balanced by hand and tested on the shed door." },
  { sku: "KUN-0101", name: "Kunai, classic", category: "Tools", price: 18.5, stock: 64, reorder: 40, sold: 71, note: "Digs, pries and opens tins. The pocket knife of the trade." },
  { sku: "SMK-0303", name: "Smoke bomb, grey", category: "Vanishing", price: 12, stock: 0, reorder: 50, sold: 88, note: "Pack of 3. For a quick exit. Not for indoor meetings." },
  { sku: "GRP-0015", name: "Grappling hook, 15 m", category: "Climbing", price: 89, stock: 9, reorder: 20, sold: 23, note: "Folds flat. Rope included, nerve sold separately." },
  { sku: "TAB-0042", name: "Tabi boots, split toe", category: "Footwear", price: 54, stock: 31, reorder: 15, sold: 34, note: "Quiet on tile, gravel and the third stair that creaks." },
  { sku: "MIZ-0007", name: "Water shoes, mizugumo", category: "Footwear", price: 120, stock: 4, reorder: 5, sold: 7, note: "For crossing ponds. Works best when the pond is shallow." },
  { sku: "SUT-0021", name: "Night suit, midnight blue", category: "Apparel", price: 64, stock: 48, reorder: 20, sold: 29, note: "Darker than black after sunset. Machine wash, cold." },
];
export const stockState = (product: Product) =>
  product.stock === 0 ? "Out of stock" : product.stock <= product.reorder ? "Low stock" : "In stock";
export const money = (value: number) => `$${value.toFixed(2)}`;
export const shopHref = (path: string) => `#example/${path}`;

export type MonthlyReport = { id: string; month: string; period: string; prepared: string; start: number; days: number; orders: number; revenue: string; average: string; onTime: number };
export const reports: MonthlyReport[] = [
  { id: "2026-09", month: "September 2026", period: "1 to 30 September", prepared: "1 October", start: Date.UTC(2026, 8, 1), days: 30, orders: 312, revenue: "$18,420", average: "$59.04", onTime: 96 },
  { id: "2026-08", month: "August 2026", period: "1 to 31 August", prepared: "1 September", start: Date.UTC(2026, 7, 1), days: 31, orders: 286, revenue: "$16,390", average: "$57.31", onTime: 94 },
  { id: "2026-07", month: "July 2026", period: "1 to 31 July", prepared: "3 August", start: Date.UTC(2026, 6, 1), days: 31, orders: 241, revenue: "$13,105", average: "$54.38", onTime: 91 },
];

/* Ninety days of shop activity up to today, shared by the Overview and the
   Charts page: orders and returns each day, and the units on the shelves. */
const dayMs = 86_400_000;
const retention = 90 * dayMs;
const today = Math.floor(Date.now() / dayMs) * dayMs;
export const salesSeries: ChartSeries[] = [
  { key: "orders", label: "Orders", slot: 1 },
  { key: "returns", label: "Returns", slot: 2 },
];
export const sales = Array.from({ length: 91 }, (_, index) => ({
  timestamp: today - (90 - index) * dayMs,
  values: {
    orders: Math.round(8 + index / 30 + Math.sin(index / 4) * 3),
    returns: Math.round(1 + Math.cos(index / 3)),
  },
}));
export const stockSeries: ChartSeries[] = [
  { key: "throwing", label: "Throwing", slot: 1 },
  { key: "footwear", label: "Footwear", slot: 2 },
  { key: "vanishing", label: "Vanishing", slot: 3 },
];
export const stock = sales.map(({ timestamp }, index) => ({
  timestamp,
  values: {
    throwing: Math.round(210 + Math.sin(index / 9) * 30),
    footwear: Math.round(40 + Math.cos(index / 4) * 6),
    vanishing: Math.max(0, 90 - index),
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
export const soldByCategory = [...new Set(products.map(product => product.category))]
  .map(category => ({
    key: category.toLowerCase(),
    label: category,
    value: products.filter(product => product.category === category).reduce((sum, product) => sum + product.sold, 0),
  }))
  .sort((first, second) => second.value - first.value);
