import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const kiso = JSON.parse(readFileSync(new URL("../../packages/kiso/package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [react()],
  define: { "import.meta.env.VITE_KISO_VERSION": JSON.stringify(kiso.version) },
});
