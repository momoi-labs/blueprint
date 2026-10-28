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

export const yaml = highlighter(
  /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|^(\s*[\w.-]+)(?=:)|(\b\d+[\w.]*\b)/gm,
  ["code-comment", "code-string", "code-name", "code-constant"]);
