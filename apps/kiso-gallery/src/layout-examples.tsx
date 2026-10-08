import { usePaneLayout } from "../../../kiso/blocks/react-prototype/src/use-pane-layout";
import { GuidedFlowDemo } from "../../../kiso/blocks/react-prototype/src/guided-input-demo";
import { CreateProjectDialog, CreateScreen, DetailScreen, ListScreen } from "../../../kiso/blocks/react-prototype/src/screens-demo";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, FileText, Folder, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import {
  Alert,
  AlertContent,
  AlertTitle,
  AlertDescription,
  AppShell,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Dot,
  Header,
  KV,
  KVKey,
  KVValue,
  Navigation,
  NavigationLink,
  PageHeader,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Sidebar,
  Stat,
  StatHeader,
  StatLabel,
  StatValue,
  StatFoot,
  StatDelta,
  Switch,
  Textarea,
  Badge,
  BrandMark,
  Button,
  PaneGrid,
  GridPane,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  Disclosure,
  FormField,
  Input,
  Label,
  Link,
  PasswordInput,
  Spinner,
  Table,
  TableFrame,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";

export const layouts = [
  {
    id: "dashboard",
    label: "Dashboard",
    description:
      "A workspace overview with sidebar, metrics, chart and data table.",
  },
  {
    id: "list-detail",
    label: "List & detail",
    description:
      "A project collection as a split, or as separate list, detail and create screens. New project opens a dialog.",
  },
  {
    id: "settings",
    label: "Settings",
    description:
      "Workspace settings with grouped fields, preferences and account details.",
  },
  {
    id: "login",
    label: "Login",
    description:
      "A focused sign-in screen with access help, a revealable password, pending protection and recoverable errors.",
  },
  { id: "guided-flow", label: "Guided flow", description: "A generic input flow with explicit steps, choices and file selection." },
] as const;

const projects = [
  {
    name: "Website refresh",
    category: "Design",
    status: "In progress",
    owner: "Alex Morgan",
    due: "Sep 18",
    tasks: "18 / 24",
  },
  {
    name: "Getting started guide",
    category: "Content",
    status: "In review",
    owner: "Sam Rivera",
    due: "Sep 20",
    tasks: "12 / 14",
  },
  {
    name: "Customer interviews",
    category: "Research",
    status: "Completed",
    owner: "Jordan Lee",
    due: "Sep 22",
    tasks: "8 / 8",
  },
  {
    name: "Mobile experience",
    category: "Product",
    status: "In progress",
    owner: "Casey Park",
    due: "Sep 25",
    tasks: "6 / 18",
  },
  {
    name: "Brand guidelines",
    category: "Design",
    status: "Planned",
    owner: "Alex Morgan",
    due: "Sep 28",
    tasks: "0 / 12",
  },
];

function Status({ value }: { value: string }) {
  return (
    <Badge
      variant={
        value === "Completed"
          ? "success"
          : value === "In review"
          ? "warning"
          : value === "In progress"
          ? "info"
          : "neutral"
      }
    >
      {value}
    </Badge>
  );
}

function LayoutIcon({ name }: { name: string }) {
  const icons: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    projects: Folder,
    team: Users,
    reports: FileText,
    settings: Settings,
  };
  const Icon = icons[name];
  return <Icon className="icon icon-sm" aria-hidden="true" />;
}

