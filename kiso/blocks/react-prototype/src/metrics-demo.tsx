import { useState } from "react"
import { BarGauge, Card, CardContent, Chart, ChartLegend, DashboardGrid, DashboardPanel,
  Disclosure, Meter, Progress, Sparkline, Stat, StatLabel, StatValue, StatFoot, TimeRangeControl, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, type ChartProps, type ChartSeries } from "@momoi-labs/kiso-react"

const start = Date.UTC(2026, 8, 12, 9)
const bounds = { from: start, to: start + 179 * 10_000 }
const series: ChartSeries[] = [
  { key: "user", label: "User", slot: 1 },
  { key: "system", label: "System", slot: 2 },
  { key: "iowait", label: "I/O wait", slot: 3 },
  { key: "steal", label: "Steal", slot: 4 },
  { key: "other", label: "Other", slot: 5 },
]
const data = Array.from({ length: 180 }, (_, index) => ({
  timestamp: start + index * 10_000,
  values: {
    user: (index > 70 && index < 80) || index === 90 ? null : Math.round(25 + Math.sin(index / 8) * 10 + (index > 105 && index < 120 ? 22 : 0)),
    system: index > 70 && index < 80 ? null : Math.round(12 + Math.sin(index / 6) * 5),
    iowait: index > 70 && index < 80 ? null : index > 105 && index < 120 ? 15 : 3,
    steal: index > 70 && index < 80 ? null : 2,
    other: index > 70 && index < 80 ? null : 1,
  },
}))
const time = (value: number) => new Date(value).toISOString().slice(11, 19)
const percent = (value: number) => `${value.toFixed(1)}%`

function ChartOptionsDemo() {
  const [variant, setVariant] = useState<NonNullable<ChartProps["variant"]>>("line")
  const [layout, setLayout] = useState<NonNullable<ChartProps["layout"]>>("compact")
  const [legend, setLegend] = useState<NonNullable<ChartProps["legend"]>>("inline")
  const [highlight, setHighlight] = useState<string | null>(null)
  const [range, setRange] = useState(bounds)
  const filtered = data.filter(sample => sample.timestamp >= range.from && sample.timestamp <= range.to)
  const code = `<Chart
  label="CPU by state (%)"
  data={samples}
  series={series}
  variant="${variant}"
  layout="${layout}"
  legend="${legend}"${highlight ? `
  highlightSeries="${highlight}"` : ""}
/>`
  return <div className="stack">
    <div className="demo-row">
      <div className="field"><span id="chart-option-variant">Variant</span>
        <Select value={variant} onValueChange={value => { if (value === "line" || value === "stacked-area") setVariant(value) }}>
          <SelectTrigger aria-labelledby="chart-option-variant"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="line">line</SelectItem><SelectItem value="stacked-area" disabled={layout === "split"}>stacked-area</SelectItem></SelectContent>
        </Select></div>
      <div className="field"><span id="chart-option-layout">Layout</span>
        <Select value={layout} onValueChange={value => { if (value === "standard" || value === "compact" || value === "split") setLayout(value) }}>
          <SelectTrigger aria-labelledby="chart-option-layout"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="compact">compact</SelectItem><SelectItem value="standard">standard</SelectItem><SelectItem value="split" disabled={variant === "stacked-area"}>split</SelectItem></SelectContent>
        </Select></div>
      <div className="field"><span id="chart-option-legend">Legend</span>
        <Select value={legend} onValueChange={value => { if (value === "inline" || value === "table" || value === "sidebar") setLegend(value) }}>
          <SelectTrigger aria-labelledby="chart-option-legend"><SelectValue /></SelectTrigger>
          <SelectContent>{["inline", "table", "sidebar"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select></div>
      <div className="field"><span id="chart-option-highlight">Highlight series</span>
        <Select value={highlight ?? "none"} onValueChange={value => setHighlight(value === "none" ? null : value)}>
          <SelectTrigger aria-labelledby="chart-option-highlight"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">None</SelectItem>{series.map(item => <SelectItem key={item.key} value={item.key}>{item.key}</SelectItem>)}</SelectContent>
        </Select></div>
    </div>
    <p className="muted t-label">Split separates series on a shared scale and requires line charts.</p>
    <TimeRangeControl bounds={bounds} value={range} onValueChange={setRange} />
    <Card><CardContent><Chart label="CPU by state (%)" data={filtered} series={series}
      variant={variant} layout={layout} legend={legend} highlightSeries={highlight}
      onHighlightSeriesChange={setHighlight} min={0} max={100} formatTime={time} formatValue={percent} /></CardContent></Card>
    <pre><code>{code}</code></pre>
  </div>
}

export function MetricsDemo({ component = "chart" }: { component?: string }) {
  const [range, setRange] = useState(bounds)
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
      <DashboardGrid>
        <DashboardPanel span={8}><Card><CardContent>
          <Chart label="CPU by state (%)" data={filtered} series={series} variant="stacked-area" layout="compact" legend="inline"
            formatTime={time} formatValue={percent} min={0} max={100} syncId="metrics-demo" />
        </CardContent></Card></DashboardPanel>
        <DashboardPanel span={4}><Card><Stat>
          <StatLabel>CPU user</StatLabel><StatValue>{filtered.at(-1)?.values.user == null ? "Not collected" : percent(filtered.at(-1)!.values.user!)}</StatValue>
          <Sparkline values={filtered.map(sample => sample.values.user)} height={48} min={0} max={100} tone="primary" label="CPU user trend in the selected window" />
          <StatFoot>Selected window, gaps indicate missing samples</StatFoot>
        </Stat></Card></DashboardPanel>
        <DashboardPanel span={4}><Card><CardContent><Meter label="Connections" value={64} max={100} /></CardContent></Card></DashboardPanel>
        <DashboardPanel span={8}><Card><CardContent><MetricsDemo component="bar-gauge" /></CardContent></Card></DashboardPanel>
        <DashboardPanel span={6}><Card><CardContent>
          <Chart label="Single sample (%)" data={[data[0]!]} series={[series[0]!]} legend="inline"
            formatTime={time} formatValue={percent} />
        </CardContent></Card></DashboardPanel>
        <DashboardPanel span={6}><Card><CardContent>
          <Chart label="Empty window (%)" data={[]} series={[series[0]!]} legend="inline"
            formatTime={time} formatValue={percent} />
        </CardContent></Card></DashboardPanel>
        <DashboardPanel span={12}><Card><CardContent>
          <Chart label="Unavailable collector (%)" data={data.map(sample => ({ ...sample, values: { user: null } }))}
            series={[series[0]!]} legend="inline" formatTime={time} formatValue={percent} />
          <p>Sparkline with a collection gap</p>
          <Sparkline values={[10, 20, 15, null, null, 35, 20, 25]} height={28} label="CPU trend with a gap" />
        </CardContent></Card></DashboardPanel>
      </DashboardGrid>
    </Disclosure>
  </div>
}
