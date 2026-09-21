// Catalogue previews. Every entry renders the published component, so the
// gallery cannot drift from what @momoi-labs/kiso-react ships.
import { MetricsDemo } from "./metrics-demo";
import { StepBarDemo, StepListDemo } from "./steps-demo";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AccentSelector,
  type Accent,
  Alert,
  AlertContent,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AppShell,
  AppShellMain,
  ApplicationShell,
  Badge,
  BrandMark,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  Chip,
  ChipInput,
  ChipInputBox,
  ChipInputEmpty,
  ChipInputField,
  ChipInputList,
  ChipInputOption,
  ChipName,
  ChipOption,
  ChipOptionAdd,
  ChipRemove,
  ChipScope,
  ChipValue,
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dot,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
  FormField,
  Header,
  Input,
  KV,
  KVKey,
  KVValue,
  Label,
  Link,
  LogView,
  LogViewLevel,
  LogViewLine,
  LogViewTime,
  Navigation,
  NavigationGroup,
  NavigationItem,
  NavigationLink,
  NavigationList,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Pagination,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
  Pane,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  Skeleton,
  Sparkline,
  Spinner,
  Split,
  Splitter,
  Stat,
  StatDelta,
  StatFoot,
  StatHeader,
  StatLabel,
  StatValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TerminalIcon,
  Textarea,
  ThemeSelector,
  Toasts,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ValidationMessage,
  useToast,
} from "@momoi-labs/kiso-react";

const catalog = [
  ["button", "Button", "Controls", "Variants, sizes, disabled and loading."],
  [
    "icon-button",
    "IconButton",
    "Controls",
    "Compact actions with accessible names.",
  ],
  ["input", "Input", "Controls", "Default, disabled and invalid fields."],
  ["textarea", "Textarea", "Controls", "Multi-line text and configuration."],
  [
    "select",
    "Select",
    "Controls",
    "Single selection with keyboard navigation.",
  ],
  [
    "checkbox",
    "Checkbox",
    "Controls",
    "Checked, unchecked, mixed and disabled.",
  ],
  ["switch", "Switch", "Controls", "An immediately applied boolean setting."],
  [
    "chip-input",
    "ChipInput",
    "Controls",
    "Several structured values in one field.",
  ],
  ["label", "Label", "Forms", "A visible, associated field name."],
  [
    "form-field",
    "FormField",
    "Forms",
    "Label, control, helper text and validation together.",
  ],
  ["helper-text", "HelperText", "Forms", "Instructions that remain visible."],
  [
    "validation-message",
    "ValidationMessage",
    "Forms",
    "A recoverable field error.",
  ],
  ["search", "Search", "Data", "Filter a visible collection."],
  ["badge", "Badge", "Data", "Neutral, info, success, warning and danger."],
  [
    "table",
    "Table / DataTable",
    "Data",
    "Records, native headers and row actions.",
  ],
  ["empty-state", "EmptyState", "Data", "No items and a useful next action."],
  ["stat", "Stat", "Data", "One figure and how it is moving."],
  ["sparkline", "Sparkline", "Data", "One metric's shape at cell size."],
  ["chart", "Chart", "Data", "Lines, stacked areas, gaps, and synchronized inspection."],
  ["chart-legend", "ChartLegend", "Data", "Per-series minimum, maximum, average, and current."],
  ["meter", "Meter / Progress", "Feedback", "Measured ratios and task completion."],
  ["bar-gauge", "BarGauge", "Data", "Labelled bars on a shared scale."],
  ["disclosure", "Disclosure", "Structure", "Native collapsible sections."],
  ["time-range-control", "TimeRangeControl", "Controls", "Presets and exact collection windows."],
  ["dashboard-grid", "DashboardGrid", "Structure", "Responsive panels on twelve columns."],
  ["kv", "KV", "Data", "Fixed facts as terms and values."],
  ["dot", "Dot", "Data", "Status as a mark beside a name."],
  ["log-view", "LogView", "Data", "Streamed output that follows the tail."],
  ["step-list", "StepList", "Data", "A run's steps with a state, a timing and an output."],
  ["step-bar", "StepBar", "Data", "The same run as one segment per step."],
  ["card", "Card", "Structure", "Header, body and footer with corner marks."],
  [
    "page-header",
    "PageHeader",
    "Structure",
    "A title, context and page actions.",
  ],
  ["header", "Header", "Structure", "Shared navigation and global status."],
  ["brand-mark", "BrandMark", "Structure", "A decorative letter or product icon."],
  [
    "sidebar",
    "Sidebar",
    "Structure",
    "Grouped destinations and current location.",
  ],
  [
    "app-shell",
    "ApplicationShell",
    "Structure",
    "Console with a sidebar rail, or a single-surface top bar.",
  ],
  [
    "split",
    "Split / Pane / Splitter",
    "Structure",
    "List and detail either side of a resizable divider.",
  ],
  ["separator", "Separator", "Structure", "A rule between groups, either axis."],
  [
    "navigation",
    "Navigation",
    "Navigation",
    "Semantic links and active destinations.",
  ],
  ["breadcrumb", "Breadcrumb", "Navigation", "Location within the console."],
  ["link", "Link", "Navigation", "Navigation using a real anchor."],
  ["tabs", "Tabs", "Navigation", "Related panels with arrow-key navigation."],
  ["pagination", "Pagination", "Navigation", "Move between known pages."],
  [
    "theme-selector",
    "ThemeSelector",
    "Navigation",
    "Follow system, light and dark.",
  ],
  [
    "accent-selector",
    "AccentSelector",
    "Navigation",
    "Violet, terracotta, teal, cobalt and nocturne.",
  ],
  ["alert", "Alert", "Feedback", "Persistent information, success and errors."],
  ["spinner", "Spinner", "Feedback", "An operation in progress."],
  ["skeleton", "Skeleton", "Feedback", "The shape of content while loading."],
  ["toast", "Toast", "Feedback", "Transient feedback with dismissal."],
  [
    "modal-dialog",
    "Modal / Dialog",
    "Overlays",
    "Task dialogs and destructive confirmations.",
  ],
  ["drawer", "Drawer", "Overlays", "A task panel at the viewport edge."],
  [
    "popover",
    "Popover",
    "Overlays",
    "Contextual content anchored to a control.",
  ],
  [
    "dropdown-menu",
    "DropdownMenu",
    "Overlays",
    "Contextual actions and keyboard focus.",
  ],
  ["tooltip", "Tooltip", "Overlays", "A nonessential hint on hover or focus."],
  [
    "command-palette",
    "CommandPalette",
    "Overlays",
    "Search commands and destinations from the keyboard.",
  ],
] as const;

type CatalogId = (typeof catalog)[number][0];

// Cards take one column of the browse grid unless listed here.
// "wide" takes two columns, "full" takes the whole row.
const catalogSize: Partial<Record<CatalogId, "wide" | "full">> = {
  textarea: "wide",
  select: "wide",
  "chip-input": "wide",
  "time-range-control": "wide",
  "form-field": "wide",
  table: "wide",
  chart: "wide",
  "chart-legend": "wide",
  "log-view": "wide",
  "step-list": "wide",
  "step-bar": "wide",
  alert: "wide",
  "dashboard-grid": "wide",
  "page-header": "wide",
  header: "wide",
  "app-shell": "wide",
  split: "wide",
  breadcrumb: "wide",
  tabs: "wide",
  pagination: "wide",
  "modal-dialog": "wide",
  drawer: "wide",
  "command-palette": "wide",
};

