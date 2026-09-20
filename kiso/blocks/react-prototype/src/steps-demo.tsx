// A run a machine walks and a person reads (issue #98). The simulation stands
// in for the Host: the same run drives the list, the bar, and the toast.
import { useEffect, useId, useMemo, useState } from "react"
import { Badge, Button, Checkbox, Label, LogView, LogViewLine, Pane, Split, Splitter, StepBar, StepList,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type StepItem, type StepState } from "@momoi-labs/kiso-react"

const PLAN: { key: string; label: string; seconds: number; output: string[] }[] = [
  { key: "create", label: "Create the instance", seconds: 3, output: ["Creating instance sf-dev-env", "Allocating 4 CPU, 8 GiB", "Disk image ubuntu-24.04 attached"] },
  { key: "boot", label: "Boot the machine", seconds: 9, output: ["[hostagent] Starting VZ", "[hostagent] [VZ] - vm state change: running", "[hostagent] Waiting for the essential requirement 1 of 3: ssh", "Cloud-init v. 26.1 running init-local. Up 2.08 seconds.", "Cloud-init v. 26.1 running init. Up 4.51 seconds.", "[hostagent] The essential requirement 3 of 3 is satisfied"] },
  { key: "network", label: "Configure network", seconds: 4, output: ["Writing /etc/netplan/50-cloud-init.yaml", "netplan apply", "Hostname set to sf-dev-env"] },
  { key: "packages", label: "System packages", seconds: 26, output: ["Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease", "Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]", "Reading package lists...", "Building dependency tree...", "The following NEW packages will be installed:", "  build-essential curl git jq unzip", "Setting up build-essential (12.10ubuntu1) ...", "Setting up git (1:2.43.0-1ubuntu7) ...", "Processing triggers for man-db (2.12.0-4) ..."] },
  { key: "ssh", label: "User and SSH", seconds: 2, output: ["Synchronizing state of ssh.service with SysV service script", "Created symlink /etc/systemd/system/sshd.service"] },
  { key: "volumes", label: "Mount volumes", seconds: 0, output: [] },
  { key: "docker", label: "Install Docker", seconds: 18, output: ["Adding Docker official GPG key", "Setting up docker-ce (5:27.3.1-1) ...", "Adding user seba to group docker"] },
  { key: "mise", label: "Install mise", seconds: 3, output: ["mise 2026.9.3 installed to /usr/local/bin/mise"] },
  { key: "mise-packages", label: "Mise packages", seconds: 45, output: ["mise node@22.9.0 installed", "mise python@3.13.2 installed", "mise go@1.24.1 installed"] },
  { key: "custom", label: "Custom commands", seconds: 5, output: ["+ ./scripts/dev-setup.sh", "done"] },
  { key: "services", label: "Start services", seconds: 2, output: ["systemctl start docker", "systemctl enable --now momoi-agent"] },
]
const SKIPPED = "volumes"
const FAILURE = {
  output: ["E: Failed to fetch http://archive.ubuntu.com/ubuntu/pool/main/g/git/git_2.43.0.deb  Connection timed out", "E: Unable to fetch some archives, maybe run apt-get update or try with --fix-missing?"],
  error: "System packages could not be installed",
  causes: ["apt-get install exited with status 100", "archive.ubuntu.com: connection timed out after 30 s", "The machine has no route to the internet. Check the bridged network on the host."],
}

type Run = { status: "idle" | "running" | "done" | "failed"; cursor: number; elapsed: number; stepElapsed: number }
type View = StepItem & { lines: string[]; seconds: number; progress: number | null }

const seconds = (value: number) => value < 1 ? "<1 s" : value < 60 ? `${Math.round(value)} s` : `${Math.floor(value / 60)} min ${Math.round(value % 60)} s`

