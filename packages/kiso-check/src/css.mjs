import { lineIndex, stripCssComments } from "./source.mjs";

function join(parents, selector) {
  if (!parents.length) return selector.split(",").map(part => part.trim());
  return parents.flatMap(parent => selector.split(",").map(part => {
    const own = part.trim();
    return own.includes("&") ? own.replaceAll("&", parent) : `${parent} ${own}`;
  }));
}

export function cssRules(raw) {
  const text = stripCssComments(raw);
  const lineOf = lineIndex(text);
  const rules = [];
  function block(start, parents) {
    let index = start;
    let prelude = "";
    let preludeStart = index;
    const declarations = [];
    while (index < text.length) {
      const char = text[index];
      if (char === "}") {
        if (prelude.trim()) declarations.push(declaration(prelude, preludeStart));
        return { end: index + 1, declarations };
      }
      if (char === ";") {
        if (prelude.trim()) declarations.push(declaration(prelude, preludeStart));
        prelude = "";
        preludeStart = index + 1;
        index++;
        continue;
      }
      if (char === "{") {
        const head = prelude.trim();
        const at = head.startsWith("@");
        const selectors = at ? parents : join(parents, head);
        const offset = preludeStart + prelude.search(/\S/);
        const inner = block(index + 1, selectors);
        if (!at) rules.push({ selectors, line: lineOf(offset), declarations: inner.declarations });
        index = inner.end;
        prelude = "";
        preludeStart = index;
        continue;
      }
      if (char === '"' || char === "'") {
        const end = text.indexOf(char, index + 1);
        const stop = end === -1 ? text.length : end + 1;
        prelude += text.slice(index, stop);
        index = stop;
        continue;
      }
      prelude += char;
      index++;
    }
    return { end: index, declarations };
  }
  function declaration(chunk, offset) {
    const colon = chunk.indexOf(":");
    const at = offset + chunk.search(/\S/);
    return { property: chunk.slice(0, colon).trim().toLowerCase(), value: chunk.slice(colon + 1).trim(), line: lineOf(at) };
  }
  block(0, []);
  return rules.filter(rule => rule.declarations.length);
}
