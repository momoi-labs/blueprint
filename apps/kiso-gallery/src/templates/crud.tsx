import { useState, type FormEvent } from "react";
import { Database, FolderKanban, House, Network, Pencil, Plus, Server, type LucideIcon } from "lucide-react";
import {
  ConsoleShell,
  DetailPage,
  FormField,
  FormPage,
  KV,
  KVKey,
  KVValue,
  Link,
  ListPage,
  Search,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  type ApplicationShellGroup,
  type ConsoleCrumb,
  type PageWidth,
  type StatusTone,
} from "@momoi-labs/kiso-react";

export const consoleScreens = [
  ["list", "List"],
  ["empty", "Empty list"],
  ["edit", "Edit"],
  ["edit-dirty", "Edit with changes"],
  ["create", "Create"],
  ["detail", "Detail"],
] as const;
export type ConsoleScreen = (typeof consoleScreens)[number][0];
export const consoleLayouts: readonly PageWidth[] = ["left", "center", "right", "full"];
export const detailTabs = ["overview", "nodes", "events"] as const;
export type DetailTab = (typeof detailTabs)[number];
export const defaultLayout = (screen: ConsoleScreen): PageWidth =>
  screen === "list" || screen === "empty" || screen === "detail" ? "full" : "left";

type Go = (screen: ConsoleScreen, tab?: DetailTab) => void;

type Cluster = { name: string; state: string; tone: StatusTone; nodes: number };
const clusters: Cluster[] = [
  { name: "main", state: "Ready", tone: "success", nodes: 2 },
  { name: "analytics", state: "Degraded", tone: "danger", nodes: 3 },
  { name: "staging", state: "Stopped", tone: "neutral", nodes: 1 },
];

function ClustersScreen({ state, width, go }: { state: "empty" | "ready"; width: PageWidth; go: Go }) {
  const [query, setQuery] = useState("");
  const rows = clusters.filter(cluster => cluster.name.includes(query));
  return <ListPage
    width={width}
    title="Clusters"
    action={{ label: "Create cluster", icon: <Plus className="icon" aria-hidden="true" />, onClick: () => go("create") }}
    state={state}
    empty={{ title: "No clusters yet", text: "A cluster appears here once you create one." }}
    filters={<div className="list-filters"><Search aria-label="Search clusters" placeholder="Search clusters" value={query} onChange={event => setQuery(event.target.value)} /></div>}
    count={`${rows.length} of ${clusters.length} clusters`}
  >
    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>State</TableHead><TableHead>Nodes</TableHead></TableRow></TableHeader>
    <TableBody>
      {rows.map(cluster => <TableRow key={cluster.name}>
        <TableCell>
          {cluster.name === "main"
            ? <Link href="#" onClick={event => { event.preventDefault(); go("detail"); }}>{cluster.name}</Link>
            : cluster.name}
        </TableCell>
        <TableCell><StatusBadge tone={cluster.tone}>{cluster.state}</StatusBadge></TableCell>
        <TableCell>{cluster.nodes}</TableCell>
      </TableRow>)}
    </TableBody>
  </ListPage>;
}

function EditScreen({ dirtyStart, width }: { dirtyStart: boolean; width: PageWidth }) {
  const [name, setName] = useState(dirtyStart ? "main-2" : "main");
  const [saved, setSaved] = useState("main");
  const dirty = name !== saved;
  const submit = (event: FormEvent) => { event.preventDefault(); setSaved(name); };
  return <FormPage
    width={width}
    title="Edit cluster main"
    mode="edit"
    submitLabel="Save"
    onSubmit={submit}
    onDiscard={() => setName(saved)}
    dirty={dirty}
    message={dirty ? <><strong>Unsaved changes.</strong> Save them before you leave.</> : "Saved."}
  >
    <FormField label="Name" name="name" value={name} onChange={event => setName(event.target.value)} />
    <FormField label="Region" name="region" defaultValue="eu-west-3" />
  </FormPage>;
}

