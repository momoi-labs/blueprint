---
"@momoi-labs/kiso": patch
---

Correct the shadcn variant mapping for filled Buttons

The v1.1 tokens made `primary` and `destructive` solid fills and added the
`--color-primary-foreground` / `--color-danger-foreground` label roles, but the
shadcn mapping table in `button.md` still told implementers to restyle
shadcn's `outline` into accent text on a surface — the exact treatment the
variants table two sections above forbids. `icon-button.md` deferred to the
same stale sentence.

Reported downstream (#57) as a Button whose contract disagreed with itself.
