# Kiso design tokens

Kiso tokens are a two-layer interface. `tokens/tokens.json` is the single DTCG
2025.10 source: `color.*` contains raw palette primitives, while `semantic.*`
names the roles a product needs. Components consume semantic colors only; they
must not use a primitive, a generated primitive variable, or a raw hex value.
If no semantic role fits, propose a role instead of bypassing this interface.

Build with Style Dictionary v5:

```sh
npx style-dictionary build --config style-dictionary.config.mjs
```

The build emits `tokens/build/tokens.css`, `tokens.json`, `tokens.d.ts`, and
`tokens.scss`. CSS contains the dark default in `:root`, light overrides in
`[data-theme="light"]`, and the reduced-motion override. Import `tokens.css`,
then toggle the light theme on an ancestor; application CSS should need no raw
color values.

```css
@import "../../tokens/build/tokens.css";

.panel {
  color: var(--color-foreground);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

## Semantic colors

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `background` | Application canvas; never text. | `neutral.900` | `neutral.200` |
| `surface` | Cards, panels, and table rows. | `neutral.800` | `neutral.100` |
| `elevated-surface` | Menus, popovers, and dialogs. | `neutral.700` | `white` |
| `foreground` | Primary text and content that must carry the strongest hierarchy. | `neutral.100` | `neutral.900` |
| `muted-foreground` | Secondary text and labels. It remains normal-text eligible. | `neutral.400` | `neutral.600` |
| `subtle-foreground` | Placeholders, timestamps, and non-essential hints; large text only, never body copy. | `neutral.500` | `neutral.500` |
| `border` | Dividers and control outlines; never text. | `neutral.600` | `neutral.300` |
| `primary` | The main interactive action: links, active states, and primary controls. | `accent.base` | `accent.base` |
| `accent` | Secondary emphasis and highlights, not the page's main action. | `accent.300` | `accent.800` |
| `success` | Positive or completed state. | `status.success` | `status.success` |
| `warning` | Caution or a condition needing attention. | `status.warning` | `status.warning` |
| `danger` | Error or destructive action. | `status.danger` | `status.danger` |
| `info` | Neutral informational state. | `status.info` | `status.info` |
| `focus` | Keyboard focus ring; never text. | `accent.300` | `accent.base` |
| `disabled` | Disabled text and controls only. | `neutral.600` | `neutral.400` |

Use `foreground` for default reading, `muted-foreground` when content is
secondary but still needs normal-text contrast, and `subtle-foreground` only
for large or non-essential supporting copy. Use `primary` for the action that
drives the current task; use `accent` to draw secondary attention without
creating another primary action.

The semantic aliases deliberately point at different primitives by theme.
Status primitives and `accent.base` are themselves mode-aware, so the same
semantic role preserves its meaning and contrast rather than preserving a
literal color.

## AA gate

`scripts/check-contrast.mjs` is the build-time AA gate. In both dark and light
themes it resolves the semantic aliases and checks:

- `foreground`, `muted-foreground`, `primary`, `accent`, `success`, `warning`,
  `danger`, and `info` at **4.5:1** or better against `background`, `surface`,
  and `elevated-surface`;
- `subtle-foreground` at **3:1** or better against those surfaces, restricting
  it to large text and non-essential metadata;
- `focus` at **3:1** or better against `background` for visible focus rings.

`disabled` is intentionally outside the gate because inactive controls are
exempt from WCAG 1.4.3. `background`, `surface`, `elevated-surface`, and `border`
are not text roles. Run the gate with:

```sh
node scripts/check-contrast.mjs tokens/tokens.json
```

## Generated files

All four files in `tokens/build/` are committed. This makes the published
artifacts directly consumable without requiring downstream projects to install
Style Dictionary. Do not edit them: change `tokens/tokens.json` or the build
configuration and regenerate. CI rebuilds the artifacts and fails if the
committed output has drifted, so `tokens/build/` is intentionally not ignored.
