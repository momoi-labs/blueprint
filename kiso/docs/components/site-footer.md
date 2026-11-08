# SiteFooter

## Purpose

SiteFooter is the last line of a site page: a start, such as the copyright and
license, and an end, such as a few links or "Made in Brazil".

## Anatomy

```
SiteFooter
├── start
└── end (children)
```

```tsx
<SiteFooter start="© 2026 Momoi Labs · PostgreSQL License">
  <a href="https://github.com/momoi-labs/pg-probe">GitHub</a>
  <a href="/releases">Releases</a>
</SiteFooter>
```

## Variants

None.

## Sizes

`--type-size-metadata` in `--color-muted-foreground`, `--spacing-xl` above and
below, a `--color-border` line on top. Start and end share one line when they
fit and wrap when they do not. The inner column matches
[SiteSection](site-section.md)'s.

## States

Links turn `--color-foreground` on hover. No other state.

## Accessibility

The root is a `footer`. When the end holds several links, wrap them in a `nav`
with a name, such as "Footer".

### Keyboard

No keymap. Links keep their own.

## When to use

- The bottom of a site page built from SiteSections.

## When NOT to use

- A sitemap with columns of links. Compose a SiteSection with a `grid` body
  above the footer.

## Radix/shadcn mapping

No Radix or shadcn primitive.
