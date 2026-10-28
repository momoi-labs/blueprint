"use client";

import { cloneElement, createElement, isValidElement, useState, type ComponentProps, type CSSProperties,
  type ReactElement, type ReactNode } from "react";
import { clsx as cn } from "clsx";
import { Check, Copy } from "lucide-react";
import { Button } from "./button.js";
import { TerminalIcon } from "./terminal-icon.js";
import { useToast } from "./toast.js";
import type { CodeEditorHighlight } from "./code-editor.js";

export type CodeBlockProps = Omit<ComponentProps<"figure">, "children" | "title"> & {
  code: string;
  /** Paints the code, as CodeEditor's `highlight`: React nodes or HTML as `{ __html }`. */
  highlight?: CodeEditorHighlight;
  title?: ReactNode;
  /** Marks the block as commands to run in a terminal. */
  terminal?: boolean;
  lineNumbers?: boolean;
  /** Reads the first column as `+`, `-` or a space, marks the line and paints the rest. */
  diff?: boolean;
  /** 1-based line numbers to mark as added or removed. */
  added?: number[];
  removed?: number[];
  /** 1-based, inclusive line ranges that start folded. */
  collapse?: [number, number][];
  /** The value type for the copy action, as in "command". Shows Copy; needs Toasts. */
  copy?: string;
};

type Change = "added" | "removed" | undefined;

// A highlight paints the whole value, so a token can span lines. These split
// the painted value back into lines, reopening any element a newline cuts.
function splitNode(node: ReactNode): ReactNode[][] {
  if (node == null || typeof node === "boolean") return [[]];
  if (typeof node === "string" || typeof node === "number") return String(node).split("\n").map(part => part ? [part] : []);
  if (Array.isArray(node)) return node.reduce<ReactNode[][]>((lines, child) => {
    const [first, ...rest] = splitNode(child as ReactNode);
    lines[lines.length - 1].push(...first);
    return [...lines, ...rest];
  }, [[]]);
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return splitNode(node.props.children).map((parts, index) =>
      parts.length ? [cloneElement(node as ReactElement, { key: `${node.key ?? ""}:${index}` }, ...parts)] : []);
  }
  return [[node]];
}

// A tag, with `>` allowed inside quoted attribute values, or a run of text.
const htmlPart = /<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+|</gi;

function splitHTML(html: string): string[] {
  const lines = [""];
  const open: [tag: string, name: string][] = [];
  for (const [part] of html.matchAll(htmlPart)) {
    if (part === "<") { lines[lines.length - 1] += "&lt;"; continue; }
    if (part.startsWith("</")) open.pop();
    else if (part.startsWith("<") && !part.endsWith("/>")) open.push([part, /^<([a-z0-9-]+)/i.exec(part)![1]]);
    if (part.startsWith("<")) { lines[lines.length - 1] += part; continue; }
    part.split("\n").forEach((text, index) => {
      if (index) {
        lines[lines.length - 1] += open.map(([, name]) => `</${name}>`).reverse().join("");
        lines.push(open.map(([tag]) => tag).join(""));
      }
      lines[lines.length - 1] += text;
    });
  }
  return lines;
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const htmlText = (html: string) => html.replace(/<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g, "")
  .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => name[0] !== "#" ? entities[name.toLowerCase()] ?? entity
    : String.fromCodePoint(parseInt(name.slice(name[1].toLowerCase() === "x" ? 2 : 1), name[1].toLowerCase() === "x" ? 16 : 10)));
// The text a split line will show. A component that takes its text from
// another prop yields none here, so its line no longer matches the source.
const nodeText = (node: ReactNode): string => node == null || typeof node === "boolean" ? ""
  : typeof node === "string" || typeof node === "number" ? String(node)
  : Array.isArray(node) ? node.map(nodeText).join("")
  : isValidElement<{ children?: ReactNode }>(node) ? nodeText(node.props.children) : "";

