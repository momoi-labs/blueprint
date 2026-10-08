import { useState } from "react"
import { DetailSelect, TerminalIcon, type ChartStyle } from "@momoi-labs/kiso-react"
import { chartStyleOptions } from "./chart-style-options"

const definitions = [
  { value: "image", label: "Container image", icon: <TerminalIcon />,
    illustration: <div className="detail-select-demo-flow" role="img" aria-label="Pull image, run container, serve HTTP"><span>Image</span><span aria-hidden="true">↓</span><span>Container</span><span aria-hidden="true">↓</span><span>HTTP</span></div>,
    description: <><p>Use an already published image, such as <code>nginx:alpine</code>.</p><p>The service pulls the image, runs one container and exposes its configured port.</p><a href="https://hub.docker.com/_/nginx" target="_blank" rel="noreferrer">View an example image</a></> },
  { value: "source", label: "Source repository", icon: <TerminalIcon />,
    illustration: <div className="detail-select-demo-flow" role="img" aria-label="Clone source, build image, run container"><span>Source</span><span aria-hidden="true">↓</span><span>Build</span><span aria-hidden="true">↓</span><span>Container</span></div>,
    description: <><p>Build an image from your repository, then run the resulting container.</p><p>The source must include its build instructions. Deployments can follow a selected branch.</p></> },
  { value: "vm", label: "Virtual machine", icon: <TerminalIcon />,
    illustration: <div className="detail-select-demo-flow">VM</div>, description: <p>Start a virtual machine from an image. Use this when the service needs its own operating system.</p> },
]

export function DetailSelectDemo() {
  const [definition, setDefinition] = useState("image")
  const [style, setStyle] = useState<ChartStyle>("solid")
  return <div className="stack">
    <DetailSelect label="Definition" value={definition} onValueChange={setDefinition} options={definitions} />
    <p className="muted t-label" role="status">Selected definition: {definition}</p>
    <DetailSelect label="Chart style example" value={style} onValueChange={value => setStyle(value as ChartStyle)} options={chartStyleOptions} />
    <DetailSelect label="Unavailable definition" defaultValue="image" options={definitions} disabled />
    <p className="muted t-label">Open the selector to compare illustrations and read the details. Links open without changing the selection.</p>
  </div>
}
