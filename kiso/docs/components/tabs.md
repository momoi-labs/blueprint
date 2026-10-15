# Tabs

Switches between related panels within the same page.

## Purpose

Tabs organize peer views without changing the person's hierarchical location.
They answer “which view of this page?”; [Breadcrumb](breadcrumb.md) answers
“where am I in the product?”

## Anatomy

```
Tabs
├── TabList
│   └── Tab (one or more)
└── TabPanel (one per Tab)
```

Tabs use `--color-foreground`, `--color-muted-foreground`,
`--color-primary`, `--color-border`, and `--color-focus`; `--spacing-sm` block
and `--spacing-md` inline tab padding; the five property-qualified label
typography tokens; `--motion-duration-fast`; and `--motion-easing-standard`.

## Variants

Two orientations: horizontal (default) and vertical. Orientation changes the
TabList layout and arrow-key axis, not the selection or panel semantics.

### Sections on a phone

`sections` shows each panel under a header of its own at widths of 1023px or
less, one open at a time, instead of a strip of triggers that cannot fit. Use
it for the tabs of a detail screen. The panels are the same elements in both
layouts, so crossing the breakpoint keeps an edited form or a running
terminal. Pressing the open header closes it without changing the value, so a
wider screen still shows that panel; any other way to a panel opens it.

Each header is a Button with `aria-expanded`. The TabList is hidden while
sections show, so arrow keys do not apply; Tab moves between headers and into
the open panel.

## Sizes

One size. Tabs use a single label and spacing treatment; do not add compact or
large scales. The host layout controls available panel width.

## States

| State | Behavior |
| --- | --- |
| default | One Tab is selected and its panel is visible. |
| hover | An enabled Tab signals selection availability. |
| focus | Focused Tab shows `--color-focus`; focus and selection may differ during keyboard movement. |
| active | Selected Tab has `aria-selected="true"` and controls the visible panel. |
| disabled | Tab remains identifiable with `aria-disabled="true"` and `--color-disabled`, but cannot be selected. |

When the selection changes, the underline slides to the newly selected Tab on
`--motion-duration-fast` and `--motion-easing-standard`. It moves without the
slide in browsers without CSS anchor positioning, in right-to-left strips, and
under reduced motion.

## Accessibility

Use `tablist`, `tab`, and `tabpanel` roles with `aria-controls` /
`aria-labelledby`. One Tab is in the tab sequence. Arrow keys move between
Tabs; `Home`/`End` move to the first/last; `Tab` enters the active panel.
Prefer automatic activation when panel changes are immediate; use
`Enter`/`Space` for manual activation when loading is costly. Orientation
determines the arrow-key axis.

## When to use

- Two or more peer panels within one page or object.
- Content where switching is frequent and labels are short.

## When NOT to use

- Product hierarchy or ancestors; use Breadcrumb.
- Routes that need independent history/bookmarking unless the selected Tab is
  encoded in the URL without losing tab semantics.
- A sequential workflow; use explicit steps instead.

## Radix/shadcn mapping

Maps to Radix Tabs / shadcn Tabs (`Root`, `List`, `Trigger`, `Content`). Keep
Radix keyboard behavior and restyle only with Kiso semantic tokens.
