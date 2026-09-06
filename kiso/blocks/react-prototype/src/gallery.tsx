// Catalogue previews. Every entry renders the published component, so the
// gallery cannot drift from what @momoi-labs/kiso-react ships.
import { useEffect, useId, useRef, useState } from "react";
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
    '<div className="brand">\n  <BrandMark>S</BrandMark>\n  <span>self-host</span>\n</div>\n<div className="brand">\n  <BrandMark><TerminalIcon /></BrandMark>\n  <span>self-host</span>\n</div>',
  button:
    '<Button variant="primary">Deploy</Button>\n<Button variant="destructive">Remove</Button>\n<Button size="sm" disabled>Unavailable</Button>',
  "icon-button":
    '<Button variant="ghost" className="btn-icon" aria-label="Add application">\n  <PlusIcon aria-hidden="true" />\n</Button>',
  input: '<Input aria-label="Application name" placeholder="my-app" />',
  textarea:
    '<Label htmlFor="notes">Notes</Label>\n<Textarea id="notes" rows={4} />',
  select:
    '<Select defaultValue="home.lan" onValueChange={setSuffix}>\n  <SelectTrigger aria-label="DNS suffix"><SelectValue /></SelectTrigger>\n  <SelectContent>\n    <SelectItem value="home.lan">home.lan</SelectItem>\n  </SelectContent>\n</Select>',
  checkbox:
    '<Checkbox id="platform" checked={checked} onCheckedChange={setChecked} />\n<Label htmlFor="platform">Show platform services</Label>',
  switch:
    '<Switch id="restart" checked={on} onCheckedChange={setOn} />\n<Label htmlFor="restart">Automatic restart</Label>',
  "form-field":
    '<FormField label="Name" hint="Lowercase letters and hyphens." required />',
  label: '<Label htmlFor="name">Application name</Label>\n<Input id="name" />',
  "helper-text":
    '<FormField label="Name" hint="Use lowercase letters, numbers and hyphens." />',
  "validation-message":
    '<Input aria-invalid="true" aria-describedby="name-error" />\n<ValidationMessage id="name-error">\n  Use lowercase letters, numbers and hyphens.\n</ValidationMessage>',
  search:
    '<Search aria-label="Search applications" placeholder="Search by name..."\n  value={query} onChange={(e) => setQuery(e.target.value)} />',
  badge: '<Badge variant="success">Running</Badge>',
  "empty-state":
    '<EmptyState variant="first-run">\n  <EmptyStateTitle>No applications yet</EmptyStateTitle>\n  <EmptyStateDescription>Deploy your first Application.</EmptyStateDescription>\n  <EmptyStateActions>\n    <Button variant="primary">Deploy application</Button>\n  </EmptyStateActions>\n</EmptyState>',
  card: "<Card>\n  <CardHeader><h2>Application</h2></CardHeader>\n  <CardContent>Configuration</CardContent>\n  <CardFooter><Button>Save</Button></CardFooter>\n</Card>",
  "page-header":
    '<PageHeader actions={<Button variant="primary">Deploy</Button>}>\n  <PageHeaderTitle>Applications</PageHeaderTitle>\n  <PageHeaderDescription>2 applications on home.lan</PageHeaderDescription>\n</PageHeader>',
  sidebar:
    "<Sidebar>\n  <SidebarHeader>{brand}</SidebarHeader>\n  <SidebarBody>\n    <Navigation aria-label=\"Applications\">\n      <NavigationGroup label=\"Applications\">\n        <NavigationList>\n          <NavigationItem>\n            <NavigationLink href=\"#app/hermes\" active>hermes</NavigationLink>\n          </NavigationItem>\n        </NavigationList>\n      </NavigationGroup>\n    </Navigation>\n  </SidebarBody>\n</Sidebar>",
  navigation:
    '<Navigation aria-label="Primary">\n  <NavigationList>\n    <NavigationItem>\n      <NavigationLink href="#overview" active>Overview</NavigationLink>\n    </NavigationItem>\n  </NavigationList>\n</Navigation>',
  breadcrumb:
    '<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href="#">Console</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>paperless</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>',
  link: '<Link href="#overview">Open console</Link>\n<Link variant="standalone" href="#dns" active>DNS setup</Link>',
  "theme-selector": "<ThemeSelector theme={theme} onChange={setTheme} />",
  alert:
    '<Alert variant="error">\n  <AlertContent>\n    <AlertTitle>Could not deploy</AlertTitle>\n    <AlertDescription>The Host did not respond. Try again.</AlertDescription>\n  </AlertContent>\n</Alert>',
  spinner:
    '<Spinner size="sm" />\n<Spinner label="Deploying application" />',
  skeleton:
    '<div aria-busy="true" aria-label="Loading application">\n  <Skeleton variant="text" style={{ width: "45%" }} />\n  <Skeleton variant="block" style={{ height: "6rem" }} />\n</div>',
  toast:
    '<ToastProvider duration={5000}>\n  <Toast open={open} onOpenChange={setOpen} variant="success">\n    <ToastContent>\n      <ToastTitle>Changes saved</ToastTitle>\n    </ToastContent>\n    <ToastClose asChild><Button size="xs" variant="ghost">Dismiss</Button></ToastClose>\n  </Toast>\n  <ToastViewport />\n</ToastProvider>',
  drawer:
    '<Drawer>\n  <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>\n  <DrawerContent placement="side">\n    <DrawerHeader><DrawerTitle>Edit application</DrawerTitle></DrawerHeader>\n    <DrawerBody>{form}</DrawerBody>\n  </DrawerContent>\n</Drawer>',
  "command-palette":
    '<CommandPalette open={open} onOpenChange={setOpen}>\n  <CommandPaletteInput value={query} onChange={(e) => setQuery(e.target.value)} />\n  <CommandPaletteList>\n    <CommandPaletteGroup heading="Navigation">\n      <CommandPaletteItem onSelect={openOverview}>Open overview</CommandPaletteItem>\n    </CommandPaletteGroup>\n  </CommandPaletteList>\n</CommandPalette>',
  dot: '<span className="row success t-label">\n  <Dot pulse />\n  <span className="fg">Platform healthy</span>\n</span>',
  stat: "<Stat>\n  <StatHeader>\n    <StatLabel>Applications</StatLabel>\n    <StatDelta variant=\"success\">+2</StatDelta>\n  </StatHeader>\n  <StatValue>4</StatValue>\n  <StatFoot>3 running \u00b7 1 crashed</StatFoot>\n</Stat>",
  kv: "<KV>\n  <KVKey>Image</KVKey>\n  <KVValue>paperlessngx:2.11</KVValue>\n</KV>",
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
          <Button>Edit application</Button>
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
              <DialogTitle>Edit application</DialogTitle>
              <DialogDescription>
                Update the example Application name.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <FormField label="Name" defaultValue="paperless" required />
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
  ["Open DNS setup", "Navigation"],
  ["Deploy application", "Actions"],
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
  { time: "09:41:02.114", level: "info", label: "INFO ", text: "paperless-ngx 2.11 starting" },
  { time: "09:41:02.482", level: "info", label: "INFO ", text: "applying migrations" },
  { time: "09:41:03.901", level: "warn", label: "WARN ", text: "redis unavailable, falling back to the in-process queue" },
  { time: "09:41:04.120", level: "error", label: "ERROR", text: "could not open /usr/src/data: permission denied" },
  { time: "09:41:04.121", level: "error", label: "ERROR", text: "exiting with status 1" },
  { time: "09:46:04.310", level: "info", label: "INFO ", text: "restart 3/5" },
  { time: "09:46:04.998", level: "info", label: "INFO ", text: "paperless-ngx 2.11 starting" },
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
        aria-label="Example application log"
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
              aria-label="Add application"
              onClick={() => setMessage("Add application activated.")}
            >
              <Plus />
            </Button>
            <Button
              className="btn-icon"
              variant="ghost"
              aria-label="Add another application"
              onClick={() => setMessage("Ghost action activated.")}
            >
              <Plus />
            </Button>
            <Button
              className="btn-icon"
              disabled
              aria-label="Add application unavailable"
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
          <FormField label="Application name" placeholder="my-app" />
          <FormField
            label="Disabled input"
            defaultValue="Inherited from Host"
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
            placeholder="Optional context for this Application..."
          />
          <small className="field-hint">{value.length} characters</small>
        </div>
      );
    case "select":
      return (
        <div className="stack">
          <Label htmlFor={uid}>DNS suffix</Label>
          <div className="demo-row">
            <Select defaultValue="home.lan" onValueChange={setValue}>
              <SelectTrigger id={uid} className="gallery-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["home.lan", "lab.lan", "office.lan"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled>Inherited suffix</Button>
          </div>
          <p className="muted t-label" role="status">
            Selected: {value || "home.lan"}
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
            <Label htmlFor={uid}>Automatic restart</Label>
          </div>
          <p className="muted t-label" role="status">
            Automatic restart is {checked ? "on" : "off"}.
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
          <Label htmlFor={uid}>Application name</Label>
          <Input id={uid} placeholder="Click the label to focus this field" />
        </div>
      );
    case "form-field":
      return (
        <FormField
          label="Hostname"
          placeholder="paperless.home.lan"
          hint="Leave empty to use the Application name and DNS suffix."
        />
      );
    case "helper-text":
      return (
        <FormField
          label="Name"
          placeholder="paperless"
          hint="Lowercase letters, numbers and hyphens; at most 63 characters."
        />
      );
    case "validation-message":
      return (
        <div className="field">
          <Label htmlFor={uid}>Application name</Label>
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
            aria-label="Search example applications"
            placeholder="Search by name..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <ul className="gallery-results">
            {["hermes", "teste", "paperless"]
              .filter((name) => name.includes(value.toLowerCase()))
              .map((name) => (
                <li key={name}>{name}</li>
              ))}
          </ul>
          {!["hermes", "teste", "paperless"].some((name) =>
            name.includes(value.toLowerCase()),
          ) && <p className="muted">No matching applications.</p>}
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
          <Table aria-label="Example applications">
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="num">Restarts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["hermes", "teste"].map((name, i) => (
                <TableRow key={name}>
                  <TableCell>
                    <Link href={`#components/table`}>{name}</Link>
                  </TableCell>
                  <TableCell className="mono">{name}.home.lan</TableCell>
                  <TableCell>
                    <Badge variant={i ? "warning" : "success"}>
                      {i ? "stopped" : "running"}
                    </Badge>
                  </TableCell>
                  <TableCell className="num">{i}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="table-footer">2 applications</p>
        </div>
      );
    case "empty-state":
      return (
        <Card>
          <EmptyState variant="first-run">
            <EmptyStateTitle>No applications yet</EmptyStateTitle>
            <EmptyStateDescription>
              Deploy your first Application to make it available on your LAN.
            </EmptyStateDescription>
            <EmptyStateActions>
              <Button
                variant="primary"
                onClick={() => setMessage("Deploy application activated.")}
              >
                Deploy application
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
              <h3 className="t-h3">Application</h3>
              <p className="muted t-label">A reusable panel composition.</p>
            </CardHeader>
            <CardContent>
              <FormField label="Name" defaultValue="paperless" />
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
              <StatLabel>Running applications</StatLabel>
              <StatValue>2</StatValue>
              <StatFoot>All applications healthy</StatFoot>
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
              onClick={() => setMessage("Deploy application activated.")}
            >
              Deploy application
            </Button>
          }
        >
          <PageHeaderTitle asChild>
            <h3 className="t-h1">Applications</h3>
          </PageHeaderTitle>
          <PageHeaderDescription>
            2 applications on home.lan
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
                  Console
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
            <BrandMark>S</BrandMark>
            <span className="t-label">self-host</span>
          </div>
          <div className="brand">
            <BrandMark>
              <TerminalIcon />
            </BrandMark>
            <span className="t-label">self-host</span>
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
                <span className="t-label">self-host</span>
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
                <NavigationGroup label="Applications">
                  <NavigationList>
                    {["hermes", "teste"].map((name) => (
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
              ["DNS setup", "#components/link"],
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
              <BreadcrumbLink href="#components">Console</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#components/table">
                Applications
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>paperless</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "link":
      return (
        <div className="stack">
          <div className="demo-row">
            <Link href="#components/link">Open console</Link>
            <Link href="#components/table">View teste</Link>
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
          <TabsList aria-label="Application panels">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics" disabled>
              Metrics (unavailable)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="configuration">
            <FormField label="Application name" defaultValue="paperless" />
          </TabsContent>
          <TabsContent value="logs">
            <pre>
              <code>14:14:47 [info] Application ready on port 80.</code>
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
                "DNS setup required",
                "Point your device at the Host's DNS server.",
              ],
              [
                "success",
                "Application deployed",
                "paperless.home.lan is ready.",
              ],
              [
                "warning",
                "Application stopped",
                "Start the Application to make it available again.",
              ],
              [
                "error",
                "Could not deploy",
                "The Host did not respond. Try again.",
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
            <Spinner label="Deploying application" />
            <span>Deploying application...</span>
          </div>
        </div>
      );
    case "skeleton":
      return (
        <div
          className="stack-sm"
          aria-busy="true"
          aria-label="Loading application"
        >
          <Skeleton variant="text" className="gallery-skeleton-title" />
          <Skeleton variant="text" />
          <Skeleton variant="block" className="gallery-skeleton-block" />
          <span className="muted t-label">Loading application details...</span>
        </div>
      );
    case "toast":
      return (
        <ToastProvider duration={5000}>
          <Button onClick={() => setOpen(true)}>Show notification</Button>
          <Toast open={open} onOpenChange={setOpen} variant="success">
            <ToastContent>
              <ToastTitle>Changes saved</ToastTitle>
              <ToastDescription>paperless is redeploying.</ToastDescription>
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
                <Button variant="destructive">Remove application</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="dialog-scroll">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove "paperless"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Its containers will stop. Named volumes and the data
                      directory are kept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => setMessage("Example Application removed.")}
                    >
                      Remove application
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
                  <DrawerTitle>Edit application</DrawerTitle>
                  <DrawerDescription>
                    Update the example Application name.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerBody>
                  <FormField label="Name" defaultValue="paperless" />
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
            <Button>Connection details</Button>
          </PopoverTrigger>
          <PopoverContent>
            <h3 className="t-h3">Local network</h3>
            <KV>
              <KVKey>Hostname</KVKey>
              <KVValue>paperless.home.lan</KVValue>
              <KVKey>Port</KVKey>
              <KVValue>80</KVValue>
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
                Application actions <span aria-hidden="true">⌄</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>paperless</DropdownMenuLabel>
              {["View logs", "Restart", "Copy hostname"].map((action) => (
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
                onSelect={() => setMessage("Remove application selected.")}
              >
                Remove application
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Deploying (unavailable)
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
              <Button>Automatic restart</Button>
            </TooltipTrigger>
            <TooltipContent>
              Restart the container if its process exits.
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
              <span className="t-label">self-host</span>
            </div>
            <nav aria-label="Example shell navigation">
              <a className="nav-item" href="#overview" aria-current="page">
                Overview
              </a>
              <a className="nav-item" href="#app/hermes">
                Applications
              </a>
            </nav>
          </aside>
          <AppShellMain>
            <div className="gallery-header-preview">
              <nav className="breadcrumb" aria-label="Example shell breadcrumb">
                <a href="#overview">Console</a>
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
              <p className="t-caps">Applications</p>
              <nav aria-label="Example split list">
                <a className="nav-item" href="#app/hermes" aria-current="page">
                  <Dot variant="success" />
                  hermes
                </a>
                <a className="nav-item" href="#app/teste">
                  <Dot variant="warning" />
                  teste
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
                <KVKey>Image</KVKey>
                <KVValue>paperlessngx:2.11</KVValue>
                <KVKey>Ports</KVKey>
                <KVValue>8000 &rarr; 80</KVValue>
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
                <StatLabel>Applications</StatLabel>
                <StatDelta variant="success">+2</StatDelta>
              </StatHeader>
              <StatValue>4</StatValue>
              <StatFoot>3 running &middot; 1 crashed</StatFoot>
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
              <KVKey>Image</KVKey>
              <KVValue>paperlessngx:2.11</KVValue>
              <KVKey>Container</KVKey>
              <KVValue>a1f4c9e2b7d8</KVValue>
              <KVKey>Ports</KVKey>
              <KVValue>8000 &rarr; 80</KVValue>
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
}: {
  route: string;
  theme: string;
  onThemeChange: (theme: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = route.split("/")[1] || "all";
  const entries = catalog.filter((entry) =>
    entry[1].toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visible =
    selected === "all"
      ? entries
      : entries.filter((entry) => entry[0] === selected);
  useEffect(() => {
    if (
      document.activeElement?.getAttribute("aria-label") === "Find a component"
    )
      return;
    setMenuOpen(false);
    heading.current?.focus();
  }, [route]);
  return (
    <div className="component-gallery">
      <aside
        id="component-navigation"
        className={`catalog-sidebar ${menuOpen ? "catalog-open" : ""}`}
      >
        <Button className="catalog-menu" onClick={() => setMenuOpen(false)}>
          Close catalog
        </Button>
        <div className="brand">
          <BrandMark>K</BrandMark>
          <div>
            <p className="t-label">Kiso</p>
            <p className="muted t-label">Component catalog</p>
          </div>
        </div>
        <Search
          aria-label="Find a component"
          placeholder="Find a component..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            window.location.hash = "components";
          }}
        />
        <Navigation aria-label="Component catalog">
          <NavigationGroup>
            <NavigationList>
              <NavigationItem>
                <NavigationLink href="#components" active={selected === "all"}>
                  All components <span className="muted">{catalog.length}</span>
                </NavigationLink>
              </NavigationItem>
            </NavigationList>
          </NavigationGroup>
          {Array.from(new Set(catalog.map((entry) => entry[2]))).map((group) => (
            <NavigationGroup className="catalog-group" key={group} label={group}>
              <NavigationList>
                {entries
                  .filter((entry) => entry[2] === group)
                  .map(([id, name]) => (
                    <NavigationItem key={id}>
                      <NavigationLink
                        href={`#components/${id}`}
                        active={selected === id}
                      >
                        {name}
                      </NavigationLink>
                    </NavigationItem>
                  ))}
              </NavigationList>
            </NavigationGroup>
          ))}
        </Navigation>
      </aside>
      <div className="catalog-content">
        <header className="catalog-topbar">
          <Button
            className="catalog-menu"
            size="sm"
            aria-controls="component-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            Components
          </Button>
          <ThemeSelector theme={theme} onChange={onThemeChange} />
        </header>
        <main className="catalog-main">
          <PageHeader>
            <p className="t-caps">React + shadcn + Kiso</p>
            <PageHeaderTitle tabIndex={-1} ref={heading}>
              {selected === "all"
                ? "Component gallery"
                : catalog.find((entry) => entry[0] === selected)?.[1] ||
                  "Component not found"}
            </PageHeaderTitle>
            <PageHeaderDescription>
              {catalog.length} Kiso components, with previews, states and
              compositions. Every preview renders the published
              <code> @momoi-labs/kiso-react </code> component.
            </PageHeaderDescription>
          </PageHeader>
          {visible.map(([id, name, group, description]) => (
            <section
              className="catalog-section"
              key={id}
              aria-labelledby={`catalog-${id}`}
            >
              <div className="catalog-section-heading">
                <div>
                  <p className="t-caps">{group}</p>
                  <h2 id={`catalog-${id}`} className="t-h2">
                    {name}
                  </h2>
                  <p className="muted t-label">{description}</p>
                </div>
              </div>
              <div className="catalog-preview">
                <Demo id={id} theme={theme} onThemeChange={onThemeChange} />
              </div>
              {snippets[id] && (
                <details className="catalog-code">
                  <summary>Usage example</summary>
                  <pre>
                    <code>{snippets[id]}</code>
                  </pre>
                </details>
              )}
            </section>
          ))}
          {visible.length === 0 && (
            <EmptyState variant="no-results">
              <EmptyStateTitle>No matching components</EmptyStateTitle>
              <EmptyStateActions>
                <Button
                  onClick={() => {
                    setSearch("");
                    window.location.hash = "components";
                  }}
                >
                  Show all components
                </Button>
              </EmptyStateActions>
            </EmptyState>
          )}
          <p className="muted t-label">
            Preview only. All actions use sample data.
          </p>
        </main>
      </div>
    </div>
  );
}
