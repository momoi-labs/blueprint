/* Non-box contours need a separate paint layer. Filtering this empty layer
   leaves panel content, controls and translucent fills unchanged. The second
   span paints the Pixel fill as one polygon. */
export function PanelShadow() {
  return <span className="panel-shadow" aria-hidden="true"><span><span /></span><span /></span>
}
