import type { AppearanceSettings, BorderStyle, CornerStyle, CornerMarks, MarkSize, Size } from "./appearance-settings";

// Thumbnail geometry stays independent of the gallery's live component scopes.
export function PanelPreview({ border = "solid", corner = "square", marks = "none", size = "medium", shadow = "auto", markSize = "medium", clearance = "normal", detail = "medium" }: {
  shadow?: AppearanceSettings["shadowStyle"]; border?: BorderStyle; corner?: CornerStyle; marks?: CornerMarks; size?: Size;
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
    {(shadow === "hard" || shadow === "soft") && <path d={contour} transform={`translate(${border === "rail" ? -3 : border === "base" ? 0 : 3} ${border === "rail" ? 0 : 3})`} fill="var(--color-shadow-contact)" stroke="none" style={{ filter: shadow === "soft" ? "blur(2px)" : undefined }} />}
    {shadow === "auto" && border === "offset" && <path d={contour} transform="translate(3 3)" className="appearance-preview-shadow" />}
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

export function BackgroundPreview({ background, strength = "visible", tone = "theme" }: {
  background: AppearanceSettings["backgroundStyle"];
  strength?: AppearanceSettings["backgroundStrength"];
  tone?: AppearanceSettings["paperTone"];
}) {
  return <span className="appearance-background-sample" data-background-style={background} data-background-strength={strength} data-preview-tone={tone} aria-hidden="true">
  </span>;
}
