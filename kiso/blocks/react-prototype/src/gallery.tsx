// Catalogue previews. Every entry renders the published component, so the
// gallery cannot drift from what @momoi-labs/kiso-react ships.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
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
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ValidationMessage,
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
  ["label", "Label", "Forms", "A visible, associated field name."],
  [
    "form-field",
    "FormField",
    "Forms",
    "Label, input and helper text together.",
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
  ["kv", "KV", "Data", "Fixed facts as terms and values."],
  ["dot", "Dot", "Data", "Status as a mark beside a name."],
  ["log-view", "LogView", "Data", "Streamed output that follows the tail."],
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
  ["app-shell", "AppShell", "Structure", "The sidebar and main column of a console."],
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

const snippets: Record<string, string> = {
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
    '<FormField label="Name" hint="Lowercase letters and hyphens." required />',
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
  alert:
    '<Alert variant="error">\n  <AlertContent>\n    <AlertTitle>Could not save</AlertTitle>\n    <AlertDescription>The request failed. Try again.</AlertDescription>\n  </AlertContent>\n</Alert>',
  spinner:
    '<Spinner size="sm" />\n<Spinner label="Saving project" />',
  skeleton:
    '<div aria-busy="true" aria-label="Loading project">\n  <Skeleton variant="text" style={{ width: "45%" }} />\n  <Skeleton variant="block" style={{ height: "6rem" }} />\n</div>',
  toast:
    '<ToastProvider duration={5000}>\n  <Toast open={open} onOpenChange={setOpen} variant="success">\n    <ToastContent>\n      <ToastTitle>Changes saved</ToastTitle>\n    </ToastContent>\n    <ToastClose asChild><Button size="xs" variant="ghost">Dismiss</Button></ToastClose>\n  </Toast>\n  <ToastViewport />\n</ToastProvider>',
  drawer:
    '<Drawer>\n  <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>\n  <DrawerContent placement="side">\n    <DrawerHeader><DrawerTitle>Edit project</DrawerTitle></DrawerHeader>\n    <DrawerBody>{form}</DrawerBody>\n  </DrawerContent>\n</Drawer>',
  "command-palette":
    '<CommandPalette open={open} onOpenChange={setOpen}>\n  <CommandPaletteInput value={query} onChange={(e) => setQuery(e.target.value)} />\n  <CommandPaletteList>\n    <CommandPaletteGroup heading="Navigation">\n      <CommandPaletteItem onSelect={openOverview}>Open overview</CommandPaletteItem>\n    </CommandPaletteGroup>\n  </CommandPaletteList>\n</CommandPalette>',
  dot: '<span className="row success t-label">\n  <Dot pulse />\n  <span className="fg">Platform healthy</span>\n</span>',
  stat: "<Stat>\n  <StatHeader>\n    <StatLabel>Projects</StatLabel>\n    <StatDelta variant=\"success\">+2</StatDelta>\n  </StatHeader>\n  <StatValue>4</StatValue>\n  <StatFoot>3 active \u00b7 1 archived</StatFoot>\n</Stat>",
  kv: "<KV>\n  <KVKey>Owner</KVKey>\n  <KVValue>Alex Morgan</KVValue>\n</KV>",
  separator: '<Separator />\n<Separator orientation="vertical" />',
  split: "<Split>\n  <Pane>{list}</Pane>\n  <Splitter defaultSize={42} aria-label=\"Resize the panes\" />\n  <Pane className=\"grow\">{detail}</Pane>\n</Split>",
  "log-view": "<LogView follow={follow} onFollowChange={setFollow}>\n  <LogViewLine>\n    <LogViewTime>09:41:02.114</LogViewTime>\n    <LogViewLevel level=\"warn\">WARN </LogViewLevel> redis unavailable\n  </LogViewLine>\n</LogView>",
  "app-shell": "<AppShell>\n  <Sidebar>\n    <SidebarBody>{navigation}</SidebarBody>\n  </Sidebar>\n  <AppShellMain>{page}</AppShellMain>\n</AppShell>",
};

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

function Demo({
  id,
  theme,
  onThemeChange,
}: {
  id: string;
  theme: string;
  onThemeChange: (theme: string) => void;
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
        <FormField
          label="Project name"
          placeholder="Website refresh"
          hint="A short, recognizable name for your project."
        />
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
        <ToastProvider duration={5000}>
          <Button onClick={() => setOpen(true)}>Show notification</Button>
          <Toast open={open} onOpenChange={setOpen} variant="success">
            <ToastContent>
              <ToastTitle>Changes saved</ToastTitle>
              <ToastDescription>Your project has been updated.</ToastDescription>
            </ToastContent>
            <ToastClose asChild>
              <Button size="xs" variant="ghost">
                Dismiss
              </Button>
            </ToastClose>
          </Toast>
          <ToastViewport />
        </ToastProvider>
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
        <AppShell className="gallery-shell-preview">
          <aside className="gallery-shell-sidebar">
            <div className="brand">
              <BrandMark>
                <TerminalIcon />
              </BrandMark>
              <span className="t-label">Kiso 基礎</span>
            </div>
            <nav aria-label="Example shell navigation">
              <a className="nav-item" href="#components/app-shell" aria-current="page">
                Overview
              </a>
              <a className="nav-item" href="#components/sidebar">
                Projects
              </a>
            </nav>
          </aside>
          <AppShellMain>
            <div className="gallery-header-preview">
              <nav className="breadcrumb" aria-label="Example shell breadcrumb">
                <a href="#components/app-shell">Workspace</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Overview</span>
              </nav>
              <span className="row success t-label">
                <Dot pulse />
                <span className="fg">Healthy</span>
              </span>
            </div>
            <div className="gallery-shell-page">
              <h3 className="t-h3">Overview</h3>
              <p className="muted t-label">The page renders in this column.</p>
            </div>
          </AppShellMain>
        </AppShell>
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
    case "log-view":
      return <LogViewDemo />;
    default:
      return null;
  }
}

export function ComponentGallery({
  route,
  theme,
  onThemeChange,
  example,
  intro,
}: {
  route: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  example?: ReactNode;
  intro?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const content = useRef<HTMLElement>(null);
  const selected = route.split("/")[1] || "all";
  const showingExample = (route === "example" || route.startsWith("example/")) && example !== undefined;
  const showingIntro = route === "intro" && intro !== undefined;
  const browsing = !showingExample && !showingIntro && selected === "all";
  const groups = Array.from(new Set(catalog.map((entry) => entry[2])));
  const entries = catalog.filter((entry) =>
    entry[1].toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visible = browsing
    ? entries.filter((entry) => group === "all" || entry[2] === group)
    : catalog.filter((entry) => entry[0] === selected);

  function showAll() {
    setSearch("");
    setGroup("all");
    content.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
    window.location.hash = "components";
  }

  useEffect(() => {
    if (
      document.activeElement?.getAttribute("aria-label") === "Find a component" ||
      document.activeElement?.getAttribute("role") === "tab"
    )
      return;
    setMenuOpen(false);
    content.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
  }, [route]);

  return (
    <div className={`component-gallery ${showingIntro ? "catalog-home" : ""}`}>
      <header className="catalog-topbar">
        <a className="brand catalog-brand" href={intro !== undefined ? "#intro" : "#components"} onClick={intro !== undefined ? undefined : showAll}>
          <BrandMark><TerminalIcon /></BrandMark>
          <span>Kiso <span className="catalog-kanji" lang="ja">基礎</span></span>
        </a>
        <nav className="demo-row" aria-label="Preview pages">
          {intro !== undefined && <a href="#intro" aria-current={showingIntro ? "page" : undefined}>Intro</a>}
          <a href="#components" aria-current={!showingExample && !showingIntro ? "page" : undefined} onClick={showAll}>
            Components
          </a>
          {example !== undefined && (
            <a href="#example" aria-current={showingExample ? "page" : undefined}>
              Layouts
            </a>
          )}
        </nav>
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
          <ThemeSelector theme={theme} onChange={onThemeChange} />
        </div>
        {!showingIntro && <Button
          className="catalog-menu"
          size="sm"
          aria-controls="component-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Hide filters" : "Show filters"}
        </Button>}
      </header>
      <aside
        id="component-navigation"
        hidden={showingIntro}
        className={`catalog-sidebar ${menuOpen ? "catalog-open" : ""}`}
      >
        <div className="catalog-group" role="group" aria-label="Component categories">
          <p className="t-caps">Explore components</p>
          <Button
            variant="ghost"
            className="catalog-filter"
            aria-pressed={browsing && group === "all"}
            onClick={showAll}
          >
            All components <span>{catalog.length}</span>
          </Button>
          {groups.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className="catalog-filter"
              aria-pressed={browsing && group === category}
              onClick={() => {
                setGroup(category);
                window.location.hash = "components";
              }}
            >
              {category}
              <span>{catalog.filter((entry) => entry[2] === category).length}</span>
            </Button>
          ))}
        </div>
        <div className="catalog-sidebar-note">
          <p className="t-label">Built with Kiso</p>
          <p className="muted t-label">
            Explore the previews. Select a component to see its states and usage.
          </p>
        </div>
      </aside>
      <main ref={content} className={`catalog-main ${showingIntro ? "catalog-intro" : showingExample ? "catalog-layouts" : browsing ? "catalog-browse" : "catalog-detail"}`}>
        {!showingIntro && <div className="catalog-heading">
          <PageHeader>
            {!browsing && (
              <a className="gallery-entry-link" href="#components" onClick={showAll}>
                ← All components
              </a>
            )}
            <PageHeaderTitle tabIndex={-1}>
              {showingExample
                ? "Layout examples"
                : browsing
                ? group === "all" ? "Component gallery" : group
                : catalog.find((entry) => entry[0] === selected)?.[1] ||
                  "Component not found"}
            </PageHeaderTitle>
            <p className="muted t-label">
              {showingExample
                ? "Complete interface examples, composed with Kiso components."
                : browsing ? "Components in action. Built for your next interface." : "Preview, states and usage."}
            </p>
          </PageHeader>
          <p className="muted t-label" role="status" hidden={showingExample || showingIntro}>
            {visible.length} {visible.length === 1 ? "component" : "components"}
          </p>
        </div>}
        {intro !== undefined && <div hidden={!showingIntro}>{intro}</div>}
        {example !== undefined && <div hidden={!showingExample}>{example}</div>}
        <div className={browsing ? "catalog-masonry" : "catalog-sections"} hidden={showingExample || showingIntro}>
          {visible.map(([id, name, category, description]) => (
            <section
              className="catalog-section"
              key={id}
              aria-labelledby={`catalog-${id}`}
            >
              <div className="catalog-section-heading">
                <div>
                  {!browsing && <p className="t-caps">{category}</p>}
                  <h2 id={`catalog-${id}`} className={browsing ? "t-h3" : "t-h2"}>
                    {browsing ? <a href={`#components/${id}`}>{name}<span aria-hidden="true"> ↗</span></a> : name}
                  </h2>
                  <p className="muted t-label">{description}</p>
                </div>
                {!browsing && (
                  <Badge variant="success">
                    Shared React
                  </Badge>
                )}
              </div>
              <div className="catalog-preview">
                <Demo id={id} theme={theme} onThemeChange={onThemeChange} />
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
      </main>
    </div>
  );
}
