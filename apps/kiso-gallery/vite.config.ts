import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync } from "node:fs";

const kiso = JSON.parse(readFileSync(new URL("../../packages/kiso/package.json", import.meta.url), "utf8"));

// Kiso's contracts in reading order, as paths under kiso/. Catalog folders
// list their README first, then each contract by name.
const kisoDir = new URL("../../kiso/", import.meta.url);
const catalog = (dir: string) => [
  `docs/${dir}/README.md`,
  ...readdirSync(new URL(`docs/${dir}/`, kisoDir))
    .filter(name => name.endsWith(".md") && name !== "README.md")
    .sort()
    .map(name => `docs/${dir}/${name}`),
];
const contracts = () => [
  "README.md",
  "AGENTS.md",
  ...["brand", "principles", "voice-and-tone", "tokens", "accessibility", "data-interfaces", "terminal-interfaces", "evolution"]
    .map(name => `docs/${name}.md`),
  ...catalog("components"),
  ...catalog("patterns"),
];

// Serves every Kiso contract as one plain-text file at /llms-full.txt, so an
// agent can load the whole system in one request.
function llmsFull(): Plugin {
  const render = () => [
    `# Kiso\n\nKiso is the Momoi Labs design system. This file joins every Kiso contract on the main branch, which can be ahead of the last release, ${kiso.version}. Each contract starts with its source path; relative links resolve from it.`,
    ...contracts().map(path => `Source: https://github.com/momoi-labs/blueprint/blob/main/kiso/${path}\n\n${readFileSync(new URL(path, kisoDir), "utf8").trim()}`),
  ].join("\n\n---\n\n") + "\n";
  return {
    name: "kiso-llms-full",
    configureServer(server) {
      server.middlewares.use("/llms-full.txt", (_req, res) => {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(render());
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms-full.txt", source: render() });
    },
  };
}

export default defineConfig({
  plugins: [react(), llmsFull()],
  define: { "import.meta.env.VITE_KISO_VERSION": JSON.stringify(kiso.version) },
});
