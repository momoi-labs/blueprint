# CodeBlock

Shows read-only code: a command to run, a fingerprint, a configuration file
or a change. It adds a title, a terminal mark, a copy action, line numbers,
diff markers and folded lines. It paints a highlight that the product
provides; Kiso ships no highlighter.

## Anatomy and API

1. **Frame**: a panel with the code block surface, border, corners and marks.
   It wraps the header and the code together.
2. **Header (optional)**: the terminal mark, the title and Copy. It shows when
   any of them is set.
3. **Lines**: one row per line, each with an optional number and, in a diff,
   a `+` or `−` marker and a tinted background.
4. **Fold (optional)**: a button that stands for a range of hidden lines.

`CodeBlock` takes the value as `code`, and figure props such as `id` and
`aria-label`.

```tsx
<CodeBlock terminal title="Deploy from CI" copy="command" highlight={bash}
  code={`curl -fsS -X POST ${origin}/deploy/${app.id} \\\n  -H "Authorization: Bearer $DEPLOY_TOKEN"`} />

<CodeBlock diff title="Changes" highlight={yaml}
  code={"-memory_limit: 512M\n+memory_limit: 1G\n restart: unless-stopped"} />
```

| Prop | Default | Behavior |
| --- | --- | --- |
| `code` | required | The value. Copy copies it exactly, diff markers included. |
| `highlight` | none | Paints the code, with the same signature as CodeEditor's: React nodes, or HTML as `{ __html }`. The block splits the result into lines. |
| `title` | none | Names the block, as a figure caption. |
| `terminal` | `false` | Adds the terminal mark: the code is a command to run. |
| `copy` | none | The value type, such as `command`. Shows a labelled Copy action. Needs [Toast](toast.md)'s `Toasts` provider. |
| `lineNumbers` | `false` | Numbers each line. |
| `diff` | `false` | Reads the first column of each line as `+`, `-` or a space, marks the line and paints the rest. |
| `added`, `removed` | none | 1-based line numbers to mark without diff syntax. |
| `collapse` | none | 1-based, inclusive ranges, such as `[[10, 13]]`, that start folded. |

The renderer receives the whole value, or in a diff the value without its
first column, and must return the same characters in the same order. Escape
HTML yourself when you return `{ __html }`. The block reopens an element that
a line break cuts, so a token may span lines. React nodes must carry their
text as children: strings, fragments and elements such as `span`. When the
painted lines do not read the same as the source, for example because a
component takes its text from another prop, the block shows the source
unpainted.

## Highlighting

Mark tokens with the syntax role classes, or color them with the matching
tokens. Text without a role keeps `--color-foreground`.

| Class | Token | Use |
| --- | --- | --- |
| `.code-comment` | `--color-code-comment` | Comments and diff headers. |
| `.code-keyword` | `--color-code-keyword` | Keywords and control flow. |
| `.code-string` | `--color-code-string` | Strings. |
| `.code-constant` | `--color-code-constant` | Numbers, booleans, constants and command options. |
| `.code-name` | `--color-code-name` | Variables and keys. |

A Prism highlighter maps its token types to these classes:

```tsx
const roles: Record<string, string> = { comment: "code-comment", keyword: "code-keyword",
  string: "code-string", number: "code-constant", boolean: "code-constant",
  variable: "code-name", key: "code-name", property: "code-name" };
```

Use the same `highlight` function for CodeBlock and
[CodeEditor](code-editor.md) so examples and editors share colors.

## Copy

Copy follows [data interfaces](../data-interfaces.md#copy-to-clipboard). It is
a labelled `xs` ghost Button, named `Copy {value type}`. Success shows a Toast
such as `Command copied`, and the name changes to `Copied {value type}` for
six seconds. Failure shows an error Toast and leaves the code selectable. On
plain HTTP, where the Clipboard API is missing, Copy falls back to a selection
copy.

## Layout

Lines never wrap; a long line scrolls the code horizontally, and the header
stays in place. The code uses the code type role with ligatures off. Line
numbers grow with the digit count of the last line. A fold sits where its
first hidden line would be, and Copy copies folded lines too.

## States

| State | Behavior |
| --- | --- |
| Default | The frame uses the code block surface and the code uses `--color-foreground`. |
| Highlighted | Tokens use the syntax roles. |
| Added line | `--color-success-surface` at 60%, a `--color-success` edge and a `+` marker. |
| Removed line | `--color-danger-surface` at 60%, a `--color-danger` edge and a `−` marker. |
| Folded | A dashed button reads `Show 4 hidden lines`. Open, it reads `Hide 4 lines` and stays above the lines. |
| Copied | The Copy label and icon change to Copied for six seconds. |
| Forced colors | Syntax colors and tints give way to system colors. Changed lines keep their marker and gain a `CanvasText` edge. |

## Appearance

The frame takes every border style, corner style and frame scope, as other
panels do. The inner code area has no fill, border or radius of its own. The
header keeps one `--color-border` divider.

## Accessibility

- A title becomes the figure caption, so the figure has a name.
- Line numbers and markers are hidden from assistive technology. Each changed
  line starts with hidden text, `Added line:` or `Removed line:`.
- Copy and each fold are buttons with names that state the action. A fold
  sets `aria-expanded`. On a coarse pointer a fold is at least
  `--size-touch-min` high.
- The change tints are lighter than status fills, so muted text such as
  comments and line numbers keeps 4.5:1 on them in every theme and accent.
- Syntax role colors are gated at 4.5:1 against the code block surface in both
  themes and every accent.

## When to use

- Commands a person copies and runs, such as setup steps and `curl` examples.
- Values a person compares or copies, such as fingerprints.
- Configuration and line diffs that a person reads but does not edit here.

## When NOT to use

- Code a person edits; use [CodeEditor](code-editor.md).
- Streaming or long output, such as logs; use [LogView](log-view.md).
- A short value inside a sentence or a table cell; use inline `code`.

## Tokens

The frame uses `--color-surface`, `--color-border` and `--radius-surface`.
Code uses `--type-role-code-font-family`, `--type-role-code-font-size`,
`--type-role-code-line-height` and `--color-foreground`; line numbers and the
header use `--color-muted-foreground`. Syntax uses `--color-code-comment`,
`--color-code-keyword`, `--color-code-string`, `--color-code-constant` and
`--color-code-name`. Changes use `--color-success`, `--color-success-surface`,
`--color-danger` and `--color-danger-surface`. Spacing uses `--spacing-xs`,
`--spacing-sm` and `--spacing-md`.

## Radix/shadcn mapping

Radix and shadcn/ui have no code block. This composes a figure, a `pre` and
Kiso's Button and Toast.
