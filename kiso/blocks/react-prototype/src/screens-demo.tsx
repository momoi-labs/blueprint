import { useState, type FormEvent, type ReactNode } from "react";
import { Archive, Waves } from "lucide-react";
import { CreateProjectForm } from "./forms-demo";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
  Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Form, FormActions, FormField, Lifecycle, Link, LogView, LogViewLevel, LogViewLine,
  LogViewTime, PageHeader, PageHeaderDescription, PageHeaderTitle, Search, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, StatusBadge, Table, TableFrame, TableBody, TableCell, TableHead,
  TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, type StatusTone,
} from "@momoi-labs/kiso-react";

const projects = [
  { name: "Website refresh", owner: "Alex Morgan", status: "Active", tone: "success" },
  { name: "Mobile experience", owner: "Sam Lee", status: "Publishing", tone: "success", pulse: true },
  { name: "Brand guidelines", owner: "Priya Shah", status: "Blocked", tone: "danger" },
  { name: "Customer interviews", owner: "Jo Park", status: "Paused", tone: "neutral" },
] satisfies { name: string; owner: string; status: string; tone: StatusTone; pulse?: boolean }[];

export function LifecycleDemo() {
  return <div className="stack">
    <Lifecycle
      status={<><StatusBadge tone="success">Running</StatusBadge><StatusBadge tone="success">Ready</StatusBadge></>}
      actions={<><Button size="sm" disabled>Start</Button><Button size="sm">Stop</Button><Button size="sm">Restart</Button></>}
      destructive={<Button size="sm" variant="ghost" className="btn-danger-ghost">Remove</Button>}
    />
    <Lifecycle
      status={<StatusBadge tone="success" pulse>Building</StatusBadge>}
      destructive={<Button size="sm" variant="ghost" className="btn-danger-ghost">Delete image</Button>}
    />
  </div>;
}

export function StatusBadgeDemo() {
  return <div className="demo-row">
    <StatusBadge tone="success">Running</StatusBadge>
    <StatusBadge tone="success" pulse>Provisioning</StatusBadge>
    <StatusBadge tone="danger">Failed</StatusBadge>
    <StatusBadge tone="neutral">Stopped</StatusBadge>
    <StatusBadge series={1} icon={Waves} pulse>Streaming</StatusBadge>
    <StatusBadge series="neutral" icon={Archive} pulse>Archiving</StatusBadge>
    <StatusBadge series={4}>Backup scheduled</StatusBadge>
  </div>;
}

/* The create dialog a list opens from its New project button. */
export function CreateProjectDialog({ trigger, fail = false }: { trigger: ReactNode; fail?: boolean }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Create project</DialogTitle><DialogDescription>Give your team a shared space to work.</DialogDescription></DialogHeader>
      <CreateProjectForm fail={fail} onCancel={() => setOpen(false)} />
    </DialogContent>
  </Dialog>;
}

/* The list. A row opens its record when the app gives onOpen; New project
   goes to the create screen when the app gives onCreate, or opens the
   dialog for a small record. */
export function ListScreen({ createFails = false, onOpen, onCreate }: { createFails?: boolean; onOpen?: (name: string) => void; onCreate?: () => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visible = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase())
    && (status === "all" || project.tone === status));
  const filtering = query !== "" || status !== "all";
  const create = <Button size="sm" variant="primary" onClick={onCreate}>New project</Button>;
  return <>
    <PageHeader actions={onCreate ? create : <CreateProjectDialog fail={createFails} trigger={create} />}>
      <PageHeaderTitle asChild><h2>Projects</h2></PageHeaderTitle>
      <PageHeaderDescription>Plan, organize and keep track of your team's work.</PageHeaderDescription>
    </PageHeader>
    <div className="list-filters">
      <Search aria-label="Search projects" placeholder="Search projects" value={query}
        onChange={event => setQuery(event.target.value)} />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="success">Active</SelectItem>
          <SelectItem value="danger">Blocked</SelectItem>
          <SelectItem value="neutral">Paused</SelectItem>
        </SelectContent>
      </Select>
      {filtering ? <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : null}
    </div>
    <TableFrame>
      <Table>
        <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {visible.length ? visible.map(project => <TableRow key={project.name}>
            <TableCell>{onOpen
              ? <Link href={`#${project.name}`} onClick={event => { event.preventDefault(); onOpen(project.name); }}>{project.name}</Link>
              : project.name}</TableCell>
            <TableCell>{project.owner}</TableCell>
            <TableCell><StatusBadge tone={project.tone} pulse={"pulse" in project}>{project.status}</StatusBadge></TableCell>
          </TableRow>) : <TableRow><TableCell colSpan={3} className="muted">No projects match your filters.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="table-footer"><span>{visible.length} of {projects.length} projects</span></div>
    </TableFrame>
  </>;
}

const detailFields = [
  ["Owner", "Alex Morgan"], ["Category", "Design"], ["Due date", "2026-09-18"], ["Priority", "High"], ["Budget", "12000"], ["Repository", "github.com/northstar/website"],
] as const;

/* The record on a screen of its own. Delete confirms first, then the app
   leaves the deleted record through onDeleted. */
