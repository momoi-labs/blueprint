# DashboardGrid

## Purpose and anatomy

Arrange metric panels in a responsive twelve-column grid. DashboardGrid owns
layout; DashboardPanel owns a column span and wraps a Card or other widget.
The grid adds no visual panel treatment or ARIA roles of its own.

## Sizes and responsive behavior

Panel `span` accepts 3, 4, 6 (default), 8, or 12. Above 1024 pixels it uses that
many columns. At 1024 pixels and below, panels use six columns, except full
width panels which keep twelve. At 640 pixels and below, every panel uses one
full-width column. Internal tables may scroll; the page must not overflow.

## States and accessibility

Each widget owns its loading, empty, stale, and error states. Reserve its
space with Skeleton while loading. The layout never reorders DOM content or
adds tab stops. Reading order, focus order, and visual order stay aligned.
Give sections meaningful headings and each chart its own name.

## Tokens and composition

Use `--spacing-lg` for gaps. Span is layout metadata, not a new spacing token.
Compose [Card](card.md), [Chart](chart.md), [Disclosure](disclosure.md), and
[TimeRangeControl](time-range-control.md) under the
[Dashboard pattern](../patterns/dashboard.md). CSS Grid needs no dependency.
