import { useId } from "react"
import { type ChartFill, type ChartLayout, type ChartLegendPlacement, type ChartLine, type ChartStyle, type ChartTreatment, type DetailSelectOption } from "@momoi-labs/kiso-react"

function StyleIcon({ style }: { style: ChartStyle }) {
  return <svg className="icon icon-sm" viewBox="0 0 16 16">
    {style === "pixel" ? <path d="M1 12h4V8h5V4h5" />
      : style === "rounded" ? <path d="M1 12c3 0 3-8 6-8s4 8 8 0" />
      : <path d="M1 12 5 7l5 2 5-5" />}
    {style === "halftone" && <g fill="currentColor" stroke="none"><circle cx="5" cy="12" r=".7" /><circle cx="8" cy="12" r=".7" /><circle cx="11" cy="12" r=".7" /><circle cx="14" cy="12" r=".7" /></g>}
  </svg>
}

function ChartStylePreview({ style, label }: { style: ChartStyle; label: string }) {
  const id = useId()
  const solid = "M4 54L16 47L28 51L40 36L52 42M72 32L84 39L96 21L108 27L124 10"
  const rounded = "M4 54C8 51 12 47 16 47C20 47 24 51 28 51C32 51 36 36 40 36C44 36 48 40 52 42M72 32C76 34 80 39 84 39C88 39 92 21 96 21C100 21 104 27 108 27C113 27 119 16 124 10"
  const pixel = "M4 54h4v-3h4v-2h4v-2h4v2h4v2h4v-5h4v-5h4v-5h4v2h4v2h4v2h4M72 32h4v2h4v3h4v2h4v-6h4v-6h4v-6h4v2h4v2h4v2h4v-4h4v-4h4v-5h4v-4"
  return <svg viewBox="0 0 132 64" width="100%" role="img" aria-label={`${label} preview with a missing sample`}>
    {style === "halftone" && <><defs><pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="var(--color-primary)" /></pattern></defs>
      <path d="M4 60V54L16 47L28 51L40 36L52 42V60ZM72 60V32L84 39L96 21L108 27L124 10V60Z" fill={`url(#${id})`} opacity=".3" /></>}
    <path d={style === "rounded" ? rounded : style === "pixel" ? pixel : solid} fill="none" stroke="var(--color-primary)"
      strokeWidth={style === "pixel" || style === "rounded" ? 2 : 1.5} strokeLinecap={style === "rounded" ? "round" : "butt"} />
  </svg>
}

export const chartStyleOptions: readonly (DetailSelectOption & { value: ChartStyle })[] = [
  { value: "solid", label: "Solid", description: <><p>Thin, continuous lines connect the collected samples. The current treatment for charts.</p><a href="https://github.com/momoi-labs/blueprint/blob/main/kiso/docs/components/chart.md" target="_blank" rel="noreferrer">Read chart behavior</a></> },
  { value: "pixel", label: "Pixel", description: <><p>Small steps follow the data path, with square markers and crisp edges. Sample positions stay fixed.</p><p>Thin gauges use square ends so the measurement remains readable.</p></> },
  { value: "halftone", label: "Halftone", description: <><p>A continuous line sits above a dotted area. Gauges use the same dot screen without changing their length.</p><p>Series keep their colors. Missing samples stay blank.</p></> },
  { value: "rounded", label: "Rounded", description: <><p>Smooth curves pass through each sample without overshooting. Line ends, sample markers and gauge ends are round.</p><p>Stacked boundaries stay straight to preserve their contributions.</p></> },
].map(option => ({ ...option, value: option.value as ChartStyle, icon: <StyleIcon style={option.value as ChartStyle} />,
  illustration: <ChartStylePreview style={option.value as ChartStyle} label={option.label} /> }))