export function DetailScreen({ onDeleted }: { onDeleted?: () => void } = {}) {
  const [name, setName] = useState("Website refresh");
  const [saved, setSaved] = useState(name);
  const dirty = name !== saved;
  function save(event: FormEvent) { event.preventDefault(); setSaved(name); }
  return <>
    <div className="between">
      <PageHeader>
        <PageHeaderTitle asChild><h2>{saved}</h2></PageHeaderTitle>
        <PageHeaderDescription>Owned by Alex Morgan, due Sep 18.</PageHeaderDescription>
      </PageHeader>
      <Lifecycle
        status={<><StatusBadge tone="success">Active</StatusBadge><StatusBadge tone="success">On track</StatusBadge></>}
        actions={<><Button size="sm" disabled>Resume</Button><Button size="sm">Pause</Button><Button size="sm">Publish</Button></>}
        destructive={<AlertDialog>
          <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="btn-danger-ghost">Delete project</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <div className="dialog-scroll">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{saved}"?</AlertDialogTitle>
                <AlertDialogDescription>The project, its tasks and its activity are removed. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDeleted}>Delete project</AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>}
      />
    </div>
    <Card className="detail-tabs">
      <Tabs defaultValue="settings">
        <TabsList aria-label="Project details">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <Form onSubmit={save}>
            <div className="form-body">
              <FormField label="Name" name="name" value={name} onChange={event => setName(event.target.value)} />
              {detailFields.map(([label, value]) =>
                <FormField key={label} label={label} name={label} type={label === "Due date" ? "date" : label === "Budget" ? "number" : undefined} defaultValue={value} />)}
            </div>
            <FormActions sticky tone={dirty ? "warning" : "neutral"}
              message={dirty ? <><strong>Unsaved changes.</strong> Save them before you leave.</> : "Saved."}>
              {dirty ? <Button size="sm" onClick={() => setName(saved)}>Discard</Button> : null}
              <Button size="sm" type="submit" variant="primary" disabled={!dirty}>Save</Button>
            </FormActions>
          </Form>
        </TabsContent>
        <TabsContent value="activity" className="detail-logs">
          <LogView follow>
            {Array.from({ length: 60 }, (_, index) => <LogViewLine key={index}>
              <LogViewTime>{`09:41:${String(index).padStart(2, "0")}`}</LogViewTime>
              <LogViewLevel level="info">INFO </LogViewLevel> page {index + 1} of the draft synced
            </LogViewLine>)}
          </LogView>
        </TabsContent>
      </Tabs>
    </Card>
  </>;
}

/* A record with a recipe: long enough that the dialog is the wrong place. */
/* The create screen. With fail, the first submit fails and the retry
   succeeds with the entries kept. Cancel and a created record leave the
   screen through the app's callbacks. */
export function CreateScreen({ fail = false, onCancel, onCreated }: { fail?: boolean; onCancel?: () => void; onCreated?: () => void } = {}) {
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [attempts, setAttempts] = useState(0);
  const section = (title: string, fields: ReactNode) =>
    <section className="stack" aria-label={title}><h3 className="t-h3">{title}</h3>{fields}</section>;
  const select = (label: string, name: string, options: string[]) =>
    <Select name={name} defaultValue={options[0]}>
      <FormField label={label}><SelectTrigger><SelectValue /></SelectTrigger></FormField>
      <SelectContent>{options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>;
  function submit(event: FormEvent) {
    event.preventDefault();
    const failing = fail && attempts === 0;
    setAttempts(count => count + 1);
    setStatus(failing ? "error" : "success");
    if (!failing) onCreated?.();
  }
  const message = status === "error" ? <><strong>Request failed.</strong> Your entries are kept. Try again.</>
    : status === "success" ? <strong>Project created.</strong> : undefined;
  return <>
    <PageHeader>
      <PageHeaderTitle asChild><h2>New project</h2></PageHeaderTitle>
      <PageHeaderDescription>A name, an owner, a schedule and the people on it.</PageHeaderDescription>
    </PageHeader>
    <Card className="form-page">
      <Form onSubmit={submit} aria-label="New project">
        <div className="form-body">
          {section("Basics", <>
            <FormField label="Name" name="name" required />
            <FormField label="Owner" name="owner" required />
            <FormField label="Description" name="description" hint="One sentence your team will read first." />
          </>)}
          {section("Schedule", <>
            <FormField label="Start date" name="start" type="date" />
            <FormField label="Due date" name="due" type="date" />
            {select("Priority", "priority", ["Medium", "High", "Low"])}
          </>)}
          {section("Team", <>
            {select("Category", "category", ["Design", "Content", "Research", "Product"])}
            <FormField label="Repository" name="repository" placeholder="github.com/northstar/website" />
            {select("Who can invite members?", "access", ["Admins only", "All members"])}
          </>)}
          {section("Budget", <>
            <FormField label="Budget" name="budget" type="number" />
            {select("Currency", "currency", ["USD", "BRL", "EUR"])}
            <FormField label="Cost center" name="cost-center" />
          </>)}
          {section("Notifications", <>
            <FormField label="Notification email" name="email" type="email" />
            {select("Email digest", "digest", ["Weekly", "Daily", "Never"])}
          </>)}
        </div>
        <FormActions sticky tone={status === "error" ? "danger" : "neutral"} message={message}>
          <Button size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" type="submit" variant="primary">Create project</Button>
        </FormActions>
      </Form>
    </Card>
  </>;
}
