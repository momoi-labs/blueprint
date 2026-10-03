import { useId } from "react";
import type { AppearanceSettings, BorderStyle, CornerStyle, CornerMarks, MarkSize, Size } from "./appearance-settings";

// Thumbnail geometry stays independent of the gallery's live component scopes.
export function PanelPreview({ border = "solid", corner = "square", marks = "none", size = "medium", markSize = "medium", clearance = "normal", detail = "medium" }: {
  border?: BorderStyle; corner?: CornerStyle; marks?: CornerMarks; size?: Size;
  markSize?: MarkSize; clearance?: AppearanceSettings["markClearance"]; detail?: MarkSize;
}) {
  const inkScale = { small: .7, medium: 1, large: 1.4 }[detail];
  const scale = { off: 0, small: .5, medium: 1, large: 1.5 }[size];
  const r = (corner === "pixel" ? 6 : 8) * scale;
  const step = r / 3;
  const contour = border === "manga" ? "M17 15 63 12 65 42 15 43Z"
    : corner === "pixel" ? `M${16 + r} 14H${64 - r}v${step}h${r - step}v${r - step}H64V${42 - r}h${-step}v${r - step}h${step - r}V42H${16 + r}v${-step}h${step - r}v${step - r}H16V${14 + r}h${step}v${step - r}h${r - step}Z`
    : corner === "rounded" ? `M${16 + r} 14H${64 - r}q${r} 0 ${r} ${r}V${42 - r}q0 ${r} ${-r} ${r}H${16 + r}q${-r} 0 ${-r} ${-r}V${14 + r}q0 ${-r} ${r} ${-r}Z`
    : corner === "asym" ? `M${16 + r} 14H64V${42 - r}q0 ${r} ${-r} ${r}H16V${14 + r}q0 ${-r} ${r} ${-r}Z`
    : "M16 14H64V42H16Z";
  const length = { small: 3, medium: 5, large: 7 }[markSize];
  const gap = clearance === "sheet" ? 6 : 2;
  return <svg className="appearance-panel-preview" viewBox="0 0 80 56" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
    {border === "offset" && <path d={contour} transform="translate(3 3)" className="appearance-preview-shadow" />}
    <path d={border === "brush" ? "M16 14H64V42H16Z" : contour} className="appearance-preview-paper" stroke={border === "none" || border === "brush" ? "none" : undefined}
      strokeWidth={border === "manga" ? 2.5 * inkScale : undefined} strokeDasharray={border === "dash" ? "4 3" : undefined} />
    {border === "brush" && <path fill="currentColor" strokeWidth={(inkScale - .7) * 2} d="M14 13 66 14 64 16 17 15 16 43 14 42ZM63 13 66 12 65 44 63 41ZM14 41 65 40 67 43 16 44Z" />}
    {border === "rail" && <path d="M17 15V41" strokeWidth="3" />}
    {border === "base" && <path d="M17 41H63" strokeWidth="3" />}
    {border === "double" && <path d={contour} transform="translate(4 4) scale(.9 .85)" />}
    {border === "bevel" && <path d="M19 39V17H61" />}
    <path className="appearance-preview-text" d="M25 25H53M25 32H43" strokeWidth="3" />
    {border !== "none" && marks !== "none" && [[16, 14, 1, 1], [64, 14, -1, 1], [16, 42, 1, -1], [64, 42, -1, -1]].map(([x, y, sx, sy], index) =>
      <g key={index} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
        {marks === "ticks" && <path d={`M${-gap - length} 0h${length}M0 ${-gap - length}v${length}`} />}
        {marks === "diagonal" && <path d={`M${-gap - length} ${-gap - length}l${length} ${length}`} />}
        {marks === "brackets" && <path d={`M${-gap} ${length - gap}v${-length}h${length}`} />}
        {marks === "arcs" && <path d={`M${-gap} ${length - gap}q0 ${-length} ${length} ${-length}`} />}
        {marks === "dots" && <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />}
      </g>)}
  </svg>;
}

export function ScopePreview({ scope, marks = false }: { scope: AppearanceSettings["frameScope"]; marks?: boolean }) {
  const panels = scope !== "outer";
  const controls = scope === "all";
  return <svg className="appearance-scope-preview" viewBox="0 0 104 72" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <rect className="appearance-preview-paper" x="8" y="8" width="88" height="56" rx={marks ? 0 : 6} />
    <path className="appearance-preview-text" d="M17 18h30" strokeWidth="3" />
    {[17, 56].map(x => <g key={x}>
      <rect className="appearance-scope-panel" x={x} y="26" width="31" height="29" rx={!marks && panels ? 4 : 0} stroke={!marks && !panels ? "none" : undefined} />
      <rect x={x + 5} y="36" width="21" height="10" rx={!marks && controls ? 3 : 0} strokeWidth={!marks && controls ? 2 : 1} />
      <path className="appearance-preview-text" d={`M${x + 9} 41h10`} />
      {marks && panels && <path className="appearance-scope-accent" d={`M${x - 3} 30v-7h7m20 35h10v-7`} />}
      {marks && controls && <path className="appearance-scope-accent" d={`M${x + 7} 41v-3h3m11 3v3h-3`} />}
    </g>)}
    {marks ? <path className="appearance-scope-accent" d="M3 14V3h11m76 0h11v11M3 58v11h11m76 0h11V58" />
      : <rect className="appearance-scope-accent" x="8" y="8" width="88" height="56" rx="6" />}
  </svg>;
}

export function BackgroundPreview({ background, strength = "visible", fill, tone = "theme" }: {
  background: AppearanceSettings["backgroundStyle"];
  strength?: AppearanceSettings["backgroundStrength"];
  fill?: AppearanceSettings["panelFill"];
  tone?: AppearanceSettings["paperTone"];
}) {
  return <span className="appearance-background-sample" data-background-style={background} data-background-strength={strength} data-preview-fill={fill} data-preview-tone={tone} aria-hidden="true">
    {fill && <span className="appearance-fill-panel"><span className="appearance-fill-title" /><span className="appearance-fill-field" /></span>}
  </span>;
}

export function PlacementPreview({ placement }: { placement: AppearanceSettings["backgroundPlacement"] }) {
  const id = useId();
  return <svg className="appearance-scope-preview" viewBox="0 0 104 72" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <defs><pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" opacity=".3" /></pattern></defs>
    <rect x="1" y="1" width="102" height="70" fill={placement === "inside" ? "var(--color-background)" : `url(#${id})`} stroke="none" />
    <rect className="appearance-preview-paper" x="14" y="12" width="76" height="48" />
    {placement !== "outside" && <rect x="14" y="12" width="76" height="48" fill={`url(#${id})`} stroke="none" />}
    <path d="M26 26h32M26 33h22" strokeWidth="2" />
  </svg>;
}
