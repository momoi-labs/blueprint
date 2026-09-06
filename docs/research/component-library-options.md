# Component library options for Kiso and Self Host

Research snapshot from 2026-09-06, before the React implementation. The selected
approach now lives in `packages/kiso-react/`; the alternatives below record the
reasoning behind that choice. Component contracts remain unchanged.

## Recommendation

Given the user's positive experience with shadcn/ui, evaluate it first as the
starting code for a shared Kiso React component package. Keep Kiso's tokens and
contracts authoritative. Adopt a few components once in that package, then let
products consume versioned releases. Copying the same components separately into
every app would preserve the maintenance problem we want to solve.

This requires a deliberate decision to introduce React into Self Host's console.
Its current HTML and vanilla JavaScript are a migration cost, not a reason to
reject React automatically. If preserving that stack matters more, Web Awesome
Core is the first complete component library to try. Zag is a more flexible
behavior toolkit, with more assembly work.

These rankings are engineering judgments from the documented integration models
below. At research time, no prototype, bundle measurement, or accessibility audit
had been performed.

## Evidence in the current projects

Self Host was inspected at `/home/seba/Work/github.com/momoi-labs/self-host`.
Paths below refer to that checkout.

- `scripts/check-vendored-css.sh` pins Kiso 0.4.0 and checks the committed
  `tokens.css` and `ui.css` against that package. Visual reuse already exists.
- `console/app.js` contains 1,252 lines mixing Application logic, rendering,
  and UI behavior. This is not a count of code a component library can remove.
  Its `confirmRemove` function manually cycles Tab between two buttons and
  restores focus. `console/api-keys.html` separately uses `window.confirm`.
  These are concrete candidates for one shared confirmation implementation.
- `console/theme.js` already shares theme rendering across pages. Preserve
  that reuse when evaluating a replacement.
- `src/console.rs` embeds static console files in the Rust binary and serves
  assets through a fixed allowlist. React would require a frontend build and
  integration of its generated assets. It does not inherently require a Node
  server in production. Web Awesome modules also need asset-serving changes.
- Kiso's [package exports](../../package.json) publish tokens, CSS, and
  contracts. Its [reference JavaScript](../../kiso/blocks/app.js) explicitly
  identifies itself as prototype behavior, not production code.

The first useful extraction is shared interaction and markup. Deploy logic,
Compose parsing, API calls, and log streaming belong to Self Host.

## Options

| Option | What we reuse | What Kiso still owns | Fit for this decision |
| --- | --- | --- | --- |
| shadcn/ui in a shared Kiso React package | Component source, composition examples, and an underlying behavior library | Token mapping, component variants, copied source updates, package releases | First choice to evaluate if React is acceptable |
| Radix Primitives or Base UI directly | Unstyled React components and interaction behavior | Styled composition and component APIs | Better if shadcn's styling would mostly be discarded |
| Web Awesome Core | Complete custom elements with behavior and styles | Theme adapter, supported CSS part overrides, product composition | First choice to evaluate while keeping vanilla HTML/JS |
| Zag with its vanilla adapter | Interaction state machines and DOM bindings | Markup, styles, component lifecycle, reusable rendering API | Useful for selective behavior reuse; more work than complete components |

### shadcn/ui

