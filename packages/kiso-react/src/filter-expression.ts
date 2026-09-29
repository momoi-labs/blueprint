/** Structured filters. Parsing is opt-in and does not change ChipInput. */
export type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "CONTAINS" | "IS NULL";
export type FilterScalar = string | number;
export type FilterJoin = "AND" | "OR";
export type FilterField = {
  key: string;
  label?: string;
  type: "text" | "number";
  nullable?: boolean;
  operators?: readonly FilterOperator[];
  values?: readonly FilterScalar[];
};
export type FilterCondition = {
  kind: "condition";
  field: string;
  operator: FilterOperator;
  value: FilterScalar | FilterScalar[] | null;
  /** The first node's join is ignored. AND binds before OR within each group. */
  join: FilterJoin;
};
export type FilterGroup = { kind: "group"; children: FilterNode[]; join: FilterJoin };
export type FilterNode = FilterCondition | FilterGroup;
export type FilterParseResult = { ok: true; value: FilterNode[] } | { ok: false; error: string };
export type FilterSuggestion = { label: string; text: string; description: string };

const textOperators: FilterOperator[] = ["=", "!=", "IN", "CONTAINS"];
const numberOperators: FilterOperator[] = ["=", "!=", ">", ">=", "<", "<=", "IN"];
export function filterOperators(field: FilterField): readonly FilterOperator[] {
  const supported = field.type === "number" ? numberOperators : textOperators;
  const allowed = field.nullable ? [...supported, "IS NULL" as const] : supported;
  return field.operators ? field.operators.filter(operator => allowed.includes(operator)) : allowed;
}

export function formatFilterScalar(value: FilterScalar): string {
  return typeof value === "number" || /^[\w.-]+$/.test(value) && !/^(AND|OR)$/i.test(value)
    ? String(value) : JSON.stringify(value);
}
export function formatFilterValue(condition: FilterCondition): string {
  return condition.value === null ? "" : Array.isArray(condition.value)
    ? `(${condition.value.map(formatFilterScalar).join(", ")})`
    : formatFilterScalar(condition.value);
}
export function serializeFilterNode(node: FilterNode): string {
  return node.kind === "group" ? `(${serializeFilterExpression(node.children)})`
    : `${node.field} ${node.operator} ${formatFilterValue(node)}`.trim();
}
export function serializeFilterExpression(nodes: readonly FilterNode[]): string {
  return nodes.map((node, index) => `${index ? `${node.join} ` : ""}${serializeFilterNode(node)}`).join(" ");
}

type Token = { text: string; quoted: boolean; start: number; end: number };
function tokens(source: string, incomplete = false): Token[] {
  const result: Token[] = [];
  let index = 0;
  while (index < source.length) {
    if (/\s/.test(source[index])) { index++; continue; }
    const start = index;
    const quote = source[index];
    if (quote === '"' || quote === "'") {
      let text = "";
      index++;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          index++;
          if (index === source.length) break;
          const escape = source[index++];
          if (escape === "u") {
            const hex = source.slice(index, index + 4);
            if (!/^[0-9a-f]{4}$/i.test(hex)) {
              if (incomplete) break;
              throw new Error("Complete the Unicode escape with four hexadecimal digits.");
            }
            text += String.fromCharCode(parseInt(hex, 16)); index += 4; continue;
          }
          text += ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" } as Record<string, string>)[escape] ?? escape;
        } else text += source[index++];
      }
      if (source[index] !== quote && !incomplete) throw new Error("Close the quoted value before confirming.");
      if (source[index] === quote) index++;
      result.push({ text, quoted: true, start, end: index });
    } else {
      const match = /^(>=|<=|!=|[=<>:~(),\[\]]|[^\s=<>!:~(),\[\]"']+)/.exec(source.slice(index));
      if (!match) {
        if (incomplete) return result;
        throw new Error(`Unexpected character "${source[index]}". Choose a suggested operator.`);
      }
      index += match[0].length;
      result.push({ text: match[0], quoted: false, start, end: index });
    }
  }
  return result;
}

