import { useId, useState } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertContent, AlertDescription, AlertDetails, AlertTitle, Button, CodeBlock, type AlertTape } from "@momoi-labs/kiso-react";
import { tsx } from "./code-highlight";
import { useDemoOptions } from "./demo-settings";

type AlertOptions = {
  appearance: "tinted" | "rail" | "loud";
  variant: "info" | "success" | "warning" | "error";
  tape: AlertTape | "default";
  animated: "off" | "on";
  pulse: "off" | "on";
  placement: "inline" | "overlay";
  extras: "off" | "on";
};
export const alertShareOptions: Record<keyof AlertOptions, readonly string[]> = {
  appearance: ["tinted", "rail", "loud"],
  variant: ["info", "success", "warning", "error"],
  tape: ["default", "top", "start", "top-bottom", "start-end", "none"],
  animated: ["off", "on"],
  pulse: ["off", "on"],
  placement: ["inline", "overlay"],
  extras: ["off", "on"],
};

const copy = {
  info: ["Maintenance tonight", "storefront-demo will restart at 23:00 UTC for a minor upgrade."],
  success: ["Failover complete", "storefront-demo.-.replica-2 is now the primary."],
  warning: ["Replication lag", "storefront-demo.-.replica-2 is 48s behind the primary (limit 30s)."],
  error: ["Database error", "target: storefront-demo.-.primary: connection refused"],
} as const;

const details = "Since 10:46:12 UTC, 6 minutes. Affects reads on 3 branches.";
const iconName = { info: "Info", success: "CircleCheck", warning: "TriangleAlert", error: "CircleX" } as const;

export function alertSnippet({ appearance, variant, tape, animated, pulse, placement, extras }: AlertOptions) {
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on";
  const [title, description] = full ? copy[variant] : [variant[0].toUpperCase() + variant.slice(1), "Review the configuration and its effect on concurrent operations."];
  const props = [
    variant !== "info" && `variant="${variant}"`,
    appearance !== "tinted" && `appearance="${appearance}"`,
    loud && tape !== "default" && `tape="${tape}"`,
    loud && animated === "on" && "animated",
    loud && pulse === "on" && "pulse",
    placement !== "inline" && `placement="${placement}"`,
    !full && `role="note"`,
    full && "onDismiss={dismiss}",
  ].filter(Boolean);
  return [
    `<Alert${props.length ? " " + props.join(" ") : ""}>`,
    ...(loud ? [] : [`  <${iconName[variant]} className="icon" aria-hidden="true" />`]),
    "  <AlertContent>",
    `    <AlertTitle>${title}</AlertTitle>`,
    `    <AlertDescription>${description}</AlertDescription>`,
    "  </AlertContent>",
    ...(full ? ["  <AlertDetails>", `    <div className="alert-body">${details}</div>`, "  </AlertDetails>"] : []),
    "</Alert>",
  ].join("\n");
}

export function AlertDemo({ usage = false }: { usage?: boolean }) {
  const id = useId();
  const [options, setOptions] = useDemoOptions<AlertOptions>("alert", { appearance: "tinted", variant: "info", tape: "default", animated: "off", pulse: "off", placement: "inline", extras: "off" });
  const { appearance, variant: severity, tape, animated, pulse, placement, extras } = options;
  const [shown, setShown] = useState<number[]>(placement === "inline" ? [0] : []);
  const [next, setNext] = useState(1);
  const SeverityIcon = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX }[severity];
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on";
  const select = <K extends keyof AlertOptions>(key: K, label: string, values: readonly (readonly [AlertOptions[K], string])[], disabled = false) => (
    <div className="field"><label htmlFor={`${id}-${key}`}>{label}</label>
      <select id={`${id}-${key}`} className="select" value={options[key]} disabled={disabled} onChange={event => setOptions({ [key]: event.target.value } as Partial<AlertOptions>)}>
        {values.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
  const show = () => { setShown(current => placement === "overlay" ? [...current, next] : [next]); setNext(n => n + 1); };
  const [title, description] = full ? copy[severity] : [severity[0].toUpperCase() + severity.slice(1), "Review the configuration and its effect on concurrent operations."];
  return <div className="stack">
    <div className="demo-settings-inline demo-control-bar" role="group" aria-label="Alert options">
      {select("appearance", "Appearance", [["tinted", "Tinted"], ["rail", "Start border"], ["loud", "Loud"]])}
      {select("variant", "Severity", [["info", "Info"], ["success", "Success"], ["warning", "Warning"], ["error", "Error"]])}
      {select("tape", "Tape", [["default", "Default"], ["top", "Top"], ["start", "Start"], ["top-bottom", "Top and bottom"], ["start-end", "Start and end"], ["none", "None"]], !loud)}
      {select("animated", "Animated tape", [["off", "Off"], ["on", "On"]], !loud)}
      {select("pulse", "Icon pulse", [["off", "Off"], ["on", "On"]], !loud)}
      {select("placement", "Placement", [["inline", "Inline"], ["overlay", "Overlay"]])}
      {select("extras", "Details and dismiss", [["off", "Off"], ["on", "On"]], loud || placement === "overlay")}
    </div>
    {shown.map(key => (
      <Alert
        key={`${key}-${placement}`}
        variant={severity}
        appearance={appearance}
        tape={tape === "default" ? undefined : tape}
        animated={animated === "on"}
        pulse={pulse === "on"}
        placement={placement}
        role={full ? undefined : "note"}
        aria-labelledby={`${id}-${key}-title`}
        aria-describedby={`${id}-${key}-description`}
        onDismiss={full ? () => setShown(current => current.filter(item => item !== key)) : undefined}
      >
        {!loud && <SeverityIcon className="icon" aria-hidden="true" />}
        <AlertContent>
          <AlertTitle id={`${id}-${key}-title`}>{title}</AlertTitle>
          <AlertDescription id={`${id}-${key}-description`}>{description}</AlertDescription>
        </AlertContent>
        {full && <AlertDetails>
          <div className="alert-body">{details} <a href="#components/alert">Open the incident page</a>.</div>
        </AlertDetails>}
      </Alert>
    ))}
    {(placement === "overlay" || shown.length === 0) && <div className="demo-row">
      <Button onClick={show}>{placement === "overlay" ? (shown.length ? "Show another overlay alert" : "Show overlay alert") : "Show the alert again"}</Button>
    </div>}
    {usage && <details className="catalog-code">
      <summary>Usage example</summary>
      <CodeBlock code={alertSnippet(options)} highlight={tsx} title="React / TSX" copy="example" />
    </details>}
  </div>;
}
