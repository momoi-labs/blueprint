import { ApplicationShell } from "@momoi-labs/kiso-react";

export function ConsoleShell({ children }) {
  return (
    <ApplicationShell brand={<span>Yard</span>}>
      <div className="page">{children}</div>
    </ApplicationShell>
  );
}