/* The simulated Host. `failAt` names the step that will fail, if any. */
function useRun(failAt: string | null, speed: number) {
  const [run, setRun] = useState<Run>({ status: "idle", cursor: -1, elapsed: 0, stepElapsed: 0 })
  useEffect(() => {
    if (run.status !== "running") return
    const timer = setInterval(() => setRun(current => {
      const step = PLAN[current.cursor]
      if (!step) return { ...current, status: "done" }
      const stepElapsed = current.stepElapsed + 0.25
      if (stepElapsed < Math.max(step.seconds, 1)) return { ...current, elapsed: current.elapsed + 0.25, stepElapsed }
      if (step.key === failAt) return { ...current, elapsed: current.elapsed + 0.25, stepElapsed, status: "failed" }
      let cursor = current.cursor + 1
      while (PLAN[cursor]?.key === SKIPPED) cursor += 1
      return { status: cursor < PLAN.length ? "running" : "done", cursor, elapsed: current.elapsed + 0.25, stepElapsed: 0 }
    }), 250 / speed)
    return () => clearInterval(timer)
  }, [run.status, failAt, speed])
  const start = () => setRun({ status: "running", cursor: 0, elapsed: 0, stepElapsed: 0 })
  const reset = () => setRun({ status: "idle", cursor: -1, elapsed: 0, stepElapsed: 0 })
  const steps: View[] = useMemo(() => PLAN.map((step, index) => {
    const state: StepState = step.key === SKIPPED && (run.status === "done" || index < run.cursor) ? "skipped"
      : run.status === "done" || index < run.cursor ? "done"
      : index === run.cursor ? (run.status === "failed" ? "failed" : "running") : "pending"
    const total = Math.max(step.seconds, 1)
    const shown = state === "running" ? Math.min(step.output.length, Math.ceil(run.stepElapsed / total * step.output.length)) : step.output.length
    const lines = state === "failed" ? [...step.output, ...FAILURE.output] : step.output.slice(0, shown)
    const meta = state === "done" ? `${seconds(step.seconds)}${lines.length ? ` · ${lines.length} lines` : ""}`
      : state === "failed" ? seconds(step.seconds)
      : state === "pending" && run.status === "failed" ? "Not run" : undefined
    return { key: step.key, label: step.label, state, meta, lines, seconds: step.seconds,
      progress: state === "running" ? run.stepElapsed / total : null }
  }), [run])
  return { run, steps, start, reset }
}

function Output({ step }: { step: View }) {
  if (step.state === "pending") return <p className="muted t-label">Not started yet.</p>
  if (step.state === "skipped") return <p className="muted t-label">Not needed on this machine.</p>
  return <LogView className="gallery-step-log" follow={step.state === "running"} aria-label={`${step.label} output`}>
    {step.lines.map((line, index) => <LogViewLine key={index}>{line}</LogViewLine>)}
    {step.state === "failed" && <>
      <LogViewLine className="log-time">──</LogViewLine>
      <LogViewLine className="log-error">✕ {FAILURE.error}</LogViewLine>
      {FAILURE.causes.map(cause => <LogViewLine key={cause} className="log-error">  ↳ {cause}</LogViewLine>)}
    </>}
  </LogView>
}

function RunControls({ run, start, reset, failAt, setFailAt }: {
  run: Run; start: () => void; reset: () => void; failAt: string | null; setFailAt: (key: string | null) => void
}) {
  const failId = useId()
  return <div className="demo-row">
    <Button size="sm" variant="primary" onClick={start} disabled={run.status === "running"}>
      {run.status === "idle" ? "Start" : "Run again"}
    </Button>
    <Button size="sm" onClick={reset} disabled={run.status === "idle"}>Reset</Button>
    <span className="check-label">
      <Checkbox id={failId} checked={failAt !== null} onCheckedChange={next => setFailAt(next === true ? "packages" : null)} />
      <Label htmlFor={failId}>Fail at System packages</Label>
    </span>
  </div>
}

function RunHeading({ run, steps }: { run: Run; steps: View[] }) {
  const at = steps.find(step => step.state === "failed" || step.state === "running")
  const index = at ? steps.indexOf(at) + 1 : null
  const sub = run.status === "idle" ? "Waiting to start"
    : run.status === "done" ? `Succeeded in ${seconds(run.elapsed)}`
    : run.status === "failed" ? `Stopped at step ${index} of ${steps.length}, ${at?.label}`
    : `Step ${index} of ${steps.length}`
  return <div className="between">
    <div>
      <div className="row"><span className="t-h3">Create</span>
        <Badge variant={run.status === "done" ? "success" : run.status === "failed" ? "danger" : "neutral"}>
          {run.status === "idle" ? "Not started" : run.status === "running" ? "Running" : run.status === "done" ? "Succeeded" : "Failed"}
        </Badge></div>
      <p className="muted t-label">{sub}</p>
    </div>
    {run.status === "failed" && <Button size="sm" variant="primary">Retry create</Button>}
  </div>
}

