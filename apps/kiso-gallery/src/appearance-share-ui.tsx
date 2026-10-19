import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, useToast, type ToastNotify } from "@momoi-labs/kiso-react";
import type { AppearanceSettings } from "./appearance-settings";
import { readShare, settingsText, shareLink, type ShareResult } from "./appearance-share";

export function announceShare(result: ShareResult, notify: ToastNotify) {
  if (!result.settings) {
    notify("error", "Appearance not applied", `${result.error} Copy the full link or settings again, then retry.`);
  } else if (result.skipped.length) {
    notify("warning", `Appearance applied, ${result.skipped.length} skipped`, `Skipped: ${result.skipped.join(", ")}.`);
  } else {
    notify("success", "Appearance applied");
  }
}

export function AppearanceShare({ settings, onApply }: {
  settings: AppearanceSettings;
  onApply: (settings: AppearanceSettings) => void;
}) {
  const notify = useToast();
  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify("success", done);
    } catch {
      notify("error", "Copy failed", "The browser blocked clipboard access. Allow it for this site, then retry.");
    }
  }
  async function paste() {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      notify("error", "Paste failed", "The browser blocked clipboard access. Allow it for this site, or open the share link instead.");
      return;
    }
    const result = readShare(text, window.kisoAppearance);
    if (result.settings) onApply(result.settings);
    announceShare(result, notify);
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm">Share</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => void copy(shareLink(settings, window.kisoAppearance), "Link copied")}>Copy link</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy(settingsText(settings), "Settings copied")}>Copy settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void paste()}>Paste settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
