# PageHeader

Introduces one page with its title, supporting context, and primary actions.

## Purpose

PageHeader gives every route a clear content heading and a predictable place
for page-scoped actions. It composes title + optional subtitle + action
[Buttons](button.md); it is distinct from the application [Header](header.md).

## Anatomy

```
PageHeader
├── title (required h1)
├── subtitle (optional)
└── actions (optional)
    └── Button(s)
```

Title uses `--type-role-heading-font-family`, `--type-role-heading-font-size`,
`--type-role-heading-font-weight`, `--type-role-heading-letter-spacing`, and
`--type-role-heading-line-height` with `--color-foreground`. The default
subtitle uses label size and weight with `--color-muted-foreground`.
The default layout uses `--spacing-md` between regions and `--spacing-2xs`
between title and subtitle. Actions retain Button tokens and behavior.

## Variants

| `variant` | Use | Appearance |
| --- | --- | --- |
| `default` | Lists, settings, and dense workspaces. | Existing page heading and compact spacing. |
| `editorial` | Overview pages and introductions that need more emphasis. | Larger responsive title, body-size description, and more space around the heading. |

Without a preference, the default remains unchanged. Both variants accept
the same children and `actions` slot. Editorial actions wrap below the text when space runs out.

Set `data-visual-style="editorial"` on `html` to use the shared editorial
style across an application. Omit `variant` to follow that preference. An explicit
`variant="default"` or `variant="editorial"` overrides it for one PageHeader.
The gallery saves this choice under Appearance > Visual style. The earlier
`data-page-header` attribute remains supported for heading-only styling.

```tsx
<PageHeader
  variant="editorial"
  actions={<Button variant="primary">Deploy application</Button>}
>
  <PageHeaderTitle>Your homelab</PageHeaderTitle>
  <PageHeaderDescription>
    Applications, machines, and images in one place.
  </PageHeaderDescription>
</PageHeader>
```

## Sizes

The default title uses the page-heading role. The editorial title scales from
`--type-size-display` to `--type-size-editorial` with viewport width. It keeps
the heading family, weight, and line height, with display letter spacing.
Editorial descriptions use the body role. The heading has `--spacing-md`
between title and description and `--spacing-lg` of vertical padding.
The actions row uses `--spacing-xl` between regions. Child Buttons retain
their own sizes. Long titles wrap without pushing actions out of the page.

## States

| State | Behavior |
| --- | --- |
| default | Title leads; subtitle and actions support it. |
| hover | No container hover; Buttons own hover. |
| focus | Focus lands on actions, never on the layout container by default. |
| active | N/A for the container; child Buttons own active state. |
| disabled | PageHeader is never disabled; individual actions may be. |
| compact | On narrow viewports, actions wrap below text without changing reading or focus order. |

## Accessibility

Use the page's single `<h1>` for the title. Keep DOM order title, subtitle,
then actions even when visual layout places actions beside the title. Button
labels must state their actions. Do not put navigation controls here merely to
fill space.

## When to use

- At the start of a routed page or a primary workspace view.
- When page-specific actions need a consistent location.

## When NOT to use

- For global product chrome; use Header.
- Inside every Card or nested section; use the correct heading level.
- When it would create a second `<h1>` on the page.

## Radix/shadcn mapping

No Radix or shadcn PageHeader primitive. Compose semantic HTML and Kiso Button;
do not treat shadcn CardHeader as a page-level substitute.
