import { CodeBlock, Toasts } from "@momoi-labs/kiso-react";
import { shell, yaml } from "./code-highlight";

const deploy = `curl -fsS -X POST https://console.home.lan/deploy/app-3f2c \\
  -H "Authorization: Bearer $DEPLOY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"delivery_id": "build-42", "branch": "main"}'`;

const changes = `-memory_limit: 512M
+memory_limit: 1G
-replicas: 1
+replicas: 2
 restart: unless-stopped`;

const compose = `services:
  web:
    image: ghcr.io/org/app:v5
    restart: unless-stopped
    command: ["node", "server.js"]
    command: ["node", "server.js", "--port", "8080"]
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/ready"]
      interval: 10s
      retries: 3`;

export function CodeBlockDemo() {
  return <Toasts>
    <div className="stack">
      <CodeBlock terminal title="Deploy from CI" copy="command" highlight={shell} code={deploy} />
      <CodeBlock title="SHA-256 fingerprint" copy="fingerprint"
        code="4F:2A:91:0C:7E:D3:58:B6:12:9F:A4:E0:3B:77:C1:5D:88:06:F2:4A:9E:31:BD:60:C7:15:2E:8A:D9:43:F0:6B" />
      <CodeBlock diff title="Changes" highlight={yaml} code={changes} />
      <CodeBlock title="compose.yaml" copy="Compose file" highlight={yaml} code={compose}
        lineNumbers removed={[5]} added={[6]} collapse={[[9, 12]]} />
    </div>
  </Toasts>;
}
