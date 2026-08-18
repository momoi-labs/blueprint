# Skeleton

A layout-preserving loading placeholder. It occupies the space of the
content that will arrive, so the page does not jump.

## Purpose

Skeleton is for *known* structure and *unknown* data: the table will have
rows, the Card will have a title and two lines, the form will have four
fields. Draw that shape now; swap in the real content when it exists.

User story #22: [Spinner](spinner.md) is indeterminate; Skeleton preserves
layout.

Table/DataTable (data slice) composes Skeleton for loading rows, together
with [EmptyState](empty-state.md) (no data) and [Pagination](pagination.md)
(known data). This doc defines the
placeholder; it does not define the table.

## Anatomy

```
Skeleton (one placeholder)
└── shape (text line | block | circle)

Region (the thing that is loading)
├── aria-busy="true"
├── accessible name / live status ("Loading replicas")
└── one or more Skeletons matching the eventual layout
```

- **Shape.** Geometric stand-in. No letters, no shimmering brand mark, no
  fake data.
- **Region.** The parent is the accessible loading state. Individual
  Skeletons are decorative.

## Variants

Variants are shapes, not colors.

| Variant | Shape tokens | Stands in for |
| --- | --- | --- |
| `text` | Height of the target type role (`--type-role-body` / `label` / `heading`), width a fraction of the column, radius `--radius-sm` | Titles, labels, table cells, descriptions. |
| `block` | Radius `--radius-md` (or `--radius-lg` when replacing a Card) | Cards, images, chart frames, table bodies as a whole. |
| `circle` | Radius `--radius-full`, equal width and height | Avatars and circular IconButtons. |

Fill is `--color-border` on the surrounding `--color-surface` or
`--color-background` (whichever the real content sits on). Do not use
`--color-primary` or status colors — loading is not a status.

Pulse (if any) interpolates opacity between the fill and `--color-surface`
using `--motion-duration-normal` and `--motion-easing-standard`.

**Reduced motion:** no pulse. Static `--color-border` placeholders. The
tokens already zero out `--motion-duration-*`; do not add a second
animation that ignores them.

## Sizes

Skeleton has no independent size scale. It **matches the content it
replaces**:

| Replacing | Skeleton |
| --- | --- |
| Body line | `text` at `--type-role-body` height, width ~ ⅔ of the column |
| Label / heading | `text` at that role's height, shorter width |
| Button | `block` with the Button size's padding box |
| Table row | A row of `text` cells aligned to column widths |
| Card | Header `text` + Content `block` or stacked `text` |

Approximate widths are layout choices, not new tokens. Do not specify
placeholder geometry in raw pixels; size against type roles and spacing.

## States

| State | Behavior |
| --- | --- |
| default | Visible placeholder while `aria-busy` is true. |
| hover / focus / active | N/A. Skeletons are not controls and must not be in the tab order. |
| disabled | N/A. |
| loading | Skeleton *is* the loading presentation. |
| error | Remove Skeletons; show [Alert](alert.md) (and optionally a retry Button). Do not leave placeholders up after failure. |

When data arrives, replace the Skeleton region with the real content in
one swap. Do not leave a Skeleton sitting next to the loaded widget.

## Accessibility

- Each Skeleton graphic is `aria-hidden="true"`.
- The **region** communicates loading: `aria-busy="true"` and a polite
  status (`role="status"` or `aria-live="polite"`) with a short label
  ("Loading queries"). Announce once, not once per row.
- Do not put focus inside the placeholder. Focus stays on the control that
  triggered the load, or on the page heading for initial page load.
- When loading finishes, set `aria-busy="false"` and let the status
  announce completion only if the person would otherwise miss it (e.g.
  the region was empty). Prefer the content itself over a "Done loading"
  toast.
- Skeleton is not a progressbar.

### Keyboard

No keymap. Placeholders are skipped.

## When to use

- First load of a list, table, Card, or form whose structure is known.
- Pagination and refetch of Table/DataTable rows (compose Skeleton rows
  in place of data rows; keep table chrome).
- Replacing a known block inside a Card while the rest of the page stays
  put.

## When NOT to use

- **Indeterminate, structure-unknown waits** (submit, connect, a one-off
  action). [Spinner](spinner.md), usually inside the Button.
- **Empty results.** That is EmptyState, not an eternal Skeleton.
- **Errors.** Alert, not a grey box.
- **Content that is already on screen.** Do not skeletonize a field the
  person is editing.
- **Fake completed UI.** Never put real-looking numbers or names in a
  Skeleton; placeholders stay empty shapes.

## Radix/shadcn mapping

No Radix Skeleton primitive.

| Kiso | Reference |
| --- | --- |
| Placeholder primitive | shadcn [Skeleton](https://ui.shadcn.com/docs/components/skeleton) |
| Table rows | shadcn Skeleton "Table" example — restyle to `--color-border` / `--color-surface` and type-role heights |
| Card / text / avatar | shadcn Card / Text / Avatar examples as shape references only |

Do not copy shadcn examples that set raw pixel widths. Map height to type
roles and padding to `--spacing-*`.

Compose with Table/DataTable in the data slice: loading → Skeleton rows;
empty → EmptyState; error → Alert; populated → rows + Pagination.
