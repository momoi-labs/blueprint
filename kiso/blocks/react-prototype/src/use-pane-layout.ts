import { useState } from "react";
import type { PaneGridLayout } from "@momoi-labs/kiso-react";

export function usePaneLayout(key: string) {
  const [layout, setLayout] = useState<PaneGridLayout | undefined>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved && Array.isArray(saved.rows) && saved.rows.every((row: unknown) =>
        Array.isArray(row) && row.every(id => typeof id === "string")) &&
        saved.sizes && Object.values(saved.sizes).every(size => typeof size === "number" && Number.isFinite(size))) return saved;
    } catch { /* Use the default layout when storage is unavailable. */ }
    return undefined;
  });
  function onLayoutChange(next: PaneGridLayout) {
    // Keep panes hidden by the gallery's current filter in the saved layout.
    const visible = new Set(next.rows.flat());
    const hidden = (layout?.rows ?? []).map(row => row.filter(id => !visible.has(id))).filter(row => row.length);
    const value = { rows: [...next.rows, ...hidden], sizes: { ...layout?.sizes, ...next.sizes } };
    setLayout(value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep edits for this session. */ }
  }
  return { layout, onLayoutChange };
}
