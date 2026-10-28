import { useState } from "react";
import { CodeEditor, FormField } from "@momoi-labs/kiso-react";
import { shell } from "./code-highlight";

const startup = `#!/bin/sh
set -eu
# Wait for the database before the first migration.
until pg_isready -h "$DB_HOST" -U "$DB_USER"; do sleep 1; done
for step in migrate seed; do
  echo "running \${step}"
  ./manage.py "$step"
done
exec "$@"`;

export function CodeEditorDemo() {
  const [script, setScript] = useState(startup);
  const [hook, setHook] = useState("curl -fsS https://example.com/ready\nexit 2");
  return <div className="demo-grid">
    <FormField label="Startup script" hint="Runs in the container before the service starts.">
      <CodeEditor value={script} onChange={event => setScript(event.target.value)} highlight={shell} rows={8} />
    </FormField>
    <FormField label="Health check" error={hook.includes("exit 2") ? "Exit with 0 or 1." : undefined}>
      <CodeEditor value={hook} onChange={event => setHook(event.target.value)} rows={3} />
    </FormField>
    <FormField label="Without line numbers">
      <CodeEditor defaultValue={'echo "ready"'} highlight={shell} lineNumbers={false} rows={2} />
    </FormField>
    <FormField label="Disabled script">
      <CodeEditor defaultValue={"# Managed by the template\nexec ./start.sh"} highlight={shell} disabled rows={2} />
    </FormField>
  </div>;
}