function WorkspacePreview({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  return (
    <AppShell className="layout-shell">
      <Sidebar
        className="layout-sidebar"
        aria-label="Example workspace sidebar"
      >
        <div className="brand">
          <BrandMark>N</BrandMark>
          <div>
            <p className="t-label">Northstar</p>
            <p className="muted t-label">Team workspace</p>
          </div>
        </div>
        <Navigation className="layout-nav" aria-label="Example workspace">
          <p className="t-caps">Workspace</p>
          {[
            ["Overview", "dashboard"],
            ["Projects", "projects"],
            ["Team", "team"],
            ["Reports", "reports"],
          ].map(([label, icon]) => (
            <NavigationLink asChild active={page === label} key={label}>
              <span>
                <LayoutIcon name={icon} />
                {label}
              </span>
            </NavigationLink>
          ))}
          <p className="t-caps">Manage</p>
          <NavigationLink asChild active={page === "Settings"}>
            <span>
              <LayoutIcon name="settings" />
              Settings
            </span>
          </NavigationLink>
          <NavigationLink asChild>
            <span>
              <LayoutIcon name="reports" />
              Help & resources
            </span>
          </NavigationLink>
        </Navigation>
        <div className="layout-account">
          <BrandMark>A</BrandMark>
          <div>
            <p className="t-label">Alex Morgan</p>
            <p className="muted t-label">Personal account</p>
          </div>
        </div>
      </Sidebar>
      <div data-slot="app-shell-main" className="layout-workspace">
        <Header className="layout-header">
          <Breadcrumb aria-label="Example location">
            <BreadcrumbList>
              <BreadcrumbItem>Workspace</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{page}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="layout-inline">
            <Badge variant="neutral">Pro plan</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="btn-icon"
              aria-label="Example notifications"
            >
              <span aria-hidden="true">◇</span>
            </Button>
          </div>
        </Header>
        <div className="layout-content">{children}</div>
      </div>
    </AppShell>
  );
}

function ProjectTable({ compact = false }: { compact?: boolean }) {
  return (
    <TableFrame>
      <Table aria-label="Sample projects">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox aria-label="Select all sample projects" />
            </TableHead>
            <TableHead>Project</TableHead>
            {!compact && <TableHead>Category</TableHead>}
            <TableHead>Status</TableHead>
            {!compact && <TableHead>Owner</TableHead>}
            <TableHead>{compact ? "Due" : "Tasks"}</TableHead>
            <TableHead>
              <span className="muted">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow
              key={project.name}
              className={
                compact && index === 0 ? "layout-selected-row" : undefined
              }
            >
              <TableCell>
                <Checkbox
                  aria-label={`Select ${project.name}`}
                  defaultChecked={compact && index === 0}
                />
              </TableCell>
              <TableCell>
                <span className="layout-project-name">{project.name}</span>
                {compact && <p className="muted t-label">{project.category}</p>}
              </TableCell>
              {!compact && (
                <TableCell>
                  <Badge variant="neutral">{project.category}</Badge>
                </TableCell>
              )}
              <TableCell>
                <Status value={project.status} />
              </TableCell>
              {!compact && <TableCell>{project.owner}</TableCell>}
              <TableCell className="mono">
                {compact ? project.due : project.tasks}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="xs"
                  className="btn-icon"
                  aria-label={`Example actions for ${project.name}`}
                >
                  ⋯
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="table-footer layout-table-footer">
        <span>Showing 5 of 24 projects</span>
        <div className="layout-inline">
          <Button size="xs" disabled>
            Previous
          </Button>
          <span>Page 1 of 5</span>
          <Button size="xs">Next</Button>
        </div>
      </div>
    </TableFrame>
  );
}

function ActivityChart() {
  const gradient = useId();
  const line =
    "M0 158 L24 143 L48 160 L72 108 L96 130 L120 84 L144 116 L168 99 L192 150 L216 114 L240 126 L264 69 L288 93 L312 61 L336 86 L360 116 L384 71 L408 99 L432 45 L456 62 L480 82 L504 48 L528 79 L552 30 L576 64 L600 50 L624 83 L648 46 L672 25 L696 54 L720 18";
  return (
    <section className="layout-section" aria-label="Workspace activity">
      <div className="layout-between">
        <div>
          <h3 className="t-h3">Workspace activity</h3>
          <p className="muted t-label">Tasks completed over the last 30 days</p>
        </div>
        <StatDelta variant="success">↑ 18.6%</StatDelta>
      </div>
      <Card>
        <CardContent>
          <div className="layout-chart-legend">
            <span>
              <Dot />
              This month
            </span>
            <span>
              <Dot />
              Last month
            </span>
          </div>
          <svg
            className="chart layout-chart"
            viewBox="0 0 720 200"
            preserveAspectRatio="none"
            role="img"
            aria-label="Illustrative activity chart. Completed tasks increase over the month and finish above the previous month."
          >
            <defs>
              <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 90, 140, 199].map((y) => (
              <line className="grid" key={y} x1="0" y1={y} x2="720" y2={y} />
            ))}
            <path d={`${line} L720 200 L0 200 Z`} fill={`url(#${gradient})`} />
            <path
              d="M0 178 L24 165 L48 173 L72 145 L96 162 L120 128 L144 143 L168 137 L192 169 L216 143 L240 154 L264 109 L288 125 L312 111 L336 129 L360 155 L384 120 L408 135 L432 90 L456 111 L480 129 L504 101 L528 124 L552 79 L576 108 L600 98 L624 124 L648 100 L672 80 L696 105 L720 69"
              className="layout-chart-comparison"
            />
            <path d={line} className="line" />
          </svg>
          <div className="layout-chart-axis">
            <span>Sep 1</span>
            <span>Sep 5</span>
            <span>Sep 10</span>
            <span>Sep 15</span>
            <span>Sep 20</span>
            <span>Sep 30</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function DashboardLayout() {
  return (
    <WorkspacePreview page="Overview">
      <div className="layout-between">
        <PageHeader>
          <h2 className="t-h1">Overview</h2>
        </PageHeader>
        <Button size="sm">
          September 2026 <ChevronDown className="icon icon-sm" aria-hidden="true" />
        </Button>
      </div>
      <Card className="layout-stats">
        {[
          ["Active projects", "24", "+4", "4 projects started this month"],
          ["Tasks completed", "186", "+18.6%", "32 more than last month"],
          ["Team members", "12", "+2", "Across 3 working groups"],
          ["On-time delivery", "94.2%", "+2.1%", "Above the 90% target"],
        ].map(([label, value, delta, detail]) => (
          <Stat key={label}>
            <StatHeader>
              <StatLabel>{label}</StatLabel>
              <StatDelta variant="success">{delta}</StatDelta>
            </StatHeader>
            <StatValue>{value}</StatValue>
            <StatFoot>{detail}</StatFoot>
          </Stat>
        ))}
      </Card>
      <ActivityChart />
      <section className="layout-section" aria-label="Recent projects">
        <div className="layout-between">
          <div>
            <h3 className="t-h3">Recent projects</h3>
            <p className="muted t-label">The latest work across your team.</p>
          </div>
          <div className="layout-inline">
            <Button size="sm">
              Filter <ChevronDown className="icon icon-sm" aria-hidden="true" />
            </Button>
            <Button variant="primary" size="sm">
              ＋ New project
            </Button>
          </div>
        </div>
        <ProjectTable />
      </section>
    </WorkspacePreview>
  );
}

function ListDetailLayout({ createFails = false }: { createFails?: boolean }) {
  return (
    <WorkspacePreview page="Projects">
      <div className="layout-between">
        <PageHeader>
          <h2 className="t-h1">Projects</h2>
          <p className="muted t-label">
            Plan, organize and keep track of your team's work.
          </p>
        </PageHeader>
        <CreateProjectDialog fail={createFails} trigger={
          <Button variant="primary" size="sm">
            ＋ New project
          </Button>} />
      </div>
      <div className="layout-list-detail">
        <div className="layout-section">
          <div className="layout-list-toolbar">
            <Input
              type="search"
              aria-label="Example project search"
              placeholder="Search projects..."
              readOnly
            />
            <Button size="sm">
              All statuses <ChevronDown className="icon icon-sm" aria-hidden="true" />
            </Button>
          </div>
          <ProjectTable compact />
          <Alert variant="info">
            <AlertContent>
              <AlertTitle>Everything in one place</AlertTitle>
              <AlertDescription>
                Keep project notes, owners and milestones alongside your work.
              </AlertDescription>
            </AlertContent>
          </Alert>
        </div>
        <Card>
          <CardHeader>
            <p className="t-caps">Selected project · PRJ-001</p>
            <h3 className="t-h2">Website refresh</h3>
            <div>
              <Status value="In progress" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="muted">
              Update the website with a clearer structure, new project pages and
              a simpler contact flow.
            </p>
            <KV>
              <KVKey>Owner</KVKey>
              <KVValue>Alex Morgan</KVValue>
              <KVKey>Due date</KVKey>
              <KVValue>Sep 18, 2026</KVValue>
              <KVKey>Category</KVKey>
              <KVValue>Design</KVValue>
              <KVKey>Priority</KVKey>
              <KVValue>High</KVValue>
            </KV>
            <Separator />
            <div className="layout-section">
              <div className="layout-between">
                <span className="t-label">Progress</span>
                <span className="muted t-label">18 of 24 tasks</span>
              </div>
              <progress
                className="layout-progress"
                value={18}
                max={24}
                aria-label="Project progress"
              />
            </div>
            <div className="layout-section">
              <h4 className="t-label">Milestones</h4>
              {[
                ["Discovery & research", true],
                ["Page structure", true],
                ["Visual design", false],
                ["Final review", false],
              ].map(([label, done]) => (
                <label className="layout-check" key={String(label)}>
                  <Checkbox
                    aria-label={String(label)}
                    defaultChecked={Boolean(done)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <Separator />
            <div>
              <p className="t-label">Latest update</p>
              <p className="muted t-label">
                Sam added the first draft of the project pages.
              </p>
              <p className="muted t-label">Today at 10:42 AM</p>
            </div>
          </CardContent>
          <CardFooter>
              <Button size="sm">View activity</Button>
              <Button variant="primary" size="sm">
                Edit project
              </Button>
          </CardFooter>
        </Card>
      </div>
    </WorkspacePreview>
  );
}

function SettingsLayout() {
  const id = useId();
  const paneLayout = usePaneLayout("kiso-settings-pane-layout");
  return (
    <WorkspacePreview page="Settings">
      <div className="layout-between">
        <PageHeader>
          <h2 className="t-h1">Workspace settings</h2>
          <p className="muted t-label">
            Manage your workspace details and preferences.
          </p>
        </PageHeader>
        <Badge variant="neutral">Workspace owner</Badge>
      </div>
      <PaneGrid {...paneLayout} aria-label="Workspace settings groups">
        <GridPane id="general" title="General" min={6} size={12}>
          <p className="muted t-label">How your workspace appears to the team.</p>
          <div className="layout-fields">
            <FormField
              label="Workspace name"
              defaultValue="Northstar"
              readOnly
            />
            <FormField
              label="Workspace URL"
              defaultValue="northstar.example"
              hint="Your team's shared workspace address."
              readOnly
            />
          </div>
          <div className="field">
            <Label htmlFor={`${id}-description`}>Description</Label>
            <Textarea
              id={`${id}-description`}
              rows={3}
              defaultValue="A shared space for ideas, projects and the people behind them."
              readOnly
            />
          </div>
          <div className="layout-fields">
            <div className="field">
              <Label htmlFor={`${id}-language`}>Language</Label>
              <Select defaultValue="English">
                <SelectTrigger id={`${id}-language`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Português">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="field">
              <Label htmlFor={`${id}-timezone`}>Time zone</Label>
              <Select defaultValue="UTC-03:00">
                <SelectTrigger id={`${id}-timezone`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-03:00">UTC-03:00</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardFooter>
            <Button size="sm">Cancel</Button>
            <Button size="sm" variant="primary">
              Save changes
            </Button>
          </CardFooter>
        </GridPane>
        <GridPane id="profile" title="Your profile" min={6} size={6} newRow>
          <div className="layout-account">
            <BrandMark>A</BrandMark>
            <div>
              <p>Alex Morgan</p>
              <p className="muted t-label">Workspace owner</p>
            </div>
          </div>
          <FormField
            label="Display name"
            defaultValue="Alex Morgan"
            readOnly
          />
          <FormField
            label="Email address"
            type="email"
            defaultValue="alex@example.com"
            readOnly
          />
          <CardFooter>
            <Button size="sm">Update profile</Button>
          </CardFooter>
        </GridPane>
        <GridPane id="plan" title="Your plan" min={6} size={6} actions={<Badge variant="info">Pro</Badge>}>
          <p className="stat-value">
            $24<span className="muted t-label"> / member</span>
          </p>
          <p className="muted t-label">12 members · billed monthly</p>
          <Separator />
          <p className="t-label">Storage usage</p>
          <progress
            className="layout-progress"
            value={24}
            max={100}
            aria-label="Storage used"
          />
          <p className="muted t-label">24 GB of 100 GB used</p>
          <CardFooter>
            <Button size="sm">Manage plan</Button>
          </CardFooter>
        </GridPane>
        <GridPane id="notifications" title="Notifications" min={6} size={12} newRow>
          <p className="muted t-label">Choose which updates you receive.</p>
          {[
            ["Project updates", "Changes to projects you follow.", true],
            ["Weekly summary", "A recap of your team's progress.", true],
            ["Product news", "New features and improvements.", false],
          ].map(([title, detail, checked], index) => (
            <div className="settings-row" key={String(title)}>
              <div>
                <Label htmlFor={`${id}-notification-${index}`}>
                  {title}
                </Label>
                <p className="muted t-label">{detail}</p>
              </div>
              <Switch
                id={`${id}-notification-${index}`}
                defaultChecked={Boolean(checked)}
              />
            </div>
          ))}
        </GridPane>
      </PaneGrid>
    </WorkspacePreview>
  );
}

type LoginResult = "success" | "refused" | "service" | "network";
type LoginErrors = { email?: string; password?: string };

const loginResults: [LoginResult, string][] = [
  ["success", "Success"],
  ["refused", "Credentials refused"],
  ["service", "Service failure"],
  ["network", "Connection failure"],
];

const loginFailures = {
  refused: ["Email or password not accepted", "Check both and try again, or reset your password."],
  service: ["Northstar could not sign you in", "This is a problem on our side. Your details are kept; try again in a moment."],
  network: ["Could not reach Northstar", "Check your connection, then try again. Your details are kept."],
} as const;

function LoginBrand() {
  return (
    <div className="brand">
      <BrandMark>N</BrandMark>
      <div className="layout-login-brand">
        <span className="t-label">Northstar</span>
        <span className="t-metadata muted">app.northstar.example</span>
      </div>
    </div>
  );
}

function LoginHelp() {
  return (
    <ul className="layout-login-help stack-sm">
      <li><strong>Forgot your password?</strong> Use Reset password below the form.</li>
      <li><strong>No account yet?</strong> Ask a workspace admin to invite your email address.</li>
      <li><strong>Locked out?</strong> Wait 15 minutes after repeated attempts, or contact your admin.</li>
    </ul>
  );
}

function LoginLayout({ result }: { result: LoginResult }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [failure, setFailure] = useState<Exclude<LoginResult, "success"> | null>(null);
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const next: LoginErrors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^@\s]+@[^@\s]+$/.test(email.trim())) next.email = "Enter an email address like name@example.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    setFailure(null);
    if (next.email || next.password) {
      document.getElementById(next.email ? `${id}-email` : `${id}-password`)?.focus();
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      if (result === "success") return setSignedIn(true);
      setFailure(result);
      if (result === "refused") {
        setPassword("");
        document.getElementById(`${id}-password`)?.focus();
      }
    }, 1200);
  }

  return (
    <div className="layout-login" data-background-style="momoi" data-background-strength="quiet">
      <aside className="layout-login-context" aria-labelledby={`${id}-context`}>
        <LoginBrand />
        <div className="stack-sm">
          <h2 className="t-h1" id={`${id}-context`}>Sign in to your workspace</h2>
          <p className="muted">Use the email address your workspace invited.</p>
        </div>
        <div className="layout-login-context-help stack-sm">
          <h3 className="t-h3">Trouble signing in?</h3>
          <LoginHelp />
        </div>
      </aside>
      <section className="layout-login-access" aria-labelledby={`${id}-title`}>
        <div className="layout-login-panel stack">
          <div className="layout-login-mobile"><LoginBrand /></div>
          <Card>
            <CardHeader>
              <h3 className="t-h3" id={`${id}-title`}>Sign in</h3>
            </CardHeader>
            <CardContent>
              {signedIn ? (
                <div className="stack">
                  <Alert variant="success">
                    <AlertContent>
                      <AlertTitle>Signed in</AlertTitle>
                      <AlertDescription>A product would now open the application shell.</AlertDescription>
                    </AlertContent>
                  </Alert>
                  <Button onClick={() => { setSignedIn(false); setPassword(""); }}>Sign out</Button>
                </div>
              ) : (
                <form className="stack" noValidate aria-busy={pending} onSubmit={submit}>
                  {failure ? (
                    <Alert variant="error">
                      <AlertContent>
                        <AlertTitle>{loginFailures[failure][0]}</AlertTitle>
                        <AlertDescription>{loginFailures[failure][1]}</AlertDescription>
                      </AlertContent>
                    </Alert>
                  ) : null}
                  <FormField id={`${id}-email`} label="Email address" type="email" name="email"
                    autoComplete="username" autoCapitalize="none" spellCheck={false} required
                    readOnly={pending} value={email} error={errors.email}
                    onChange={event => { setEmail(event.target.value); setErrors(e => ({ ...e, email: undefined })); }} />
                  <FormField label="Password" error={errors.password}>
                    <PasswordInput id={`${id}-password`} name="password" required readOnly={pending}
                      value={password}
                      onChange={event => { setPassword(event.target.value); setErrors(e => ({ ...e, password: undefined })); }} />
                  </FormField>
                  <Button type="submit" variant="primary" aria-busy={pending}>
                    {pending ? <Spinner size="sm" /> : null}
                    {pending ? "Signing in..." : "Sign in"}
                  </Button>
                  <Link href="#example/login">Reset password</Link>
                  <Disclosure className="layout-login-mobile" summary="Trouble signing in?">
                    <LoginHelp />
                  </Disclosure>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function LoginExample({ description }: { description: string }) {
  const [result, setResult] = useState<LoginResult>("refused");
  const id = useId();
  return (
    <section aria-label="Login">
      <div className="layout-preview-caption">
        <p className="muted t-label">{description}</p>
        <label className="row t-label layout-scene-controls" htmlFor={`${id}-result`}>
          Sign-in result
          <select id={`${id}-result`} className="select" value={result}
            onChange={event => setResult(event.target.value as LoginResult)}>
            {loginResults.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <Card className="layout-preview">
        <LoginLayout result={result} />
      </Card>
    </section>
  );
}

/* The same projects two ways: a split with the selected record beside the
   list, or separate list, detail and create screens. A screen takes the
   height the shell leaves. */
const scenes = [["split", "Split"], ["list", "List"], ["detail", "Detail"], ["create", "Create"]] as const;

function ListDetailExamples({ description, initialScene }: { description: string; initialScene?: string }) {
  const [scene, setScene] = useState(initialScene && scenes.some(([key]) => key === initialScene) ? initialScene : "split");
  const [createFails, setCreateFails] = useState(false);
  const id = useId();
  return (
    <section aria-label="List & detail">
      <div className="layout-preview-caption">
        <p className="muted t-label">{description}</p>
        <div className="row-wrap layout-scene-controls">
          {scene === "split" || scene === "list" ? (
            <label className="row t-label" htmlFor={`${id}-result`}>
              Save result
              <select id={`${id}-result`} className="select" value={createFails ? "error" : "success"}
                onChange={event => setCreateFails(event.target.value === "error")}>
                <option value="success">Success</option>
                <option value="error">Error, then retry succeeds</option>
              </select>
            </label>
          ) : null}
          <div className="btn-group" role="group" aria-label="View">
            {scenes.map(([key, label]) => (
              <Button key={key} size="sm" aria-pressed={scene === key} onClick={() => setScene(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <Card className="layout-preview">
        {scene === "split" ? <ListDetailLayout createFails={createFails} /> : (
          <WorkspacePreview page="Projects">
            {scene === "list" ? <ListScreen createFails={createFails} /> : scene === "detail" ? <DetailScreen /> : <CreateScreen />}
          </WorkspacePreview>
        )}
      </Card>
    </section>
  );
}

export function LayoutExamples({ route }: { route: string }) {
  const [, requested, scene] = route.split("/");
  const selected =
    layouts.find((layout) => layout.id === requested) ?? layouts[0];
  if (selected.id === "guided-flow") return <GuidedFlowDemo />;
  if (selected.id === "login") return <LoginExample description={selected.description} />;
  if (selected.id === "list-detail") return <ListDetailExamples key={scene} description={selected.description} initialScene={scene} />;
  return (
    <section aria-label={selected.label}>
      <div className="layout-preview-caption">
        <p className="muted t-label">{selected.description}</p>
        <Badge variant="neutral">Static preview</Badge>
      </div>
      <Card className="layout-preview">
        {selected.id === "dashboard" ? (
          <DashboardLayout />
        ) : (
          <SettingsLayout />
        )}
      </Card>
    </section>
  );
}
