import { useId, useState } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertContent, AlertDescription, AlertTitle } from "@momoi-labs/kiso-react";
import { DemoSettings } from "./demo-settings";

export function AlertDemo() {
  const id = useId();
  const [appearance, setAppearance] = useState<"tinted" | "rail">("tinted");
  const [severity, setSeverity] = useState<"info" | "success" | "warning" | "error">("info");
  const SeverityIcon = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX }[severity];
  return <div className="stack">
    <DemoSettings title="Alert">
      <div className="field"><label htmlFor={`${id}-appearance`}>Appearance</label>
        <select id={`${id}-appearance`} className="select" value={appearance} onChange={event => setAppearance(event.target.value as typeof appearance)}>
          <option value="tinted">Tinted</option><option value="rail">Start border</option>
        </select>
      </div>
      <div className="field"><label htmlFor={`${id}-severity`}>Severity</label>
        <select id={`${id}-severity`} className="select" value={severity} onChange={event => setSeverity(event.target.value as typeof severity)}>
          <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option>
        </select>
      </div>
    </DemoSettings>
    <Alert variant={severity} appearance={appearance} role="note" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <SeverityIcon className="icon" aria-hidden="true" />
      <AlertContent>
        <AlertTitle id={`${id}-title`}>{severity[0].toUpperCase() + severity.slice(1)}</AlertTitle>
        <AlertDescription id={`${id}-description`}>Review the configuration and its effect on concurrent operations.</AlertDescription>
      </AlertContent>
    </Alert>
  </div>;
}
