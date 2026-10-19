import { useState } from "react"
import { usePaneLayout } from "./use-pane-layout"
import { BarGauge, Card, CardContent, Chart, ChartLegend, Checkbox, Label, DashboardGrid, DashboardPanel,
  Disclosure, Meter, Progress, Sparkline, Stat, StatValue, StatFoot, TimeRangeControl, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, type ChartProps, type ChartSeries, type ChartSummaryStat } from "@momoi-labs/kiso-react"

const start = Date.UTC(2026, 8, 12, 9)
const bounds = { from: start, to: start + 179 * 10_000 }
const series: ChartSeries[] = [
  { key: "user", label: "User", slot: 1 },
  { key: "system", label: "System", slot: 2 },
  { key: "iowait", label: "I/O wait", slot: 3 },
  { key: "steal", label: "Steal", slot: 4 },
  { key: "other", label: "Other", slot: 5 },
  { key: "nice", label: "Nice", slot: 6 },
  { key: "irq", label: "IRQ", slot: 7 },
  { key: "softirq", label: "Soft IRQ", slot: 8 },
  { key: "guest", label: "Guest", slot: 9 },
]
const data = Array.from({ length: 180 }, (_, index) => ({
  timestamp: start + index * 10_000,
  values: {
    user: (index > 70 && index < 80) || index === 90 ? null : Math.round(25 + Math.sin(index / 8) * 10 + (index > 105 && index < 120 ? 22 : 0)),
    system: index > 70 && index < 80 ? null : Math.round(12 + Math.sin(index / 6) * 5),
    iowait: index > 70 && index < 80 ? null : index > 105 && index < 120 ? 15 : 3,
    steal: index > 70 && index < 80 ? null : 2,
    other: index > 70 && index < 80 ? null : 1,
    nice: index > 70 && index < 80 ? null : Math.round(3 + Math.cos(index / 9) * 2),
    irq: index > 70 && index < 80 ? null : 1,
    softirq: index > 70 && index < 80 ? null : Math.round(2 + Math.sin(index / 5)),
    guest: index > 70 && index < 80 ? null : index > 140 ? 4 : 0,
  },
}))
const time = (value: number) => new Date(value).toISOString().slice(11, 19)
const percent = (value: number) => `${value.toFixed(1)}%`
const summaryColumns: ChartSummaryStat[] = ["min", "max", "avg", "current", "p50", "p75", "p90", "p95", "p99"]

function ChartOptionsDemo() {
  const [variant, setVariant] = useState<NonNullable<ChartProps["variant"]>>("line")
  const [highlight, setHighlight] = useState<string | null>(null)
  const [summary, setSummary] = useState<ChartSummaryStat[]>(["min", "max", "avg", "current"])
  const toggleColumn = (column: ChartSummaryStat, checked: boolean) =>
    setSummary(current => summaryColumns.filter(item => item === column ? checked : current.includes(item)))
  const [range, setRange] = useState(bounds)
  const filtered = data.filter(sample => sample.timestamp >= range.from && sample.timestamp <= range.to)
  const code = `<Chart
  label="CPU by state (%)"
  data={samples}
  series={series}
  variant="${variant}"${highlight ? `
  highlightSeries="${highlight}"` : ""}
  summary={${JSON.stringify(summary).replaceAll(",", ", ")}}
/>`
  return <div className="stack">
    <div className="demo-row">
      <div className="field"><span id="chart-option-variant">Variant</span>
        <Select value={variant} onValueChange={value => { if (value === "line" || value === "stacked-area") setVariant(value) }}>
          <SelectTrigger aria-labelledby="chart-option-variant"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="line">line</SelectItem><SelectItem value="stacked-area">stacked-area</SelectItem></SelectContent>
        </Select></div>
      <div className="field"><span id="chart-option-highlight">Highlight series</span>
        <Select value={highlight ?? "none"} onValueChange={value => setHighlight(value === "none" ? null : value)}>
          <SelectTrigger aria-labelledby="chart-option-highlight"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">None</SelectItem>{series.map(item => <SelectItem key={item.key} value={item.key}>{item.key}</SelectItem>)}</SelectContent>
        </Select></div>
    </div>
    <fieldset className="field"><legend>Legend columns</legend>
      <div className="demo-row">{summaryColumns.map(column => <span className="check-label" key={column}>
        <Checkbox id={`chart-option-summary-${column}`} checked={summary.includes(column)}
          disabled={summary.length === 1 && summary[0] === column}
          onCheckedChange={next => toggleColumn(column, next === true)} />
        <Label htmlFor={`chart-option-summary-${column}`}>{column}</Label>
      </span>)}</div>
    </fieldset>
    <p className="muted t-label">Layout and legend follow Appearance, under Charts. Split applies to line charts only.</p>
    <TimeRangeControl bounds={bounds} value={range} onValueChange={setRange} />
    <Card><CardContent><Chart label="CPU by state (%)" data={filtered} series={series}
      variant={variant} highlightSeries={highlight}
      onHighlightSeriesChange={setHighlight} summary={summary} min={0} max={100} formatTime={time} formatValue={percent} onRangeSelect={setRange} /></CardContent></Card>
    <pre><code>{code}</code></pre>
  </div>
}

