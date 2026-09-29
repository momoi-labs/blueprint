import { useState } from "react";
import {
  Badge, Button, FilterInput, parseFilterExpression, serializeFilterExpression,
  type FilterCondition, type FilterField, type FilterNode,
} from "@momoi-labs/kiso-react";

const fields: FilterField[] = [
  { key: "status", label: "Status", type: "text", values: ["active", "paused", "failed"] },
  { key: "region", label: "Region", type: "text", values: ["eu", "us", "ap"] },
  { key: "lag", label: "Lag (ms)", type: "number" },
  { key: "owner", label: "Owner", type: "text", nullable: true },
];
const replicas = [
  { name: "api-eu-01", status: "active", region: "eu", lag: 24, owner: "Mina" },
  { name: "api-eu-02", status: "active", region: "eu", lag: 180, owner: "Leo" },
  { name: "worker-us-01", status: "active", region: "us", lag: 320, owner: "Mina" },
  { name: "queue-eu-01", status: "paused", region: "eu", lag: 0, owner: null },
  { name: "api-ap-01", status: "failed", region: "ap", lag: 920, owner: "Nora" },
  { name: "worker-eu-02", status: "failed", region: "eu", lag: 460, owner: null },
  { name: "cache-eu-01", status: "active", region: "eu", lag: 8, owner: "Leo" },
  { name: "cache-us-01", status: "paused", region: "us", lag: 0, owner: "Nora" },
];
const examples = [
  { name: "Two conditions", text: "status=active AND lag>=100" },
  { name: "Several values", text: "region IN (eu, us)" },
  { name: "Nested groups", text: "(status=active OR (status=failed AND lag>=500)) AND region IN (eu, ap)" },
];
function parsed(text: string): FilterNode[] {
  const result = parseFilterExpression(text, fields);
  return result.ok ? result.value : [];
}
// This application adapter belongs to the gallery. FilterInput never queries data.
function conditionMatches(condition: FilterCondition, replica: typeof replicas[number]): boolean {
  const value = replica[condition.field as keyof typeof replica];
  if (condition.operator === "IS NULL") return value === null;
  if (value === null) return false;
  switch (condition.operator) {
    case "=": return value === condition.value;
    case "!=": return value !== condition.value;
    case ">": return Number(value) > Number(condition.value);
    case ">=": return Number(value) >= Number(condition.value);
    case "<": return Number(value) < Number(condition.value);
    case "<=": return Number(value) <= Number(condition.value);
    case "IN": return Array.isArray(condition.value) && condition.value.includes(value);
    case "CONTAINS": return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
  }
}
function matches(nodes: FilterNode[], replica: typeof replicas[number]): boolean {
  if (!nodes.length) return true;
  let disjunction = false;
  let conjunction = true;
  for (const [index, node] of nodes.entries()) {
    if (index > 0 && node.join === "OR") { disjunction ||= conjunction; conjunction = true; }
    conjunction &&= node.kind === "group" ? matches(node.children, replica) : conditionMatches(node, replica);
  }
  return disjunction || conjunction;
}

export function FilterInputDemo() {
  const [value, setValue] = useState<FilterNode[]>([]);
  const [draft, setDraft] = useState("");
  const [generation, setGeneration] = useState(0);
  const rows = replicas.filter(replica => matches(value, replica));
  return <div className="stack filter-demo">
    <p className="muted t-label">Use for structured searches with field/operator/value conditions. For a plain text query, use Search. For dependencies and options, keep ChipInput.</p>
    <FilterInput key={generation} label="Find replicas" fields={fields} value={value} onValueChange={setValue} onDraftChange={setDraft} />
    <p className="muted t-label">Type <code>status=active </code> followed by a space to create a chip. Try <code>region IN (eu, us)</code> or <code>(status=active OR status=paused) AND region=eu</code>. Click one segment to edit it, or a group's opening parenthesis to edit the group.</p>
    <div className="demo-row">{examples.map(example => <Button key={example.name} size="sm" disabled={!!draft} onClick={() => { setValue(parsed(example.text)); setGeneration(current => current + 1); }}>{example.name}</Button>)}</div>
    <div className="between"><h3 className="t-h3">Replicas</h3><p className="muted t-label" role="status">{rows.length} of {replicas.length} results{draft ? ". Draft pending." : ""}</p></div>
    <div className="filter-demo-table"><table className="table"><thead><tr><th>Name</th><th>Status</th><th>Region</th><th>Lag (ms)</th><th>Owner</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><td className="mono">{row.name}</td><td><Badge variant={row.status === "failed" ? "danger" : row.status === "active" ? "success" : "neutral"}>{row.status}</Badge></td><td>{row.region}</td><td>{row.lag}</td><td>{row.owner ?? "Unassigned"}</td></tr>)}</tbody></table></div>
    {!rows.length && <p className="muted">No replicas match. Edit a condition or clear the filters.</p>}
    <details className="catalog-code"><summary>Expression and structured value</summary><pre>{serializeFilterExpression(value) || "No filters"}</pre><pre>{JSON.stringify(value, null, 2)}</pre></details>
    <details><summary className="t-label">Disabled state</summary><FilterInput label="Inherited filters" fields={fields} value={parsed(examples[2].text)} onValueChange={() => {}} disabled /></details>
    <p className="muted t-label">The product owns fetching, loading, pagination, and SQL translation. This example filters eight local records. Incomplete text stays in the input until it can be confirmed.</p>
  </div>;
}
