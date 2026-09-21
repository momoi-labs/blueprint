import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Button, Card, CardHeader, Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, Form, FormActions, FormField,
  Tabs, TabsContent, TabsList, TabsTrigger, Textarea,
} from "@momoi-labs/kiso-react";

type Mode = "login" | "create" | "edit" | "access";
type Status = "idle" | "saving" | "error" | "success";

function ExampleForm({ mode = "edit", sticky = false, fail = false, onCancel }: {
  mode?: Mode;
  sticky?: boolean;
  fail?: boolean;
  onCancel?: () => void;
}) {
  const id = useId();
  const edit = mode === "edit" || mode === "access";
  const initial = { name: edit ? "Studio" : "", email: "alex@example.com", password: "demo-password",
    description: "A shared space for the design team.", zone: "America/Sao_Paulo",
    language: "English", digest: "Weekly", owner: "Alex Morgan", access: "Admins only" };
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const busy = status === "saving";
  const verb = mode === "login" ? "Sign in" : mode === "create" ? "Create project" : "Save changes";
  function change(key: keyof typeof values, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    setStatus("idle");
  }
  function input(key: keyof typeof values, label: string, type = "text") {
    return <FormField label={label} name={key} type={type} required value={values[key]}
      onChange={event => change(key, event.target.value)} />;
  }
  function select(key: keyof typeof values, label: string, options: string[]) {
    return <FormField label={label}><select className="select" name={key} value={values[key]}
      onChange={event => change(key, event.target.value)}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select></FormField>;
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setStatus("saving");
    timer.current = setTimeout(() => {
      if (fail) setStatus("error");
      else { setSaved(values); setStatus("success"); }
    }, 1000);
  }
  const message = status === "saving" ? (edit ? "Saving changes..." : "Submitting...")
    : status === "error" ? <><strong>{edit ? "Changes could not be saved." : "Request failed."}</strong> Your entries are kept. Try again.</>
    : status === "success" ? <><strong>{edit ? "Changes saved." : mode === "login" ? "Signed in." : "Project created."}</strong></>
    : edit && dirty ? <strong>Unsaved changes.</strong> : undefined;
  return <Form onSubmit={submit} className={onCancel ? "form-scroll" : undefined} aria-label={mode === "access" ? "Access settings" : mode === "edit" ? "General settings" : verb}>
    <fieldset className="form-body" disabled={busy}>
      {mode === "login" ? <>{input("email", "Email", "email")}{input("password", "Password", "password")}</>
        : mode === "access" ? select("access", "Who can invite members?", ["Admins only", "All members"])
        : <>{input("name", "Project name")}
          {mode === "create" ? select("access", "Who can invite members?", ["Admins only", "All members"])
            : <>
              <FormField label="Description"><Textarea name="description" rows={4} value={values.description}
                onChange={event => change("description", event.target.value)} /></FormField>
              <section className="forms-demo-section" aria-labelledby={`${id}-regional`}>
                <h3 id={`${id}-regional`} className="t-h3">Regional preferences</h3>
                {select("zone", "Time zone", ["America/Sao_Paulo", "Europe/London", "Asia/Tokyo"])}
                {select("language", "Language", ["English", "Portuguese", "Japanese"])}
              </section>
              <section className="forms-demo-section" aria-labelledby={`${id}-notifications`}>
                <h3 id={`${id}-notifications`} className="t-h3">Notifications</h3>
                {input("email", "Notification email", "email")}
                {select("digest", "Email digest", ["Weekly", "Daily", "Never"])}
              </section>
              <section className="forms-demo-section" aria-labelledby={`${id}-sharing`}>
                <h3 id={`${id}-sharing`} className="t-h3">Sharing</h3>
                {input("owner", "Project owner")}
                {select("access", "Who can invite members?", ["Admins only", "All members"])}
              </section>
            </>}
        </>}
    </fieldset>
    <FormActions sticky={sticky} tone={status === "error" ? "danger" : edit && dirty ? "warning" : "neutral"} message={message}>
      {onCancel && <Button disabled={busy} onClick={onCancel}>Cancel</Button>}
      {edit && dirty && <Button variant="ghost" disabled={busy} onClick={() => {
        setValues(saved); setStatus("idle");
      }}>Discard changes</Button>}
      <Button type="submit" variant="primary" disabled={busy || (edit && !dirty)}
        aria-busy={busy} data-loading={busy || undefined}>{busy ? "Please wait..." : verb}</Button>
    </FormActions>
  </Form>;
}

export function FormDemo() {
  return <Card><ExampleForm mode="create" /></Card>;
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

export function FormsExamples() {
  const [scene, setScene] = useState("panel");
  const [fail, setFail] = useState(false);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className="forms-demo stack">
    <nav className="forms-demo-choices" aria-label="Form examples">
      {[["login", "Sign in"], ["create", "Create in dialog"], ["page", "Page scroll"], ["panel", "Panel scroll"]].map(([key, label]) =>
        <Button key={key} aria-pressed={scene === key} variant={scene === key ? "primary" : "default"}
          onClick={() => setScene(key)}>{label}</Button>)}
    </nav>
    <div className="forms-demo-toolbar">
      <label htmlFor={id}>Save result</label>
      <select id={id} className="select" value={fail ? "error" : "success"} onChange={event => setFail(event.target.value === "error")}>
        <option value="success">Success</option><option value="error">Error</option>
      </select>
      <Button variant="ghost" onClick={() => setRevision(value => value + 1)}>Reset example</Button>
    </div>
    <div key={`${scene}-${revision}`}>
      {scene === "login" ? <Card className="forms-demo-login"><CardHeader><h2 className="t-h3">Welcome back</h2><p className="muted">Sign in to your workspace.</p></CardHeader><ExampleForm mode="login" fail={fail} /></Card>
        : scene === "create" ? <Dialog open={open} onOpenChange={setOpen}>
          <Card className="forms-demo-launch"><h2 className="t-h3">Create a shared space for your team.</h2><DialogTrigger asChild><Button variant="primary">Create project</Button></DialogTrigger></Card>
          <DialogContent><DialogHeader><DialogTitle>Create project</DialogTitle><DialogDescription>Give your team a shared space to work.</DialogDescription></DialogHeader>
            <ExampleForm mode="create" fail={fail} onCancel={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
        : scene === "page" ? <Card className="forms-demo-page"><CardHeader><h2 className="t-h3">Workspace settings</h2></CardHeader><ExampleForm sticky fail={fail} /></Card>
        : <Card><CardHeader><h2 className="t-h3">Studio</h2></CardHeader>
          <Tabs defaultValue="general">
            <TabsList className="forms-demo-tabs" aria-label="Project settings"><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="access">Access</TabsTrigger></TabsList>
            <TabsContent value="general" forceMount className="form-scroll forms-demo-scroll"><ExampleForm sticky fail={fail} /></TabsContent>
            <TabsContent value="access" forceMount className="form-scroll forms-demo-scroll"><ExampleForm mode="access" sticky fail={fail} /></TabsContent>
          </Tabs>
        </Card>}
    </div>
  </div>;
}