const snippets: Record<string, string> = {
  "chip-input":
    '<ChipInput>\n  <ChipInputBox>\n    <Chip>\n      <ChipName>npm:t3</ChipName>\n      <ChipValue value="latest" onCommit={setVersion} />\n      <ChipOptions label="npm:t3 options" count={1}>\n        <FormField label="allow_builds" value={allowBuilds} onChange={...} />\n      </ChipOptions>\n      <ChipRemove aria-label="Remove npm:t3" onClick={remove} />\n    </Chip>\n    <ChipInputField value={query} onChange={...} onRemoveLast={removeLast} />\n  </ChipInputBox>\n  <ChipInputList aria-label="Dependency suggestions">\n    <ChipInputOption onSelect={add}>node</ChipInputOption>\n  </ChipInputList>\n</ChipInput>',
  "brand-mark":
    '<div className="brand">\n  <BrandMark>N</BrandMark>\n  <span>Northstar</span>\n</div>\n<div className="brand">\n  <BrandMark><TerminalIcon /></BrandMark>\n  <span>Kiso 基礎</span>\n</div>',
  button:
    '<Button variant="primary">Create project</Button>\n<Button variant="destructive">Remove</Button>\n<Button size="sm" disabled>Unavailable</Button>',
  "icon-button":
    '<Button variant="ghost" className="btn-icon" aria-label="Add project">\n  <PlusIcon aria-hidden="true" />\n</Button>',
  input: '<Input aria-label="Project name" placeholder="my-project" />',
  textarea:
    '<Label htmlFor="notes">Notes</Label>\n<Textarea id="notes" rows={4} />',
  select:
    '<Select defaultValue="English" onValueChange={setLanguage}>\n  <SelectTrigger aria-label="Language"><SelectValue /></SelectTrigger>\n  <SelectContent>\n    <SelectItem value="English">English</SelectItem>\n  </SelectContent>\n</Select>',
  checkbox:
    '<Checkbox id="platform" checked={checked} onCheckedChange={setChecked} />\n<Label htmlFor="platform">Show platform services</Label>',
  switch:
    '<Switch id="notifications" checked={on} onCheckedChange={setOn} />\n<Label htmlFor="notifications">Email notifications</Label>',
  "form-field":
    '<FormField label="Compose file" hint="Docker Compose YAML." error={error}>\n  <Textarea rows={8} />\n</FormField>',
  label: '<Label htmlFor="name">Project name</Label>\n<Input id="name" />',
  "helper-text":
    '<FormField label="Name" hint="Use lowercase letters, numbers and hyphens." />',
  "validation-message":
    '<Input aria-invalid="true" aria-describedby="name-error" />\n<ValidationMessage id="name-error">\n  Use lowercase letters, numbers and hyphens.\n</ValidationMessage>',
  search:
    '<Search aria-label="Search projects" placeholder="Search by name..."\n  value={query} onChange={(e) => setQuery(e.target.value)} />',
  badge: '<Badge variant="success">Running</Badge>',
  "empty-state":
    '<EmptyState variant="first-run">\n  <EmptyStateTitle>No projects yet</EmptyStateTitle>\n  <EmptyStateDescription>Create your first project.</EmptyStateDescription>\n  <EmptyStateActions>\n    <Button variant="primary">Create project</Button>\n  </EmptyStateActions>\n</EmptyState>',
  card: "<Card>\n  <CardHeader><h2>Project</h2></CardHeader>\n  <CardContent>Configuration</CardContent>\n  <CardFooter><Button>Save</Button></CardFooter>\n</Card>",
  "page-header":
    '<PageHeader actions={<Button variant="primary">Create project</Button>}>\n  <PageHeaderTitle>Projects</PageHeaderTitle>\n  <PageHeaderDescription>2 projects in your workspace</PageHeaderDescription>\n</PageHeader>',
  sidebar:
    "<Sidebar>\n  <SidebarHeader>{brand}</SidebarHeader>\n  <SidebarBody>\n    <Navigation aria-label=\"Projects\">\n      <NavigationGroup label=\"Projects\">\n        <NavigationList>\n          <NavigationItem>\n            <NavigationLink href=\"#components/sidebar\" active>Website</NavigationLink>\n          </NavigationItem>\n        </NavigationList>\n      </NavigationGroup>\n    </Navigation>\n  </SidebarBody>\n</Sidebar>",
  navigation:
    '<Navigation aria-label="Primary">\n  <NavigationList>\n    <NavigationItem>\n      <NavigationLink href="#components/app-shell" active>Overview</NavigationLink>\n    </NavigationItem>\n  </NavigationList>\n</Navigation>',
  breadcrumb:
    '<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href="#">Workspace</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>Website refresh</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>',
  link: '<Link href="#components/app-shell">Open workspace</Link>\n<Link variant="standalone" href="#components/link" active>Workspace setup</Link>',
  "theme-selector": "<ThemeSelector theme={theme} onChange={setTheme} />",
  "accent-selector": "<AccentSelector accent={accent} onChange={setAccent} />",
  alert:
    '<Alert variant="error">\n  <AlertContent>\n    <AlertTitle>Could not save</AlertTitle>\n    <AlertDescription>The request failed. Try again.</AlertDescription>\n  </AlertContent>\n</Alert>',
  spinner:
    '<Spinner size="sm" />\n<Spinner label="Saving project" />',
  skeleton:
    '<div aria-busy="true" aria-label="Loading project">\n  <Skeleton variant="text" style={{ width: "45%" }} />\n  <Skeleton variant="block" style={{ height: "6rem" }} />\n</div>',
  toast:
    '<Toasts>\n  <Application />\n</Toasts>\n\nconst notify = useToast();\nnotify("success", "Changes saved", "Your project has been updated.");',
  drawer:
    '<Drawer>\n  <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>\n  <DrawerContent placement="side">\n    <DrawerHeader><DrawerTitle>Edit project</DrawerTitle></DrawerHeader>\n    <DrawerBody>{form}</DrawerBody>\n  </DrawerContent>\n</Drawer>',
  "command-palette":
    '<CommandPalette open={open} onOpenChange={setOpen}>\n  <CommandPaletteInput value={query} onChange={(e) => setQuery(e.target.value)} />\n  <CommandPaletteList>\n    <CommandPaletteGroup heading="Navigation">\n      <CommandPaletteItem onSelect={openOverview}>Open overview</CommandPaletteItem>\n    </CommandPaletteGroup>\n  </CommandPaletteList>\n</CommandPalette>',
  dot: '<span className="row success t-label">\n  <Dot pulse />\n  <span className="fg">Platform healthy</span>\n</span>',
  stat: "<Stat>\n  <StatHeader>\n    <StatLabel>Projects</StatLabel>\n    <StatDelta variant=\"success\">+2</StatDelta>\n  </StatHeader>\n  <StatValue>4</StatValue>\n  <StatFoot>3 active \u00b7 1 archived</StatFoot>\n</Stat>",
  sparkline:
    '<Sparkline values={cpu} height={28} tone="primary" fill\n  label="CPU trend with a collection gap and a measured zero" />\n<Sparkline values={memory} height={18} />',
  kv: "<KV>\n  <KVKey>Owner</KVKey>\n  <KVValue>Alex Morgan</KVValue>\n</KV>",
  separator: '<Separator />\n<Separator orientation="vertical" />',
  split: "<Split>\n  <Pane>{list}</Pane>\n  <Splitter defaultSize={42} aria-label=\"Resize the panes\" />\n  <Pane className=\"grow\">{detail}</Pane>\n</Split>",
  "step-list": '<Split>\n  <Pane>\n    <StepList label="Create run steps" steps={steps} selected={picked} onSelect={setPicked} />\n  </Pane>\n  <Splitter defaultSize={36} aria-label="Resize the steps and output panes" />\n  <Pane className="grow"><LogView follow>{lines}</LogView></Pane>\n</Split>',
  "step-bar": '<StepBar label="Create" steps={steps} />\n<span className="mono muted">4 of 11</span>',
  "log-view": "<LogView follow={follow} onFollowChange={setFollow}>\n  <LogViewLine>\n    <LogViewTime>09:41:02.114</LogViewTime>\n    <LogViewLevel level=\"warn\">WARN </LogViewLevel> redis unavailable\n  </LogViewLine>\n</LogView>",
  "app-shell":
    '<ApplicationShell brand={brand} navigation={groups} header={header}>\n  {page}\n</ApplicationShell>\n\n<ApplicationShell layout="topbar" brand={brand} primaryAction={action} header={chrome}>\n  {page}\n</ApplicationShell>',
};