/** Empty input is an empty filter. Incomplete input returns an error without partial results. */
export function parseFilterExpression(
  source: string,
  fields: readonly FilterField[],
  options: { allowLeadingJoin?: boolean } = {},
): FilterParseResult {
  try {
    const input = tokens(source);
    let index = 0;
    const is = (text: string) => !input[index]?.quoted && input[index]?.text.toUpperCase() === text;
    function take(message: string): Token {
      const token = input[index++];
      if (!token) throw new Error(message);
      return token;
    }
    function sequence(nested = false, depth = 0): FilterNode[] {
      // Bound recursion for pasted or generated input; this is not a UI nesting limit.
      if (depth > 64) throw new Error("Too many nested groups. Use fewer than 65 levels.");
      const nodes: FilterNode[] = [];
      while (index < input.length && !(nested && is(")"))) {
        let join: FilterJoin = "AND";
        if (is("AND") || is("OR")) {
          if (!nodes.length && !(options.allowLeadingJoin && !nested)) throw new Error("Add a condition before AND or OR.");
          join = take("").text.toUpperCase() as FilterJoin;
        }
        if (is("(")) {
          index++;
          const children = sequence(true, depth + 1);
          if (!is(")")) throw new Error("Close the filter group with ).");
          index++;
          nodes.push({ kind: "group", children, join });
          continue;
        }
        if (is(")")) throw new Error("This ) has no matching filter group.");
        const name = take("Type a field after the connector.");
        const field = fields.find(field => field.key.toLowerCase() === name.text.toLowerCase());
        if (!field || name.quoted) throw new Error(`Unknown field "${name.text}". Choose a suggested field.`);
        let operator = take(`Choose an operator for ${field.label ?? field.key}.`).text.toUpperCase();
        if (operator === ":") operator = "=";
        if (operator === "~") operator = "CONTAINS";
        if (operator === "IS") {
          if (!is("NULL")) throw new Error("Complete IS NULL, or choose another operator.");
          index++;
          operator = "IS NULL";
        }
        if (!filterOperators(field).includes(operator as FilterOperator)) {
          throw new Error(`${field.label ?? field.key} accepts ${filterOperators(field).join(", ")}.`);
        }
        const scalar = (): FilterScalar => {
          const token = take(`Type a value for ${field.label ?? field.key}.`);
          if (!token.quoted && /^(AND|OR|[(),\[\]])$/i.test(token.text)) throw new Error(`Type a value for ${field.label ?? field.key}. Quote text containing spaces or reserved words.`);
          let value: FilterScalar = token.text;
          if (field.type === "number") {
            if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token.text) || !Number.isFinite(Number(token.text))) throw new Error(`${field.label ?? field.key} needs a finite number.`);
            value = Number(token.text);
          }
          if (field.values && !field.values.includes(value)) throw new Error(`Choose a listed value for ${field.label ?? field.key}.`);
          return value;
        };
        let value: FilterCondition["value"] = null;
        if (operator === "IN") {
          if (!is("(") && !is("[")) throw new Error("Write IN (a, b), with comma-separated values.");
          const closing = take("").text === "(" ? ")" : "]";
          const values = [scalar()];
          while (is(",")) {
            index++;
            // Completion leaves a comma ready for another value; closing ends the list.
            if (is(closing)) break;
            values.push(scalar());
          }
          if (!is(closing)) throw new Error(`Separate IN values with commas and close the list with ${closing}.`);
          index++;
          value = [...new Set(values)];
        } else if (operator !== "IS NULL") value = scalar();
        nodes.push({ kind: "condition", field: field.key, operator: operator as FilterOperator, value, join });
      }
      if (nested && !nodes.length) throw new Error("Add a condition inside the group.");
      return nodes;
    }
    return { ok: true, value: sequence() };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Suggestions replace only the condition at the end of the draft, including inside groups. */