// A highlight must keep the value's characters. When the painted lines do not
// read the same as the source, the block shows the source unpainted.
function paint(code: string, highlight?: CodeEditorHighlight): ReactNode[] {
  const rows = code.split("\n");
  const painted = highlight?.(code);
  if (painted == null || painted === false || painted === "") return rows;
  if (typeof painted === "object" && "__html" in painted) {
    const lines = splitHTML(painted.__html);
    if (lines.length !== rows.length || lines.some((line, index) => htmlText(line) !== rows[index])) return rows;
    return lines.map((__html, index) => <span key={index} dangerouslySetInnerHTML={{ __html }} />);
  }
  const lines = splitNode(painted as ReactNode);
  if (lines.length !== rows.length || lines.some((parts, index) => nodeText(parts) !== rows[index])) return rows;
  return lines.map(parts => createElement("span", null, ...parts));
}

// The console also runs on plain HTTP, where the Clipboard API is missing.
async function writeClipboard(text: string) {
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

function CopyButton({ code, label }: { code: string; label: string }) {
  const notify = useToast();
  const [copied, setCopied] = useState(false);
  const name = label[0].toUpperCase() + label.slice(1);
  return <Button size="xs" variant="ghost" aria-label={`${copied ? "Copied" : "Copy"} ${label}`} onClick={async () => {
    try {
      await writeClipboard(code);
      notify("success", `${name} copied`);
      setCopied(true);
      setTimeout(() => setCopied(false), 6000);
    } catch {
      notify("error", `${name} was not copied`, "Clipboard access was blocked. Select the value and copy it manually.");
    }
  }}>
    {copied ? <Check className="icon" aria-hidden="true" /> : <Copy className="icon" aria-hidden="true" />}
    {copied ? "Copied" : "Copy"}
  </Button>;
}

export function CodeBlock({ code, highlight, title, terminal = false, lineNumbers = false, diff = false,
  added = [], removed = [], collapse = [], copy, className, ...props }: CodeBlockProps) {
  const rows = code.split("\n");
  const changes: Change[] = rows.map((row, index) => diff
    ? (row[0] === "+" ? "added" : row[0] === "-" ? "removed" : undefined)
    : added.includes(index + 1) ? "added" : removed.includes(index + 1) ? "removed" : undefined);
  const source = diff ? rows.map(row => /^[+\- ]/.test(row) ? row.slice(1) : row).join("\n") : code;
  const lines = paint(source, highlight);
  const markers = changes.some(Boolean);
  const [open, setOpen] = useState<number[]>([]);
  // A title captions the figure; without one, the header holds only controls.
  const Header = title != null ? "figcaption" : "div";

  const line = (index: number) => <span className="code-block-line" data-change={changes[index]} key={index}>
    {lineNumbers && <span className="code-block-number" aria-hidden="true">{index + 1}</span>}
    {markers && <span className="code-block-marker" aria-hidden="true">
      {changes[index] === "added" ? "+" : changes[index] === "removed" ? "−" : " "}
    </span>}
    {changes[index] && <span className="code-block-change">{changes[index] === "added" ? "Added line: " : "Removed line: "}</span>}
    {lines[index]}{"\n"}
  </span>;

  const body: ReactNode[] = [];
  for (let index = 0; index < lines.length; index++) {
    const range = collapse.findIndex(([from, to]) => from === index + 1 && to >= from && to <= lines.length);
    if (range === -1) { body.push(line(index)); continue; }
    const [from, to] = collapse[range];
    const expanded = open.includes(range);
    const count = to - from + 1;
    body.push(<span className="code-block-line code-block-fold" key={`fold-${range}`}>
      <button type="button" aria-expanded={expanded}
        onClick={() => setOpen(current => expanded ? current.filter(item => item !== range) : [...current, range])}>
        {expanded ? `Hide ${count} lines` : `Show ${count} hidden lines`}
      </button>{"\n"}
    </span>);
    if (expanded) for (let folded = from - 1; folded < to; folded++) body.push(line(folded));
    index = to - 1;
  }

  return (
    <figure className={cn("code-block", className)} data-slot="code-block" data-terminal={terminal || undefined}
      style={{ "--code-block-digits": String(lines.length).length } as CSSProperties} {...props}>
      {(title != null || terminal || copy) && <Header className="code-block-header">
        {terminal && <TerminalIcon />}
        {title != null && <span className="code-block-title">{title}</span>}
        {copy && <CopyButton code={code} label={copy} />}
      </Header>}
      <pre><code>{body}</code></pre>
    </figure>
  );
}
