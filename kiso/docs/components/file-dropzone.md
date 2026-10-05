# FileDropzone

Selects local files through a labelled native picker or a drop target.
It does not transfer, parse or store files.

## Anatomy and API

`FileDropzone` renders a labelled native file input, optional decorative icon,
description and an associated error. The whole target opens the picker.

```tsx
<FileDropzone label="Choose a file" description="Text files only."
  accept=".txt,text/plain" onFilesSelected={setFiles} />
```

The caller owns the selected list and displays it outside the target.
`onFilesSelected(files)` reports a valid nonempty selection. The native input
resets after reading its files so selecting the same file again works. Build
submission data from the callback's File objects; this input does not submit
stored files through FormData and does not implement required validation.

## Selection rules

`accept` supports comma-separated extensions, exact MIME types and wildcard
MIME groups. `multiple` defaults to false. Picker results and drops use the
same checks. If any file fails, reject the selection as a whole and preserve
the caller's previous files. `onFilesRejected` receives the rejected files
with reason `type` or `multiple`. File extensions compare without case.

Acceptance checks are UI guidance. The application validates content and size,
handles transfer and progress, and offers removal. No extension or MIME rule
is hardcoded. Directory traversal is not supported.

## States

| State | Behavior |
| --- | --- |
| default | Visible label and description invite file selection. |
| hover / dragging | Accent boundary and tint mark the target. |
| focus | The target has a visible ring while the input has keyboard focus. |
| disabled | Native disabled input; picker and drops cannot report files. |
| error | The associated message and danger boundary explain rejection. |

Cancellation and empty drops do not call either callback or erase selection.
A valid selection clears internal rejection feedback. The caller can supply
`error`; it takes precedence over internal feedback. Localize internal text
through `invalidTypeMessage` and `multipleFilesMessage`.

## Accessibility

The native input remains keyboard accessible. The visible label names it;
description and errors connect through `aria-describedby`. Preserve supplied
ARIA references. Invalid input exposes `aria-invalid`. Do not hide the native
input with `display: none`, and do not nest other interactive controls in the
target. Use separate actions for removal and submission.

## Tokens

Use `--color-card`, `--color-foreground`, `--color-muted-foreground`,
`--color-border-strong`, `--color-link`, `--color-accent-surface`,
`--color-focus`, `--color-danger`, `--color-disabled` and
`--color-disabled-surface`. Padding uses `--spacing-xl`, gaps use
`--spacing-sm`, and the label uses `--type-role-body-large-font-size`.

There is no Radix file primitive. Preserve native picker behavior rather than
building a file browser inside the component.

## Appearance

With frame scope `all`, the target uses the same full border contour and
corners as panels, including Pixel, Manga and Brush. Scopes `panels` and
`outer` retain its default dashed border and standard control corners.
Pixel focus thickens the edge. Hover, error and disabled states retain their
semantic colors. Decoration does not clip content or change the hit area.
