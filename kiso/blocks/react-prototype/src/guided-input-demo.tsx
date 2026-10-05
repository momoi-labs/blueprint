import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  Alert, AlertTitle, AlertDescription, ApplicationShell, Button, FileDropzone,
  FormField, Label, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Spinner, Steps, Switch, Textarea,
  type RadioGroupProps, type StepsItem,
} from "@momoi-labs/kiso-react";
import "./guided-input-demo.css";

const sampleSteps: StepsItem[] = [
  { id: "source", label: "Source", status: "completed", description: "Text selected", navigable: true },
  { id: "format", label: "Format", status: "completed", description: "Compact output", navigable: true },
  { id: "options", label: "Options", status: "error", description: "Check the current values", navigable: true },
  { id: "preview", label: "Preview" },
  { id: "finish", label: "Finish", status: "disabled" },
];

export function StepsDemo() {
  const [items, setItems] = useState(sampleSteps);
  const [current, setCurrent] = useState<string | null>("options");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [responsive, setResponsive] = useState(true);
  const id = useId();
  const index = items.findIndex(item => item.id === current);
  const finished = current === null;
  const active = items[index];

  function advance() {
    if (!active) return;
    setItems(previous => previous.map((item, position) => position === index
      ? { ...item, status: "completed", navigable: true, description: item.status === "error" ? undefined : item.description }
      : position === index + 1 && item.status === "disabled" ? { ...item, status: "upcoming" } : item));
    setCurrent(items[index + 1]?.id ?? null);
  }

  function restart() {
    setItems(sampleSteps.map((item, position) => ({ ...item,
      status: position === sampleSteps.length - 1 ? "disabled" : "upcoming",
      description: undefined, navigable: false,
    })));
    setCurrent(sampleSteps[0]!.id);
  }

  return <div className="stack">
    <div className="demo-row">
      <label htmlFor={id}>Orientation <select id={id} className="select" value={orientation} onChange={e => setOrientation(e.target.value as typeof orientation)}><option>horizontal</option><option>vertical</option></select></label>
      <div className="row"><Switch id={`${id}-compact`} checked={responsive} onCheckedChange={setResponsive} /><Label htmlFor={`${id}-compact`}>Compact in narrow containers</Label></div>
    </div>
    <Steps label="Example progress" items={items} current={current} orientation={orientation} responsive={responsive} onStepChange={setCurrent} />
    <div className="row-wrap">
      <Button disabled={index === 0} onClick={() => setCurrent(items[finished ? items.length - 1 : index - 1]!.id)}>Back</Button>
      <Button variant="primary" disabled={finished} onClick={advance}>
        {finished ? "Completed" : active?.status === "error" ? "Retry and continue" : index === items.length - 1 ? "Complete" : "Next"}
      </Button>
      <Button variant="ghost" onClick={restart}>Restart</Button>
    </div>
    <p className="muted t-label" role="status">{finished ? "All steps completed." : `Step ${index + 1} of ${items.length}: ${active?.label}.`}</p>
  </div>;
}

export function RadioGroupDemo() {
  const [variant, setVariant] = useState<RadioGroupProps["variant"]>("tiles");
  const [value, setValue] = useState("compact");
  const [confirmed, setConfirmed] = useState("");
  const [large, setLarge] = useState(true);
  const id = useId();
  return <form className="stack" onSubmit={e => { e.preventDefault(); setConfirmed(value); }}>
    <div className="demo-row">
      <label htmlFor={id}>Presentation <select id={id} className="select" value={variant} onChange={e => setVariant(e.target.value as typeof variant)}><option value="default">Standard</option><option value="tiles">Tiles</option><option value="segmented">Segmented</option></select></label>
      <div className="row"><Switch id={`${id}-xl`} checked={large} onCheckedChange={setLarge} /><Label htmlFor={`${id}-xl`}>XL controls</Label></div>
    </div>
    <RadioGroup label="Output format" description="Choose a format, then confirm." name="format" value={value} onValueChange={setValue} variant={variant} controlSize={large ? "xl" : "md"}>
      <RadioGroupItem value="compact" label="Compact" description="A short summary." />
      <RadioGroupItem value="full" label="Full" description="Include all details." />
      <RadioGroupItem value="unavailable" label="Unavailable" disabled />
    </RadioGroup>
    <Button type="submit" variant="primary">Confirm selection</Button>
    <p role="status">{confirmed ? `Confirmed: ${confirmed}` : "No selection confirmed yet."}</p>
  </form>;
}

export function FileDropzoneDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const id = useId();
  return <div className="stack">
    <div className="demo-row">
      <div className="row"><Switch id={`${id}-disabled`} checked={disabled} onCheckedChange={setDisabled} /><Label htmlFor={`${id}-disabled`}>Disabled</Label></div>
      <div className="row"><Switch id={`${id}-multiple`} checked={multiple} onCheckedChange={setMultiple} /><Label htmlFor={`${id}-multiple`}>Allow multiple files</Label></div>
    </div>
    <FileDropzone label="Choose a file" description="Choose or drop a .txt or .png file. Files stay in this browser." accept=".txt,.png,text/plain,image/png" multiple={multiple} disabled={disabled} onFilesSelected={setFiles} />
    <div role="status">{files.length ? files.map(file => file.name).join(", ") : "No files selected."}</div>
    {files.length > 0 && <Button onClick={() => setFiles([])}>Clear selection</Button>}
  </div>;
}