function ToastDemoButton() {
  const notify = useToast();
  return (
    <Button
      onClick={() =>
        notify("success", "Changes saved", "Your project has been updated.")
      }
    >
      Show notification
    </Button>
  );
}

function Plus() {
  return (
    <svg
      className="icon icon-sm"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}

function TaskDialog() {
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className="stack-sm">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Edit project</Button>
        </DialogTrigger>
        <DialogContent>
          <form
            className="dialog-scroll"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(true);
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit project</DialogTitle>
              <DialogDescription>
                Update the example project name.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <FormField label="Name" defaultValue="Website refresh" required />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="muted t-label" role="status">
        {saved ? "Example changes saved." : ""}
      </p>
    </div>
  );
}

const commands = [
  ["Open overview", "Navigation"],
  ["Open workspace setup", "Navigation"],
  ["Create project", "Actions"],
  ["Manage API keys", "Actions"],
] as const;

function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const matches = commands.filter(([label]) =>
    label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="stack">
      <div className="demo-row">
        <Button
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
        >
          Open command palette
        </Button>
        <p className="muted t-label">
          Arrow keys move the highlight, Enter runs, Escape closes.
        </p>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen}>
        <CommandPaletteInput
          placeholder="Type a command or destination..."
          aria-label="Find a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <CommandPaletteList>
          {["Navigation", "Actions"].map((group) =>
            matches.some(([, name]) => name === group) ? (
              <CommandPaletteGroup key={group} heading={group}>
                {matches
                  .filter(([, name]) => name === group)
                  .map(([label]) => (
                    <CommandPaletteItem
                      key={label}
                      onSelect={() => {
                        setMessage(`${label} selected.`);
                        setOpen(false);
                      }}
                    >
                      {label}
                    </CommandPaletteItem>
                  ))}
              </CommandPaletteGroup>
            ) : null,
          )}
          {matches.length === 0 && (
            <CommandPaletteEmpty>No matching commands.</CommandPaletteEmpty>
          )}
        </CommandPaletteList>
      </CommandPalette>
      <p className="muted t-label" role="status">
        {message}
      </p>
    </div>
  );
}

type LogLine = {
  time: string;
  level: "info" | "warn" | "error";
  label: string;
  text: string;
};

const exampleLog: LogLine[] = [
  { time: "09:41:02.114", level: "info", label: "INFO ", text: "Sample service starting" },
  { time: "09:41:02.482", level: "info", label: "INFO ", text: "applying migrations" },
  { time: "09:41:03.901", level: "warn", label: "WARN ", text: "redis unavailable, falling back to the in-process queue" },
  { time: "09:41:04.120", level: "error", label: "ERROR", text: "could not open /usr/src/data: permission denied" },
  { time: "09:41:04.121", level: "error", label: "ERROR", text: "exiting with status 1" },
  { time: "09:46:04.310", level: "info", label: "INFO ", text: "restart 3/5" },
  { time: "09:46:04.998", level: "info", label: "INFO ", text: "Sample service starting" },
];

function LogViewDemo() {
  const followId = useId();
  const [follow, setFollow] = useState(true);
  const [lines, setLines] = useState(exampleLog);
  return (
    <div className="stack-sm">
      <div className="between">
        <div className="check-label">
          <Checkbox
            id={followId}
            checked={follow}
            onCheckedChange={(next) => setFollow(next === true)}
          />
          <Label htmlFor={followId}>Follow</Label>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                time: new Date().toTimeString().slice(0, 8),
                level: "info",
                label: "INFO ",
                text: `health check ${current.length - exampleLog.length + 1} passed`,
              },
            ])
          }
        >
          Append line
        </Button>
      </div>
      <LogView
        className="gallery-log-preview"
        follow={follow}
        onFollowChange={setFollow}
        aria-label="Example project log"
      >
        {lines.map((line, i) => (
          <LogViewLine key={`${line.time}-${i}`}>
            <LogViewTime>{line.time}</LogViewTime>
            <LogViewLevel level={line.level}>{line.label}</LogViewLevel>{" "}
            {line.text}
          </LogViewLine>
        ))}
      </LogView>
      <p className="muted t-label">
        Appending pins the view to the end while Follow is on. Scrolling away
        turns it off.
      </p>
    </div>
  );
}

// mise knowledge belongs to the product, not to Kiso. ChipInput ships the
// field; this demo ships the package manager it happens to configure.
type Dependency = {
  id: string;
  backend: string;
  name: string;
  version: string;
  options: Record<string, string>;
};

const miseBackends: [string, string][] = [
  ["npm", "npm package"],
  ["cargo", "Rust crate"],
  ["pipx", "Python application"],
  ["go", "Go module"],
  ["gem", "Ruby gem"],
  ["aqua", "aqua registry"],
  ["github", "GitHub release"],
  ["apt", "Debian package on the host"],
  ["brew", "Homebrew formula on the host"],
];

const miseRegistry: [string, string][] = [
  ["node", "Node.js"],
  ["python", "CPython"],
  ["rust", "Rust toolchain"],
  ["deno", "Deno"],
  ["bun", "Bun"],
  ["claude-code", "Claude Code"],
  ["ripgrep", "ripgrep"],
  ["jq", "jq"],
];

// apt and brew install with the host package manager, so they land in
// [bootstrap.packages] and take no build options.
const hostManagers = new Set(["apt", "brew", "dnf", "pacman", "apk"]);

const backendOptions: Record<string, string[]> = {
  npm: ["allow_builds", "allow_low_downloads"],
  cargo: ["features", "locked"],
  pipx: ["uvx"],
  github: ["version_order"],
};

const optionHints: Record<string, string> = {
  allow_builds: "node-pty, esbuild",
  allow_low_downloads: "true",
  features: "postgres, rustls",
  locked: "false",
  uvx: "true",
  version_order: "semver",
  os: "linux, macos",
  depends: "node",
  postinstall: "corepack enable",
};

function optionNames(backend: string) {
  if (hostManagers.has(backend)) return ["os"];
  return [...(backendOptions[backend] ?? []), "os", "depends", "postinstall"];
}

// mise takes these as arrays even with a single entry.
const listOptions = new Set(["allow_builds", "features", "os", "depends"]);

// The chip writes options the way mise.toml writes them, one segment each, so
// a chip can be read and typed as a single line of configuration.
function parseOption(text: string) {
  const at = text.indexOf("=");
  if (at < 1) return null;
  const name = text.slice(0, at).trim();
  const value = text
    .slice(at + 1)
    .trim()
    .replace(/^\[|\]$/g, "")
    .trim();
  return name ? { name, value } : null;
}

function tomlValue(name: string, raw: string) {
  if (raw === "true" || raw === "false") return raw;
  if (listOptions.has(name)) {
    const parts = raw.split(",").map((part) => `"${part.trim()}"`);
    return `[${parts.join(", ")}]`;
  }
  return `"${raw}"`;
}

function tomlLine(dep: Dependency) {
  const key = dep.backend ? `"${dep.id}"` : dep.id;
  const set = Object.entries(dep.options).filter(([, value]) => value.trim());
  if (!set.length) return `${key} = "${dep.version}"`;
  const options = set
    .map(([name, value]) => `${name} = ${tomlValue(name, value.trim())}`)
    .join(", ");
  return `${key} = { version = "${dep.version}", ${options} }`;
}

