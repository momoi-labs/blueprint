import { useState, type ReactNode } from "react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, FormField, Meter, Switch, TerminalIcon } from "@momoi-labs/kiso-react";

type Panel = "identity" | "project" | "preferences";
const names: Record<Panel, string> = { identity: "Sign in", project: "Project summary", preferences: "Preferences" };

export function HeroPanels() {
  const [front, setFront] = useState<Panel>("project");
  const [signedIn, setSignedIn] = useState(false);
  const [completed, setCompleted] = useState(8);
  const [preferences, setPreferences] = useState([true, true, false]);
  const panel = (id: Panel, children: ReactNode) => <div key={id} className={`hero-panel hero-panel-${id}`} data-front={front === id}>
    <div inert={front !== id} aria-hidden={front !== id}>{children}</div>
    {front !== id && <Button className="hero-panel-reveal" variant="ghost" aria-label={`Bring ${names[id]} to the front`} onClick={event => {
      const layer = event.currentTarget.parentElement;
      setFront(id);
      if (event.detail === 0) requestAnimationFrame(() => layer?.querySelector<HTMLElement>("input, button")?.focus());
    }} />}
  </div>;
  return <div className="intro-composition studio-scene" aria-label="Interactive Kiso examples">
    <div className="hero-panel-stack">
      {panel("preferences", <Card className="hero-preferences"><aside className="hero-preferences-rail"><span className="hero-panel-symbol"><TerminalIcon /></span><strong>Workspace</strong><span>General</span><span className="hero-selected">Preferences</span><span>Members</span></aside><div className="hero-preferences-main"><h2>Make it yours.</h2>{["Email notifications", "Weekly summary", "Product updates"].map((label, index) => <div className="hero-setting" key={label}><label htmlFor={`hero-preference-${index}`}>{label}</label><Switch id={`hero-preference-${index}`} checked={preferences[index]} onCheckedChange={checked => setPreferences(values => values.map((value, at) => at === index ? checked : value))} /></div>)}<p className="muted t-metadata">Your changes apply immediately.</p></div></Card>)}
      {panel("project", <Card><CardHeader><div className="hero-panel-row"><span>Your next project</span><Badge variant={completed === 12 ? "success" : "info"}>{completed === 12 ? "Complete" : "In progress"}</Badge></div></CardHeader><CardContent><h2>Website refresh</h2><div className="hero-metrics"><div><strong>{completed} / 12</strong><span className="muted t-label">Tasks complete</span></div><div><strong>3</strong><span className="muted t-label">Team members</span></div></div><Meter label="Project progress" value={completed} max={12} valueText={`${Math.round(completed / 12 * 100)}%`} /></CardContent><CardFooter><span className="muted t-metadata" role="status">{completed === 12 ? "Project complete." : "Alex is building"}</span><Button variant="primary" size="sm" disabled={completed === 12} onClick={() => setCompleted(value => Math.min(value + 1, 12))}>{completed === 12 ? "All done" : "Complete task →"}</Button></CardFooter></Card>)}
      {panel("identity", <Card className="hero-sign-in"><CardContent><span className="hero-panel-symbol"><TerminalIcon /></span><h2>Welcome to Northstar</h2><p className="muted t-label">Your workspace, one sign-in away.</p><form onSubmit={event => { event.preventDefault(); setSignedIn(true); }}><FormField label="Work email" type="email" required placeholder="you@company.com" autoComplete="off" /><Button variant="primary" type="submit">Continue with email →</Button></form><p className="muted t-metadata" role="status">{signedIn ? "Welcome back. Local preview complete." : "Secure by default. Yours by design."}</p></CardContent></Card>)}
    </div>
  </div>;
}
