export function lineIndex(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index++) if (text[index] === "\n") starts.push(index + 1);
  return offset => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (starts[middle] <= offset) low = middle; else high = middle - 1;
    }
    return low + 1;
  };
}

const blank = text => text.replace(/[^\n]/g, " ");

export function stripScriptComments(text) {
  let out = "";
  let index = 0;
  let quote = null;
  while (index < text.length) {
    const char = text[index];
    if (quote) {
      out += char;
      if (char === "\\") { out += text[index + 1] ?? ""; index += 2; continue; }
      if (char === quote || (char === "\n" && quote !== "`")) quote = null;
      index++;
      continue;
    }
    if (char === "/" && text[index + 1] === "/") {
      const end = text.indexOf("\n", index);
      const stop = end === -1 ? text.length : end;
      out += blank(text.slice(index, stop));
      index = stop;
      continue;
    }
    if (char === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += blank(text.slice(index, stop));
      index = stop;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    out += char;
    index++;
  }
  return out;
}

export const stripCssComments = text => text.replace(/\/\*[\s\S]*?\*\//g, blank);

export function skipBalanced(text, start) {
  const open = text[start];
  const close = { "{": "}", "(": ")", "[": "]" }[open];
  let depth = 0;
  let quote = null;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (quote) {
      if (char === "\\") { index++; continue; }
      if (char === quote || (char === "\n" && quote !== "`")) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === open) depth++;
    else if (char === close && --depth === 0) return index + 1;
  }
  return text.length;
}

export function readTag(text, start) {
  const attrs = [];
  let index = start + 1;
  while (index < text.length && /[\w.$-]/.test(text[index])) index++;
  const name = text.slice(start + 1, index);
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) { index++; continue; }
    if (char === "/" && text[index + 1] === ">") return { name, start, end: index + 2, attrs, selfClosing: true };
    if (char === ">") return { name, start, end: index + 1, attrs, selfClosing: false };
    if (char === "{") {
      const end = skipBalanced(text, index);
      attrs.push({ name: "...", start: index, value: text.slice(index, end), valueStart: index });
      index = end;
      continue;
    }
    const attrStart = index;
    while (index < text.length && /[\w:.-]/.test(text[index])) index++;
    if (index === attrStart) { index++; continue; }
    const attrName = text.slice(attrStart, index);
    if (text[index] !== "=") { attrs.push({ name: attrName, start: attrStart, value: null, valueStart: attrStart }); continue; }
    index++;
    const valueStart = index;
    if (text[index] === "{") index = skipBalanced(text, index);
    else if (text[index] === '"' || text[index] === "'") {
      const end = text.indexOf(text[index], index + 1);
      index = end === -1 ? text.length : end + 1;
    }
    attrs.push({ name: attrName, start: attrStart, value: text.slice(valueStart, index), valueStart });
  }
  return { name, start, end: text.length, attrs, selfClosing: true };
}

export function findElements(text, name) {
  const pattern = new RegExp(`<${name.replace(/[.$]/g, "\\$&")}(?=[\\s/>])`, "g");
  const closing = `</${name}>`;
  const elements = [];
  for (const match of text.matchAll(pattern)) {
    if (/[\w$.\]]/.test(text[match.index - 1] ?? "")) continue;
    const tag = readTag(text, match.index);
    let close = tag.end;
    if (!tag.selfClosing) {
      let depth = 1;
      let index = tag.end;
      const scan = new RegExp(`<${name.replace(/[.$]/g, "\\$&")}(?=[\\s/>])|${closing.replace(/[.$/]/g, "\\$&")}`, "g");
      scan.lastIndex = index;
      let found;
      while ((found = scan.exec(text))) {
        if (found[0] === closing) {
          if (--depth === 0) { close = found.index + closing.length; index = found.index; break; }
        } else if (!readTag(text, found.index).selfClosing) depth++;
      }
      tag.inner = text.slice(tag.end, found ? index : text.length);
      tag.innerStart = tag.end;
    }
    tag.close = close;
    elements.push(tag);
  }
  return elements;
}

export function stringLiterals(text) {
  const out = [];
  for (const match of text.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
    out.push({ value: match[1] ?? match[2] ?? match[3].replace(/\$\{[^}]*\}/g, " "), offset: match.index });
  }
  return out;
}

export function parseImports(text) {
  const imports = [];
  const pattern = /import\s+(type\s+)?([\w$]+\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([\w$]+)|([\w$]+))?\s*(?:from\s*)?["']([^"']+)["']/g;
  for (const match of text.matchAll(pattern)) {
    const source = match[6];
    const names = [];
    if (match[3]) {
      for (const part of match[3].split(",")) {
        const spec = part.trim().replace(/^type\s+/, "");
        if (!spec) continue;
        const [imported, local] = spec.split(/\s+as\s+/).map(item => item.trim());
        names.push({ imported, local: local ?? imported });
      }
    }
    if (match[2]) { const local = match[2].replace(",", "").trim(); names.push({ imported: "default", local }); }
    if (match[5]) names.push({ imported: "default", local: match[5] });
    imports.push({ source, names, offset: match.index });
  }
  return imports;
}
