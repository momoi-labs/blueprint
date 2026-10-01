import { useId, useState } from "react";
import { Alert, AlertContent, AlertDescription, AlertTitle } from "@momoi-labs/kiso-react";
import { DemoSettings } from "./demo-settings";

export function AlertDemo() {
  const id = useId();
  const [appearance, setAppearance] = useState<"tinted" | "rail">("tinted");
  const [severity, setSeverity] = useState<"info" | "success" | "warning" | "error">("info");
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
      <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
        {severity === "warning" ? <><path d="M8 2 15 14H1Z" /><path d="M8 6v4m0 1v1" /></> : <>
          <circle cx="8" cy="8" r="6" />
          <path d={severity === "success" ? "m4 8 3 3 5-6" : severity === "error" ? "m5 5 6 6m0-6-6 6" : "M8 7v5M8 4v1"} />
        </>}
      </svg>
      <AlertContent>
        <AlertTitle id={`${id}-title`}>{severity[0].toUpperCase() + severity.slice(1)}</AlertTitle>
        <AlertDescription id={`${id}-description`}>Review the configuration and its effect on concurrent operations.</AlertDescription>
      </AlertContent>
    </Alert>
  </div>;
}
