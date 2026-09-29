"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Button } from "./button.js";
import { Chip, ChipRemove } from "./chip-input.js";
import {
  filterOperators, formatFilterValue, getFilterSuggestions, parseFilterExpression,
  serializeFilterExpression, serializeFilterNode,
  type FilterField, type FilterNode, type FilterOperator,
} from "./filter-expression.js";

export type FilterInputProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  label: string;
  fields: readonly FilterField[];
  value: FilterNode[];
  onValueChange: (value: FilterNode[]) => void;
  /** Observe uncommitted text, for example to prevent submitting an incomplete search. */
  onDraftChange?: (draft: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

type Segment = "field" | "operator" | "value" | "group";
type Edit = { path: number[]; segment: Segment; text: string; error: string; operator?: FilterOperator };
function nodeAt(nodes: FilterNode[], path: number[]): FilterNode | undefined {
  let node: FilterNode | undefined;
  for (const index of path) {
    node = nodes[index];
    nodes = node?.kind === "group" ? node.children : [];
  }
  return node;
}
function replaceNode(nodes: FilterNode[], path: number[], replacement: FilterNode | null): FilterNode[] {
  return nodes.flatMap((node, index) => {
    if (index !== path[0]) return [node];
    if (path.length === 1) return replacement ? [replacement] : [];
    if (node.kind !== "group") return [node];
    const children = replaceNode(node.children, path.slice(1), replacement);
    return children.length ? [{ ...node, children }] : [];
  });
}
const controlKey = (path: number[], segment: Segment) => `${path.join("-")}-${segment}`;

/** Continuous typing creates segmented filters; the product owns querying and SQL. */
export function FilterInput({
  id: providedId, label, fields, value, onValueChange, onDraftChange,
  disabled = false, placeholder = "status=active OR region IN (eu, us)",
  className, ...props
}: FilterInputProps) {
  const generatedId = React.useId();
  const id = providedId ?? generatedId;
  const host = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const composing = React.useRef(false);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [edit, setEdit] = React.useState<Edit | null>(null);
  const [wholeExpression, setWholeExpression] = React.useState(false);
  const suggestions = getFilterSuggestions(draft, fields, !wholeExpression && value.length > 0);
  const visible = !disabled && !edit && focused && !dismissed && suggestions.length > 0;
  const selected = Math.min(active, Math.max(0, suggestions.length - 1));
  const parsed = parseFilterExpression(draft, fields, { allowLeadingJoin: !wholeExpression && value.length > 0 });

  React.useEffect(() => {
    if (edit && !nodeAt(value, edit.path)) setEdit(null);
  }, [value, edit]);
  React.useEffect(() => {
    if (visible) host.current?.querySelector(`#${CSS.escape(`${id}-option-${selected}`)}`)?.scrollIntoView({ block: "nearest" });
  }, [selected, visible, id]);

  function updateDraft(text: string) {
    setDraft(text); onDraftChange?.(text); setError(""); setActive(0); setDismissed(false);
  }
  function commit(text = draft, reportError = true): boolean {
    if (disabled || !text.trim() && !wholeExpression) return false;
    const result = parseFilterExpression(text, fields, { allowLeadingJoin: !wholeExpression && value.length > 0 });
    if (!result.ok) { if (reportError) setError(result.error); return false; }
    onValueChange(wholeExpression ? result.value : [...value, ...result.value]);
    setWholeExpression(false); updateDraft(""); setDismissed(true);
    setMessage("Filters updated. Keep typing to add another condition.");
    return true;
  }
  function typed(text: string, caretAtEnd: boolean) {
    updateDraft(text);
    if (!composing.current && !wholeExpression && caretAtEnd && /(?:\s|[)\]])$/.test(text)) commit(text, false);
  }
  function choose(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion || disabled) return;
    updateDraft(suggestion.text);
    if (!wholeExpression) commit(suggestion.text, false);
    input.current?.focus();
  }
  function restoreFocus(path: number[], segment: Segment) {
    requestAnimationFrame(() => {
      const button = host.current?.querySelector<HTMLButtonElement>(`[data-filter-control="${controlKey(path, segment)}"]`);
      (button ?? input.current)?.focus();
    });
  }
  function closeEdit() {
    if (!edit) return;
    restoreFocus(edit.path, edit.segment); setEdit(null);
  }
  function beginEdit(path: number[], segment: Segment) {
    if (disabled || edit || wholeExpression || draft.trim()) return;
    const node = nodeAt(value, path);
    if (!node) return;
    const text = node.kind === "group" ? serializeFilterExpression(node.children)
      : segment === "field" ? node.field : segment === "operator" ? node.operator : formatFilterValue(node);
    setEdit({ path, segment, text, error: "" }); setDismissed(true);
  }
  function saveEdit() {
    if (!edit || disabled) return;
    const node = nodeAt(value, edit.path);
    if (!node) { closeEdit(); return; }
    let candidate = edit.text;
    if (node.kind === "condition") {
      let operator = edit.operator ?? node.operator;
      let nextValue = node.value;
      if (edit.segment === "operator") {
        const entered = edit.text.trim().toUpperCase();
        operator = (entered === ":" ? "=" : entered === "~" ? "CONTAINS" : entered) as FilterOperator;
        const field = fields.find(field => field.key === node.field);
        if (!field || !filterOperators(field).includes(operator)) {
          setEdit({ ...edit, error: "Choose an operator supported by this field." }); return;
        }
        if (operator === "IS NULL") nextValue = null;
        else if (nextValue === null || Array.isArray(nextValue) && operator !== "IN" && nextValue.length > 1) {
          setEdit({ ...edit, segment: "value", operator, text: "", error: "Type a value for the new operator, then press Enter." }); return;
        } else if (operator === "IN" && !Array.isArray(nextValue)) nextValue = [nextValue];
        else if (operator !== "IN" && Array.isArray(nextValue)) nextValue = nextValue[0];
      }
      const field = edit.segment === "field" ? edit.text : node.field;
      const editedValue = edit.segment === "value"
        ? operator === "IN" && !/^\s*[(\[]/.test(edit.text) ? `(${edit.text})` : edit.text
        : formatFilterValue({ ...node, value: nextValue });
      candidate = `${field} ${operator} ${operator === "IS NULL" ? "" : editedValue}`;
    }
    const result = parseFilterExpression(candidate, fields);
    if (!result.ok || !result.value.length || node.kind === "condition" && (result.value.length !== 1 || result.value[0].kind !== "condition")) {
      setEdit({ ...edit, error: !result.ok ? result.error : "Enter a valid condition. Groups cannot be empty." }); return;
    }
    const next: FilterNode = node.kind === "group" ? { ...node, children: result.value } : { ...result.value[0], join: node.join };
    onValueChange(replaceNode(value, edit.path, next)); setMessage("Filter updated."); closeEdit();
  }
  function remove(path: number[]) {
    if (disabled) return;
    onValueChange(replaceNode(value, path, null)); setEdit(null); setMessage("Filter removed."); input.current?.focus();
  }
  function keys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (composing.current || event.nativeEvent.isComposing) return;
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length) {
      event.preventDefault(); setDismissed(false);
      setActive(visible ? (selected + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length : event.key === "ArrowDown" ? 0 : suggestions.length - 1);
    } else if (event.key === "Tab" && !event.shiftKey && visible) {
      event.preventDefault(); choose(selected);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (parsed.ok && (parsed.value.length || wholeExpression)) commit();
      else if (visible && draft.trim()) choose(selected);
      else if (draft.trim()) commit();
    } else if (event.key === "Escape") {
      setDismissed(true); setError("");
      if (wholeExpression) { setWholeExpression(false); updateDraft(""); setDismissed(true); setMessage("Expression edit canceled. Filters unchanged."); }
    } else if (event.key === "Backspace" && !draft && !wholeExpression && value.length) {
      event.preventDefault();
      const last = value.at(-1)!;
      onValueChange(value.slice(0, -1));
      updateDraft(`${value.length > 1 ? `${last.join} ` : ""}${serializeFilterNode(last)}`);
      setMessage("Last filter restored as text. Edit it and press Enter.");
    }
  }
  function editor() {
    if (!edit) return null;
    const node = nodeAt(value, edit.path);
    return <span className="filter-editor">
      <input key={controlKey(edit.path, edit.segment)} autoFocus disabled={disabled} className="filter-segment-input"
        aria-label={`Edit ${edit.segment} in ${node ? serializeFilterNode(node) : "filter"}`}
        aria-invalid={!!edit.error} aria-describedby={`${id}-edit-hint`} value={edit.text}
        size={Math.max(6, Math.min(edit.text.length + 1, 48))}
        onFocus={event => event.target.select()} onChange={event => setEdit({ ...edit, text: event.target.value, error: "" })}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") { event.preventDefault(); saveEdit(); }
          if (event.key === "Escape") { event.preventDefault(); closeEdit(); }
        }} />
      <span className="filter-edit-actions"><Button size="xs" onClick={saveEdit} disabled={disabled}>Save</Button><Button size="xs" variant="ghost" onClick={closeEdit} disabled={disabled}>Cancel</Button></span>
    </span>;
  }
  const busy = !!edit || wholeExpression || !!draft.trim();
  function renderNodes(nodes: FilterNode[], parent: number[] = []): React.ReactNode {
    return nodes.map((node, index) => {
      const path = [...parent, index];
      const key = path.join("-");
      const editingHere = edit?.path.join("-") === key;
      const description = serializeFilterNode(node);
      function segment(name: "field" | "operator" | "value", content: React.ReactNode) {
        return editingHere && edit?.segment === name ? editor() : <button type="button" className={`filter-segment filter-${name}`} data-filter-control={controlKey(path, name)} disabled={disabled || busy} aria-label={`Edit ${name} in ${description}`} onClick={() => beginEdit(path, name)}>{content}</button>;
      }
      return <React.Fragment key={key}>
        {index > 0 && <button type="button" className="filter-join" data-join={node.join} disabled={disabled || busy} aria-label={`Change ${node.join} before ${description}`} onClick={() => onValueChange(replaceNode(value, path, { ...node, join: node.join === "AND" ? "OR" : "AND" }))}>{node.join}</button>}
        {node.kind === "group" ? <span className="filter-group" role="group" aria-label={`Filter group: ${serializeFilterExpression(node.children)}`}>
          <button type="button" className="filter-boundary" data-filter-control={controlKey(path, "group")} disabled={disabled || busy} aria-label={`Edit group ${description}`} onClick={() => beginEdit(path, "group")}>(</button>
          {editingHere ? editor() : renderNodes(node.children, path)}
          <span className="filter-boundary" aria-hidden="true">)</span>
          <ChipRemove disabled={disabled || busy} aria-label={`Remove group ${description}`} onClick={() => remove(path)} />
        </span> : <Chip className="filter-chip" invalid={editingHere && !!edit?.error}>
          {segment("field", fields.find(field => field.key === node.field)?.label ?? node.field)}
          {segment("operator", editingHere && edit?.operator ? edit.operator : node.operator)}
          {(editingHere && edit?.operator ? edit.operator : node.operator) !== "IS NULL" && segment("value", Array.isArray(node.value)
            ? <><span aria-hidden="true">(</span>{node.value.map((item, i) => <React.Fragment key={i}>{i > 0 && <span>,</span>}<span className="filter-list-value">{String(item)}</span></React.Fragment>)}<span aria-hidden="true">)</span></>
            : node.value === "" ? '""' : String(node.value))}
          <ChipRemove disabled={disabled || busy} aria-label={`Remove ${description}`} onClick={() => remove(path)} />
        </Chip>}
      </React.Fragment>;
    });
  }

  return <div {...props} ref={host} data-slot="filter-input" className={cn("filter-input", className)}>
    <label className="label" htmlFor={id}>{label}</label>
    <div className="chip-input">
      <div className="chip-input-box filter-box" data-disabled={disabled || undefined} aria-invalid={!!error || undefined}
        onMouseDown={event => { if (event.target === event.currentTarget && !disabled) { event.preventDefault(); input.current?.focus(); } }}>
        {!wholeExpression && renderNodes(value)}
        <input ref={input} id={id} data-slot="filter-input-field" className="chip-input-field filter-field-input"
          role="combobox" autoComplete="off" spellCheck={false} disabled={disabled || !!edit}
          aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? `${id}-list` : undefined}
          aria-activedescendant={visible ? `${id}-option-${selected}` : undefined}
          aria-invalid={!!error} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} placeholder={placeholder} value={draft}
          onChange={event => typed(event.target.value, event.target.selectionStart === event.target.value.length)}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={event => { composing.current = false; typed(event.currentTarget.value, event.currentTarget.selectionStart === event.currentTarget.value.length); }}
          onKeyDown={keys} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </div>
      {visible && <div className="menu filter-suggestions" id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`}>
        {suggestions.map((suggestion, index) => <div key={`${suggestion.text}-${index}`} id={`${id}-option-${index}`} role="option" aria-selected={index === selected} className="menu-item"
          onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
          <span>{suggestion.label}</span><span className="muted">{suggestion.description}</span>
        </div>)}
      </div>}
    </div>
    <p id={`${id}-hint`} className="field-hint">Space completes a filter. Close IN lists and groups with ). Enter also confirms. Tab completes suggestions; Escape closes them. Quote values with spaces.</p>
    {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    {edit && <p id={`${id}-edit-hint`} className={edit.error ? "field-error" : "field-hint"} role={edit.error ? "alert" : undefined}>{edit.error || "Enter saves; Escape cancels. Results use the saved filter until you confirm."}</p>}
    {wholeExpression && <p className="field-hint">Edit parentheses or conditions. Enter saves; Escape cancels. Results still use the saved filters.</p>}
    <div className="filter-actions">
      <Button size="sm" variant="ghost" disabled={disabled || busy || !value.length} onClick={() => { updateDraft(serializeFilterExpression(value)); setWholeExpression(true); input.current?.focus(); }}>Edit expression</Button>
      <Button size="sm" variant="ghost" disabled={disabled || (!value.length && !draft && !edit)} onClick={() => { onValueChange([]); setEdit(null); setWholeExpression(false); updateDraft(""); setMessage("Filters cleared."); requestAnimationFrame(() => input.current?.focus()); }}>Clear filters</Button>
    </div>
    <span className="filter-status" role="status" aria-atomic="true">{message}</span>
  </div>;
}
