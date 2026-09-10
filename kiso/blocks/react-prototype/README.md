# Component gallery

A local preview of `@momoi-labs/kiso-react`. It lists all 44 entries in
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
6. Splitter: drag the divider, then focus it and use the arrow keys, Home and
   End. It reports its position through `aria-valuenow`.
7. LogView: append a line with Follow on and the view stays at the end. Scroll
   up and Follow turns itself off; scroll back to the end and it resumes.
8. Narrow the viewport to 390px. The catalog collapses behind Components.

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

The adapter uses Kiso classes and follows Kiso contracts for variants. Radix
owns focus containment, dismissal, focus restoration, and menu, tab, select,
and toast semantics. CommandPalette composes Radix Dialog with a listbox
driven by `aria-activedescendant`. It requires no additional dependency.

React-specific styles live in `packages/kiso-react/src/styles.css`, next to
the components that need them. These include Radix state selectors, Drawer
placements, and the Switch track.

This folder stays under `kiso/blocks/`, which the published Kiso package
excludes.

## Verification

```sh
npm run check:react
```

The command runs type checking, builds the demo with Vite, and tests both
packed packages in an isolated consumer.

The preview was also checked in a browser across every catalog route, theme
switching, overlays, palette keyboard controls, Select, DropdownMenu, Switch,
and Toast. Screen-reader testing and product integration remain unverified.
