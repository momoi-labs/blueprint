import { useId, useState } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertCode, AlertContent, AlertDetails, AlertEvidence, AlertHelp, AlertLabel, AlertLine, AlertMessage, AlertNote, Button, CodeBlock, type AlertTape } from "@momoi-labs/kiso-react";
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
  content: "simple" | "detailed" | "full";
};
export const alertShareOptions: Record<keyof AlertOptions, readonly string[]> = {
  appearance: ["tinted", "rail", "loud"],
  variant: ["info", "success", "warning", "error"],
  tape: ["default", "top", "start", "top-bottom", "start-end", "none"],
  animated: ["off", "on"],
  pulse: ["off", "on"],
  placement: ["inline", "overlay"],
  extras: ["off", "on"],
  content: ["simple", "detailed", "full", "short", "long", "rich"],
};

const diagnostics = {
  error: {
    label: "Error · Database unreachable", code: "db-unreachable", message: "Checkout cannot reach the primary database",
    help: "Fail over to replica-03.", action: "Fail over", source: "primary-replica-02.eu-west-1.internal:5432", since: "4 minutes ago, at 10:54:31",
    lines: [["10:54:31", "pool connect refused", "first failure", true], ["10:54:31", "retry 3/3 failed", "gave up here", false], ["10:54:32", "products.list 503", "what users see", false]],
    note: "Checkout returns 503 until the primary accepts connections.",
  },
  warning: {
    label: "Warning · Disk almost full", code: "disk-almost-full", message: "The primary disk is 92% full",
    help: "Grow the volume before it reaches 100%.", action: "Grow to 200 GB", source: "primary-replica-02 · /var/lib/postgresql", since: "1 hour 30 minutes ago, at 09:10",
    lines: [["09:10", "disk usage 80%", "crossed the warning line", false], ["10:38", "WAL archive 3 GB behind", "why it grows", true], ["10:40", "disk usage 92%", "now", false]],
    note: "At this rate the disk is full in about 2 hours.",
  },
  info: {
    label: "Info · Maintenance tonight", code: "maint-window", message: "Writes pause for 5 minutes at 23:00 UTC",
    help: "Finish long imports before 22:50.", action: "Show schedule", source: "eu-west-1 · all primaries", since: "Planned 2 days ago",
    lines: [["22:50", "last import start", "last safe start", true], ["23:00", "writes paused", "window opens", false], ["23:05", "writes resume", "window closes", false]],
    note: "Reads keep working the whole time.",
  },
  success: {
    label: "Success · Failover complete", code: "failover-done", message: "Checkout writes to replica-03 again",
    help: "Rebuild primary-02 as a replica.", action: "Rebuild primary-02", source: "replica-03.eu-west-1.internal:5432", since: "1 minute ago, at 10:58:24",
    lines: [["10:58:02", "failover started", "you clicked Fail over", false], ["10:58:21", "replica-03 promoted", "new primary", true], ["10:58:24", "checkout 200", "users recovered", false]],
    note: "Checkout was down for 3 minutes 53 seconds.",
  },
} as const;
const details = "Since 10:46:12 UTC, 6 minutes. Affects reads on 3 branches.";
const legacyContent: Record<string, AlertOptions["content"]> = { short: "simple", long: "detailed", rich: "full" };
const iconName = { info: "Info", success: "CircleCheck", warning: "TriangleAlert", error: "CircleX" } as const;

export function alertSnippet({ appearance, variant, tape, animated, pulse, placement, extras, content }: AlertOptions) {
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on" || content === "full";
  const d = diagnostics[variant];
  const props = [
    variant !== "info" && `variant="${variant}"`,
    appearance !== "tinted" && `appearance="${appearance}"`,
    loud && tape !== "default" && `tape="${tape}"`,
    loud && animated === "on" && "animated",
    loud && pulse === "on" && "pulse",
    placement !== "inline" && `placement="${placement}"`,
    !full && `role="note"`,
    full && "onDismiss={dismiss}",
    content === "full" && `labels={{ show: "Show evidence", hide: "Hide evidence" }}`,
  ].filter(Boolean);
  const head = content === "simple"
    ? [`    <AlertLabel>${d.label}</AlertLabel>`]
    : ["    <div className=\"alert-head\">", `      <AlertLabel>${d.label}</AlertLabel>`, `      <AlertCode code="${d.code}" />`, "    </div>"];
  const help = content === "full"
    ? [`    <AlertHelp action={<Button size="sm" onClick={fix}>${d.action}</Button>}>${d.help}</AlertHelp>`]
    : content === "detailed" ? [`    <AlertHelp>${d.help}</AlertHelp>`] : [];
  const more = content === "full"
    ? [
        "  <AlertDetails>",
        "    <div className=\"stack-sm\">",
        "      <dl className=\"alert-facts\">",
        `        <dt>source</dt><dd><samp>${d.source}</samp></dd>`,
        `        <dt>since</dt><dd>${d.since}</dd>`,
        "      </dl>",
        `      <AlertEvidence origin="${d.source}">`,
        ...d.lines.map(([at, event, label, primary]) => `        <AlertLine at="${at}"${primary ? " role=\"primary\"" : ""} label="${label}">${event}</AlertLine>`),
        "      </AlertEvidence>",
        `      <AlertNote>${d.note}</AlertNote>`,
        "    </div>",
        "  </AlertDetails>",
      ]
    : full ? ["  <AlertDetails>", `    <div className="alert-body">${details}</div>`, "  </AlertDetails>"] : [];
  return [
    `<Alert${props.length ? " " + props.join(" ") : ""}>`,
    ...(loud ? [] : [`  <${iconName[variant]} className="icon" aria-hidden="true" />`]),
    "  <AlertContent>",
    ...head,
    `    <AlertMessage>${d.message}</AlertMessage>`,
    ...help,
    "  </AlertContent>",
    ...more,
    "</Alert>",
  ].join("\n");
}