export function getFilterSuggestions(source: string, fields: readonly FilterField[], existing = false): FilterSuggestion[] {
  const complete = parseFilterExpression(source, fields, { allowLeadingJoin: existing });
  if (complete.ok && complete.value.length) return [];
  const input = tokens(source, true);
  let start = 0;
  const stack: ("group" | "list")[] = [];
  input.forEach((token, index) => {
    if (token.quoted) return;
    if (token.text === "(" || token.text === "[") {
      const list = input[index - 1]?.text.toUpperCase() === "IN" && !input[index - 1].quoted;
      stack.push(list ? "list" : "group");
      if (!list) start = token.end;
    } else if (token.text === ")" || token.text === "]") stack.pop();
    else if (!stack.includes("list") && /^(AND|OR)$/i.test(token.text) && /\s/.test(source[token.end] ?? "")) start = token.end;
  });
  const prefix = source.slice(0, start);
  const tail = source.slice(start).trimStart();
  const leadingSpace = source.slice(start).slice(0, source.slice(start).length - tail.length);
  const wrap = (suggestions: FilterSuggestion[]) => suggestions.map(suggestion => ({ ...suggestion, text: prefix + leadingSpace + suggestion.text }));
  const tailResult = parseFilterExpression(tail, fields, { allowLeadingJoin: true });
  if (tailResult.ok && tailResult.value.length) return [];
  const condition = tokens(tail, true);
  const first = condition[0];
  const field = fields.find(field => field.key.toLowerCase() === first?.text.toLowerCase());
  if (!field || condition.length === 1 && !/\s$/.test(tail)) {
    const suggestions = fields.filter(field => field.key.toLowerCase().startsWith(tail.toLowerCase()) || field.label?.toLowerCase().startsWith(tail.toLowerCase()))
      .map(field => ({ label: field.label ?? field.key, text: `${field.key} `, description: field.type === "number" ? "Number" : "Text" }));
    if (existing && !prefix && /^(A|AN|AND|O|OR)$/i.test(tail)) {
      const join = tail.toUpperCase().startsWith("A") ? "AND" : "OR";
      suggestions.push({ label: join, text: `${join} `, description: "Combine with the next filter" });
    }
    return wrap(suggestions);
  }
  const remainder = tail.slice(first.end).trimStart();
  const operatorMatch = /^(IS NULL|CONTAINS|IN|!=|>=|<=|[=<>:~])\s*(.*)$/i.exec(remainder);
  if (!operatorMatch) return wrap(filterOperators(field).filter(operator => operator.startsWith(remainder.toUpperCase())).map(operator => ({ label: operator, text: `${field.key} ${operator} `, description: operator === "IN" ? "Several values" : "Operator" })));
  const operator = operatorMatch[1].toUpperCase();
  const rawValue = operatorMatch[2];
  if (operator === "IS NULL") return [];
  if (operator === "IN") {
    const valueTokens = tokens(rawValue, true);
    if (valueTokens.at(-1)?.text === ")" || valueTokens.at(-1)?.text === "]") return [];
    const lastComma = [...valueTokens].reverse().find(token => token.text === "," && !token.quoted);
    const partial = lastComma ? rawValue.slice(lastComma.end).trim() : rawValue.replace(/^\s*[(\[]/, "").trim();
    const committed = lastComma ? rawValue.slice(0, lastComma.end).replace(/^\s*[(\[]/, "").trim() : "";
    const search = tokens(partial, true)[0]?.text ?? "";
    return wrap((field.values ?? []).filter(value => String(value).toLowerCase().startsWith(search.toLowerCase())).map(value => ({ label: String(value), text: `${field.key} IN (${committed ? `${committed} ` : ""}${formatFilterScalar(value)}, `, description: "Add value; type ) to finish" })));
  }
  const partial = tokens(rawValue, true)[0]?.text ?? "";
  return wrap((field.values ?? []).filter(value => String(value).toLowerCase().startsWith(partial.toLowerCase())).map(value => ({ label: String(value), text: `${field.key} ${operator} ${formatFilterScalar(value)}`, description: "Complete condition" })));
}
