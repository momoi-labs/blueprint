# CodeEditor

Edits a short piece of code, such as a shell script or a Compose file, in a
native textarea. It adds line numbers and paints a highlight that the product
provides. It does not parse, format, lint or complete code, and Kiso ships no
highlighter.

## Anatomy and API

1. **Frame**: the FormField grouped control frame around everything. It
   carries the border, corners, marks, fill and the focus, invalid and
   disabled states.
2. **Gutter (optional)**: line numbers, hidden from assistive technology.
3. **Highlight layer (optional)**: the painted value, under the textarea and
   hidden from assistive technology.
4. **Native textarea**: the value, caret, selection and editing.

`CodeEditor` accepts textarea props. `value` and `defaultValue` are strings,
and `onChange` receives the native change event. Place it inside
[FormField](form-field.md), which supplies the Label, hint, error and ID
wiring.

```tsx
<FormField label="Startup script" hint="Runs before the service starts." error={errors.script}>
  <CodeEditor value={script} onChange={(event) => setScript(event.target.value)}
    highlight={(code) => ({ __html: Prism.highlight(code, Prism.languages.bash, "bash") })} />
</FormField>
```

| Prop | Default | Behavior |
| --- | --- | --- |
| `highlight` | none | Paints the value. Return React nodes, or HTML as `{ __html }`. Return nothing to leave the text plain. |
| `lineNumbers` | `true` | Shows the gutter. |
| `rows` | `5` | Visible lines. The textarea sets the height; a long value scrolls. |
| `className` | none | Goes on the frame. Other props go on the textarea. |

The renderer receives the whole value and must return the same characters, in
the same order, with no added or removed text. Escape HTML yourself when you
return `{ __html }`; Kiso inserts it as given. Style tokens with color only:
a change of font, weight, size or padding moves the painted text away from
the caret.

## Native attributes

Defaults are `spellCheck={false}`, `autoCapitalize="off"`,
`autoComplete="off"` and `autoCorrect="off"`, so the browser does not change
code. Lines never wrap. Pass `name`, `required`, `readOnly`, `disabled`,
`maxLength`, `placeholder` and `ref` as on Textarea.

## Layout

The gutter, the highlight and the textarea use the code type role, ligatures
off and the same padding, so painted text, line numbers and the caret line up.
The highlight and the gutter move with the textarea on both scroll axes. The
gutter grows with the digit count of the last line. The textarea resizes
vertically, and the frame follows it.

## States

| State | Behavior |
| --- | --- |
| Default | The frame uses the field surface. Without a highlight the text uses `--color-foreground`. |
| Highlighted | The textarea text is transparent; the caret and selection stay visible over the painted layer. |
| Focus | The frame shows the field focus ring, as a grouped control does. |
| Read-only | The value is highlighted and selectable but cannot change. |
| Disabled | The frame uses the disabled surface. The highlight is dropped and the text and numbers use `--color-disabled`. |
| Invalid | FormField's error sets `aria-invalid` and colors the frame. |
| Forced colors | The highlight is hidden and the textarea shows its own text in system colors. |

## Appearance

Inner parts have no fill, border, shadow or radius of their own. Every border
style, corner style and frame scope draws only the frame, so Pixel corners,
Manga and Brush contours and control marks show around the whole editor. The
gutter keeps one `--color-border` divider.

## Accessibility

- The textarea is the only focusable part and carries the label,
  description and invalid state.
- Line numbers and the highlight are `aria-hidden`; assistive technology reads
  the value once.
- Tab moves focus out of the editor, as in any textarea. The editor does not
  trap Tab for indentation.
- Highlight colors must keep 4.5:1 contrast against `--color-card` in both
  themes. Mark tokens with the syntax role classes in
  [CodeBlock](code-block.md#highlighting), which are gated at 4.5:1, not raw
  colors.

## When to use

- Short scripts and configuration files that a person types or pastes, such
  as startup scripts, health checks and Compose files.

## When NOT to use

- Prose or free-form notes; use [Textarea](textarea.md).
- Read-only code, such as commands and examples; use
  [CodeBlock](code-block.md) with the same `highlight`.
- Read-only output, such as logs; use [LogView](log-view.md).
- Long files or work that needs completion, folding, search or multiple
  cursors; that needs a full editor.

## Tokens

The frame uses FormField's grouped control: `--color-card`, `--color-input`,
`--color-border-strong`, `--color-focus`, `--color-danger`,
`--color-disabled-surface` and `--color-disabled`. Text uses
`--type-role-code-font-family`, `--type-role-code-font-size` and
`--type-role-code-line-height`, with `--color-foreground`; line numbers use
`--color-muted-foreground` and a `--color-border` divider. A highlight uses
the syntax roles `--color-code-comment`, `--color-code-keyword`,
`--color-code-string`, `--color-code-constant` and `--color-code-name`. Padding uses `--spacing-sm` and
`--spacing-md`.

## Radix/shadcn mapping

Radix and shadcn/ui have no code editor. This composes a native textarea in
Kiso's grouped field frame.
