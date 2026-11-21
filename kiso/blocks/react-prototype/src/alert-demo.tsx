import { useId, useState } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertContent, AlertDescription, AlertDetails, AlertLabel, AlertMessage, AlertMeta, AlertTitle, Button, CodeBlock, type AlertTape } from "@momoi-labs/kiso-react";
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
  content: "short" | "long" | "rich";
};
export const alertShareOptions: Record<keyof AlertOptions, readonly string[]> = {
  appearance: ["tinted", "rail", "loud"],
  variant: ["info", "success", "warning", "error"],
  tape: ["default", "top", "start", "top-bottom", "start-end", "none"],
  animated: ["off", "on"],
  pulse: ["off", "on"],
  placement: ["inline", "overlay"],
  extras: ["off", "on"],
  content: ["short", "long", "rich"],
};

const copy = {
  info: ["Maintenance tonight", "storefront-demo will restart at 23:00 UTC for a minor upgrade."],
  success: ["Failover complete", "storefront-demo.-.replica-2 is now the primary."],
  warning: ["Replication lag", "storefront-demo.-.replica-2 is 48s behind the primary (limit 30s)."],
  error: ["Database error", "target: storefront-demo.-.primary: connection refused"],
} as const;

const details = "Since 10:46:12 UTC, 6 minutes. Affects reads on 3 branches.";

const long = {
  info: ["Maintenance tonight on storefront-demo.-.primary and every replica in the eu-west-1 region", "target: storefront-demo-eu-west-1.-.primary-replica-02.internal:5432 will restart at 23:00 UTC for a minor upgrade to 17.4. Connections drop for about two minutes. Clients that retry reconnect on their own."],
  success: ["Failover complete: storefront-demo.-.replica-2 is now the primary for every branch in eu-west-1", "target: storefront-demo-eu-west-1.-.primary-replica-02.internal:5432 accepted writes after 3 retries (timeout 30000ms). The old primary is fenced. Rebuild it as a replica when you are ready."],
  warning: ["Replication lag on storefront-demo.-.replica-2 is above the limit for reads on 3 branches", "target: storefront-demo-eu-west-1.-.primary-replica-02.internal:5432: lag 48s after 3 checks (limit 30000ms). Reads may return stale rows until the replica catches up. Writes are not affected."],
  error: ["Database error: storefront-demo.-.primary refuses connections from every app server in eu-west-1", "target: storefront-demo-eu-west-1.-.primary-replica-02.internal:5432: connection refused after 3 retries (timeout 30000ms). The app returns 503 for checkout and account pages. Reads fall back to replica-1 and may be stale."],
} as const;

const rich = {
  info: {
    label: "Notice · Maintenance", message: "storefront-demo restarts at 23:00 UTC", meta: "21:30:00 · minor upgrade · about 2 min downtime",
    facts: [["Version", "17.3 → 17.4"], ["Window", "23:00 to 23:05 UTC"], ["Branches", "main, preview-412, preview-418"]],
    log: ["21:30:00.000 INFO  upgrade scheduled for 23:00 UTC", "21:30:00.112 INFO  replicas restart first, primary last"],
  },
  success: {
    label: "Resolved · Failover", message: "replica-2 is now the primary", meta: "10:58:12 · writes restored · 4 min outage",
    facts: [["Primary", "storefront-demo.-.replica-2"], ["Fenced", "storefront-demo.-.primary"], ["Branches", "main, preview-412, preview-418"]],
    log: ["10:58:11.904 INFO  promote replica-2: done", "10:58:12.010 INFO  fence old primary: done", "10:58:12.233 INFO  writes accepted on replica-2"],
  },
  warning: {
    label: "Warning · Replication lag", message: "replica-2 lag 48s exceeds 30s threshold", meta: "10:52:07 · reads may be stale · auto-resolves",
    facts: [["Replica", "storefront-demo.-.replica-2"], ["Lag", "48s (limit 30s)"], ["Since", "10:46:12 (6 min)"], ["Branches", "main, preview-412, preview-418"]],
    log: ["10:46:12.481 WARN  replica-2 lag 31s", "10:49:08.007 WARN  replica-2 lag 39s", "10:52:07.315 WARN  replica-2 lag 48s"],
  },
  error: {
    label: "Critical · Database error", message: "target: storefront-demo.-.primary: connection refused", meta: "10:54:31 · storefront refusing requests",
    facts: [["Code", "errno 1054 · sqlstate 42S22"], ["Request", "req_8f2c41d07a"], ["Since", "10:54:31 (3 min)"], ["Branches", "main, preview-412, preview-418"]],
    log: ["10:54:31.204 ERROR pool: connect storefront-demo.-.primary:5432 refused", "10:54:31.512 WARN  retry 3/3 in 300ms", "10:54:32.118 ERROR trpc:products.list 503 (req_8f2c41d07a)"],
  },
} as const;
const iconName = { info: "Info", success: "CircleCheck", warning: "TriangleAlert", error: "CircleX" } as const;

