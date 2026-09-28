import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button, Card, Form, FormActions, FormField } from "@momoi-labs/kiso-react";

type Status = "idle" | "saving" | "error" | "success";

export function CreateProjectForm({ fail = false, onCancel }: { fail?: boolean; onCancel?: () => void }) {
  const [values, setValues] = useState({ name: "", access: "Admins only" });
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const busy = status === "saving";
  function change(key: keyof typeof values, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    setStatus("idle");
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setStatus("saving");
    // The failure is transient: the retry succeeds with the entries kept.
    const failing = fail && attempts === 0;
    setAttempts(count => count + 1);
    timer.current = setTimeout(() => setStatus(failing ? "error" : "success"), 1000);
  }
  const message = status === "saving" ? "Submitting..."
    : status === "error" ? <><strong>Request failed.</strong> Your entries are kept. Try again.</>
    : status === "success" ? <strong>Project created.</strong> : undefined;
  return <Form onSubmit={submit} className={onCancel ? "form-scroll" : undefined} aria-label="Create project">
    <fieldset className="form-body" disabled={busy}>
      <FormField label="Project name" name="name" required value={values.name}
        onChange={event => change("name", event.target.value)} />
      <FormField label="Who can invite members?"><select className="select" name="access" value={values.access}
        onChange={event => change("access", event.target.value)}>
        {["Admins only", "All members"].map(option => <option key={option}>{option}</option>)}
      </select></FormField>
    </fieldset>
    <FormActions tone={status === "error" ? "danger" : "neutral"} message={message}>
      {onCancel && <Button disabled={busy} onClick={onCancel}>Cancel</Button>}
      <Button type="submit" variant="primary" disabled={busy} aria-busy={busy} data-loading={busy || undefined}>
        {busy ? "Please wait..." : "Create project"}
      </Button>
    </FormActions>
  </Form>;
}

export function FormDemo() {
  return <Card><CreateProjectForm /></Card>;
}

export function FormActionsDemo() {
  const [state, setState] = useState("idle");
  const id = useId();
  const messages: Record<string, string | undefined> = {
    idle: undefined, dirty: "Unsaved changes.",
    saving: "Saving changes. Please wait.", error: "Changes could not be saved. Try again.", success: "Changes saved.",
  };
  return <div className="stack">
    <div className="field"><label htmlFor={id}>Preview state</label>
      <select className="select" id={id} value={state} onChange={event => setState(event.target.value)}>
        <option value="idle">No message</option><option value="dirty">Unsaved changes</option>
        <option value="saving">Saving</option><option value="error">Error</option><option value="success">Saved</option>
      </select>
    </div>
    <FormActions tone={state === "error" ? "danger" : state === "dirty" ? "warning" : "neutral"} message={messages[state]}>
      {(state === "dirty" || state === "error") && <Button variant="ghost" onClick={() => setState("idle")}>Discard changes</Button>}
      <Button variant="primary" disabled={state === "saving" || state === "success"}
        data-loading={state === "saving" || undefined} onClick={() => setState("success")}>
        {state === "saving" ? "Saving..." : "Save changes"}
      </Button>
    </FormActions>
  </div>;
}
