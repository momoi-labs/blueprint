// Catalogue previews. Shared exports are distinguished from compositions below.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DropdownMenu,
  Popover,
  Select,
  Switch,
  Tabs,
  Toast,
  Tooltip,
} from "radix-ui";
import { Button } from "@momoi-labs/kiso-react";
import { Input } from "@momoi-labs/kiso-react";
import { Label } from "@momoi-labs/kiso-react";
import { Checkbox } from "@momoi-labs/kiso-react";
import { Badge } from "@momoi-labs/kiso-react";
import { BrandMark, TerminalIcon } from "@momoi-labs/kiso-react";
import { Card, CardContent, CardFooter, CardHeader } from "@momoi-labs/kiso-react";
import { FormField } from "@momoi-labs/kiso-react";
import { ThemeSelector } from "@momoi-labs/kiso-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
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
    "Searchable command layout preview.",
  ],
] as const;

const shared = new Set([
  "brand-mark",
  "button",
  "icon-button",
  "input",
  "checkbox",
  "label",
  "form-field",
  "badge",
  "table",
  "card",
  "theme-selector",
  "modal-dialog",
]);
const snippets: Record<string, string> = {
  "brand-mark":
    '<div className="brand">\n  <BrandMark>S</BrandMark>\n  <span>self-host</span>\n</div>\n<div className="brand">\n  <BrandMark><TerminalIcon /></BrandMark>\n  <span>self-host</span>\n</div>',
  button:
    '<Button variant="primary">Deploy</Button>\n<Button variant="destructive">Remove</Button>\n<Button size="sm" disabled>Unavailable</Button>',
  "icon-button":
    '<Button variant="ghost" className="btn-icon" aria-label="Add application">\n  <PlusIcon aria-hidden="true" />\n</Button>',
  input: '<Input aria-label="Application name" placeholder="my-app" />',
  checkbox:
    '<Checkbox id="platform" checked={checked} onCheckedChange={setChecked} />\n<Label htmlFor="platform">Show platform services</Label>',
  "form-field":
    '<FormField label="Name" hint="Lowercase letters and hyphens." required />',
  label: '<Label htmlFor="name">Application name</Label>\n<Input id="name" />',
  badge: '<Badge variant="success">Running</Badge>',
  card: "<Card>\n  <CardHeader><h2>Application</h2></CardHeader>\n  <CardContent>Configuration</CardContent>\n  <CardFooter><Button>Save</Button></CardFooter>\n</Card>",
  "theme-selector": "<ThemeSelector theme={theme} onChange={setTheme} />",
  textarea:
    '<Label htmlFor="notes">Notes</Label>\n<textarea id="notes" className="textarea" />',
  "helper-text":
    '<small id="name-help" className="field-hint">Use lowercase letters.</small>\n<Input aria-describedby="name-help" />',
  "validation-message":
    '<Input aria-invalid="true" aria-describedby="name-error" />\n<p id="name-error" className="field-error">Use lowercase letters.</p>',
  link: '<a href="#overview">Open console</a>',
  spinner:
    '<span className="spinner" aria-hidden="true" />\n<span role="status">Deploying application...</span>',
  skeleton:
    '<div aria-busy="true" aria-label="Loading application">\n  <div className="skeleton" aria-hidden="true" />\n</div>',
  alert:
    '<div className="alert alert-danger" role="alert">\n  <p>The Host did not respond. Try again.</p>\n</div>',
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

function TaskDialog({ drawer = false }: { drawer?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="stack-sm">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button>{drawer ? "Open drawer" : "Edit application"}</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="kiso-react-overlay" />
          <Dialog.Content
            className={`kiso-react-dialog marked ${drawer ? "gallery-drawer" : ""}`}
          >
            <form
              className="dialog-scroll"
              onSubmit={(e) => {
                e.preventDefault();
                setSaved(true);
                setOpen(false);
              }}
            >
              <div className="dialog-header">
                <Dialog.Title className="t-h3">Edit application</Dialog.Title>
                <Dialog.Description className="muted">
                  Update the example Application name.
                </Dialog.Description>
              </div>
              <div className="dialog-body">
                <FormField label="Name" defaultValue="paperless" required />
              </div>
              <div className="dialog-footer">
                <Dialog.Close asChild>
                  <Button>Cancel</Button>
                </Dialog.Close>
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <p className="muted t-label" role="status">
        {saved ? "Example changes saved." : ""}
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
              {loading && <span className="spinner" aria-hidden="true" />}
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
            <p id={`${uid}-error`} className="field-error">
              Use lowercase letters, numbers and hyphens.
            </p>
          </div>
        </div>
      );
    case "textarea":
      return (
        <div className="field">
          <Label htmlFor={uid}>Operator notes</Label>
          <textarea
            id={uid}
            className="textarea"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
            <Select.Root defaultValue="home.lan" onValueChange={setValue}>
              <Select.Trigger asChild>
                <Button id={uid}>
                  <Select.Value /> <span aria-hidden="true">⌄</span>
                </Button>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  className="menu gallery-floating"
                  sideOffset={4}
                >
                  <Select.Viewport>
                    {["home.lan", "lab.lan", "office.lan"].map((option) => (
                      <Select.Item
                        key={option}
                        value={option}
                        className="menu-item"
                      >
                        <Select.ItemText>{option}</Select.ItemText>
                        <Select.ItemIndicator aria-hidden="true">
                          ✓
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
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
            <div className="check-label" key={item.label}>
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
          <div className="check-label">
            <Switch.Root
              id={uid}
              className="gallery-switch"
              checked={checked}
              onCheckedChange={setChecked}
            >
              <Switch.Thumb className="gallery-switch-thumb" />
            </Switch.Root>
            <Label htmlFor={uid}>Automatic restart</Label>
          </div>
          <p className="muted t-label" role="status">
            Automatic restart is {checked ? "on" : "off"}.
          </p>
          <div className="check-label">
            <Switch.Root
              id={`${uid}-disabled`}
              className="gallery-switch"
              disabled
            >
              <Switch.Thumb className="gallery-switch-thumb" />
            </Switch.Root>
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
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!/^[a-z0-9-]+$/.test(value)}
            aria-describedby={`${uid}-validation`}
          />
          <p
            id={`${uid}-validation`}
            className={
              /^[a-z0-9-]+$/.test(value) ? "field-hint" : "field-error"
            }
          >
            {/^[a-z0-9-]+$/.test(value)
              ? "This name is valid."
              : "Use lowercase letters, numbers and hyphens."}
          </p>
        </div>
      );
    case "search":
      return (
        <div className="stack">
          <Input
            type="search"
            aria-label="Search example applications"
            placeholder="Search by name..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
                <span className="dot" aria-hidden="true" />
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
                    <a href={`#app/${name}`}>{name}</a>
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
          <div className="empty">
            <h3 className="t-h3">No applications yet</h3>
            <p>
              Deploy your first Application to make it available on your LAN.
            </p>
            <Button variant="primary" asChild>
              <a href="#deploy">Deploy application</a>
            </Button>
          </div>
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
          <Card className="stat">
            <p className="stat-label">Running applications</p>
            <p className="stat-value">2</p>
            <p className="stat-foot">All applications healthy</p>
          </Card>
          {feedback}
        </div>
      );
    case "page-header":
      return (
        <div className="detail-heading">
          <div className="page-header">
            <h3 className="t-h1">Applications</h3>
            <p className="muted t-label">2 applications on home.lan</p>
          </div>
          <Button variant="primary" asChild>
            <a href="#deploy">Deploy application</a>
          </Button>
        </div>
      );
    case "header":
      return (
        <div className="gallery-header-preview">
          <nav className="breadcrumb" aria-label="Example header breadcrumb">
            <a href="#overview">Console</a>
            <span aria-hidden="true">/</span>
            <span>Overview</span>
          </nav>
          <Badge variant="success">Healthy</Badge>
        </div>
      );
    case "brand-mark":
      return (
        <div className="demo-row">
          <div className="brand">
            <BrandMark>S</BrandMark>
            <span className="t-label">self-host</span>
          </div>
          <div className="brand">
            <BrandMark><TerminalIcon /></BrandMark>
            <span className="t-label">self-host</span>
          </div>
        </div>
      );
    case "sidebar":
      return (
        <div className="gallery-sidebar-preview">
          <div className="brand">
            <BrandMark><TerminalIcon /></BrandMark>
            <span className="t-label">self-host</span>
          </div>
          <nav aria-label="Example sidebar">
            <a className="nav-item" href="#overview">
              Overview
            </a>
            <p className="t-caps">Applications</p>
            <a className="nav-item" href="#app/hermes">
              hermes
            </a>
            <a className="nav-item" href="#app/teste">
              teste
            </a>
          </nav>
          <ThemeSelector theme={theme} onChange={onThemeChange} />
        </div>
      );
    case "navigation":
      return (
        <nav className="demo-row" aria-label="Example navigation">
          <a href="#overview">Overview</a>
          <a href="#dns">DNS setup</a>
          <a href="#keys">API keys</a>
        </nav>
      );
    case "breadcrumb":
      return (
        <nav className="breadcrumb" aria-label="Example breadcrumb">
          <a href="#overview">Console</a>
          <span aria-hidden="true">/</span>
          <a href="#overview">Applications</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">paperless</span>
        </nav>
      );
    case "link":
      return (
        <div className="demo-row">
          <a href="#overview">Open console</a>
          <a href="#app/teste">View teste</a>
          <a href="#components">Component catalog</a>
        </div>
      );
    case "tabs":
      return (
        <Tabs.Root defaultValue="configuration">
          <Tabs.List className="tabs" aria-label="Application panels">
            <Tabs.Trigger value="configuration">Configuration</Tabs.Trigger>
            <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
            <Tabs.Trigger value="metrics" disabled>
              Metrics (unavailable)
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="gallery-tab-panel" value="configuration">
            <FormField label="Application name" defaultValue="paperless" />
          </Tabs.Content>
          <Tabs.Content className="gallery-tab-panel" value="logs">
            <pre>
              <code>14:14:47 [info] Application ready on port 80.</code>
            </pre>
          </Tabs.Content>
        </Tabs.Root>
      );
    case "pagination":
      return (
        <div className="stack">
          <nav className="pagination demo-row" aria-label="Example pagination">
            <Button
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                size="sm"
                aria-current={page === n ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            <Button
              size="sm"
              disabled={page === 3}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </nav>
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
          {[
            [
              "info",
              "DNS setup required",
              "Point your device at the Host's DNS server.",
            ],
            ["success", "Application deployed", "paperless.home.lan is ready."],
            [
              "warning",
              "Application stopped",
              "Start the Application to make it available again.",
            ],
            [
              "danger",
              "Could not deploy",
              "The Host did not respond. Try again.",
            ],
          ].map(([kind, title, description]) => (
            <div
              key={kind}
              className={`alert alert-${kind}`}
              role={kind === "danger" ? "alert" : "status"}
            >
              <div>
                <p className="alert-title">{title}</p>
                <p className="alert-body">{description}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "spinner":
      return (
        <div className="demo-row" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Deploying application...</span>
        </div>
      );
    case "skeleton":
      return (
        <div
          className="stack-sm"
          aria-busy="true"
          aria-label="Loading application"
        >
          <div className="skeleton gallery-skeleton-title" aria-hidden="true" />
          <div className="skeleton gallery-skeleton-line" aria-hidden="true" />
          <div className="skeleton gallery-skeleton-line" aria-hidden="true" />
          <span className="muted t-label">Loading application details...</span>
        </div>
      );
    case "toast":
      return (
        <Toast.Provider duration={5000}>
          <Button onClick={() => setOpen(true)}>Show notification</Button>
          <Toast.Root open={open} onOpenChange={setOpen} className="toast">
            <div className="grow">
              <Toast.Title className="alert-title">Changes saved</Toast.Title>
              <Toast.Description className="alert-body">
                paperless is redeploying.
              </Toast.Description>
            </div>
            <Toast.Close asChild>
              <Button size="xs" variant="ghost">
                Dismiss
              </Button>
            </Toast.Close>
          </Toast.Root>
          <Toast.Viewport className="gallery-toast-viewport" />
        </Toast.Provider>
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
      return <TaskDialog drawer />;
    case "popover":
      return (
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button>Connection details</Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="gallery-popover gallery-floating"
              sideOffset={4}
            >
              <h3 className="t-h3">Local network</h3>
              <dl className="kv">
                <dt>Hostname</dt>
                <dd>paperless.home.lan</dd>
                <dt>Port</dt>
                <dd>80</dd>
              </dl>
              <Popover.Close asChild>
                <Button size="sm">Close</Button>
              </Popover.Close>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );
    case "dropdown-menu":
      return (
        <div className="stack">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button>
                Application actions <span aria-hidden="true">⌄</span>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="menu gallery-floating"
                sideOffset={4}
              >
                <DropdownMenu.Label className="menu-label t-caps">
                  paperless
                </DropdownMenu.Label>
                {["View logs", "Restart", "Copy hostname"].map((action) => (
                  <DropdownMenu.Item
                    key={action}
                    className="menu-item"
                    onSelect={() => setMessage(`${action} selected.`)}
                  >
                    {action}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="menu-separator" />
                <DropdownMenu.Item className="menu-item" disabled>
                  Deploying (unavailable)
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {feedback}
        </div>
      );
    case "tooltip":
      return (
        <Tooltip.Provider delayDuration={150}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button>Automatic restart</Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="tooltip gallery-floating"
                sideOffset={4}
              >
                Restart the container if its process exits.
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    case "command-palette":
      return (
        <div className="stack">
          <p className="muted t-label">
            Layout preview. Full command-palette keyboard behavior is not
            implemented yet.
          </p>
          <Card>
            <CardContent>
              <Input
                type="search"
                aria-label="Find a command"
                placeholder="Find a command..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <nav className="nav-group" aria-label="Example commands">
                {[
                  ["Open overview", "overview"],
                  ["Deploy application", "deploy"],
                  ["Manage API keys", "keys"],
                ]
                  .filter(([label]) =>
                    label.toLowerCase().includes(value.toLowerCase()),
                  )
                  .map(([label, route]) => (
                    <a className="nav-item" href={`#${route}`} key={route}>
                      {label}
                    </a>
                  ))}
                {![
                  "Open overview",
                  "Deploy application",
                  "Manage API keys",
                ].some((label) =>
                  label.toLowerCase().includes(value.toLowerCase()),
                ) && <p className="muted t-label">No matching commands.</p>}
              </nav>
            </CardContent>
          </Card>
        </div>
      );
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
        <Input
          type="search"
          aria-label="Find a component"
          placeholder="Find a component..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            window.location.hash = "components";
          }}
        />
        <nav aria-label="Component catalog">
          <a
            className="nav-item"
            href="#components"
            aria-current={selected === "all" ? "page" : undefined}
          >
            All components <span className="muted">{catalog.length}</span>
          </a>
          {Array.from(new Set(catalog.map((entry) => entry[2]))).map(
            (group) => (
              <div className="catalog-group" key={group}>
                <p className="t-caps">{group}</p>
                {entries
                  .filter((entry) => entry[2] === group)
                  .map(([id, name]) => (
                    <a
                      key={id}
                      className="nav-item"
                      href={`#components/${id}`}
                      aria-current={selected === id ? "page" : undefined}
                    >
                      {name}
                    </a>
                  ))}
              </div>
            ),
          )}
        </nav>
        <a className="nav-item" href="#overview">
          ← Self Host console
        </a>
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
          <nav className="demo-row" aria-label="Preview pages">
            <a href="#components" aria-current="page">
              Components
            </a>
            <a href="#overview">Self Host console</a>
          </nav>
          <ThemeSelector theme={theme} onChange={onThemeChange} />
        </header>
        <main className="catalog-main">
          <div className="page-header">
            <p className="t-caps">React + shadcn + Kiso</p>
            <h1 className="t-h1" tabIndex={-1} ref={heading}>
              {selected === "all"
                ? "Component gallery"
                : catalog.find((entry) => entry[0] === selected)?.[1] ||
                  "Component not found"}
            </h1>
            <p className="muted">
              {catalog.length} Kiso components, with previews, states and
              compositions.
            </p>
            <p className="muted t-label">
              Shared components are the same exports used in the console.
              Composition previews explore the remaining contracts.
            </p>
          </div>
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
                <Badge variant={shared.has(id) ? "success" : "neutral"}>
                  {shared.has(id) ? "Shared React" : "Composition preview"}
                </Badge>
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
            <div className="empty">
              <h2 className="t-h3">No matching components</h2>
              <Button
                onClick={() => {
                  setSearch("");
                  window.location.hash = "components";
                }}
              >
                Show all components
              </Button>
            </div>
          )}
          <p className="muted t-label">
            Prototype only. All actions use sample data.
          </p>
        </main>
      </div>
    </div>
  );
}