export function alertSnippet({ appearance, variant, tape, animated, pulse, placement, extras, content }: AlertOptions) {
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on" || content === "rich";
  const [title, description] = content === "long" ? long[variant] : full ? copy[variant] : [variant[0].toUpperCase() + variant.slice(1), "Review the configuration and its effect on concurrent operations."];
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
  const r = rich[variant];
  const body = content === "rich"
    ? [`    <AlertLabel>${r.label}</AlertLabel>`, `    <AlertMessage>${r.message}</AlertMessage>`, `    <AlertMeta>${r.meta}</AlertMeta>`]
    : [`    <AlertTitle>${title}</AlertTitle>`, `    <AlertDescription>${description}</AlertDescription>`];
  const more = content === "rich"
    ? [
        "  <AlertDetails>",
        "    <div className=\"stack-sm\">",
        "      <dl className=\"kv\">",
        ...r.facts.flatMap(([term, value]) => [`        <dt>${term}</dt><dd>${value}</dd>`]),
        "      </dl>",
        `      <pre>{\`${r.log.join("\n")}\`}</pre>`,
        "      <div className=\"row-wrap\">",
        "        <Button size=\"sm\" onClick={retry}>Retry</Button>",
        "        <a href=\"/runbooks/database\">Open the runbook</a>",
        "      </div>",
        "    </div>",
        "  </AlertDetails>",
      ]
    : full ? ["  <AlertDetails>", `    <div className="alert-body">${details}</div>`, "  </AlertDetails>"] : [];
  return [
    `<Alert${props.length ? " " + props.join(" ") : ""}>`,
    ...(loud ? [] : [`  <${iconName[variant]} className="icon" aria-hidden="true" />`]),
    "  <AlertContent>",
    ...body,
    "  </AlertContent>",
    ...more,
    "</Alert>",
  ].join("\n");
}

export function AlertDemo({ usage = false }: { usage?: boolean }) {
  const id = useId();
  const [options, setOptions] = useDemoOptions<AlertOptions>("alert", { appearance: "tinted", variant: "info", tape: "default", animated: "off", pulse: "off", placement: "inline", extras: "off", content: "short" });
  const { appearance, variant: severity, tape, animated, pulse, placement, extras, content } = options;
  const [shown, setShown] = useState<number[]>(placement === "inline" ? [0] : []);
  const [next, setNext] = useState(1);
  const SeverityIcon = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX }[severity];
  const loud = appearance === "loud";
  const full = loud || placement === "overlay" || extras === "on" || content === "rich";
  const select = <K extends keyof AlertOptions>(key: K, label: string, values: readonly (readonly [AlertOptions[K], string])[], disabled = false) => (
    <div className="field"><label htmlFor={`${id}-${key}`}>{label}</label>
      <select id={`${id}-${key}`} className="select" value={options[key]} disabled={disabled} onChange={event => setOptions({ [key]: event.target.value } as Partial<AlertOptions>)}>
        {values.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
  const show = () => { setShown(current => placement === "overlay" ? [...current, next] : [next]); setNext(n => n + 1); };
  const r = rich[severity];
  const [title, description] = content === "long" ? long[severity] : full ? copy[severity] : [severity[0].toUpperCase() + severity.slice(1), "Review the configuration and its effect on concurrent operations."];
  return <div className="stack">
    <div className="demo-settings-inline demo-control-bar" role="group" aria-label="Alert options">
      {select("appearance", "Appearance", [["tinted", "Tinted"], ["rail", "Start border"], ["loud", "Loud"]])}
      {select("variant", "Severity", [["info", "Info"], ["success", "Success"], ["warning", "Warning"], ["error", "Error"]])}
      {select("tape", "Tape", [["default", "Default"], ["top", "Top"], ["start", "Start"], ["top-bottom", "Top and bottom"], ["start-end", "Start and end"], ["none", "None"]], !loud)}
      {select("animated", "Animated tape", [["off", "Off"], ["on", "On"]], !loud)}
      {select("pulse", "Icon pulse", [["off", "Off"], ["on", "On"]], !loud)}
      {select("placement", "Placement", [["inline", "Inline"], ["overlay", "Overlay"]])}
      {select("extras", "Details and dismiss", [["off", "Off"], ["on", "On"]], loud || placement === "overlay" || content === "rich")}
      {select("content", "Content", [["short", "Short"], ["long", "Long"], ["rich", "Rich"]])}
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
        {content === "rich" ? <AlertContent>
          <AlertLabel id={`${id}-${key}-title`}>{r.label}</AlertLabel>
          <AlertMessage id={`${id}-${key}-description`}>{r.message}</AlertMessage>
          <AlertMeta>{r.meta}</AlertMeta>
        </AlertContent> : <AlertContent>
          <AlertTitle id={`${id}-${key}-title`}>{title}</AlertTitle>
          <AlertDescription id={`${id}-${key}-description`}>{description}</AlertDescription>
        </AlertContent>}
        {content === "rich" ? <AlertDetails>
          <div className="stack-sm">
            <dl className="kv">{r.facts.map(([term, value]) => [<dt key={`${term}-t`}>{term}</dt>, <dd key={`${term}-d`}>{value}</dd>])}</dl>
            <pre>{r.log.join("\n")}</pre>
            <div className="row-wrap">
              <Button size="sm">Retry</Button>
              <a href="#components/alert">Open the runbook</a>
            </div>
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