export function AlertDemo({ usage = false }: { usage?: boolean }) {
  const id = useId();
  const [stored, setOptions] = useDemoOptions<AlertOptions>("alert", { appearance: "tinted", variant: "info", tape: "default", animated: "off", pulse: "off", placement: "inline", extras: "off", content: "simple" });
  const options = { ...stored, content: legacyContent[stored.content] ?? stored.content };
  const { appearance, variant: severity, tape, animated, pulse, placement, extras, content } = options;
  const [shown, setShown] = useState<number[]>(placement === "inline" ? [0] : []);
  const [next, setNext] = useState(1);
  const SeverityIcon = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX }[severity];
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on" || content === "full";
  const select = <K extends keyof AlertOptions>(key: K, label: string, values: readonly (readonly [AlertOptions[K], string])[], disabled = false) => (
    <div className="field"><label htmlFor={`${id}-${key}`}>{label}</label>
      <select id={`${id}-${key}`} className="select" value={options[key]} disabled={disabled} onChange={event => setOptions({ [key]: event.target.value } as Partial<AlertOptions>)}>
        {values.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
  const show = () => { setShown(current => placement === "overlay" ? [...current, next] : [next]); setNext(n => n + 1); };
  const d = diagnostics[severity];
  return <div className="stack">
    <div className="demo-settings-inline demo-control-bar" role="group" aria-label="Alert options">
      {select("appearance", "Appearance", [["tinted", "Tinted"], ["rail", "Start border"], ["loud", "Loud"]])}
      {select("variant", "Severity", [["info", "Info"], ["success", "Success"], ["warning", "Warning"], ["error", "Error"]])}
      {select("tape", "Tape", [["default", "Default"], ["top", "Top"], ["start", "Start"], ["top-bottom", "Top and bottom"], ["start-end", "Start and end"], ["none", "None"]], !loud)}
      {select("animated", "Animated tape", [["off", "Off"], ["on", "On"]], !loud)}
      {select("pulse", "Icon pulse", [["off", "Off"], ["on", "On"]], !loud)}
      {select("placement", "Placement", [["inline", "Inline"], ["overlay", "Overlay"]])}
      {select("extras", "Details and dismiss", [["off", "Off"], ["on", "On"]], loud || placement === "overlay" || content === "full")}
      {select("content", "Content", [["simple", "Simple"], ["detailed", "Detailed"], ["full", "Full"]])}
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
        labels={content === "full" ? { show: "Show evidence", hide: "Hide evidence" } : undefined}
      >
        {!loud && <SeverityIcon className="icon" aria-hidden="true" />}
        <AlertContent>
          {content === "simple" ? <AlertLabel id={`${id}-${key}-title`}>{d.label}</AlertLabel> : <div className="alert-head">
            <AlertLabel id={`${id}-${key}-title`}>{d.label}</AlertLabel>
            <AlertCode code={d.code} />
          </div>}
          <AlertMessage id={`${id}-${key}-description`}>{d.message}</AlertMessage>
          {content !== "simple" && <AlertHelp action={content === "full" ? <Button size="sm">{d.action}</Button> : undefined}>{d.help}</AlertHelp>}
        </AlertContent>
        {content === "full" ? <AlertDetails>
          <div className="stack-sm">
            <dl className="alert-facts">
              <dt>source</dt><dd><samp>{d.source}</samp></dd>
              <dt>since</dt><dd>{d.since}</dd>
            </dl>
            <AlertEvidence origin={d.source}>
              {d.lines.map(([at, event, label, primary]) => <AlertLine key={`${at}-${event}`} at={at} role={primary ? "primary" : undefined} label={label}>{event}</AlertLine>)}
            </AlertEvidence>
            <AlertNote>{d.note}</AlertNote>
          </div>
        </AlertDetails> : full && <AlertDetails>
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
