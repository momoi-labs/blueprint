import { useId } from "react"
import { type ChartStyle, type DetailSelectOption } from "@momoi-labs/kiso-react"

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
