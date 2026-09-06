// Throwaway Self Host console simulation, composed from Kiso-styled shadcn components.
import { StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@momoi-labs/kiso-react";
import { Input } from "@momoi-labs/kiso-react";
import { FormField as Field } from "@momoi-labs/kiso-react";
import { ThemeSelector } from "@momoi-labs/kiso-react";
import { ComponentGallery } from "./gallery";
import { Label } from "@momoi-labs/kiso-react";
import { Checkbox } from "@momoi-labs/kiso-react";
import { Badge } from "@momoi-labs/kiso-react";
import { BrandMark, TerminalIcon } from "@momoi-labs/kiso-react";
import { Card, CardContent, CardHeader } from "@momoi-labs/kiso-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@momoi-labs/kiso-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@momoi-labs/kiso-react";
import {
  initialApplications,
  platformServices,
  type Application,
} from "./mock-data";
import "@momoi-labs/kiso-react/styles.css";
import "./prototype.css";
import "./gallery.css";

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    plus: <path d="M8 3v10M3 8h10" />,
    chart: <path d="M2 13h12M4 10V7m4 3V3m4 7V5" />,
    globe: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M2 8h12M8 2c3 3 3 9 0 12-3-3-3-9 0-12" />
      </>
    ),
    key: (
      <>
        <circle cx="5" cy="11" r="3" />
        <path d="m7 9 6-6m-2 2 2 2" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="7" width="10" height="7" rx="1" />
        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
      </>
    ),
    monitor: (
      <>
        <rect x="2" y="2" width="12" height="9" rx="1" />
        <path d="M8 11v3M5 14h6" />
      </>
    ),
    sun: (
      <>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 0v2m0 12v2M0 8h2m12 0h2M2 2l2 2m8 8 2 2M2 14l2-2M12 4l2-2" />
      </>
    ),
    moon: <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" />,
    menu: <path d="M2 4h12M2 8h12M2 12h12" />,
  };
  return (
    <svg
      className="icon icon-sm"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Status({ status }: { status: Application["status"] }) {
  return (
    <Badge
      variant={
        status === "running"
          ? "success"
          : status === "failed"
            ? "danger"
            : "neutral"
      }
    >
      <span className="dot" aria-hidden="true" />
      {status}
    </Badge>
  );
}

function ApplicationForm({
  app,
  busy,
  applications,
  onSave,
  onRemove,
  onCancel,
}: {
  app?: Application;
  busy: string;
  applications: Application[];
  onSave: (
    data: Pick<
      Application,
      "name" | "hostname" | "image" | "aliases" | "source" | "compose"
    >,
  ) => void;
  onRemove?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(app?.name ?? "");
  const [image, setImage] = useState(app?.image ?? "nginx");
  const [hostname, setHostname] = useState(app?.hostname ?? "");
  const [aliases, setAliases] = useState(app?.aliases ?? "");
  const [source, setSource] = useState<"image" | "compose">(
    app?.source ?? "image",
  );
  const [compose, setCompose] = useState(
    app?.compose ||
      "services:\n  web:\n    image: nginx\n    ports:\n      - '80'",
  );
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  return (
    <form
      className="stack app-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (applications.some((a) => a.id !== app?.id && a.name === name)) {
          setError("This name is already in use. Choose another name.");
          return;
        }
        const resolvedHostname = hostname.trim() || `${name}.home.lan`;
        if (
          applications.some(
            (a) => a.id !== app?.id && a.hostname === resolvedHostname,
          )
        ) {
          setError("This hostname is already in use. Choose another hostname.");
          return;
        }
        setError("");
        onSave({
          name,
          image: source === "compose" ? "Compose application" : image,
          hostname: resolvedHostname,
          aliases,
          source,
          compose,
        });
      }}
    >
      <h2 className="t-caps">Configuration</h2>
      <Field
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={63}
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        placeholder="my-app"
        hint="Lowercase letters, numbers and hyphens; at most 63 characters."
      />
      {!app && (
        <div className="field">
          <Label htmlFor="definition">Definition</Label>
          <select
            id="definition"
            className="select"
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
          >
            <option value="image">Container image</option>
            <option value="compose">Compose file</option>
          </select>
        </div>
      )}
      {source === "image" ? (
        <Field
          label="Container image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required
          hint="One container serving HTTP on port 80."
        />
      ) : (
        <div className="field">
          <Label htmlFor="compose">Compose file</Label>
          <textarea
            id="compose"
            className="textarea mono compose-editor"
            value={compose}
            onChange={(e) => setCompose(e.target.value)}
            required
            aria-describedby="compose-help"
          />
          <small id="compose-help" className="field-hint">
            Preview only: the Compose file is stored as text and is not executed
            or validated.
          </small>
        </div>
      )}
      <Field
        label="Hostname"
        value={hostname}
        onChange={(e) => setHostname(e.target.value)}
        placeholder={`${name || "my-app"}.home.lan`}
        pattern="[a-zA-Z0-9]+([a-zA-Z0-9.\-]*[a-zA-Z0-9])?"
        hint={
          app
            ? "Takes effect immediately; the container keeps running."
            : "Leave empty to use the Application name and DNS suffix."
        }
      />
      <Field
        label="Aliases"
        value={aliases}
        onChange={(e) => setAliases(e.target.value)}
        placeholder="old-name.home.lan"
        hint="Other hostnames this Application also answers on, comma separated. Keep the old one here to change the Hostname without breaking it."
      />
      {app && (
        <section aria-labelledby="services-title">
          <h3 className="t-caps section-label" id="services-title">
            Services
          </h3>
          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="num">Restarts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>app</TableCell>
                  <TableCell className="mono">
                    sf-app-{app.id.slice(0, 12)}
                  </TableCell>
                  <TableCell>
                    <Status status={app.status} />
                  </TableCell>
                  <TableCell className="num">{app.restarts}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      )}
      {error && (
        <p
          className="alert alert-danger"
          role="alert"
          tabIndex={-1}
          ref={errorRef}
        >
          {error}
        </p>
      )}
      <div className="form-actions">
        {app ? (
          <Button
            variant="ghost"
            className="remove-action"
            disabled={!!busy}
            onClick={onRemove}
          >
            Remove application
          </Button>
        ) : (
          <Button disabled={!!busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          type="submit"
          disabled={!!busy}
          aria-busy={busy === "Saving" || busy === "Deploying"}
        >
          {busy === "Saving"
            ? "Saving..."
            : busy === "Deploying"
              ? "Deploying..."
              : app
                ? "Save and redeploy"
                : "Deploy"}
        </Button>
      </div>
    </form>
  );
}

function Logs({ app }: { app: Application }) {
  const [following, setFollowing] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (following && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [app.logs, following]);
  return (
    <section className="logs-pane" aria-labelledby="logs-title">
      <div className="logs-heading">
        <h2 id="logs-title" className="t-caps">
          Logs from sf-app-{app.id.slice(0, 12)}
        </h2>
        <div className="row">
          <Button
            size="xs"
            variant="ghost"
            aria-pressed={following}
            onClick={() => setFollowing(!following)}
          >
            {following ? "Pause scroll" : "Follow logs"}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(app.logs.join("\n"));
                setCopyMessage("Copied");
              } catch {
                setCopyMessage("Select and copy the log text below.");
              }
            }}
          >
            Copy
          </Button>
        </div>
      </div>
      {copyMessage && (
        <p className="copy-message t-label" role="status">
          {copyMessage}
        </p>
      )}
      <div className="logview">
        <div
          className="log-scroll"
          ref={scroll}
          tabIndex={0}
          aria-label={`Logs for ${app.name}`}
        >
          <div className="log-lines">
            {app.logs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [apps, setApps] = useState(initialApplications);
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "overview",
  );
  const [theme, setTheme] = useState("system");
  const [search, setSearch] = useState("");
  const [showPlatform, setShowPlatform] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState("");
  const [failNext, setFailNext] = useState(false);
  const [notice, setNotice] = useState({ text: "", error: false });
  const [confirm, setConfirm] = useState<{
    kind: "app" | "key";
    id: string;
    name: string;
  } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [keys, setKeys] = useState([
    { id: "demo-laptop", name: "Laptop", created: "Sep 6, 2026" },
  ]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState("");
  const task = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const selected = route.startsWith("app/")
    ? apps.find((a) => a.id === route.slice(4))
    : undefined;
  const title =
    selected?.name ??
    ({
      overview: "Overview",
      deploy: "Deploy application",
      platform: "Platform",
      dns: "DNS setup",
      keys: "API keys",
      lock: "Console locked",
    }[route] ||
      "Overview");
  const overview =
    !selected && !["deploy", "platform", "dns", "keys", "lock"].includes(route);

  useEffect(() => {
    const navigate = () => {
      setRoute(window.location.hash.slice(1) || "overview");
      setMobileNav(false);
    };
    window.addEventListener("hashchange", navigate);
    return () => {
      window.removeEventListener("hashchange", navigate);
      if (task.current) clearTimeout(task.current);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [route]);
  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (confirmError) alertRef.current?.focus();
  }, [confirmError]);

  function navigate(next: string) {
    window.location.hash = next;
  }
  function run(label: string, complete: () => void, failed?: () => void) {
    if (busy) return;
    const shouldFail = failNext;
    setFailNext(false);
    setBusy(label);
    setNotice({ text: `${label}...`, error: false });
    task.current = setTimeout(() => {
      setBusy("");
      if (shouldFail) {
        setNotice({
          text: "The Host did not respond. Try the action again.",
          error: true,
        });
        failed?.();
      } else complete();
    }, 850);
  }
  function updateApp(id: string, update: Partial<Application>, log: string) {
    setApps((current) =>
      current.map((a) =>
        a.id === id
          ? {
              ...a,
              ...update,
              logs: [
                ...a.logs,
                `${new Date().toLocaleTimeString("en-GB")} [info] ${log}`,
              ],
            }
          : a,
      ),
    );
  }
  function lifecycle(action: "Start" | "Stop" | "Restart") {
    if (!selected) return;
    const a = selected;
    run(`${action} ${a.name}`, () => {
      updateApp(
        a.id,
        {
          status: action === "Stop" ? "stopped" : "running",
          restarts: a.restarts + (action === "Restart" ? 1 : 0),
        },
        action === "Stop"
          ? "Containers stopped. Application is offline."
          : `${action} complete. Listening on :80.`,
      );
      setNotice({
        text: `${a.name} ${action === "Stop" ? "stopped" : action === "Start" ? "started" : "restarted"}.`,
        error: false,
      });
    });
  }
  function openConfirmation(target: NonNullable<typeof confirm>) {
    opener.current = document.activeElement as HTMLElement;
    setConfirmError("");
    setConfirm(target);
  }
  function cancelConfirmation() {
    if (task.current) clearTimeout(task.current);
    setBusy("");
    setConfirm(null);
    setConfirmError("");
    setNotice({ text: "Action cancelled. Nothing changed.", error: false });
  }
  function reset() {
    if (task.current) clearTimeout(task.current);
    setBusy("");
    setApps(initialApplications());
    setConfirm(null);
    setConfirmError("");
    setSearch("");
    setShowPlatform(false);
    setFailNext(false);
    setKeys([{ id: "demo-laptop", name: "Laptop", created: "Sep 6, 2026" }]);
    setNewKey("");
    setKeyName("");
    setNotice({ text: "Demo reset. All sample data restored.", error: false });
    navigate("overview");
  }
  const matches = (name: string) =>
    name.toLowerCase().includes(search.trim().toLowerCase());
  const filtered = apps.filter((a) => matches(a.name));
  const filteredPlatform = showPlatform
    ? platformServices.filter((a) => matches(a.name))
    : [];

  if (route.startsWith("components"))
    return (
      <ComponentGallery route={route} theme={theme} onThemeChange={setTheme} />
    );

  return (
    <div className="app-shell console-prototype">
      <aside
        className={`sidebar ${mobileNav ? "mobile-open" : ""}`}
        id="console-sidebar"
        aria-label="Console navigation"
      >
        <div className="sidebar-header">
          <div className="brand">
            <BrandMark><TerminalIcon /></BrandMark>
            <div>
              <div className="t-label">self-host</div>
              <div className="muted mono t-label">home.lan</div>
            </div>
          </div>
          <Button variant="primary" size="sm" asChild>
            <a href="#deploy">
              <Icon name="plus" />
              Deploy application
            </a>
          </Button>
        </div>
        <div className="sidebar-body">
          <nav className="nav-group" aria-label="Main">
            <a
              className="nav-item"
              href="#overview"
              aria-current={overview ? "page" : undefined}
            >
              <Icon name="chart" />
              Overview
            </a>
          </nav>
          <nav className="nav-group" aria-label="Applications">
            <p className="t-caps">Applications</p>
            {apps.map((a) => (
              <a
                key={a.id}
                className="nav-item"
                href={`#app/${a.id}`}
                aria-current={selected?.id === a.id ? "page" : undefined}
              >
                <span
                  className={`dot ${a.status === "running" ? "success" : a.status === "failed" ? "danger" : "muted"}`}
                  aria-hidden="true"
                />
                {a.name}
              </a>
            ))}
            {apps.length === 0 && (
              <p className="muted t-label sidebar-empty">No applications yet</p>
            )}
          </nav>
        </div>
        <div className="sidebar-footer">
          <a
            className="nav-item"
            href="#dns"
            aria-current={route === "dns" ? "page" : undefined}
          >
            <Icon name="globe" />
            DNS setup
          </a>
          <a
            className="nav-item"
            href="#keys"
            aria-current={route === "keys" ? "page" : undefined}
          >
            <Icon name="key" />
            API keys
          </a>
          <ThemeSelector theme={theme} onChange={setTheme} />
          <hr className="separator" />
          <a className="nav-item" href="#lock">
            <Icon name="lock" />
            Lock
          </a>
        </div>
      </aside>
      <div className="console-content">
        <header className="topbar">
          <Button
            variant="ghost"
            size="sm"
            className="mobile-menu btn-icon"
            aria-label="Toggle navigation"
            aria-controls="console-sidebar"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Icon name="menu" />
          </Button>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="#overview">Console</a>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{title}</span>
          </nav>
          <span className="grow" />
          <a className="health-link" href="#platform">
            <span className="dot success" aria-hidden="true" />
            Healthy
          </a>
        </header>
        <main className="page console-page">
          <header className="detail-heading">
            <div className="page-header">
              <h1 className="t-h1" tabIndex={-1} ref={heading}>
                {title}
              </h1>
              {overview && (
                <p className="muted t-label">
                  {apps.length} applications on home.lan
                </p>
              )}
              {selected && (
                <p className="mono hostname-label">{selected.hostname}</p>
              )}
              {route === "deploy" && (
                <p className="muted t-label">
                  Make an Application available on your LAN.
                </p>
              )}
            </div>
            {selected && (
              <div className="lifecycle">
                <Status status={selected.status} />
                {(["Start", "Stop", "Restart"] as const).map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    disabled={
                      !!busy ||
                      (action === "Start"
                        ? selected.status === "running"
                        : selected.status !== "running")
                    }
                    onClick={() => lifecycle(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </header>

          {overview && (
            <>
              <div className="overview-toolbar">
                <Input
                  type="search"
                  aria-label="Search applications"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="check-label">
                  <Checkbox
                    id="show-platform"
                    checked={showPlatform}
                    onCheckedChange={(v) => setShowPlatform(v === true)}
                  />
                  <Label htmlFor="show-platform">Show platform services</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setShowPlatform(false);
                  }}
                >
                  Clear filters
                </Button>
              </div>
              <div className="stat-grid">
                {[
                  ["Applications", apps.length],
                  [
                    "Running",
                    apps.filter((a) => a.status === "running").length,
                  ],
                  ["Failed", apps.filter((a) => a.status === "failed").length],
                ].map(([label, value]) => (
                  <Card className="stat" key={label}>
                    <p className="stat-label">{label}</p>
                    <p className="stat-value">{value}</p>
                  </Card>
                ))}
              </div>
              <div className="table-wrap">
                <Table aria-label="Applications">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="num">Restarts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <a className="application-link" href={`#app/${a.id}`}>
                            {a.name}
                          </a>
                        </TableCell>
                        <TableCell className="mono">{a.hostname}</TableCell>
                        <TableCell className="mono">{a.image}</TableCell>
                        <TableCell>
                          <Status status={a.status} />
                        </TableCell>
                        <TableCell className="num">{a.restarts}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPlatform.map((a) => (
                      <TableRow key={a.name}>
                        <TableCell>
                          <a className="application-link" href="#platform">
                            {a.name}
                          </a>{" "}
                          <Badge>platform</Badge>
                        </TableCell>
                        <TableCell className="mono">{a.hostname}</TableCell>
                        <TableCell className="mono">{a.image}</TableCell>
                        <TableCell>
                          <Status status="running" />
                        </TableCell>
                        <TableCell className="num">0</TableCell>
                      </TableRow>
                    ))}
                    {filtered.length + filteredPlatform.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="empty">
                            <h2 className="t-h3">
                              {apps.length
                                ? "No matching applications"
                                : "No applications yet"}
                            </h2>
                            <p>
                              {apps.length
                                ? "Try another name or clear the filters."
                                : "Deploy an Application to make it available on your LAN."}
                            </p>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                apps.length ? setSearch("") : navigate("deploy")
                              }
                            >
                              {apps.length
                                ? "Clear search"
                                : "Deploy application"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <p className="table-footer">
                  {filtered.length} of {apps.length} applications
                  {showPlatform
                    ? ` / ${filteredPlatform.length} platform services`
                    : ""}
                </p>
              </div>
            </>
          )}

          {selected && (
            <Card className="detail-panel">
              <div className="detail-split">
                <div className="configuration-pane">
                  <ApplicationForm
                    key={selected.id}
                    app={selected}
                    applications={apps}
                    busy={busy}
                    onCancel={() => navigate("overview")}
                    onRemove={() =>
                      openConfirmation({
                        kind: "app",
                        id: selected.id,
                        name: selected.name,
                      })
                    }
                    onSave={(data) => {
                      const id = selected.id;
                      run("Saving", () => {
                        updateApp(
                          id,
                          { ...data, status: "running" },
                          "Configuration saved. Application redeployed.",
                        );
                        setNotice({
                          text: `${data.name} saved and redeployed.`,
                          error: false,
                        });
                      });
                    }}
                  />
                </div>
                <Logs key={selected.id} app={selected} />
              </div>
            </Card>
          )}
          {route === "deploy" && (
            <Card className="deploy-panel">
              <CardContent>
                <ApplicationForm
                  applications={apps}
                  busy={busy}
                  onCancel={() => navigate("overview")}
                  onSave={(data) =>
                    run("Deploying", () => {
                      const id = crypto.randomUUID();
                      setApps((current) => [
                        ...current,
                        {
                          ...data,
                          id,
                          status: "running",
                          restarts: 0,
                          logs: [
                            `${new Date().toLocaleTimeString("en-GB")} [info] Application deployed. Listening on :80.`,
                          ],
                        },
                      ]);
                      setNotice({
                        text: `${data.name} deployed at ${data.hostname}.`,
                        error: false,
                      });
                      navigate(`app/${id}`);
                    })
                  }
                />
              </CardContent>
            </Card>
          )}
          {route === "platform" && (
            <>
              <p className="muted">
                Platform Infra used for routing, DNS and state storage.
              </p>
              <div className="table-wrap">
                <Table aria-label="Platform services">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platformServices.map((s) => (
                      <TableRow key={s.name}>
                        <TableCell>{s.role}</TableCell>
                        <TableCell className="mono">sf-{s.name}</TableCell>
                        <TableCell className="mono">{s.image}</TableCell>
                        <TableCell>
                          <Status status="running" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {route === "dns" && (
            <Card className="deploy-panel">
              <CardHeader>
                <h2 className="t-h3">Reach Applications on your LAN</h2>
                <p className="muted t-label">
                  Example Host address: 192.168.1.74 / DNS suffix: home.lan
                </p>
              </CardHeader>
              <CardContent>
                <p>
                  Point a device or router at the Host's DNS server to resolve
                  Application Hostnames.
                </p>
                {["Linux", "macOS", "Windows"].map((os) => (
                  <details className="dns-disclosure" key={os}>
                    <summary>{os}</summary>
                    <p>
                      In your network settings, set the DNS server to your
                      actual Host address. Reconnect to the network, then open
                      an Application Hostname such as teste.home.lan.
                    </p>
                  </details>
                ))}
                <p className="muted t-label">
                  These are sample values. This preview does not configure your
                  network.
                </p>
              </CardContent>
            </Card>
          )}
          {route === "keys" && (
            <>
              <Card>
                <CardHeader>
                  <h2 className="t-h3">Create an API key</h2>
                  <p className="muted t-label">
                    Try creating and revoking keys using sample data.
                  </p>
                </CardHeader>
                <CardContent>
                  <form
                    className="key-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = keyName.trim();
                      if (!name) return;
                      setKeys((current) => [
                        ...current,
                        { id: crypto.randomUUID(), name, created: "Just now" },
                      ]);
                      setNewKey(`demo-only-${crypto.randomUUID()}`);
                      setKeyName("");
                      setNotice({
                        text: `Demo key created for ${name}.`,
                        error: false,
                      });
                    }}
                  >
                    <Field
                      label="Label"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="Laptop"
                      required
                    />
                    <Button variant="primary" type="submit">
                      Create key
                    </Button>
                  </form>
                  {newKey && (
                    <div className="alert alert-info" role="status">
                      <div>
                        <p className="alert-title">Example key created</p>
                        <p className="mono key-value">{newKey}</p>
                        <p className="t-label">
                          This demo key cannot authenticate with Self Host.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="table-wrap">
                <Table aria-label="API keys">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell>{k.name}</TableCell>
                        <TableCell>{k.created}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="remove-action"
                            disabled={!!busy}
                            onClick={() =>
                              openConfirmation({
                                kind: "key",
                                id: k.id,
                                name: k.name,
                              })
                            }
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {keys.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>No API keys yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {route === "lock" && (
            <Card className="deploy-panel">
              <CardContent>
                <Icon name="lock" />
                <h2 className="t-h3">Console locked</h2>
                <p className="muted">
                  This is a preview of the locked state. No credentials are
                  needed.
                </p>
                <Button variant="primary" onClick={() => navigate("overview")}>
                  Unlock demo
                </Button>
              </CardContent>
            </Card>
          )}

          <div
            className={`console-notice ${notice.error ? "danger" : "muted"}`}
            role="status"
            aria-live="polite"
          >
            {notice.text}
          </div>
          <a className="gallery-entry-link" href="#components">
            Browse all Kiso components →
          </a>
          <details className="demo-tools">
            <summary>Simulation / no connection to your Host</summary>
            <div className="demo-tools-body">
              <p className="muted t-label">
                Try navigation, search, deploy, editing and lifecycle actions.
                Refreshing restores sample data.
              </p>
              <div className="check-label">
                <Checkbox
                  id="fail-next"
                  checked={failNext}
                  onCheckedChange={(v) => setFailNext(v === true)}
                />
                <Label htmlFor="fail-next">
                  Make the next Application action or revocation fail
                </Label>
              </div>
              <Button size="sm" onClick={reset}>
                Reset demo
              </Button>
            </div>
          </details>
        </main>
      </div>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(next) => {
          if (!next) cancelConfirmation();
        }}
      >
        <AlertDialogContent
          aria-busy={!!busy}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (
              opener.current?.isConnected &&
              !opener.current.hasAttribute("disabled")
            )
              opener.current.focus();
            else heading.current?.focus();
          }}
        >
          <div className="dialog-scroll">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm?.kind === "key" ? "Revoke key" : "Remove"} "
                {confirm?.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm?.kind === "key"
                  ? "Any client using this key will lose access to the Platform."
                  : "Its containers will stop and the Application will no longer be available on your LAN."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="dialog-body">
              {confirm?.kind === "app" && (
                <p className="muted">
                  Named volumes and the data directory are kept on the Host.
                </p>
              )}
              {confirmError && (
                <p
                  className="alert alert-danger"
                  role="alert"
                  ref={alertRef}
                  tabIndex={-1}
                >
                  {confirmError}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!!busy}
                aria-busy={!!busy}
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirm) return;
                  const target = confirm;
                  run(
                    target.kind === "app" ? "Removing" : "Revoking",
                    () => {
                      if (target.kind === "app") {
                        setApps((current) =>
                          current.filter((a) => a.id !== target.id),
                        );
                        navigate("overview");
                      } else
                        setKeys((current) =>
                          current.filter((k) => k.id !== target.id),
                        );
                      setConfirm(null);
                      setNotice({
                        text:
                          target.kind === "app"
                            ? `${target.name} removed. Volumes and data directory kept.`
                            : `${target.name} key revoked.`,
                        error: false,
                      });
                    },
                    () =>
                      setConfirmError(
                        "The Host did not respond. Try again or cancel.",
                      ),
                  );
                }}
              >
                {busy
                  ? `${busy}...`
                  : confirmError
                    ? "Try again"
                    : confirm?.kind === "key"
                      ? "Revoke key"
                      : "Remove application"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