function miseToml(deps: Dependency[]) {
  const tools = deps.filter((dep) => !hostManagers.has(dep.backend));
  const host = deps.filter((dep) => hostManagers.has(dep.backend));
  const sections = [];
  if (tools.length) {
    sections.push(["[tools]", ...tools.map(tomlLine)].join("\n"));
  }
  if (host.length) {
    sections.push(["[bootstrap.packages]", ...host.map(tomlLine)].join("\n"));
  }
  return sections.join("\n\n") || "# No dependencies yet.";
}

function ChipInputDemo() {
  const fieldId = useId();
  const [deps, setDeps] = useState<Dependency[]>([
    { id: "node", backend: "", name: "node", version: "latest", options: {} },
    {
      id: "npm:t3",
      backend: "npm",
      name: "t3",
      version: "latest",
      options: { allow_builds: "node-pty" },
    },
    {
      id: "claude-code",
      backend: "",
      name: "claude-code",
      version: "latest",
      options: {},
    },
    {
      id: "apt:libssl-dev",
      backend: "apt",
      name: "libssl-dev",
      version: "latest",
      options: {},
    },
  ]);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  function add(backend: string, name: string) {
    if (!name) return;
    const id = backend ? `${backend}:${name}` : name;
    setQuery("");
    setDeps((current) =>
      current.some((dep) => dep.id === id)
        ? current
        : [...current, { id, backend, name, version: "latest", options: {} }],
    );
  }

  function update(id: string, change: Partial<Dependency>) {
    setDeps((current) =>
      current.map((dep) => (dep.id === id ? { ...dep, ...change } : dep)),
    );
  }

  const known = new Set(deps.map((dep) => dep.id));
  const separator = trimmed.indexOf(":");
  let suggestions: { key: string; label: string; hint: string; select: () => void }[] = [];
  if (separator > 0) {
    const backend = trimmed.slice(0, separator);
    const name = trimmed.slice(separator + 1).trim();
    const entry = miseBackends.find(([id]) => id === backend);
    if (entry && name && !known.has(`${backend}:${name}`)) {
      suggestions = [
        {
          key: trimmed,
          label: `${backend}:${name}`,
          hint: entry[1],
          select: () => add(backend, name),
        },
      ];
    }
  } else if (trimmed) {
    const needle = trimmed.toLowerCase();
    suggestions = [
      ...miseRegistry
        .filter(([name]) => name.includes(needle) && !known.has(name))
        .map(([name, hint]) => ({
          key: name,
          label: name,
          hint,
          select: () => add("", name),
        })),
      ...miseBackends
        .filter(([id]) => id.startsWith(needle))
        .map(([id, hint]) => ({
          key: `${id}:`,
          label: `${id}:`,
          hint: `${hint}, keep typing the name`,
          select: () => setQuery(`${id}:`),
        })),
    ];
  }

  return (
    <div className="stack">
      <div className="field">
        <Label htmlFor={fieldId}>Dependencies</Label>
        <ChipInput>
          <ChipInputBox>
            {deps.map((dep) => (
                <Chip key={dep.id}>
                  {dep.backend ? <ChipScope>{dep.backend}</ChipScope> : null}
                  <ChipName>{dep.name}</ChipName>
                  <ChipValue
                    value={dep.version}
                    editLabel={`Edit ${dep.id} version, currently ${dep.version}`}
                    confirmLabel={`Confirm ${dep.id} version`}
                    onCommit={(version) => update(dep.id, { version })}
                  />
                  {Object.entries(dep.options).map(([name, value]) => (
                    <ChipOption
                      key={name}
                      name={name}
                      value={
                        listOptions.has(name)
                          ? value.split(",").map((part) => part.trim())
                          : value
                      }
                      label={dep.id}
                      onCommit={(text) => {
                        const next = { ...dep.options };
                        delete next[name];
                        const parsed = parseOption(text);
                        if (parsed?.value) next[parsed.name] = parsed.value;
                        update(dep.id, { options: next });
                      }}
                    />
                  ))}
                  <ChipOptionAdd
                    label={dep.id}
                    onCommit={(text) => {
                      const parsed = parseOption(text);
                      if (!parsed?.value) return;
                      update(dep.id, {
                        options: { ...dep.options, [parsed.name]: parsed.value },
                      });
                    }}
                  />
                  <ChipRemove
                    aria-label={`Remove ${dep.id}`}
                    onClick={() =>
                      setDeps((current) =>
                        current.filter((item) => item.id !== dep.id),
                      )
                    }
                  />
                </Chip>
            ))}
            <ChipInputField
              id={fieldId}
              value={query}
              placeholder="node, npm:t3, apt:libssl-dev..."
              onChange={(event) => setQuery(event.target.value)}
              onRemoveLast={() => setDeps((current) => current.slice(0, -1))}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.defaultPrevented) return;
                event.preventDefault();
                const at = trimmed.indexOf(":");
                if (at > 0) add(trimmed.slice(0, at), trimmed.slice(at + 1).trim());
                else add("", trimmed);
              }}
            />
          </ChipInputBox>
          {trimmed && (
            <ChipInputList aria-label="Dependency suggestions">
              {suggestions.length ? (
                suggestions.map((suggestion) => (
                  <ChipInputOption
                    key={suggestion.key}
                    onSelect={suggestion.select}
                  >
                    <span className="mono">{suggestion.label}</span>
                    <span className="muted t-metadata">{suggestion.hint}</span>
                  </ChipInputOption>
                ))
              ) : (
                <ChipInputEmpty>
                  No match. Enter adds {trimmed} as typed.
                </ChipInputEmpty>
              )}
            </ChipInputList>
          )}
        </ChipInput>
        <small className="field-hint">
          Type a tool, or a backend such as npm:, cargo: or apt:. Enter adds it.
          Each option is its own segment, typed as name=value: allow_builds,
          features, os, depends, postinstall. A list takes its items comma
          separated. Backspace on an empty field removes the last chip.
        </small>
      </div>
      <p className="muted t-label" role="status">
        {deps.length} dependencies.
      </p>
      <pre>
        <code>{miseToml(deps)}</code>
      </pre>
    </div>
  );
}

