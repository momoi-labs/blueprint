# Component gallery

A local preview of `@momoi-labs/kiso-react`. It lists the 36 entries in
[`kiso/docs/components/README.md`](../../docs/components/README.md) and renders
each one from the workspace package, so an entry can only appear here if the
package exports it.

From the repository root:

```sh
npm ci
npm run prototype
```

Open <http://127.0.0.1:5173/#components>. Every component has its own route,
for example `#components/select`. State is in memory and no request leaves the
page. The Kiso stylesheet loads Google Fonts.

## What to look at

1. Search the catalog, then open a single component from the sidebar. Empty
   results offer a way back to the full list.
2. Compare themes with the Theme control: system, light, dark.
3. Overlays: open the Dialog and the destructive confirmation, both Drawer
   placements, the Popover, the DropdownMenu, and the Tooltip. Escape closes
   them and focus returns to the trigger.
4. CommandPalette: Arrow keys move the highlight across groups, typing filters
   and re-anchors it, Enter runs the highlighted command, Escape closes.
5. Controls: Select, Switch, Checkbox with a mixed state, and the validation
   message that updates as the Application name changes.
6. Narrow the viewport to 390px. The catalog collapses behind Components.

## Implementation

The components live in [`../../../packages/kiso-react/src/`](../../../packages/kiso-react/src),
adapted from the shadcn registry source:

- [Button](https://ui.shadcn.com/r/styles/new-york-v4/button.json)
- [Alert Dialog](https://ui.shadcn.com/r/styles/new-york-v4/alert-dialog.json)
- [Input](https://ui.shadcn.com/r/styles/new-york-v4/input.json)
- [Label](https://ui.shadcn.com/r/styles/new-york-v4/label.json)
- [Checkbox](https://ui.shadcn.com/r/styles/new-york-v4/checkbox.json)
- [Table](https://ui.shadcn.com/r/styles/new-york-v4/table.json)
- [Badge](https://ui.shadcn.com/r/styles/new-york-v4/badge.json)
- [Card](https://ui.shadcn.com/r/styles/new-york-v4/card.json)

Retrieved on 2026-09-06. The upstream MIT notice is in `SHADCN-LICENSE`.

The adapter replaces Tailwind classes with Kiso classes and maps variants onto
the Kiso contracts. Radix owns focus containment, dismissal, focus restoration,
and menu, tab, select, and toast semantics. CommandPalette is not a Radix
primitive: it composes Radix Dialog with a listbox driven by
`aria-activedescendant`, which keeps the palette out of a second dependency.

Presentation that the shared component layer does not name — Radix state
selectors, the Drawer placements, the Switch track — lives in
`packages/kiso-react/src/styles.css` rather than in `kiso/ui.css`, next to the
components that need it.

This folder stays under `kiso/blocks/`, which the published Kiso package
excludes.

## Verification

```sh
npm run check:react
```

Type checking, the Vite production build, and an isolated consumer installing
both packed tarballs. Browser checks covered every catalog route, theme
switching, the overlays, the palette keyboard, Select, DropdownMenu, Switch,
and Toast. Screen-reader testing and product integration remain outside this
preview.
