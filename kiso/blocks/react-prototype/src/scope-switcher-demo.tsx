import { useState } from "react";
import { DemoSettings, useDemoOptions } from "./demo-settings";
import { Header, ScopeDestination, ScopeSegment, ScopeSwitcher, type ScopeOption } from "@momoi-labs/kiso-react";

const orgs: ScopeOption[] = [{ value: "acme", label: "Acme" }, { value: "umbrella", label: "Umbrella Corporation" }];
const projects: ScopeOption[] = [
  { value: "checkout", label: "Checkout" },
  { value: "billing", label: "Billing" },
  { value: "analytics", label: "Analytics and reporting for every region" },
];
const servers: ScopeOption[] = [
  ...["db-prod-01", "db-prod-02", "db-replica-01"].map((label) => ({ value: label, label, group: "Checkout" })),
  ...["billing-01", "billing-replica-01"].map((label) => ({ value: label, label, group: "Billing" })),
  ...Array.from({ length: 12 }, (_, index) => {
    const label = `metrics-${String(index + 1).padStart(2, "0")}`;
    return { value: label, label, description: "eu-west-1", group: "Analytics and reporting for every region" };
  }),
];
type State = "ready" | "loading" | "error" | "empty";
export const scopeSwitcherShareOptions = { state: ["ready", "loading", "error", "empty"] satisfies State[] };

// The demo owns the scope the way a product's router would: a project switch
// resets the server to "All servers", and the page itself never changes.
export function ScopeSwitcherDemo() {
  const [org, setOrg] = useState("acme");
  const [project, setProject] = useState("checkout");
  const [server, setServer] = useState("db-prod-01");
  const [{ state }, setOptions] = useDemoOptions<{ state: State }>("scopeSwitcher", { state: "ready" });
  const setState = (next: State) => setOptions({ state: next });
  const shown = project === "all" ? servers : servers.filter((option) => option.group === projects.find((p) => p.value === project)?.label);
  const status = state === "empty" ? "ready" : state;
  return (
    <div className="stack">
      <DemoSettings title="ScopeSwitcher">
      <label className="field">Server state
        <select className="select" value={state} onChange={(event) => setState(event.target.value as State)}>
          <option value="ready">Ready</option>
          <option value="loading">Loading</option>
          <option value="error">Error with retry</option>
          <option value="empty">Empty level</option>
        </select>
      </label>
      </DemoSettings>
      <Header>
        <strong>pg-yard</strong>
        <ScopeSwitcher>
          <ScopeSegment level="Organization" value={org} options={orgs} onValueChange={(value) => { setOrg(value); setProject("all"); setServer("all"); }}
            destinations={<ScopeDestination href="#components/scope-switcher">Organization settings</ScopeDestination>} />
          <ScopeSegment level="Project" value={project} options={projects} all={{ value: "all", label: "All projects" }}
            labels={{ list: "Projects" }} onValueChange={(value) => { setProject(value); setServer("all"); }}
            destinations={<ScopeDestination href="#components/scope-switcher">Manage projects</ScopeDestination>} />
          <ScopeSegment level="Server" value={server} searchable options={status === "ready" && state !== "empty" ? shown : []}
            all={{ value: "all", label: "All servers" }} currentLabel={server === "all" ? "All servers" : server}
            status={status} onRetry={() => { setState("loading"); setTimeout(() => setState("ready"), 800); }}
            labels={{ list: "Servers", empty: state === "empty" ? "No servers in this project." : undefined }}
            onValueChange={setServer}
            destinations={<ScopeDestination href="#components/scope-switcher">Open server details</ScopeDestination>} />
        </ScopeSwitcher>
      </Header>
      <p className="muted t-label">Scope: {org} / {project} / {server}. The page stays on Metrics.</p>
    </div>
  );
}