const stages = ["Choose input", "Add content", "Choose format", "Set options", "Review", "Finish"];
export function GuidedFlowDemo() {
  const [at, setAt] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [source, setSource] = useState("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState("compact");
  const [name, setName] = useState("Sample output");
  const [spacing, setSpacing] = useState("normal");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useLayoutEffect(() => { heading.current?.focus(); }, [at]);
  const summaries = [source === "text" ? "Text input" : "Local file", source === "text" ? text : files.map(f => f.name).join(", "), format, name, "Checked", "Ready"];
  const items: StepsItem[] = stages.map((label, i) => ({ id: String(i), label,
    status: at === i && error ? "error" : completed.includes(i) ? "completed" : "upcoming",
    description: completed.includes(i) ? summaries[i] : undefined,
    navigable: completed.includes(i) && !pending,
  }));
  function go(next: number) { if (!pending) { setError(""); setAt(next); } }
  function advance() {
    if (pending) return;
    if (at === 1 && (source === "text" ? !text.trim() : files.length === 0)) {
      setError(source === "text" ? "Add some text to continue." : "Choose a file to continue.");
      document.getElementById(`${id}-content`)?.focus(); return;
    }
    if (at === 3 && !name.trim()) { setError("Enter an output name."); document.getElementById(`${id}-name`)?.focus(); return; }
    setError(""); setPending(true);
    timer.current = window.setTimeout(() => {
      setCompleted(old => [...new Set([...old, at, ...(at === 4 ? [5] : [])])]);
      setAt(old => Math.min(5, old + 1)); setPending(false);
    }, 350);
  }
  function choose(next: string) { setSource(next); setCompleted(old => [...new Set([...old, 0])]); go(1); }
  function reset() { window.clearTimeout(timer.current); setPending(false); setAt(0); setSource("text"); setCompleted([]); setText(""); setFiles([]); setFormat("compact"); setName("Sample output"); setSpacing("normal"); setError(""); }
  const progress = (responsive: boolean) => <Steps label="Setup progress" items={items} current={at === 5 ? null : String(at)} orientation="vertical" responsive={responsive} onStepChange={next => go(Number(next))} />;
  return <div className="guided-demo">
    <ApplicationShell layout="topbar" headerVariant="plain" brand={<strong>Guided setup</strong>} header={<Button variant="ghost" onClick={reset}>Reset example</Button>}>
      <div className="guided-layout">
        <aside className="guided-wide">{progress(false)}</aside>
        <div className="guided-narrow">{progress(true)}</div>
        <section className="guided-stage" aria-busy={pending}>
          <h2 ref={heading} tabIndex={-1}>{at === 5 ? "Your output is ready" : stages[at]}</h2>
          <p className="t-body-large muted">{at === 5 ? "This example runs locally and sends no data." : "Complete one task, then continue. You can return to completed steps."}</p>
          <form className="stack" onSubmit={e => { e.preventDefault(); advance(); }}>
            {at === 0 && <div className="guided-choices">
              <Button presentation="tile" size="xl" description="Start with a short description." onClick={() => choose("text")}>Write text</Button>
              <Button presentation="tile" size="xl" description="Select a file from this device." onClick={() => choose("file")}>Choose file</Button>
            </div>}
            {at === 1 && (source === "text" ? <FormField label="Content" error={error} controlSize="xl"><Textarea id={`${id}-content`} rows={4} value={text} disabled={pending} onChange={e => setText(e.target.value)} /></FormField>
              : <><FileDropzone id={`${id}-content`} label="Choose a text file" description="Choose or drop a .txt file." accept=".txt,text/plain" disabled={pending} error={error} onFilesSelected={setFiles} /><p role="status">{files.map(file => file.name).join(", ") || "No file selected."}</p></>)}
            {at === 2 && <RadioGroup label="Output format" value={format} onValueChange={setFormat} variant="tiles" controlSize="xl" disabled={pending}>
              <RadioGroupItem value="compact" label="Compact" description="Keep a short summary." />
              <RadioGroupItem value="full" label="Full" description="Include every detail." />
            </RadioGroup>}
            {at === 3 && <>
              <FormField id={`${id}-name`} label="Output name" controlSize="xl" value={name} onChange={e => setName(e.target.value)} error={error} disabled={pending} />
              <Select value={spacing} onValueChange={setSpacing} disabled={pending}>
                <FormField label="Spacing" controlSize="xl"><SelectTrigger><SelectValue /></SelectTrigger></FormField>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="wide">Wide</SelectItem></SelectContent>
              </Select>
            </>}
            {at === 4 && <dl className="guided-review"><dt>Input</dt><dd>{source}</dd><dt>Content</dt><dd>{source === "text" ? text : files.map(f => f.name).join(", ")}</dd><dt>Format</dt><dd>{format}</dd><dt>Name</dt><dd>{name}</dd><dt>Spacing</dt><dd>{spacing}</dd></dl>}
            {error && at !== 1 && at !== 3 && <Alert variant="error"><AlertTitle>Check the input</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {at > 0 && at < 5 && <div className="guided-actions">
              <Button variant="ghost" size="xl" disabled={pending} onClick={() => go(at - 1)}>Back</Button>
              <Button type="submit" variant="primary" size="xl" disabled={pending} aria-busy={pending}>{pending && <Spinner size="sm" />}{pending ? "Working..." : at === 4 ? "Finish" : "Continue"}</Button>
            </div>}
            {at === 5 && <Button size="xl" variant="primary" onClick={reset}>Start again</Button>}
          </form>
          {at > 0 && at < 5 && <Button variant="ghost" disabled={pending} onClick={() => setError("Review the current input before continuing.")}>Show validation error</Button>}
        </section>
      </div>
    </ApplicationShell>
  </div>;
}
