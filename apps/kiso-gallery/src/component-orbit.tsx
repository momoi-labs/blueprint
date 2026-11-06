import { useId, useState } from "react";
import { Button, Card, Input, Switch } from "@momoi-labs/kiso-react";

export function ComponentOrbit() {
  const id = useId();
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [applied, setApplied] = useState(false);
  return <div className="studio-live-example component-orbit" aria-label="Interactive controls">
    <span className="component-orbit-ring" aria-hidden />
    <div className="component-orbit-center"><strong>{Number(autoSave) + Number(notifications)}</strong><span className="muted t-metadata">active controls</span></div>
    <Card className="component-orbit-node component-orbit-save"><label htmlFor={`${id}-save`}>Auto-save</label><Switch id={`${id}-save`} checked={autoSave} onCheckedChange={checked => { setAutoSave(checked); setApplied(false); }} /></Card>
    <Card className="component-orbit-node component-orbit-notifications"><label htmlFor={`${id}-notifications`}>Notifications</label><Switch id={`${id}-notifications`} checked={notifications} onCheckedChange={checked => { setNotifications(checked); setApplied(false); }} /></Card>
    <Card className="component-orbit-node component-orbit-input"><Input aria-label="Workspace name" defaultValue="Northstar" onChange={() => setApplied(false)} /></Card>
    <div className="component-orbit-apply"><Button variant="primary" size="sm" onClick={() => setApplied(true)}>Apply changes</Button></div>
    <p className="component-orbit-status muted" role="status">{applied ? "Preferences applied." : "Small controls. Connected behavior."}</p>
  </div>;
}