export function StepListDemo() {
  const [failAt, setFailAt] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const { run, steps, start, reset } = useRun(failAt, 3)
  const current = steps.find(step => step.state === "running" || step.state === "failed")
  const shown = steps.find(step => step.key === picked) ?? current ?? steps[run.status === "done" ? steps.length - 1 : 0]!
  return <div className="stack">
    <RunControls run={run} start={() => { setPicked(null); start() }} reset={() => { setPicked(null); reset() }} failAt={failAt} setFailAt={setFailAt} />
    <RunHeading run={run} steps={steps} />
    <Split className="gallery-step-split">
      <Pane className="gallery-step-pane">
        <StepList label="Create run steps" steps={steps} selected={shown.key} onSelect={setPicked} />
        {current && shown !== current && <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>Back to {current.label}</Button>}
      </Pane>
      <Splitter defaultSize={36} aria-label="Resize the steps and output panes" />
      <Pane className="grow gallery-step-output">{shown && <Output step={shown} />}</Pane>
    </Split>
    <p className="muted t-label">
      Selecting a step shows its output in the pane. The pane keeps its height while lines arrive; only the rail moves.
    </p>
  </div>
}

export function StepBarDemo() {
  const [failAt, setFailAt] = useState<string | null>(null)
  const { run, steps, start, reset } = useRun(failAt, 3)
  const current = steps.find(step => step.state === "running" || step.state === "failed")
  const index = current ? steps.indexOf(current) + 1 : null
  const active = run.status === "running" || run.status === "failed"
  const tone = run.status === "done" ? "success" : run.status === "failed" ? "danger" : "neutral"
  const status = run.status === "idle" ? "Stopped" : run.status === "running" ? "Running" : run.status === "done" ? "Running" : "Failed"
  return <div className="stack">
    <RunControls run={run} start={start} reset={reset} failAt={failAt} setFailAt={setFailAt} />
    <div className="gallery-step-summary">
      <p className="t-caps">Summary tab</p>
      <div className="between t-label"><span className="row"><b>Create</b> <Badge variant={tone}>{status}</Badge></span>
        <span className="mono muted">{run.status === "done" ? seconds(run.elapsed) : index ? `${index} of ${steps.length}` : ""}</span></div>
      <StepBar label="Create" steps={steps} />
      <p className="mono muted t-label truncate">
        {current ? `${current.label}${current.lines.length ? ` · ${current.lines.at(-1)}` : ""}` : run.status === "done" ? "All steps done" : "Waiting"}
      </p>
    </div>
    <div>
      <p className="t-caps">Machines table</p>
      <Table>
        <TableHeader><TableRow><TableHead>Machine</TableHead><TableHead>Status</TableHead><TableHead>Address</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow>
            <TableCell><b>sf-dev-env</b><br /><span className="muted">ubuntu-24.04 · 4 CPU</span></TableCell>
            <TableCell>
              <span className="gallery-step-cell" title={current?.label}>
                <Badge variant={tone}>{active ? `Create · ${status}` : status}</Badge>
                {active && <><StepBar label="Create" steps={steps} /><span className="mono muted t-label">{index}/{steps.length}</span></>}
              </span>
            </TableCell>
            <TableCell className="muted">192.168.5.15</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><b>pg-lab</b><br /><span className="muted">ubuntu-24.04 · 2 CPU</span></TableCell>
            <TableCell><Badge variant="success">Running</Badge></TableCell>
            <TableCell className="muted">192.168.5.22</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="muted t-label">One line, the Badge's height, no ticker. The bar appears only while the action runs or after it fails.</p>
    </div>
  </div>
}
