---
"@momoi-labs/kiso-react": patch
"@momoi-labs/kiso": patch
---

Fix the neutral Badge. `<Badge>` and `<Badge variant="neutral">` rendered only `class="badge"`, so the badge had no fill and took its parent's text color. They now apply `badge-neutral`, and `.badge-neutral` follows the Badge contract: text `--color-foreground`, background `--color-surface`, border `--color-border`.

Visible changes:

- `.badge-neutral` in plain HTML, such as `badge badge-neutral` or `badge badge-neutral badge-pill`, loses the `--color-secondary` fill and shows the surface fill and border.
- `StatusBadge tone="neutral"` now renders `class="badge badge-neutral"` and shows the standard border.
- Neutral count badges (`badge-neutral badge-count`) keep the `--color-secondary` fill. The DiagramFold and DiagramSection counts now get that fill too, where they showed bare text before.
- `.badge-outline` now sets a transparent background, so `<Badge className="badge-outline">` keeps its outline look.
