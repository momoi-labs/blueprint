import { useState } from "react";
import { Archive, Database, Network, Pencil, Plus, Waves } from "lucide-react";
import {
  Button,
  ConsoleShell,
  DetailPage,
  FormField,
  FormPage,
  KV,
  KVKey,
  KVValue,
  Lifecycle,
  ListPage,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";

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

const clusters = [
  { name: "main", state: "Ready", tone: "success" as const },
  { name: "staging", state: "Stopped", tone: "neutral" as const },
];

function ClusterRows() {
  return <>
    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
    <TableBody>
      {clusters.map(cluster => <TableRow key={cluster.name}>
        <TableCell>{cluster.name}</TableCell>
        <TableCell><StatusBadge tone={cluster.tone}>{cluster.state}</StatusBadge></TableCell>
      </TableRow>)}
    </TableBody>
  </>;
}

const createAction = { label: "Create cluster", icon: <Plus className="icon" aria-hidden="true" /> };
const empty = { title: "No clusters yet", text: "A cluster appears here once you create one." };

export function ConsoleShellDemo() {
  const [theme, setTheme] = useState("system");
  return <div className="gallery-console-preview">
    <ConsoleShell
      brand={<span className="t-label">Console</span>}
      brandMark={<Database className="icon" aria-hidden="true" />}
      navigationLabel="Example console navigation"
      navigation={[{ destinations: [{ href: "#components/console-shell", label: "Clusters", leading: <Network className="icon" aria-hidden="true" />, active: true }] }]}
      breadcrumb={[{ label: "Console", href: "#components/console-shell" }, { label: "Clusters" }]}
      account={{ identity: "alex@example.com", theme, onThemeChange: setTheme, onSignOut: () => undefined }}
    >
      <ListPage title="Clusters" action={createAction} state="ready" empty={empty}><ClusterRows /></ListPage>
    </ConsoleShell>
  </div>;
}

export function ListPageDemo() {
  const [state, setState] = useState<"loading" | "empty" | "ready">("ready");
  return <div className="stack">
    <label className="field">State<select className="select" value={state} onChange={event => setState(event.target.value as typeof state)}><option value="ready">Ready</option><option value="empty">Empty</option><option value="loading">Loading</option></select></label>
    <div className="page">
      <ListPage title="Clusters" action={createAction} state={state} empty={empty} count="2 of 2 clusters"><ClusterRows /></ListPage>
    </div>
  </div>;
}

export function FormPageDemo() {
  const [name, setName] = useState("main");
  const [saved, setSaved] = useState("main");
  const dirty = name !== saved;
  return <div className="page">
    <FormPage
      title="Edit cluster main"
      mode="edit"
      submitLabel="Save"
      onSubmit={event => { event.preventDefault(); setSaved(name); }}
      onDiscard={() => setName(saved)}
      dirty={dirty}
      message={dirty ? "Unsaved changes." : "Saved."}
    >
      <FormField label="Name" name="name" value={name} onChange={event => setName(event.target.value)} />
    </FormPage>
  </div>;
}

export function DetailPageDemo() {
  return <div className="page">
    <DetailPage
      title="main"
      action={{ label: "Edit cluster", icon: <Pencil className="icon" aria-hidden="true" /> }}
      tabs={[
        { value: "overview", label: "Overview", content: <KV><KVKey>State</KVKey><KVValue><StatusBadge tone="success">Ready</StatusBadge></KVValue><KVKey>Region</KVKey><KVValue>eu-west-3</KVValue></KV> },
        { value: "events", label: "Events", empty: { title: "No events yet", text: "Events appear here when the cluster changes." } },
      ]}
    />
  </div>;
}
