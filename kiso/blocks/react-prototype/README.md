# React component prototype

Does shadcn's component composition work with Kiso's existing tokens and CSS
across the Self Host console? This throwaway simulation follows the real
console's Overview and Application detail screens. It consumes the shared `@momoi-labs/kiso-react` workspace.

From the repository root:

```sh
npm ci
npm run prototype
```

Open <http://127.0.0.1:5173>. All state is in memory. The example makes no
Self Host API calls. The existing Kiso stylesheet loads Google Fonts.

The component gallery is at <http://127.0.0.1:5173/#components>.
It covers all 36 entries in `kiso/docs/components/README.md`, with search,
individual component routes, theme controls, and examples of component states.
The console remains at <http://127.0.0.1:5173/#overview>.

Entries marked Shared React use the same components as the console. Composition
previews combine Kiso CSS, semantic HTML, and Radix behavior where applicable.
These previews are not a complete, published React implementation of every
contract. CommandPalette currently shows a searchable layout; its full keyboard
behavior remains unimplemented and is labelled as such in the gallery.

## Try it

1. Search the Overview and toggle Show platform services. No matches produces
   an empty state with a clear-search action.
2. Open `teste` from the table or sidebar. Edit its configuration, save,
   start, stop, or restart it. Status, counters, and logs respond to each action.
3. Remove an Application. Cancel receives focus; Tab stays inside the dialog;
   Escape cancels and restores focus. Confirming returns to Overview.
4. Use Deploy application to add a sample Application. Image and Compose
   definitions are available. Compose text is not parsed or executed.
5. Open API keys to create a demo key and revoke it through a confirmation.
   DNS setup, Platform via Healthy, and a simulated Lock screen are navigable.
6. Use the sidebar's Theme buttons to compare system, light, and dark modes.
   On narrow screens, Toggle navigation opens the sidebar and logs stack
   below the configuration form.
7. Expand Simulation at the bottom to make the next Application action or
   revocation fail, or use Reset demo. Error recovery keeps confirmation open
   and focuses its error. The following attempt succeeds.

Outside clicks do not dismiss destructive confirmations. Successful removal
focuses the new page heading when the original control no longer exists.
Cancelling a pending simulated removal cancels its timer.

## Implementation

The files in `../../../packages/kiso-react/src/` adapt the actual shadcn registry source:

- [Button source](https://ui.shadcn.com/r/styles/new-york-v4/button.json)
- [Alert Dialog source](https://ui.shadcn.com/r/styles/new-york-v4/alert-dialog.json)
- [Input source](https://ui.shadcn.com/r/styles/new-york-v4/input.json)
- [Label source](https://ui.shadcn.com/r/styles/new-york-v4/label.json)
- [Checkbox source](https://ui.shadcn.com/r/styles/new-york-v4/checkbox.json)
- [Table source](https://ui.shadcn.com/r/styles/new-york-v4/table.json)
- [Badge source](https://ui.shadcn.com/r/styles/new-york-v4/badge.json)
- [Card source](https://ui.shadcn.com/r/styles/new-york-v4/card.json)

Retrieved on 2026-09-06. The upstream MIT notice is in `SHADCN-LICENSE`.
Radix owns focus containment, cancellation, focus restoration, and dialog
semantics. The example owns simulated removal and its outcome.

FormField and ThemeSelector are shared between the console and gallery.
Gallery overlays, selection, tabs, switches, and toast examples use the already
installed Radix package. There is no second component library or new token set.

The adapter replaces Tailwind classes with Kiso classes, maps Button and Badge
variants to the Kiso contracts, and uses one responsive dialog size. Its stylesheet imports the
`@momoi-labs/kiso` dependency. No Tailwind theme,
new tokens, or changed component contracts are required. Dialog elevation uses
the existing `--shadow-md`; the contract's `--shadow-lg` reference is unresolved
in the current tokens, as recorded in Kiso's evolution document.

The private demo stays under `kiso/blocks/`, which the published Kiso package
excludes. Shared components live in `packages/kiso-react/`. No Self Host files
changed.

## Verification

```sh
npm run check:react
```

Type checking and the Vite production build passed. Browser checks covered
search and filters, navigation, lifecycle actions, editing, confirmation focus
and keyboard behavior, removal error and retry, deploy, key creation and
revocation, reset, themes, and navigation at a 390px viewport. Screen-reader
testing and product integration remain outside this prototype's validation.

Gallery checks covered the 35-entry catalogue, search, loading, mixed checkbox
state, tab keyboard navigation, select, dropdown menu, dialog focus, drawer,
toast, popover, tooltip, switch, themes, and mobile navigation. No browser errors
were observed in the final interaction run.