const linePaths: Record<ChartLine, string> = {
  straight: "M4 54L16 47L28 51L40 36L52 42M72 32L84 39L96 21L108 27L124 10",
  curved: "M4 54C8 51 12 47 16 47C20 47 24 51 28 51C32 51 36 36 40 36C44 36 48 40 52 42M72 32C76 34 80 39 84 39C88 39 92 21 96 21C100 21 104 27 108 27C113 27 119 16 124 10",
  stepped: "M4 54h4v-3h4v-2h4v-2h4v2h4v2h4v-5h4v-5h4v-5h4v2h4v2h4v2h4M72 32h4v2h4v3h4v2h4v-6h4v-6h4v-6h4v2h4v2h4v2h4v-4h4v-4h4v-5h4v-4",
}

function FillPattern({ id, fill }: { id: string; fill: ChartFill }) {
  if (fill === "scanlines") return <pattern id={id} width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="var(--color-primary)" /></pattern>
  return <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
    {fill === "squares" ? <rect width="2" height="2" fill="var(--color-primary)" /> : <circle cx="1" cy="1" r=".8" fill="var(--color-primary)" />}
  </pattern>
}

function TreatmentPreview({ line, fill, label }: ChartTreatment & { label: string }) {
  const id = useId()
  const textured = fill === "dots" || fill === "squares" || fill === "scanlines"
  return <svg viewBox="0 0 132 64" width="100%" role="img" aria-label={`${label} preview with a missing sample`}>
    {textured && <defs><FillPattern id={id} fill={fill} /></defs>}
    {fill !== "none" && <path d="M4 60V54L16 47L28 51L40 36L52 42V60ZM72 60V32L84 39L96 21L108 27L124 10V60Z"
      fill={textured ? `url(#${id})` : "var(--color-primary)"} opacity={textured ? ".3" : ".2"} />}
    <path d={linePaths[line]} fill="none" stroke="var(--color-primary)"
      strokeWidth={line === "straight" ? 1.5 : 2} strokeLinecap={line === "curved" ? "round" : "butt"} />
  </svg>
}

function LineIcon({ line }: { line: ChartLine }) {
  return <svg className="icon icon-sm" viewBox="0 0 16 16">
    <path d={line === "stepped" ? "M1 12h4V8h5V4h5" : line === "curved" ? "M1 12c3 0 3-8 6-8s4 8 8 0" : "M1 12 5 7l5 2 5-5"} />
  </svg>
}

function FillIcon({ fill }: { fill: ChartFill }) {
  return <svg className="icon icon-sm" viewBox="0 0 16 16">
    <path d="M1 12 5 7l5 2 5-5" />
    <g fill="currentColor" stroke="none">
      {fill === "tint" && <path d="M1 12 5 7l5 2 5-5v10H1Z" opacity=".3" />}
      {fill === "dots" && [4, 8, 12].map(x => <circle key={x} cx={x} cy="13" r=".7" />)}
      {fill === "squares" && [3, 7, 11].map(x => <rect key={x} x={x} y="12" width="1.6" height="1.6" />)}
      {fill === "scanlines" && <><rect x="2" y="11" width="12" height=".8" /><rect x="2" y="13.5" width="12" height=".8" /></>}
    </g>
  </svg>
}

export const chartLineOptions: readonly (DetailSelectOption & { value: ChartLine })[] = ([
  { value: "straight", label: "Straight", description: <p>Thin, straight segments connect the collected samples. Gauges have slightly rounded ends.</p> },
  { value: "stepped", label: "Stepped", description: <><p>Small steps follow the data path, with square markers and crisp edges. Sample positions stay fixed.</p><p>Gauges use square ends.</p></> },
  { value: "curved", label: "Curved", description: <><p>Smooth curves pass through each sample without overshooting. Line ends, markers and gauge ends are round.</p><p>Stacked boundaries stay straight to preserve their contributions.</p></> },
] as const).map(option => ({ ...option, icon: <LineIcon line={option.value} />,
  illustration: <TreatmentPreview line={option.value} fill="none" label={option.label} /> }))