export function MetricsDemo({ component = "chart" }: { component?: string }) {
  const [range, setRange] = useState(bounds)
  const layout = usePaneLayout("kiso-gallery-dashboard-layout")
  const filtered = data.filter(sample => sample.timestamp >= range.from && sample.timestamp <= range.to)
  if (component === "chart") return <ChartOptionsDemo />
  if (component === "meter") return <div className="stack">
    <Meter label="Connections" value={64} max={100} />
    <Meter label="No connections" value={0} max={100} />
    <Meter label="At capacity" value={100} max={100} />
    <Meter label="Over capacity" value={120} max={100} />
    <Meter label="Unavailable collector" value={null} />
    <Progress label="Collection" value={42} />
    <Progress label="Starting collector" />
  </div>
  if (component === "bar-gauge") return <BarGauge label="Memory by process (MiB)" max={1024}
    formatValue={value => `${value} MiB`} rows={[
      { key: "postgres", label: "PostgreSQL", value: 768 },
      { key: "probe", label: "pg-probe", value: 96 },
      { key: "worker", label: "Worker", value: 0 },
      { key: "missing", label: "Disconnected", value: null },
    ]} />
  if (component === "disclosure") return <div className="stack">
    <Disclosure summary="Operating system" open><p>CPU, memory, and disk metrics.</p></Disclosure>
    <Disclosure summary="Database"><p>Connections and queries.</p></Disclosure>
  </div>
  if (component === "time-range-control") return <div className="stack">
    <TimeRangeControl bounds={bounds} value={range} onValueChange={setRange} />
    <TimeRangeControl label="Unavailable range" bounds={bounds} value={bounds} onValueChange={() => {}} disabled />
    <p>{filtered.length} samples in the selected window.</p>
  </div>
  if (component === "chart-legend") return <div className="stack">
    <ChartLegend variant="inline" label="CPU (%): current" data={data} series={series} formatValue={percent} />
    <Disclosure summary="Other legend layouts">
    <ChartLegend label="CPU (%): summary" data={data} series={series} formatValue={percent} />
    <ChartLegend variant="sidebar" label="CPU (%): inspected sample" data={data} series={series}
      activeTimestamp={data[110]!.timestamp} formatTime={time} formatValue={percent} />
    </Disclosure>
  </div>
  return <div className="stack">
    <TimeRangeControl bounds={bounds} value={range} onValueChange={setRange} />
    <Disclosure summary="Operating system" open>
      <DashboardGrid aria-label="Operating system metrics" {...layout}>
        <DashboardPanel id="cpu" title="CPU by state (%)" size={8} min={4} expandable>
          <Chart label="CPU by state (%)" data={filtered} series={series} variant="stacked-area" layout="compact" legend="inline"
            formatTime={time} formatValue={percent} min={0} max={100} syncId="metrics-demo" onRangeSelect={setRange} />
        </DashboardPanel>
        <DashboardPanel id="cpu-user" title="CPU user" size={4} min={3}>
          <Stat><StatValue>{filtered.at(-1)?.values.user == null ? "Not collected" : percent(filtered.at(-1)!.values.user!)}</StatValue>
          <Sparkline values={filtered.map(sample => sample.values.user)} height={48} min={0} max={100} tone="primary" label="CPU user trend in the selected window" />
          <StatFoot>Selected window, gaps indicate missing samples</StatFoot></Stat>
        </DashboardPanel>
        <DashboardPanel id="connections" title="Connections" size={4} min={3} newRow>
          <Meter label="Connections" value={64} max={100} />
        </DashboardPanel>
        <DashboardPanel id="memory" title="Memory by process" size={8} min={4}>
          <MetricsDemo component="bar-gauge" />
        </DashboardPanel>
        <DashboardPanel id="single-sample" title="Single sample (%)" size={6} min={4} newRow expandable>
          <Chart label="Single sample (%)" data={[data[0]!]} series={[series[0]!]} legend="inline"
            formatTime={time} formatValue={percent} />
        </DashboardPanel>
        <DashboardPanel id="empty-window" title="Empty window (%)" size={6} min={4} expandable>
          <Chart label="Empty window (%)" data={[]} series={[series[0]!]} legend="inline"
            formatTime={time} formatValue={percent} />
        </DashboardPanel>
        <DashboardPanel id="unavailable" title="Unavailable collector (%)" size={12} min={6} newRow expandable>
          <Chart label="Unavailable collector (%)" data={data.map(sample => ({ ...sample, values: { user: null } }))}
            series={[series[0]!]} legend="inline" formatTime={time} formatValue={percent} />
          <p>Sparkline with a collection gap</p>
          <Sparkline values={[10, 20, 15, null, null, 35, 20, 25]} height={28} label="CPU trend with a gap" />
        </DashboardPanel>
      </DashboardGrid>
    </Disclosure>
  </div>
}
