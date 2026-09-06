import { useId, type ReactNode } from "react";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  Badge,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  FormField,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";

const layouts = [
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
      "A project collection with filters and a selected record alongside it.",
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
      "A focused sign-in screen with credentials and an alternative sign-in option.",
  },
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
  const paths: Record<string, ReactNode> = {
    dashboard: <path d="M2 2h5v5H2zM10 2h4v5h-4zM2 10h5v4H2zM10 10h4v4h-4z" />,
    projects: <path d="M2 4h5l2 2h5v7H2zM2 4V2h5l2 2" />,
    team: (
      <>
        <circle cx="6" cy="5" r="2" />
        <path d="M2 14v-2a4 4 0 0 1 8 0v2M11 3a2 2 0 0 1 0 4m1 3a3 3 0 0 1 2 3v1" />
      </>
    ),
    reports: <path d="M3 2h10v12H3zM5 5h6M5 8h6M5 11h3" />,
    settings: (
      <>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2m0 10v2M1 8h2m10 0h2M3 3l1.5 1.5m7 7L13 13M3 13l1.5-1.5m7-7L13 3" />
      </>
    ),
  };
  return (
    <svg
      className="icon icon-sm"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
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
        <Button variant="primary" size="sm">
          <span aria-hidden="true">＋</span> Create new
        </Button>
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
      <div className="layout-workspace">
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
    <div className="table-wrap">
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
      <div className="layout-table-footer">
        <span>Showing 5 of 24 projects</span>
        <div className="layout-inline">
          <Button size="xs" disabled>
            Previous
          </Button>
          <span>Page 1 of 5</span>
          <Button size="xs">Next</Button>
        </div>
      </div>
    </div>
  );
}

function ActivityChart() {
  const gradient = useId();
  const line =
    "M0 158 L24 143 L48 160 L72 108 L96 130 L120 84 L144 116 L168 99 L192 150 L216 114 L240 126 L264 69 L288 93 L312 61 L336 86 L360 116 L384 71 L408 99 L432 45 L456 62 L480 82 L504 48 L528 79 L552 30 L576 64 L600 50 L624 83 L648 46 L672 25 L696 54 L720 18";
  return (
    <Card>
      <CardHeader>
        <div className="layout-between">
          <div>
            <h3 className="t-h3">Workspace activity</h3>
            <p className="muted t-label">
              Tasks completed over the last 30 days
            </p>
          </div>
          <Badge variant="success">↑ 18.6%</Badge>
        </div>
      </CardHeader>
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
  );
}