function Demo({
  id,
  theme,
  onThemeChange,
  accent,
  onAccentChange,
}: {
  id: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  accent: string;
  onAccentChange: (accent: Accent) => void;
}) {
  const uid = useId();
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setMessage("Example saved.");
    }, 900);
    return () => clearTimeout(timer);
  }, [loading]);
  const feedback = (
    <p className="muted t-label" role="status">
      {message}
    </p>
  );

  switch (id) {
    case "button":
      return (
        <div className="stack">
          <div className="demo-row">
            {(["default", "primary", "destructive", "ghost"] as const).map(
              (variant) => (
                <Button
                  key={variant}
                  variant={variant}
                  onClick={() => setMessage(`${variant} button activated.`)}
                >
                  {variant}
                </Button>
              ),
            )}
          </div>
          <div className="demo-row">
            {(["xs", "sm", "md", "lg"] as const).map((size) => (
              <Button
                key={size}
                size={size}
                onClick={() => setMessage(`Size ${size} activated.`)}
              >
                {size}
              </Button>
            ))}
          </div>
          <div className="demo-row">
            <Button disabled>Disabled</Button>
            <Button
              variant="primary"
              disabled={loading}
              aria-busy={loading}
              onClick={() => setLoading(true)}
            >
              {loading && <Spinner size="sm" />}
              {loading ? "Saving..." : "Test loading"}
            </Button>
          </div>
          {feedback}
        </div>
      );
    case "icon-button":
      return (
        <div className="stack">
          <div className="demo-row">
            <Button
              className="btn-icon"
              variant="primary"
              aria-label="Add project"
              onClick={() => setMessage("Add project activated.")}
            >
              <Plus />
            </Button>
            <Button
              className="btn-icon"
              variant="ghost"
              aria-label="Add another project"
              onClick={() => setMessage("Ghost action activated.")}
            >
              <Plus />
            </Button>
            <Button
              className="btn-icon"
              disabled
              aria-label="Add project unavailable"
            >
              <Plus />
            </Button>
          </div>
          {feedback}
        </div>
      );
    case "input":
      return (
        <div className="demo-grid">
          <FormField label="Project name" placeholder="my-project" />
          <FormField
            label="Disabled input"
            defaultValue="Inherited from workspace"
            disabled
          />
          <div className="field">
            <Label htmlFor={uid}>Invalid input</Label>
            <Input
              id={uid}
              defaultValue="My App!"
              aria-invalid="true"
              aria-describedby={`${uid}-error`}
            />
            <ValidationMessage id={`${uid}-error`}>
              Use lowercase letters, numbers and hyphens.
            </ValidationMessage>
          </div>
        </div>
      );
    case "textarea":
      return (
        <div className="field">
          <Label htmlFor={uid}>Operator notes</Label>
          <Textarea
            id={uid}
            rows={4}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Optional context for this Project..."
          />
          <small className="field-hint">{value.length} characters</small>
        </div>
      );
    case "chip-input":
      return <ChipInputDemo />;
    case "select":
      return (
        <div className="stack">
          <Label htmlFor={uid}>Language</Label>
          <div className="demo-row">
            <Select defaultValue="English" onValueChange={setValue}>
              <SelectTrigger id={uid} className="gallery-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["English", "Português", "日本語"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled>Inherited suffix</Button>
          </div>
          <p className="muted t-label" role="status">
            Selected: {value || "English"}
          </p>
        </div>
      );
    case "checkbox":
      return (
        <div className="stack">
          {[
            {
              label: "Show platform services",
              state: checked,
              disabled: false,
            },
            {
              label: "Mixed selection",
              state: "indeterminate" as const,
              disabled: false,
            },
            { label: "Inherited setting", state: true, disabled: true },
          ].map((item, i) => (
            <div className="row" key={item.label}>
              <Checkbox
                id={`${uid}-${i}`}
                checked={
                  i === 1
                    ? value === "mixed-changed"
                      ? true
                      : item.state
                    : item.state
                }
                disabled={item.disabled}
                onCheckedChange={(v) =>
                  i === 0 ? setChecked(v === true) : setValue("mixed-changed")
                }
              />
              <Label htmlFor={`${uid}-${i}`}>{item.label}</Label>
            </div>
          ))}
        </div>
      );
    case "switch":
      return (
        <div className="stack">
          <div className="row">
            <Switch id={uid} checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor={uid}>Email notifications</Label>
          </div>
          <p className="muted t-label" role="status">
            Email notifications are {checked ? "on" : "off"}.
          </p>
          <div className="row">
            <Switch id={`${uid}-disabled`} disabled />
            <Label htmlFor={`${uid}-disabled`}>Managed by the Host</Label>
          </div>
        </div>
      );
    case "label":
      return (
        <div className="field">
          <Label htmlFor={uid}>Project name</Label>
          <Input id={uid} placeholder="Click the label to focus this field" />
        </div>
      );
    case "form-field":
      return (
        <FormField label="Compose file" hint="Docker Compose YAML." error="Image is required.">
          <Textarea rows={5} defaultValue={"services:\n  web:\n    image: ''"} />
        </FormField>
      );
    case "helper-text":
      return (
        <FormField
          label="Name"
          placeholder="Website refresh"
          hint="Lowercase letters, numbers and hyphens; at most 63 characters."
        />
      );
    case "validation-message":
      return (
        <div className="field">
          <Label htmlFor={uid}>Project name</Label>
          <Input
            id={uid}
            value={value || "My App!"}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={!/^[a-z0-9-]+$/.test(value)}
            aria-describedby={`${uid}-validation`}
          />
          {/^[a-z0-9-]+$/.test(value) ? (
            <small id={`${uid}-validation`} className="field-hint">
              This name is valid.
            </small>
          ) : (
            <ValidationMessage id={`${uid}-validation`}>
              Use lowercase letters, numbers and hyphens.
            </ValidationMessage>
          )}
        </div>
      );
    case "search":
      return (
        <div className="stack">
          <Search
            aria-label="Search example projects"
            placeholder="Search by name..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <ul className="gallery-results">
            {["Website", "Brand guide", "Website refresh"]
              .filter((name) => name.includes(value.toLowerCase()))
              .map((name) => (
                <li key={name}>{name}</li>
              ))}
          </ul>
          {!["Website", "Brand guide", "Website refresh"].some((name) =>
            name.includes(value.toLowerCase()),
          ) && <p className="muted">No matching projects.</p>}
        </div>
      );
    case "badge":
      return (
        <div className="demo-row">
          {(["neutral", "info", "success", "warning", "danger"] as const).map(
            (variant) => (
              <Badge key={variant} variant={variant}>
                <Dot />
                {variant}
              </Badge>
            ),
          )}
        </div>
      );
    case "table":
      return (
        <div className="table-wrap">
          <Table aria-label="Example projects">
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="num">Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["Website", "Brand guide"].map((name, i) => (
                <TableRow key={name}>
                  <TableCell>
                    <Link href={`#components/table`}>{name}</Link>
                  </TableCell>
                  <TableCell>Alex Morgan</TableCell>
                  <TableCell>
                    <Badge variant={i ? "warning" : "success"}>
                      {i ? "in review" : "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="num">{i}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="table-footer">2 projects</p>
        </div>
      );
    case "empty-state":
      return (
        <Card>
          <EmptyState variant="first-run">
            <EmptyStateTitle>No projects yet</EmptyStateTitle>
            <EmptyStateDescription>
              Create your first project to organize your work.
            </EmptyStateDescription>
            <EmptyStateActions>
              <Button
                variant="primary"
                onClick={() => setMessage("Create project activated.")}
              >
                Create project
              </Button>
            </EmptyStateActions>
          </EmptyState>
          {feedback}
        </Card>
      );
    case "card":
      return (
        <div className="demo-grid">
          <Card>
            <CardHeader>
              <h3 className="t-h3">Project</h3>
              <p className="muted t-label">A reusable panel composition.</p>
            </CardHeader>
            <CardContent>
              <FormField label="Name" defaultValue="Website refresh" />
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                onClick={() => setMessage("Card saved.")}
              >
                Save
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <Stat>
              <StatLabel>Active projects</StatLabel>
              <StatValue>2</StatValue>
              <StatFoot>All projects on track</StatFoot>
            </Stat>
          </Card>
          {feedback}
        </div>
      );
    case "page-header":
      return (
        <PageHeader
          actions={
            <Button
              variant="primary"
              onClick={() => setMessage("Create project activated.")}
            >
              Create project
            </Button>
          }
        >
          <PageHeaderTitle asChild>
            <h3 className="t-h1">Projects</h3>
          </PageHeaderTitle>
          <PageHeaderDescription>
            2 projects in your workspace
          </PageHeaderDescription>
        </PageHeader>
      );
    case "header":
      return (
        <Header className="gallery-header-preview">
          <Breadcrumb aria-label="Example header breadcrumb">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#components/header">
                  Workspace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="grow" />
          <Badge variant="success">Healthy</Badge>
        </Header>
      );
    case "brand-mark":
      return (
        <div className="demo-row">
          <div className="brand">
            <BrandMark>N</BrandMark>
            <span className="t-label">Northstar</span>
          </div>
          <div className="brand">
            <BrandMark>
              <TerminalIcon />
            </BrandMark>
            <span className="t-label">Kiso 基礎</span>
          </div>
        </div>
      );
    case "sidebar":
      return (
        <div className="gallery-sidebar-frame">
          <Sidebar>
            <SidebarHeader>
              <div className="brand">
                <BrandMark>
                  <TerminalIcon />
                </BrandMark>
                <span className="t-label">Kiso 基礎</span>
              </div>
            </SidebarHeader>
            <SidebarBody>
              <Navigation aria-label="Example sidebar">
                <NavigationGroup>
                  <NavigationList>
                    <NavigationItem>
                      <NavigationLink href="#components/sidebar" active>
                        Overview
                      </NavigationLink>
                    </NavigationItem>
                  </NavigationList>
                </NavigationGroup>
                <NavigationGroup label="Projects">
                  <NavigationList>
                    {["Website", "Brand guide"].map((name) => (
                      <NavigationItem key={name}>
                        <NavigationLink href="#components/sidebar">
                          {name}
                        </NavigationLink>
                      </NavigationItem>
                    ))}
                  </NavigationList>
                </NavigationGroup>
              </Navigation>
            </SidebarBody>
            <SidebarFooter>
              <ThemeSelector theme={theme} onChange={onThemeChange} />
            </SidebarFooter>
          </Sidebar>
        </div>
      );
    case "navigation":
      return (
        <Navigation aria-label="Example navigation">
          <NavigationList className="nav-row">
            {[
              ["Overview", "#components/navigation"],
              ["Workspace setup", "#components/link"],
              ["API keys", "#components/breadcrumb"],
            ].map(([label, href], i) => (
              <NavigationItem key={label}>
                <NavigationLink href={href} active={i === 0}>
                  {label}
                </NavigationLink>
              </NavigationItem>
            ))}
          </NavigationList>
        </Navigation>
      );
    case "breadcrumb":
      return (
        <Breadcrumb aria-label="Example breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#components">Workspace</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#components/table">
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Website refresh</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "link":
      return (
        <div className="stack">
          <div className="demo-row">
            <Link href="#components/link">Open workspace</Link>
            <Link href="#components/table">View Brand guide</Link>
          </div>
          <div className="demo-row">
            <Link variant="standalone" href="#components/link" active>
              Current destination
            </Link>
            <Link variant="standalone" href="#components/navigation">
              Another destination
            </Link>
          </div>
          <Button asChild variant="primary">
            <a href="#components">A link with Button weight</a>
          </Button>
        </div>
      );
    case "tabs":
      return (
        <Tabs defaultValue="configuration">
          <TabsList aria-label="Project panels">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics" disabled>
              Metrics (unavailable)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="configuration">
            <FormField label="Project name" defaultValue="Website refresh" />
          </TabsContent>
          <TabsContent value="logs">
            <pre>
              <code>14:14:47 [info] Project ready on port 80.</code>
            </pre>
          </TabsContent>
        </Tabs>
      );
    case "pagination":
      return (
        <div className="stack">
          <Pagination aria-label="Example pagination">
            <PaginationPrevious
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            />
            {[1, 2, 3].map((n) => (
              <PaginationPage
                key={n}
                active={page === n}
                onClick={() => setPage(n)}
              >
                {n}
              </PaginationPage>
            ))}
            <PaginationNext
              disabled={page === 3}
              onClick={() => setPage(page + 1)}
            />
          </Pagination>
          <p className="muted t-label" role="status">
            Page {page} of 3 / records {(page - 1) * 10 + 1} to {page * 10}
          </p>
        </div>
      );
    case "theme-selector":
      return (
        <div className="gallery-theme-preview">
          <ThemeSelector theme={theme} onChange={onThemeChange} />
          <p className="muted t-label">
            This control updates the whole gallery.
          </p>
        </div>
      );
    case "accent-selector":
      return (
        <div className="gallery-theme-preview">
          <AccentSelector accent={accent} onChange={onAccentChange} />
          <p className="muted t-label">
            This control updates the whole gallery, layouts included.
          </p>
        </div>
      );
    case "alert":
      return (
        <div className="stack">
          {(
            [
              [
                "info",
                "Workspace setup required",
                "Add a name and email to your profile.",
              ],
              [
                "success",
                "Project saved",
                "Website refresh is ready.",
              ],
              [
                "warning",
                "Project archived",
                "Restore the project to continue working on it.",
              ],
              [
                "error",
                "Could not save",
                "The request failed. Try again.",
              ],
            ] as const
          ).map(([variant, title, description]) => (
            <Alert key={variant} variant={variant}>
              <AlertContent>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
              </AlertContent>
            </Alert>
          ))}
        </div>
      );
    case "spinner":
      return (
        <div className="stack">
          <div className="demo-row">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Spinner key={size} size={size} />
            ))}
          </div>
          <div className="demo-row">
            <Spinner label="Saving project" />
            <span>Saving project...</span>
          </div>
        </div>
      );
    case "skeleton":
      return (
        <div
          className="stack-sm"
          aria-busy="true"
          aria-label="Loading project"
        >
          <Skeleton variant="text" className="gallery-skeleton-title" />
          <Skeleton variant="text" />
          <Skeleton variant="block" className="gallery-skeleton-block" />
          <span className="muted t-label">Loading project details...</span>
        </div>
      );
    case "toast":
      return (
        <Toasts duration={5000}>
          <ToastDemoButton />
        </Toasts>
      );
    case "modal-dialog":
      return (
        <div className="stack">
          <div className="demo-row">
            <TaskDialog />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Remove project</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="dialog-scroll">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove "Website refresh"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the sample project from your workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => setMessage("Example Project removed.")}
                    >
                      Remove project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {feedback}
        </div>
      );
    case "drawer":
      return (
        <div className="demo-row">
          {(["side", "bottom"] as const).map((placement) => (
            <Drawer key={placement}>
              <DrawerTrigger asChild>
                <Button>Open {placement} drawer</Button>
              </DrawerTrigger>
              <DrawerContent placement={placement}>
                <DrawerHeader>
                  <DrawerTitle>Edit project</DrawerTitle>
                  <DrawerDescription>
                    Update the example project name.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerBody>
                  <FormField label="Name" defaultValue="Website refresh" />
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ))}
        </div>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button>Project details</Button>
          </PopoverTrigger>
          <PopoverContent>
            <h3 className="t-h3">Project information</h3>
            <KV>
              <KVKey>Name</KVKey>
              <KVValue>Website refresh</KVValue>
              <KVKey>Owner</KVKey>
              <KVValue>Alex Morgan</KVValue>
            </KV>
            <PopoverClose asChild>
              <Button size="sm">Close</Button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      );
    case "dropdown-menu":
      return (
        <div className="stack">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Project actions <span aria-hidden="true">⌄</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Website refresh</DropdownMenuLabel>
              {["View activity", "Duplicate", "Copy link"].map((action) => (
                <DropdownMenuItem
                  key={action}
                  onSelect={() => setMessage(`${action} selected.`)}
                >
                  {action}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setMessage("Remove project selected.")}
              >
                Remove project
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Saving (unavailable)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {feedback}
        </div>
      );
    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Email notifications</Button>
            </TooltipTrigger>
            <TooltipContent>
              Receive an email when a project you follow changes.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case "command-palette":
      return <CommandPaletteDemo />;
    case "app-shell":
      return (
        <div className="stack-sm">
          <ApplicationShell
            className="gallery-shell-preview"
            brand={
              <div className="brand">
                <BrandMark>
                  <TerminalIcon />
                </BrandMark>
                <span className="t-label">Kiso 基礎</span>
              </div>
            }
            navigation={[{
              destinations: [
                { href: "#components/app-shell", active: true, label: "Overview" },
                { href: "#components/sidebar", label: "Projects" },
              ],
            }]}
            navigationLabel="Example shell navigation"
            header={
              <>
                <nav className="breadcrumb" aria-label="Example shell breadcrumb">
                  <a href="#components/app-shell">Workspace</a>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">Overview</span>
                </nav>
                <span className="row success t-label">
                  <Dot pulse />
                  <span className="fg">Healthy</span>
                </span>
              </>
            }
          >
            <div className="gallery-shell-page">
              <h3 className="t-h3">Overview</h3>
              <p className="muted t-label">Console layout with a sidebar rail.</p>
            </div>
          </ApplicationShell>
          <ApplicationShell
            layout="topbar"
            className="gallery-shell-preview"
            brand={
              <div className="brand">
                <BrandMark>
                  <TerminalIcon />
                </BrandMark>
                <span className="t-label">Organizeitor</span>
              </div>
            }
            primaryAction={
              <Button variant="primary" size="sm">
                Create project
              </Button>
            }
            header={
              <span className="muted t-label grow">Board chrome in the top bar</span>
            }
          >
            <div className="gallery-shell-page">
              <h3 className="t-h3">Board</h3>
              <p className="muted t-label">Single-surface layout without a rail.</p>
            </div>
          </ApplicationShell>
        </div>
      );
    case "split":
      return (
        <div className="stack-sm">
          <Split className="gallery-split-preview">
            <Pane className="gallery-split-pane">
              <p className="t-caps">Projects</p>
              <nav aria-label="Example split list">
                <a className="nav-item" href="#components/sidebar" aria-current="page">
                  <Dot variant="success" />
                  Website
                </a>
                <a className="nav-item" href="#components/split">
                  <Dot variant="warning" />
                  Brand guide
                </a>
              </nav>
            </Pane>
            <Splitter
              defaultSize={42}
              aria-label="Resize the list and detail panes"
            />
            <Pane className="gallery-split-pane grow">
              <p className="t-caps">Detail</p>
              <KV>
                <KVKey>Owner</KVKey>
                <KVValue>Alex Morgan</KVValue>
                <KVKey>Tasks</KVKey>
                <KVValue>18 / 24</KVValue>
              </KV>
            </Pane>
          </Split>
          <p className="muted t-label">
            Drag the divider, or focus it and use the arrow keys.
          </p>
        </div>
      );
    case "separator":
      return (
        <div className="stack-sm">
          <p className="t-label">Configuration</p>
          <Separator />
          <p className="t-label">Danger zone</p>
          <div className="row">
            <span className="t-label">Running</span>
            <Separator orientation="vertical" />
            <span className="t-label">18 days</span>
            <Separator orientation="vertical" />
            <span className="t-label">2 restarts</span>
          </div>
        </div>
      );
    case "stat":
      return (
        <div className="demo-grid">
          <Card>
            <Stat>
              <StatHeader>
                <StatLabel>Projects</StatLabel>
                <StatDelta variant="success">+2</StatDelta>
              </StatHeader>
              <StatValue>4</StatValue>
              <StatFoot>3 active &middot; 1 archived</StatFoot>
            </Stat>
          </Card>
          <Card>
            <Stat>
              <StatHeader>
                <StatLabel>Requests / min</StatLabel>
                <StatDelta variant="danger">-18%</StatDelta>
              </StatHeader>
              <StatValue>1,284</StatValue>
              <StatFoot>Down from 1,566 yesterday</StatFoot>
            </Stat>
          </Card>
        </div>
      );
    case "sparkline": {
      const cpu = [40, 44, 42, 48, null, null, 50, 55, 0, 58, 56, 60, 58, 62];
      const rows = [
        { name: "web", values: [12, 14, 13, 16, 18, 17, 21, 24, 23, 27] },
        { name: "db", values: [30, 28, 29, 24, 22, 23, 18, 16, 14, 12] },
        { name: "cache", values: [8, 9, 8, 10, 9, 11, 10, 9, 10, 9] },
      ];
      return (
        <div className="stack-sm">
          <Card>
            <Stat>
              <StatHeader>
                <StatLabel>CPU</StatLabel>
                <StatDelta variant="warning">62%</StatDelta>
              </StatHeader>
              <StatValue>62%</StatValue>
              <Sparkline
                values={cpu}
                height={48}
                min={0}
                max={100}
                tone="primary"
                label="CPU trend with a collection gap and a measured zero"
              />
            </Stat>
          </Card>
          <div className="demo-row">
            {rows.map((row) => (
              <div className="row t-label" key={row.name}>
                <span style={{ width: 72, flex: "none" }}>
                  <Sparkline values={row.values} height={18} min={0} max={100} />
                </span>
                {row.name}
              </div>
            ))}
          </div>
          <p className="muted t-label">
            The rows share one scale, so the shapes compare honestly.
          </p>
          <div className="row t-label">
            <span style={{ width: 72, flex: "none" }}>
              <Sparkline values={[42]} height={18} min={0} max={100} />
            </span>
            one sample draws nothing
          </div>
        </div>
      );
    }
    case "kv":
      return (
        <Card>
          <CardContent>
            <KV>
              <KVKey>Owner</KVKey>
              <KVValue>Alex Morgan</KVValue>
              <KVKey>Project ID</KVKey>
              <KVValue>a1f4c9e2b7d8</KVValue>
              <KVKey>Tasks</KVKey>
              <KVValue>18 / 24</KVValue>
              <KVKey>Created</KVKey>
              <KVValue>2026-08-19T09:41:02Z</KVValue>
            </KV>
          </CardContent>
        </Card>
      );
    case "dot":
      return (
        <div className="demo-row">
          {(["success", "warning", "danger", "info"] as const).map(
            (variant) => (
              <span className="row t-label" key={variant}>
                <Dot variant={variant} />
                {variant}
              </span>
            ),
          )}
          <span className="row success t-label">
            <Dot size="lg" pulse />
            <span className="fg">Platform healthy</span>
          </span>
        </div>
      );
    case "chart":
    case "chart-legend":
    case "meter":
    case "bar-gauge":
    case "disclosure":
    case "time-range-control":
    case "dashboard-grid":
      return <MetricsDemo component={id} />;
    case "log-view":
      return <LogViewDemo />;
    case "step-list":
      return <StepListDemo />;
    case "step-bar":
      return <StepBarDemo />;
    default:
      return null;
  }
}

// Wide cards go first so the small ones fill the columns left over.
function sizeRank(size: "wide" | "full" | undefined) {
  return size === "full" ? 0 : size === "wide" ? 1 : 2;
}

const MASONRY_ROW = 8;

// Masonry on a 12-column grid: each card spans only the 8px rows its content
// needs, so short cards do not wait for the tallest card in the same row.
function useMasonryRows(grid: RefObject<HTMLDivElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const root = grid.current;
    if (!active || !root) return;
    const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
    const fit = (card: HTMLElement) => {
      const height = card.getBoundingClientRect().height;
      card.style.setProperty("--catalog-rows", String(Math.ceil((height + gap) / MASONRY_ROW)));
    };
    const cards = Array.from(root.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) fit(entry.target as HTMLElement);
    });
    for (const card of cards) {
      fit(card);
      observer.observe(card);
    }
    return () => observer.disconnect();
  });
}

