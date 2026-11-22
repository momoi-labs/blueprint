// The console also runs on plain HTTP, where the Clipboard API is missing.
export async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const focused = document.activeElement as HTMLElement | null;
  const area = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
  area.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(area);
  area.select();
  let copied = false;
  try { copied = document.execCommand("copy"); }
  finally { area.remove(); focused?.focus(); }
  if (!copied) throw new Error("Copy failed");
}