shadcn distributes editable component source. Its theme uses CSS variables, so a
Kiso adapter can map semantic colors without replacing every component class.
Spacing, density, typography, radius, variants, and interaction rules still need
comparison with Kiso's contracts. A color theme alone cannot establish that fit.
[Introduction](https://ui.shadcn.com/docs),
[theming](https://ui.shadcn.com/docs/theming).

The existing [Button contract](../../kiso/docs/components/button.md) already
maps Kiso variants to shadcn by intent. Preserve that mapping, square panels with
corner marks, and Kiso's density. Kiso uses `data-theme` while shadcn documents
`.dark`; the adapter must coordinate them. Check generated Tailwind CSS against
Kiso's `--color-*` and `--radius-*` names. Shared names can collide or form circular
aliases, so validate a separate adapter namespace rather than importing both
default themes unchanged. These are integration concerns, not confirmed bugs.

Its documentation explicitly supports placing components in a shared `packages/ui`
and importing them into applications. Publishing the equivalent as a versioned
Kiso package across separate repositories is our proposed distribution choice,
not something the CLI automatically configures. Kiso maintainers would review
upstream source changes once; products would update the package version.
[Shared package documentation](https://ui.shadcn.com/docs/monorepo).

Use the adapted components directly where their APIs fit. Add a smaller Kiso API
only when it removes repeated composition or enforces a documented rule. Wrapping
every upstream prop in another generic API would add work without proving reuse.

The current component docs include both
[Base UI Alert Dialog](https://ui.shadcn.com/docs/components/base/alert-dialog) and
[Radix Alert Dialog](https://ui.shadcn.com/docs/components/radix/alert-dialog).
Choose one foundation for the initial component set. shadcn is no longer usefully
described as Radix-only. Its registry can distribute files to any framework, but
that does not make these React components usable in vanilla HTML.
[Registry scope](https://ui.shadcn.com/docs/registry).

shadcn saves composition and styling work beyond what an unstyled library gives
us. If adapting those styles means replacing most of them with existing Kiso
classes, direct Radix or Base UI becomes the smaller dependency and maintenance
choice. That is the main question for a small comparison prototype.

### Direct Radix Primitives or Base UI

Both provide unstyled React components. Radix documents keyboard navigation,
focus management, and ARIA behavior, while leaving styles, including functional
overlay styles, to the consumer. Base UI also leaves the styling solution open.
Both can consume Kiso custom properties through ordinary CSS. Neither removes
the need to introduce React in Self Host.
[Radix introduction](https://www.radix-ui.com/primitives/docs/overview/introduction),
[Radix styling](https://www.radix-ui.com/primitives/docs/guides/styling),
[Base UI overview](https://base-ui.com/react/overview/about).

### Web Awesome Core

Web Awesome grew out of Shoelace. It supplies custom elements usable directly in
HTML. The installation docs support local hosting, individual component imports,
and a `dist-cdn` distribution usable without a bundler. Local installation still
requires shipping dependent modules and assets and configuring the base path.
[Project history](https://webawesome.com/),
[installation and self hosting](https://webawesome.com/docs/).

Its theme uses `--wa-*` custom properties. Shadow DOM isolates component internals,
so existing Kiso selectors cannot style those internals directly. An adapter must
map Kiso tokens into Web Awesome tokens and use documented `::part()` hooks where
needed. Public parts are a supported API, but cannot expose every possible
internal styling choice. Visual fit needs testing before adopting the library.
[Customization](https://webawesome.com/docs/customizing).

Core is MIT-licensed and permits embedding, self hosting, and redistribution with
its copyright and permission notice. Pro has separate paid terms that restrict
redistributing component assets and giving other developers modification rights.
Use Core for this proposed shared library. Some advanced components, including
combobox and data grid, are Pro, so Core does not cover every future requirement.
[Core license](https://webawesome.com/license),
[Pro license](https://webawesome.com/license/pro),
[component catalog](https://webawesome.com/).

### Zag

Zag separates component interaction logic from rendered markup and styles. It
handles many keyboard, focus, and ARIA details and allows individual machines to
be installed. That is a closer fit to retaining Kiso's current CSS than a styled
Shadow DOM library.
[Zag introduction](https://zagjs.com/overview/introduction).

There is an official vanilla adapter in the source tree, named `@zag-js/vanilla`.
The framework adapter guide links it as the starting point for subscriptions
without a component runtime. Do not infer a lack of vanilla support from the
installation page's emphasis on React, Vue, Solid, and Svelte. The integration
still needs markup, state subscription, mounting, cleanup, and application of
changing element props. It is a behavior foundation rather than ready-made HTML
components.
[Adapter guide](https://zagjs.com/guides/framework-adapters),
[vanilla package source](https://github.com/chakra-ui/zag/tree/main/packages/frameworks/vanilla),
[package manifest](https://raw.githubusercontent.com/chakra-ui/zag/main/packages/frameworks/vanilla/package.json).

## Decision to test

Compare a real destructive confirmation and its trigger using shadcn plus Kiso
tokens against direct Radix or Base UI plus Kiso CSS. Check keyboard navigation,
initial and restored focus, dismissal rules, async errors, and both themes.
Estimate the console build and asset-serving changes as part of the comparison.
If React is rejected, run the same check with Web Awesome Core.

Only extract reusable product compositions when repetition demonstrates their
shape. Infrastructure cards, request handling, and application state remain
product code. Kiso's existing
[evolution policy](../../kiso/docs/evolution.md) already allows reconsidering
component implementations once product usage provides evidence.
