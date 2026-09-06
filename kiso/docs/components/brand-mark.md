# BrandMark

## Purpose

BrandMark is the small rounded square next to a product name in a sidebar or
login header. It holds a letter or a single inline SVG. The self-host console
uses the momoi-labs terminal prompt logo, as shown in
[self-host PR #48](https://github.com/momoi-labs/self-host/pull/48).

## Anatomy and variants

- A decorative `span` with the existing `.brand-mark` class.
- Letter content, such as "S", keeps the class's font weight and font size.
- Icon content uses `.icon.icon-sm`. The icon inherits `currentColor`, has no
  fill, and uses a 1.75 stroke width with round caps and joins.
- The adjacent product name supplies the accessible name.

In React, pass either content through `children`, as with Button and Badge.
BrandMark adds the icon classes to an element child without an extra wrapper.
Custom icon components must forward `className` to their inline SVG.

`TerminalIcon` supplies the momoi-labs `>_` glyph on a 16 by 16 viewBox. Its
paths are `M4 4.5L8 8l-4 3.5` and `M9.5 11.5H13`.

## States and accessibility

BrandMark is static and always has `aria-hidden="true"`, including when a
consumer passes a different value. Keep the product name visible beside it.
Do not put interactive or focusable content inside the mark. If the brand
navigates, wrap the mark and product name together in a Link.

## Token consumption

The existing `.brand-mark` CSS remains unchanged. Grid placement centers the
content; `--size-control-sm` sets both dimensions and `--radius-lg` rounds the
corners. The background uses `--color-primary` and the foreground uses
`--color-primary-foreground`. Letter typography uses `--type-weight-bold` and
`--type-size-label`; icon dimensions use `--size-icon-sm`.

## Radix/shadcn mapping

There is no dedicated behavioral primitive. The React implementation uses
Radix Slot to merge icon classes onto the child SVG.
