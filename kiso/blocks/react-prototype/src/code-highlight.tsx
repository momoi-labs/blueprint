import type { ReactNode } from "react";

// Small highlighters for the previews, marked with Kiso's syntax role
// classes. Products bring their own, such as Prism; Kiso does not ship one.
function highlighter(pattern: RegExp, roles: string[]) {
  return (code: string): ReactNode => {
    const out: ReactNode[] = [];
    let last = 0;
    for (const match of code.matchAll(pattern)) {
      if (match.index > last) out.push(code.slice(last, match.index));
      out.push(<span key={match.index} className={roles[match.slice(1).findIndex(Boolean)]}>{match[0]}</span>);
      last = match.index + match[0].length;
    }
    out.push(code.slice(last));
    return out;
  };
}

export const shell = highlighter(
  /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\{?\w+\}?)|\b(if|then|else|fi|for|in|do|done|until|echo|export|set|exec)\b|(\s--?[\w-]+)/gm,
  ["code-comment", "code-string", "code-name", "code-keyword", "code-constant"]);

export const tsx = highlighter(
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*)|\b(const|let|import|from|export|return|function|type|interface|if|else)\b|\b(true|false|null|undefined|\d+)\b|([\w-]+(?=\s*=))/g,
  ["code-comment", "code-string", "code-keyword", "code-keyword", "code-constant", "code-name"]);

export const yaml = highlighter(
  /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|^(\s*[\w.-]+)(?=:)|(\b\d+[\w.]*\b)/gm,
  ["code-comment", "code-string", "code-name", "code-constant"]);

export const rust = highlighter(
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|\b(fn|let|mut|const|impl|struct|enum|type|match|if|else|for|in|return|pub|use|self|Self|Some|None)\b|\b(true|false|\d[\d_.]*)\b|\b([A-Z]\w*)(?=::|\s*[({<])/g,
  ["code-comment", "code-string", "code-keyword", "code-constant", "code-name"]);
