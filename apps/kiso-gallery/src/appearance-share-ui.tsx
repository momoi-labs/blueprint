import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, useToast, type ToastNotify } from "@momoi-labs/kiso-react";
import { alertShareOptions } from "../../../kiso/blocks/react-prototype/src/alert-demo";
import { diagramShareOptions } from "../../../kiso/blocks/react-prototype/src/diagram-demo";
import { applicationShellShareOptions } from "../../../kiso/blocks/react-prototype/src/gallery";
import { inlineFieldsShareOptions } from "../../../kiso/blocks/react-prototype/src/inline-fields-demo";
import { paneGridShareOptions } from "../../../kiso/blocks/react-prototype/src/pane-grid-demo";
import { scopeSwitcherShareOptions } from "../../../kiso/blocks/react-prototype/src/scope-switcher-demo";
import { tableShareOptions } from "../../../kiso/blocks/react-prototype/src/table-demo";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { readShare, settingsText, shareLink, type DemoSchema, type ShareResult } from "./appearance-share";

// The demos whose options a shared look carries.
export const demoSchema: DemoSchema = {
  alert: alertShareOptions, applicationShell: applicationShellShareOptions, diagram: diagramShareOptions, inlineFields: inlineFieldsShareOptions,
  paneGrid: paneGridShareOptions, scopeSwitcher: scopeSwitcherShareOptions, table: tableShareOptions,
};

export function announceShare(result: ShareResult, notify: ToastNotify) {
  if (!result.settings) {
    notify("error", "Appearance not applied", `${result.error} Copy the full link or settings again, then retry.`);
  } else if (result.skipped.length) {
    notify("warning", `Appearance applied, ${result.skipped.length} skipped`, `Skipped: ${result.skipped.join(", ")}.`);
  } else {
    notify("success", "Appearance applied");
  }
}

export function AppearanceShare({ settings, demos, onApply }: {
  settings: AppearanceSettings;
  demos: DemoOptions;
  onApply: (settings: AppearanceSettings, demos: DemoOptions) => void;
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
    const result = readShare(text, window.kisoAppearance, demoSchema);
    if (result.settings) onApply(result.settings, result.demos);
    announceShare(result, notify);
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm">Share</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => void copy(shareLink(settings, window.kisoAppearance, demos), "Link copied")}>Copy link</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy(settingsText(settings, demos), "Settings copied")}>Copy settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void paste()}>Paste settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