export function ComponentGallery({
  route,
  theme,
  onThemeChange,
  accent,
  onAccentChange,
  example,
  examples = [],
  intro,
}: {
  route: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  accent: string;
  onAccentChange: (accent: Accent) => void;
  example?: ReactNode;
  examples?: readonly { id: string; label: string }[];
  intro?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const selected = route.split("/")[1] || "all";
  const showingExample = (route === "example" || route.startsWith("example/")) && example !== undefined;
  const showingIntro = route === "intro" && intro !== undefined;
  const browsing = !showingExample && !showingIntro && selected === "all";
  const groups = Array.from(new Set(catalog.map((entry) => entry[2])));
  const entries = catalog.filter((entry) =>
    entry[1].toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visible = browsing
    ? entries
        .filter((entry) => group === "all" || entry[2] === group)
        .sort((a, b) => sizeRank(catalogSize[a[0]]) - sizeRank(catalogSize[b[0]]))
    : catalog.filter((entry) => entry[0] === selected);
  useMasonryRows(grid, browsing);

  function showAll() {
    setSearch("");
    setGroup("all");
    content.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
    window.location.hash = "components";
  }

  // Moving focus to the new page's heading is for in-app navigation only; on
  // first load the document starts unfocused like any other page.
  const previousRoute = useRef(route);
  useEffect(() => {
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    if (
      document.activeElement?.getAttribute("aria-label") === "Find a component" ||
      document.activeElement?.getAttribute("role") === "tab"
    )
      return;
    setMenuOpen(false);
    content.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
  }, [route]);

  const current = catalog.find((entry) => entry[0] === selected);
  const categories: [string, string, number][] = [
    ["all", "All components", catalog.length],
    ...groups.map((category): [string, string, number] => [
      category,
      category,
      catalog.filter((entry) => entry[2] === category).length,
    ]),
  ];

  function showGroup(category: string) {
    setSearch("");
    setGroup(category);
    window.location.hash = "components";
  }

  return (
    <AppShell
      className="component-gallery"
      data-layout={showingIntro ? "topbar" : undefined}
    >
      {!showingIntro && <Sidebar
        id="component-navigation"
        className={`catalog-sidebar ${menuOpen ? "catalog-open" : ""}`}
      >
        <SidebarHeader>
          <a className="brand catalog-brand" href={intro !== undefined ? "#intro" : "#components"} onClick={intro !== undefined ? undefined : showAll}>
            <BrandMark><TerminalIcon /></BrandMark>
            <span>Kiso <span className="catalog-kanji" lang="ja">基礎</span></span>
          </a>
        </SidebarHeader>
        <SidebarBody>
          {showingExample && examples.length > 0 ? (
            <Navigation aria-label="Example layouts">
              <NavigationGroup label="Layouts">
                <NavigationList>
                  {examples.map((layout, index) => (
                    <NavigationItem key={layout.id}>
                      <NavigationLink
                        href={`#example/${layout.id}`}
                        active={selected === layout.id || (selected === "all" && index === 0)}
                      >
                        {layout.label}
                      </NavigationLink>
                    </NavigationItem>
                  ))}
                </NavigationList>
              </NavigationGroup>
            </Navigation>
          ) : (
          <Navigation aria-label="Component categories">
            <NavigationGroup label="Explore components">
              <NavigationList>
                {categories.map(([category, label, count]) => (
                  <NavigationItem key={category}>
                    <NavigationLink
                      href="#components"
                      active={browsing && group === category}
                      onClick={(event) => {
                        event.preventDefault();
                        if (category === "all") showAll();
                        else showGroup(category);
                      }}
                    >
                      <span className="grow">{label}</span>
                      <Badge variant="neutral">{count}</Badge>
                    </NavigationLink>
                  </NavigationItem>
                ))}
              </NavigationList>
            </NavigationGroup>
          </Navigation>
          )}
        </SidebarBody>
        <SidebarFooter>
          <ThemeSelector theme={theme} onChange={onThemeChange} />
        </SidebarFooter>
      </Sidebar>}
      <AppShellMain>
        <Header className="catalog-header">
          {!showingIntro && (
            <a className="brand catalog-brand catalog-header-brand" href={intro !== undefined ? "#intro" : "#components"} onClick={intro !== undefined ? undefined : showAll}>
              <BrandMark><TerminalIcon /></BrandMark>
              <span>Kiso <span className="catalog-kanji" lang="ja">基礎</span></span>
            </a>
          )}
          <Navigation aria-label="Preview pages">
            <NavigationList className="nav-row">
              {intro !== undefined && (
                <NavigationItem>
                  <NavigationLink href="#intro" active={showingIntro}>Intro</NavigationLink>
                </NavigationItem>
              )}
              <NavigationItem>
                <NavigationLink href="#components" active={!showingExample && !showingIntro} onClick={showAll}>
                  Components
                </NavigationLink>
              </NavigationItem>
              {example !== undefined && (
                <NavigationItem>
                  <NavigationLink href="#example" active={showingExample}>Layouts</NavigationLink>
                </NavigationItem>
              )}
            </NavigationList>
          </Navigation>
          <div className="catalog-tools">
            <Search
              aria-label="Find a component"
              placeholder="Find a component..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                window.location.hash = "components";
              }}
            />
            <AccentSelector accent={accent} onChange={onAccentChange} preview={false} />
            {showingIntro ? (
              <ThemeSelector theme={theme} onChange={onThemeChange} />
            ) : (
              <Button
                className="catalog-menu"
                size="sm"
                aria-controls="component-navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? "Hide navigation" : "Show navigation"}
              </Button>
            )}
          </div>
        </Header>
        <div ref={content} className={`catalog-main ${showingIntro ? "catalog-intro" : showingExample ? "catalog-layouts" : browsing ? "catalog-browse" : "catalog-detail"}`}>
        {!showingIntro && <div className="catalog-heading">
          {!browsing && !showingExample && (
            <Breadcrumb aria-label="Component location">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#components" onClick={showAll}>Components</BreadcrumbLink>
                </BreadcrumbItem>
                {current && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="#components"
                        onClick={(event) => {
                          event.preventDefault();
                          showGroup(current[2]);
                        }}
                      >
                        {current[2]}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{current?.[1] ?? "Not found"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <PageHeader
            actions={
              showingExample ? undefined : browsing ? (
                <p className="muted t-label" role="status">
                  {visible.length} {visible.length === 1 ? "component" : "components"}
                </p>
              ) : current ? (
                <Badge variant="success">Shared React</Badge>
              ) : undefined
            }
          >
            <PageHeaderTitle tabIndex={-1}>
              {showingExample
                ? "Layout examples"
                : browsing
                ? group === "all" ? "Component gallery" : group
                : current?.[1] || "Component not found"}
            </PageHeaderTitle>
            <PageHeaderDescription>
              {showingExample
                ? "Complete interface examples, composed with Kiso components."
                : browsing
                ? "Components in action. Built for your next interface."
                : current?.[3] ?? "Preview, states and usage."}
            </PageHeaderDescription>
          </PageHeader>
        </div>}
        {intro !== undefined && <div hidden={!showingIntro}>{intro}</div>}
        {example !== undefined && <div hidden={!showingExample}>{example}</div>}
        <div ref={grid} className={browsing ? "catalog-masonry" : "catalog-sections"} hidden={showingExample || showingIntro}>
          {visible.map(([id, name, category, description]) => (
            <section
              className="catalog-section"
              key={id}
              data-size={browsing ? catalogSize[id] : undefined}
              aria-labelledby={browsing ? `catalog-${id}` : undefined}
              aria-label={browsing ? undefined : name}
            >
              {browsing && (
                <div className="catalog-section-heading">
                  <div>
                    <h2 id={`catalog-${id}`} className="t-h3">
                      <a href={`#components/${id}`}>{name}<span aria-hidden="true"> ↗</span></a>
                    </h2>
                    <p className="muted t-label">{description}</p>
                  </div>
                </div>
              )}
              <div className="catalog-preview">
                <Demo
                  id={id}
                  theme={theme}
                  onThemeChange={onThemeChange}
                  accent={accent}
                  onAccentChange={onAccentChange}
                />
              </div>
              {!browsing && snippets[id] && (
                <details className="catalog-code">
                  <summary>Usage example</summary>
                  <pre>
                    <code>{snippets[id]}</code>
                  </pre>
                </details>
              )}
            </section>
          ))}
        </div>
        {!showingExample && !showingIntro && visible.length === 0 && (
          <EmptyState variant="no-results">
            <EmptyStateTitle>{browsing ? "No matching components" : "Component not found"}</EmptyStateTitle>
            <EmptyStateActions><Button onClick={showAll}>Show all components</Button></EmptyStateActions>
          </EmptyState>
        )}
        <p className="muted t-label catalog-footnote" hidden={showingIntro}>
          {showingExample ? "Visual examples only. Actions do not save or send data." : "Preview only. All actions use sample data."}
        </p>
        </div>
      </AppShellMain>
    </AppShell>
  );
}
