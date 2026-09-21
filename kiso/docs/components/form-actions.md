# FormActions

## Purpose

FormActions gives an explicit-submit form one place for its primary action,
secondary actions, and optional feedback. It works for sign-in, creation,
editing, and applying choices. It does not assume that submission saves a record.

## Anatomy

1. An action region after the form content.
2. An optional visible message in a persistent status region.
3. An action group with one primary Button and any secondary actions.

The message comes before the buttons in DOM order. Buttons align to the end
of the region. The layout wraps when the available width cannot hold both
message and actions. Labels and messages can wrap without horizontal scrolling.

## React API

| Prop | Default | Meaning |
| --- | --- | --- |
| `children` | None | Consumer-provided Buttons or navigation Links. |
| `message` | None | React content rendered inside the status region. |
| `tone` | `neutral` | `neutral`, `warning`, or `danger` presentation. |
| `sticky` | `false` | Stick to the bottom of the nearest scrolling ancestor, within the form. |
| Native div props | None | Includes `className`, `style`, `ref`, and ARIA attributes. |

```tsx
<FormActions
  sticky
  tone={error ? "danger" : dirty ? "warning" : "neutral"}
  message={error || (dirty ? "Unsaved changes." : undefined)}
>
  {dirty && <Button type="button" onClick={discard}>Discard changes</Button>}
  <Button type="submit" variant="primary" disabled={saving || !dirty}>
    {saving ? "Saving..." : "Save changes"}
  </Button>
</FormActions>
```

Loading indicators and `aria-busy` belong on the submitting Button. The
consumer prevents duplicate submission and decides whether cancellation is safe.
No buttons, labels, dirty tracking, or network behavior are built in.

## Tones and messages

| Situation | Presentation |
| --- | --- |
| Initial or create | Neutral; no message required. |
| Unsaved edits | Warning with a message identifying the unsaved changes. |
| Submitting | A short progress message and loading submit Button. |
| Submission failed | Danger with a recovery message; preserve entries. |
| Saved | Neutral confirmation when the form stays open; clear dirty state. |

Tone does not encode business state. A product decides what "saved, awaiting
application" means and supplies suitable copy. FormActions does not model
machines, deployments, or synchronization. Use text to communicate meaning;
color alone is insufficient. An icon and bold lead are optional.

A new record can show Cancel and Create without a message. Discard appears
only when there are edits to discard. Avoid an always-visible "Saved" caption
that remains unchanged after editing.

## Placement and scrolling

For page scrolling, put FormActions last inside Form and pass `sticky`.
Its bottom offset defaults to zero. When the page has outer padding, set
`inset-block-end` to the same spacing token so the floating actions respect
that inset. Cover the space below the floating bar with the page background,
including the container border, so scrolling fields do not show through the
outer padding. An offset alone does not create that visual separation.
When page scrolling moves a marked Card behind sticky actions, keep the top
marks on the Card and move both bottom corner marks to the sticky action edge.
Draw them above the inset cover so each corner retains its horizontal and
vertical tick. Do not leave
a second pair attached to the scrolling Card bottom.
For example, use `var(--spacing-xl)` for a page padded by
`--spacing-xl`, and match any responsive padding changes. The form must remain
in document flow: an ancestor with scrolling overflow changes the sticky
container.

For a bounded panel, put Form inside a height-constrained `form-scroll` region.
That region owns overflow and has no padding. Put padding on `form-body`
instead. Actions then span the container width without negative margins.
Form fills at least the panel height and pushes actions to its bottom.

```tsx
<TabsContent value="general" className="form-scroll" style={{ height: "28rem" }}>
  <Form onSubmit={save}>
    <div className="form-body">{/* FormFields */}</div>
    <FormActions sticky>{/* Buttons */}</FormActions>
  </Form>
</TabsContent>
```

Keep an outer Card's corner marks outside the scrolling region. Do not nest
FormActions inside CardFooter or DialogFooter; it provides its own border and
padding. CardFooter stays a general visual container without form status.

If an existing scroller must retain padding, the consumer must account for it:
set `style={{ insetBlockEnd: "calc(-1 * var(--spacing-lg))" }}` when the
scroller's bottom padding is `--spacing-lg`. Align the form with the horizontal
edges separately. Use lengths such as `0px` when supplying values to CSS math.
Prefer the unpadded composition above for new screens.

The background layers semantic tint over an opaque card surface. Scrolled
content must not show through the message or buttons. The bar stops at the
form's end; it is not fixed to the viewport across unrelated content.

## Accessibility

Only the message region has `role="status"` and `aria-atomic="true"`. Keep it
mounted when empty so updates can be announced. Do not put these attributes
on the entire action region, and do not put interactive controls in `message`.

Buttons retain their native semantics and tab order. The primary Button has
`type="submit"`; secondary Buttons have `type="button"`. Use a Link for an
actual navigation destination. Avoid duplicate announcements from an inline
message and a Toast for the same event.

Field validation stays beside its field. Keep form-level failures visible
until the person edits or retries. Verify sticky actions at narrow widths,
zoom, and keyboard focus. Shared scroll spacing reserves room for typical
wrapped actions; consumers must increase that space for unusually tall bars.

## Tokens

Spacing uses `--spacing-sm`, `--spacing-md`, and `--spacing-lg`. Scroll spacing
uses `--spacing-4xl`. Text uses `--type-size-label` and
`--type-weight-semibold`. The base uses `--color-card`,
`--color-card-foreground`, and `--color-border`. Warning uses
`--color-warning-surface` and `--color-warning-border`; danger uses
`--color-danger-surface` and `--color-danger-border`.

## When not to use

Do not add submission actions to immediate preferences or automatic filters.
Do not use this component for page-wide record actions unrelated to the form,
a generic Card footer, or a toolbar for selecting table rows.

## Radix/shadcn mapping

FormActions is a Kiso composition of native grouping, a status region, and
Buttons. It does not add a keyboard interaction model or a Radix dependency.