function CreateScreen({ width, go }: { width: PageWidth; go: Go }) {
  return <FormPage
    width={width}
    title="New cluster"
    mode="create"
    submitLabel="Create cluster"
    onSubmit={event => { event.preventDefault(); go("list"); }}
    onCancel={() => go("list")}
  >
    <FormField label="Name" name="name" required />
    <FormField label="Region" name="region" defaultValue="eu-west-3" />
  </FormPage>;
}

const nodes = [
  { name: "main-1", role: "Primary", tone: "success" as StatusTone, state: "Ready" },
  { name: "main-2", role: "Replica", tone: "success" as StatusTone, state: "Ready" },
];

function DetailScreen({ width, tab, go }: { width: PageWidth; tab: DetailTab; go: Go }) {
  return <DetailPage
    width={width}
    title="main"
    action={{ label: "Edit cluster", icon: <Pencil className="icon" aria-hidden="true" />, onClick: () => go("edit") }}
    value={tab}
    onValueChange={next => go("detail", next as DetailTab)}
    tabs={[
      {
        value: "overview",
        label: "Overview",
        content: <KV>
          <KVKey>State</KVKey><KVValue><StatusBadge tone="success">Ready</StatusBadge></KVValue>
          <KVKey>Region</KVKey><KVValue>eu-west-3</KVValue>
          <KVKey>Nodes</KVKey><KVValue>{nodes.length}</KVValue>
        </KV>,
      },
      {
        value: "nodes",
        label: "Nodes",
        content: <TableFrame frame="none">
          <Table aria-label="Nodes of main">
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
            <TableBody>
              {nodes.map(node => <TableRow key={node.name}>
                <TableCell>{node.name}</TableCell>
                <TableCell>{node.role}</TableCell>
                <TableCell><StatusBadge tone={node.tone}>{node.state}</StatusBadge></TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </TableFrame>,
      },
      { value: "events", label: "Events", empty: { title: "No events yet", text: "Events appear here when the cluster changes." } },
    ]}
  />;
}

const icon = (Icon: LucideIcon) => <Icon className="icon" aria-hidden="true" />;

const crumbs: Record<ConsoleScreen, string[]> = {
  list: ["Console", "Clusters"],
  empty: ["Console", "Clusters"],
  edit: ["Console", "Clusters", "main"],
  "edit-dirty": ["Console", "Clusters", "main"],
  create: ["Console", "Clusters", "New cluster"],
  detail: ["Console", "Clusters", "main"],
};

export function ConsoleLayout({ screen, layout, tab, theme, onThemeChange, go }: {
  screen: ConsoleScreen;
  layout: PageWidth;
  tab: DetailTab;
  theme: string;
  onThemeChange: (theme: string) => void;
  go: Go;
}) {
  const navigation: ApplicationShellGroup[] = [
    {
      destinations: [
        { href: "#", label: "Overview", leading: icon(House), onClick: () => undefined },
        { href: "#", label: "Clusters", leading: icon(Network), active: true, onClick: () => go("list") },
        { href: "#", label: "Nodes", leading: icon(Server), onClick: () => undefined },
      ],
    },
    { destinations: [{ href: "#", label: "Projects", leading: icon(FolderKanban), onClick: () => undefined }] },
  ];
  const breadcrumb = crumbs[screen].map((label, index, all): ConsoleCrumb => index === all.length - 1
    ? { label }
    : { label, href: "#", onClick: event => { event.preventDefault(); go("list"); } });
  return <ConsoleShell
    brandMark={<Database className="console-brand-symbol" aria-hidden="true" />}
    brand={<span className="console-brand"><Database className="console-brand-symbol" aria-hidden="true" />Console</span>}
    navigation={navigation}
    breadcrumb={breadcrumb}
    account={{ identity: "alex@example.com", theme, onThemeChange, onSignOut: () => undefined }}
  >
    {screen === "list" || screen === "empty"
      ? <ClustersScreen key={screen} state={screen === "empty" ? "empty" : "ready"} width={layout} go={go} />
      : screen === "edit" || screen === "edit-dirty"
        ? <EditScreen key={screen} dirtyStart={screen === "edit-dirty"} width={layout} />
        : screen === "create"
          ? <CreateScreen width={layout} go={go} />
          : <DetailScreen width={layout} tab={tab} go={go} />}
  </ConsoleShell>;
}