function DashboardLayout() {
  return (
    <WorkspacePreview page="Overview">
      <div className="layout-between">
        <PageHeader>
          <p className="t-caps">Your workspace at a glance</p>
          <h2 className="t-h1">Overview</h2>
          <p className="muted t-label">
            Welcome back, Alex. Here is what your team is working on.
          </p>
        </PageHeader>
        <Button size="sm">
          September 2026 <span aria-hidden="true">⌄</span>
        </Button>
      </div>
      <div className="layout-stats">
        {[
          ["Active projects", "24", "+4", "4 projects started this month"],
          ["Tasks completed", "186", "+18.6%", "32 more than last month"],
          ["Team members", "12", "+2", "Across 3 working groups"],
          ["On-time delivery", "94.2%", "+2.1%", "Above the 90% target"],
        ].map(([label, value, delta, detail]) => (
          <Card key={label}>
            <Stat>
              <StatHeader>
                <StatLabel>{label}</StatLabel>
                <StatDelta variant="success">{delta}</StatDelta>
              </StatHeader>
              <StatValue>{value}</StatValue>
              <StatFoot>{detail}</StatFoot>
            </Stat>
          </Card>
        ))}
      </div>
      <ActivityChart />
      <section className="layout-section" aria-label="Recent projects">
        <div className="layout-between">
          <div>
            <h3 className="t-h3">Recent projects</h3>
            <p className="muted t-label">The latest work across your team.</p>
          </div>
          <div className="layout-inline">
            <Button size="sm">
              Filter <span aria-hidden="true">⌄</span>
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

function ListDetailLayout() {
  return (
    <WorkspacePreview page="Projects">
      <div className="layout-between">
        <PageHeader>
          <h2 className="t-h1">Projects</h2>
          <p className="muted t-label">
            Plan, organize and keep track of your team's work.
          </p>
        </PageHeader>
        <Button variant="primary" size="sm">
          ＋ New project
        </Button>
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
              All statuses <span aria-hidden="true">⌄</span>
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
      <div className="layout-settings">
        <div className="layout-section">
          <Card>
            <CardHeader>
              <h3 className="t-h3">General</h3>
              <p className="muted t-label">
                How your workspace appears to the team.
              </p>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter>
              <Button size="sm">Cancel</Button>
              <Button size="sm" variant="primary">
                Save changes
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="t-h3">Notifications</h3>
              <p className="muted t-label">Choose which updates you receive.</p>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
        <div className="layout-section">
          <Card>
            <CardHeader>
              <h3 className="t-h3">Your profile</h3>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter>
              <Button size="sm">Update profile</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="layout-between">
                <h3 className="t-h3">Your plan</h3>
                <Badge variant="info">Pro</Badge>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter>
              <Button size="sm">Manage plan</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </WorkspacePreview>
  );
}

function LoginLayout() {
  return (
    <div className="layout-login">
      <div className="layout-login-form">
        <div className="brand">
          <BrandMark>N</BrandMark>
          <span className="t-label">Northstar</span>
        </div>
        <Card>
          <CardHeader>
            <h2 className="t-h1">Welcome back</h2>
            <p className="muted">Sign in to your workspace to continue.</p>
          </CardHeader>
          <CardContent>
            <Button>Continue with Google</Button>
            <div className="layout-divider">
              <Separator />
              <span className="muted t-label">or use your email</span>
              <Separator />
            </div>
            <FormField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              readOnly
            />
            <FormField
              label="Password"
              type="password"
              placeholder="Enter your password"
              readOnly
            />
            <div className="layout-between">
              <label className="layout-check">
                <Checkbox defaultChecked />
                <span className="t-label">Remember me</span>
              </label>
              <Button variant="ghost" size="xs">
                Forgot password?
              </Button>
            </div>
            <Button variant="primary">Sign in</Button>
          </CardContent>
          <CardFooter>
            <span className="muted t-label">New to Northstar?</span>
            <Button variant="ghost" size="sm">
              Create an account
            </Button>
          </CardFooter>
        </Card>
        <p className="muted t-label">A shared space for your team's work.</p>
      </div>
    </div>
  );
}

export function LayoutExamples({ route }: { route: string }) {
  const requested = route.split("/")[1];
  const selected =
    layouts.find((layout) => layout.id === requested) ?? layouts[0];
  return (
    <Tabs
      value={selected.id}
      onValueChange={(value) => {
        window.location.hash = `example/${value}`;
      }}
    >
      <TabsList className="tabs layout-tabs" aria-label="Example layouts">
        {layouts.map((layout) => (
          <TabsTrigger key={layout.id} value={layout.id}>
            {layout.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="layout-preview-caption">
        <p className="muted t-label">{selected.description}</p>
        <Badge variant="neutral">Static preview</Badge>
      </div>
      {layouts.map((layout) => (
        <TabsContent
          key={layout.id}
          value={layout.id}
          className="layout-tab-panel"
        >
          <Card className="layout-preview">
            {layout.id === "dashboard" ? (
              <DashboardLayout />
            ) : layout.id === "list-detail" ? (
              <ListDetailLayout />
            ) : layout.id === "settings" ? (
              <SettingsLayout />
            ) : (
              <LoginLayout />
            )}
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
