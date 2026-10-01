import { useState } from "react";
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@momoi-labs/kiso-react";

export function InlineFieldsDemo() {
  const [ram, setRam] = useState("4");
  const [os, setOs] = useState("linux");
  const [controlSize, setControlSize] = useState<"sm" | "md" | "lg">("md");
  return <div className="stack">
    <label className="field">Control size<select className="select" value={controlSize} onChange={event => setControlSize(event.target.value as typeof controlSize)}><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></label>
    <div className="demo-grid">
      <Select value={os} onValueChange={setOs}>
        <FormField label="OS" layout="inline" controlSize={controlSize}>
          <SelectTrigger><SelectValue /></SelectTrigger>
        </FormField>
        <SelectContent><SelectItem value="linux">GNU/Linux</SelectItem><SelectItem value="windows">Windows</SelectItem><SelectItem value="macos">macOS</SelectItem></SelectContent>
      </Select>
      <FormField label="RAM" layout="inline" suffix="GB" controlSize={controlSize} type="number" min={1} value={ram} onChange={event => setRam(event.target.value)} error={Number(ram) < 1 ? "Enter at least 1 GB." : undefined} leading={<svg className="icon" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="8" /><path d="M5 6v4M8 6v4M11 6v4" /></svg>} />
      <FormField label="Connections" layout="inline" controlSize={controlSize} type="number" defaultValue={100} min={1} />
      <FormField label="Managed value" layout="inline" controlSize={controlSize} defaultValue="Inherited" disabled />
    </div>
  </div>;
}
