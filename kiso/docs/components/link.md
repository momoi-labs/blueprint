# Link

Navigates to a URL. It does not trigger in-page behavior the way a Button
does.

## Purpose

Link is the control for *going somewhere*: another route, a hash on this
page, an external document. The browser (or router) changes location.

That is a different job from [Button](button.md) (action) and
[IconButton](icon-button.md) (icon-only action). User stories #1 and #29.

### Choose the right control

| Need | Control | Why |
| --- | --- | --- |
| Trigger behavior; URL stays put | **[Button](button.md)** | Action. |
| Icon-only action; URL stays put | **[IconButton](icon-button.md)** | Action without visible text. |
| Change the URL | **Link** | Navigation. Open in new tab, copy URL, and middle-click must work. |

If it has an `href`, it is a Link. If it only has an `onClick`, it is a
Button (or it is a broken Link). Do not fake navigation with a Button, and
do not fake actions with an `<a>` that has no `href`.

A Link may be *styled* to look like a Button (prominent "Open dashboard"
call to action that still goes to a route). It remains a Link: real `href`,
link semantics, no `role="button"`.

## Anatomy

```
Link
├── leading icon (optional)
├── text (required, unless the icon Link has an accessible name)
└── trailing icon (optional; external-indicator is a trailing icon)
```

- **Text.** The destination or the thing opened, not "click here". In-app:
  "Replicas", "Query history". External: the resource name.
- **Icon.** Optional. Decorative (`aria-hidden="true"`) when text is present.
  An icon-only Link still needs an accessible name (`aria-label`) *and* is
  still a Link, not IconButton.
- **External indicator.** When the destination leaves the product, show it
  visually (trailing icon) and in the accessible name if the visual cue is
  not announced ("Docs (opens in a new tab)" when `target="_blank"`).

## Variants

Links are distinguished by *context*, not by a Button-like variant enum.

| Variant | Appearance | Tokens |
| --- | --- | --- |
| `inline` (default) | In body copy or metadata. | Text `--color-primary`. Underline on hover at minimum; underline always in running body text so color is not the only cue (WCAG 1.4.1). |
| `standalone` | Nav items, lists of destinations. | Text `--color-foreground` at rest; `--color-primary` on hover/current. No underline required if the placement is unambiguously navigation (Header, sidebar). Focus ring still `--color-focus`. |
| `button-look` | A destination that must match Button visual weight. | Apply [Button](button.md) visual tokens (`primary` / `default` / `ghost`) to the Link. Keep `<a>` / router link semantics. |

Current-route indication (Header, nav): `aria-current="page"` on the Link
that matches the location. Color may use `--color-primary`; do not invent a
"current" token.

Visited: there is no visited semantic token. Keep `--color-primary` (or
`--color-foreground` for standalone). Do not reach into the primitive
palette for a visited purple.

## Sizes

Links inherit the surrounding type role. Do not invent a parallel size scale.

| Context | Type role |
| --- | --- |
| Body copy | `--type-role-body` |
| Navigation, labels | `--type-role-label` |
| Chrome / metadata | `--type-role-metadata` |
| `button-look` | Same padding, radius, and `--type-role-label` as the matching [Button](button.md) size (`sm` / `md` / `lg`) |

## States

| State | Behavior | Tokens / notes |
| --- | --- | --- |
| default | Navigable. | Variant tokens above. |
| hover | Pointer over the link. | `--color-primary` (or `--color-accent` on an already-primary inline link). Underline for `inline`. Transition `--motion-duration-fast` / `--motion-easing-standard`. |
| focus | Keyboard focus. | Visible ring `--color-focus`. Never rely on underline alone for focus. |
| active | Activation. | Brief press; then navigation proceeds. |
| disabled | Rare. A destination that exists but is unavailable. | Prefer omitting the Link and explaining why. If it must remain for layout, use `aria-disabled="true"`, remove `href` (or prevent navigation), `--color-disabled`, and keep it out of the tab order. A Link with `href` that does nothing is a trap. |
| loading | Optional, for client-side transitions. | `aria-busy="true"` on the Link or its region. Do not replace the Link with a [Spinner](spinner.md) that loses the href. |
| error | Not a Link state. | Failed navigation belongs in [Alert](alert.md). |

## Accessibility

- Render a real `<a href="…">` or the framework equivalent that still
  produces one (e.g. Next.js `Link`). No `div` + click handler.
- `href` is required. `#` as a fake href for an action is a Button in
  disguise — rewrite it as Button.
- Accessible name: visible text, or `aria-label` for icon-only Links.
- `target="_blank"` requires `rel="noopener noreferrer"` and an indication
  that a new context opens.
- `aria-current="page"` for the current location in a nav set.
- Do not set `role="button"` on a Link. Do not handle `Space` as activation
  to mimic Button; Space scrolls, Enter follows the link.
- Underline (or another non-color cue) in running text.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Follow the link. |
| `Tab` / `Shift+Tab` | Move focus. |
| `Space` | Does **not** follow the link (page scroll). |

Browser shortcuts (new tab, copy link address, back) must keep working —
another reason this cannot be a `<button>`.

## When to use

- In-app routing: another view, a record, settings, docs hosted in-product.
- External URLs.
- In-page anchors (`#anatomy`).
- Header navigation. Header composes Link + IconButton (later slice).
- Any control the person should be able to bookmark, share, or open in a
  new tab.

## When NOT to use

- **Actions.** Submit, save, delete, open a dialog, run a job —
  [Button](button.md) or [IconButton](icon-button.md).
- **A control whose `href` is unknown until click.** If there is no URL
  until after a side effect, it is an action (Button), then optionally
  navigate.
- **Toggles, disclosures, tabs.** Those have their own components; a Link
  that only swaps a panel without a URL is a Button or a Tab.
- **Breadcrumb separators or decorative slashes.** Those are not Links;
  only the path segments that go somewhere are.

## Radix/shadcn mapping

No Radix Link primitive. No shadcn Link component.

| Kiso | Reference |
| --- | --- |
| Semantics and keyboard | Native `<a>` / platform router Link |
| `button-look` visuals | shadcn [Button](https://ui.shadcn.com/docs/components/button) `buttonVariants` (or equivalent classes) applied to `<a>` |
| Icon-only Link name | Same `aria-label` rule as [IconButton](icon-button.md), but the element is still `<a href>` |

shadcn documents an "As Link" pattern and warns that some Button
implementations force `role="button"`, which **overrides** link semantics.
If the chosen Button primitive does that, do not wrap the Link in it. Apply
visual classes to the anchor instead.

Do not use shadcn `variant="link"` on a `<button>`. That produces a Button
that looks like a Link — the inverse of this spec, and the usual agent
mistake for user stories #1 and #29.
