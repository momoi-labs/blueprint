import { useId } from "react";
import { Button, CodeBlock, Toasts, useToast } from "@momoi-labs/kiso-react";
import { tsx } from "./code-highlight";
import { useDemoOptions } from "./demo-settings";

type ToastOptions = {
  variant: "neutral" | "success" | "warning" | "error";
  appearance: "default" | "loud";
  pulse: "off" | "on";
};
export const toastShareOptions: Record<keyof ToastOptions, readonly string[]> = {
  variant: ["neutral", "success", "warning", "error"],
  appearance: ["default", "loud"],
  pulse: ["off", "on"],
};

const copy = {
  neutral: ["Backup started", "storefront-demo.-.primary"],
  success: ["Changes saved", "Your project has been updated."],
  warning: ["Disk at 85%", "storefront-demo.-.primary"],
  error: ["Deploy failed", "storefront-demo: build exited 1"],
} as const;

export function toastSnippet({ variant, appearance, pulse }: ToastOptions) {
  const loud = appearance === "loud";
  const options = [loud && `appearance: "loud"`, loud && pulse === "on" && "pulse: true"].filter(Boolean);
  const [title, body] = copy[variant];
  return [
    "<Toasts>",
    "  <Application />",
    "</Toasts>",
    "",
    "const notify = useToast();",
    `notify("${variant}", "${title}", "${body}"${options.length ? `, { ${options.join(", ")} }` : ""});`,
  ].join("\n");
}

function ShowToast({ options }: { options: ToastOptions }) {
  const notify = useToast();
  const loud = options.appearance === "loud";
  const [title, body] = copy[options.variant];
  return <Button onClick={() => notify(options.variant, title, body, loud ? { appearance: "loud", pulse: options.pulse === "on" } : undefined)}>Show toast</Button>;
}

export function ToastDemo({ usage = false }: { usage?: boolean }) {
  const id = useId();
  const [options, setOptions] = useDemoOptions<ToastOptions>("toast", { variant: "success", appearance: "default", pulse: "off" });
  const loud = options.appearance === "loud";
  const select = <K extends keyof ToastOptions>(key: K, label: string, values: readonly (readonly [ToastOptions[K], string])[], disabled = false) => (
    <div className="field"><label htmlFor={`${id}-${key}`}>{label}</label>
      <select id={`${id}-${key}`} className="select" value={options[key]} disabled={disabled} onChange={event => setOptions({ [key]: event.target.value } as Partial<ToastOptions>)}>
        {values.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
  return <div className="stack">
    <div className="demo-settings-inline demo-control-bar" role="group" aria-label="Toast options">
      {select("variant", "Severity", [["neutral", "Neutral"], ["success", "Success"], ["warning", "Warning"], ["error", "Error"]])}
      {select("appearance", "Appearance", [["default", "Default"], ["loud", "Loud"]])}
      {select("pulse", "Icon pulse", [["off", "Off"], ["on", "On"]], !loud)}
    </div>
    <Toasts duration={5000}>
      <div className="demo-row"><ShowToast options={options} /></div>
    </Toasts>
    {usage && <details className="catalog-code">
      <summary>Usage example</summary>
      <CodeBlock code={toastSnippet(options)} highlight={tsx} title="React / TSX" copy="example" />
    </details>}
  </div>;
}