export const chartFillOptions: readonly (DetailSelectOption & { value: ChartFill })[] = ([
  { value: "none", label: "None", description: <p>Only the line. Stacked areas keep a light tint, since a stack needs an area.</p> },
  { value: "dots", label: "Dots", description: <p>A dot screen under each line and on the empty part of gauges. Values stay solid.</p> },
  { value: "tint", label: "Tint", description: <p>A light wash of the series color under each line. The easiest fill to read in stacks. Gauges keep a plain track.</p> },
  { value: "squares", label: "Squares", description: <p>A screen of small squares. Pairs well with the stepped line.</p> },
  { value: "scanlines", label: "Scanlines", description: <p>Thin horizontal rules, like a terminal screen.</p> },
] as const).map(option => ({ ...option, icon: <FillIcon fill={option.value} />,
  illustration: <TreatmentPreview line="straight" fill={option.value} label={option.label} /> }))

const wave = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y + h * .7}L${x + w * .25} ${y + h * .4}L${x + w * .5} ${y + h * .55}L${x + w * .75} ${y + h * .15}L${x + w} ${y + h * .3}`

function LayoutPreview({ layout, label }: { layout: ChartLayout; label: string }) {
  const lanes = layout === "split" ? [0, 1, 2].map(lane => ({ y: 6 + lane * 19, h: 14 })) : [{ y: 6, h: layout === "compact" ? 30 : 46 }]
  return <svg viewBox="0 0 132 64" width="100%" role="img" aria-label={`${label} layout preview`}>
    {lanes.map(({ y, h }, index) => <g key={index}>
      <path d={`M4 ${y + h}H128`} stroke="var(--color-border)" />
      <path d={wave(4, y, 124, h)} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
    </g>)}
  </svg>
}

function LegendPreview({ legend, label }: { legend: ChartLegendPlacement; label: string }) {
  const plotWidth = legend === "sidebar" ? 84 : 124
  return <svg viewBox="0 0 132 64" width="100%" role="img" aria-label={`${label} legend preview`}>
    <path d={wave(4, 4, plotWidth, legend === "sidebar" ? 52 : 30)} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
    <g fill="var(--color-muted-foreground)">
      {legend === "sidebar" && [8, 20, 32, 44].map(y => <rect key={y} x="96" y={y} width="32" height="4" rx="1" />)}
      {legend === "inline" && [4, 46, 88].map(x => <rect key={x} x={x} y="46" width="36" height="4" rx="1" />)}
      {legend === "table" && [40, 48, 56].map(y => <rect key={y} x="4" y={y} width="124" height="4" rx="1" opacity={y === 40 ? 1 : .6} />)}
    </g>
  </svg>
}

export const chartLayoutOptions: readonly (DetailSelectOption & { value: ChartLayout })[] = ([
  { value: "standard", label: "Standard", description: <p>One 200-pixel plot holds every series.</p> },
  { value: "compact", label: "Compact", description: <p>One 165-pixel plot with tighter spacing, for dense dashboards.</p> },
  { value: "split", label: "Split", description: <><p>Each series gets its own labelled lane on one shared scale.</p><p>Stacked charts keep one plot, since a stack needs a common total.</p></> },
] as const).map(option => ({ ...option, illustration: <LayoutPreview layout={option.value} label={option.label} /> }))

export const chartLegendOptions: readonly (DetailSelectOption & { value: ChartLegendPlacement })[] = ([
  { value: "table", label: "Table", description: <p>Min, max, average and current values below the plot.</p> },
  { value: "inline", label: "Inline", description: <p>Current values in a wrapping row below the plot.</p> },
  { value: "sidebar", label: "Sidebar", description: <p>Current values beside the plot, and the inspected instant on hover. Moves below the plot when narrow.</p> },
] as const).map(option => ({ ...option, illustration: <LegendPreview legend={option.value} label={option.label} /> }))
