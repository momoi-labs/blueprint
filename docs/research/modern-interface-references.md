# Modern interface references for Kiso

Kiso should explore a stronger hierarchy between navigation, working content,
and brand expression. Pair expressive overview pages with compact operational
pages inside one coherent shell. This recommendation draws on the four supplied
screenshots, the current repository,
the live gallery, and primary sources reviewed on 2026-09-29. It does not change
Kiso's contracts or published implementation.

## What the CLIProxyAPI screenshot shows

I would describe it as editorial minimalism with oversized typography and a
split-screen authentication layout. These are descriptive terms, not an
official classification used by the project.

The left side behaves like a poster. The right side has a conventional form,
rounded container, thin borders, and warm-looking dark neutrals. Contrast in
scale and separation between identity and task give the screen its character.
Its giant lettering has a brutalist influence; that label alone does not
explain the softer form controls.

The upstream login source explicitly separates `brandPanel` from `formPanel`
and renders CLI, PROXY, and API as three brand words. The exact deployed version
in the screenshot was not established.
[CLIProxyAPI login source](https://github.com/router-for-me/Cli-Proxy-API-Management-Center/blob/main/src/pages/LoginPage.tsx).

Borrow the contrast between expressive identity and a quiet task area. Reserve
giant decorative text for entry points where it earns its space.

## What the additional product screenshots change

The dashboard, provider management, and light-theme credential screen show a
broader direction than the login alone. I would call the product an editorial
dashboard with soft panels and modular card layouts. This remains a descriptive
classification, not a formal style category or a claim made by its authors.

The dashboard uses an oversized state headline, a large adjacent metric, generous
section spacing, a row of smaller summaries, and technical labels in monospace.
Provider management reduces the heading size and divides the task into a local
provider list and a working panel. Credential management combines tabs, a filter
bar, resource cards, and actions inside each resource. The light theme preserves
the hierarchy with pale borders and selective shadows.

The shared qualities are rounded panels, strong title/body contrast, grouped
navigation, and a compact global utility group near the top right. The dashboard
also shows a faint colored glow and grid. Screenshots do not establish blur,
animation, interaction quality, or accessibility conformance.

The useful lesson is two visual rhythms in one system: expressive when orienting
the person, compact when they manage resources. Expressive typography belongs
on overview pages as well as login and onboarding. I would retain the hierarchy
and contextual actions, reduce the dashboard's large empty bands, and check the
light theme's muted text against real contrast requirements. I would evaluate
the floating utility group separately because it uses space and could collide
with page actions at narrow widths.

## Primary references

### Linear: let working content dominate

Linear's March 2026 refresh made navigation dimmer, reduced icon size and
decoration, softened borders, and made headers and actions more predictable.
It retained information density. The team also moved its default palette toward
warmer, less saturated gray, while warning that excessive warmth looked muddy.
[Linear's design refresh](https://linear.app/now/behind-the-latest-design-refresh).

Recommendation: compare quiet navigation with a distinct content area. Keep
page identity, view controls, and actions in predictable places.

### Geist typography: give text roles complete recipes

Geist combines font size, line height, tracking, and weight in reusable text
styles. It distinguishes headings, button text, single-line labels, and
multiline copy. It also distinguishes spacious marketing copy from compact
product copy and documents tabular numbers for numeric alignment.
[Geist typography](https://vercel.com/geist/typography).

Recommendation: distinguish expressive display text from page headings and
data labels. Test scale, line length, weight, and spacing together.

### Geist materials: make elevation a role

Geist defines coordinated presets for fills, borders, radii, and shadows.
It separates elements resting on a page from floating menus and dialogs.
Its guidance favors the lowest visible elevation and requires checking both
light and dark themes, where shadows behave differently.
[Geist materials](https://vercel.com/geist/materials).

Recommendation: define when a region needs a background, border, or shadow.
Treat ordinary page sections differently from floating panels.

### Carbon: connect component styling to its surroundings

Carbon's layering model has a base and three additional layers. Layer sets
coordinate backgrounds, fields, borders, and interaction states. Contextual
tokens let a component adapt to the layer containing it, so reuse does not
depend on guessing its background.
[Carbon color usage](https://carbondesignsystem.com/elements/color/usage/).

Recommendation: validate existing roles on complete compositions, including an
input inside a panel and a menu above it. Carbon supports explicit relationships;
it does not establish that Kiso needs additional layers.

### Radix Themes: separate density from enclosure

Radix's table exposes sizes that change cell text and padding. Its default
variant is `ghost`; `surface` adds an enclosing backplate. Density and enclosure
are separate decisions in the API.
[Radix Themes table](https://www.radix-ui.com/themes/docs/components/table).

Recommendation: compare tables that sit directly in the working area with
those needing a container. Choose density for the task. A sophisticated
interface does not require shrinking every control.

## What Kiso already supports

The current [tokens](../../kiso/docs/tokens.md) already provide warm neutrals,
separate sidebar, canvas, panel, and floating-layer colors, and multiple accents.
Control heights are 24, 32, 36, and 40 px. The product type scale is 11, 12, 14,
16, 18, 22, and 30 px. There are complete typography roles, not just font sizes.

Appearance attributes for borders, corner size, and corner marks already ship in
[ui.css](../../kiso/ui.css). A quiet comparison can use `data-border-style="soft"`
and `data-corner-marks="none"` without inventing a new palette. These options
change styling, but do not establish a different page hierarchy.

The [application shell](../../kiso/docs/patterns/application-shell.md),
[list-detail pattern](../../kiso/docs/patterns/list-detail.md), and
[command palette](../../kiso/docs/patterns/command-palette.md) already cover
navigation, contextual details, and keyboard entry. Reuse those contracts.

The [live dashboard example](https://kiso.momoi-labs.dev/#example/dashboard)
places a sample application inside the gallery's own navigation. At the inspected
1280 px viewport this narrows the sample and creates two navigation frames.
That affects the demonstration, but does not explain every product-design
limitation. The sample's layout is defined in
[layout-examples.tsx](../../apps/kiso-gallery/src/layout-examples.tsx) and
[app.css](../../apps/kiso-gallery/src/app.css).

## Where system changes would matter

These are proposals to evaluate, not accepted API names or token values.

| Priority | Proposal | Existing basis and actual gap |
| --- | --- | --- |
| First | A workspace composition with quiet navigation and one continuous content area. Compare an inset content frame with an edge-to-edge version. | AppShell and list-detail already exist. Define their visual relationship, shared alignment, header placement, and scrolling rules at the pattern level. |
| First | Distinguish compact task headings from expressive overview headings. | [PageHeader](../../kiso/docs/components/page-header.md) explicitly has one size and no visual variants. Test the existing 22 and 30 px roles on task pages, and a proposed 40 to 64 px display role on overview pages. Reusable variants and new type values need contract and token changes. |
| First | Use borders to separate tasks or layers. Avoid wrapping every section in a card. | Existing colors already separate layers. Define when a section sits directly on the canvas, when it needs a panel, and when it floats. Do not lower all border contrast globally. |
| Next | An optional split authentication layout, with product identity beside a compact form. | [Authentication](../../kiso/docs/patterns/login-authentication.md) explicitly calls for a centered Card and excludes a marketing hero. A split composition needs a proposed pattern revision. On mobile, identity should shorten and the form should lead. |
| Next | Resource cards with consistent title, status, metadata, and local actions. | [Card](../../kiso/docs/components/card.md) already provides these slots. Compose it with Badge, Stat, and existing actions. Record a reusable resource-management pattern only if the composition repeats. |
| Evaluate separately | Compact global controls without a full-width header band. | [Header](../../kiso/docs/components/header.md) currently has one structural treatment. A floating utility group would require shell/header guidance for placement, focus, and narrow screens. It should not overlap page actions. |

My preferred direction is expressive overview pages plus a calm workspace for
daily operations. [DashboardGrid](../../kiso/docs/components/dashboard-grid.md)
already supports unequal column spans, so a modular summary composition does
not require a new grid component. An oversized editorial treatment on every
page would consume space needed for tables and logs. I would not make it the
default for operational screens.

Keep Inter, JetBrains Mono, the existing neutral palette, and the accent system
for the first comparison. Keeping these constant makes it easier to judge the
effect of composition. Preserve the square, marked appearance for products
where that technical character is useful; compare the quieter treatment as a
coherent option rather than replacing every appearance choice.

## How to evaluate the direction

Compare the same content and tasks in a full-width product view. Use a dashboard,
a dense list with selected-record details, and a settings form. Check light and
dark themes, narrow widths, keyboard navigation, long labels, loading, empty,
and error states. A login alone cannot show whether the direction works for a
tool people use all day.

Look for an immediately identifiable page title and primary action, clear
selection, useful row density, readable controls, and fewer competing frames.
Reuse current control sizes and touch behavior. Do not claim usability gains
until a person has compared real tasks.

The accompanying interactive workspace study uses the gallery's sample projects,
summary values, and current semantic colors. It contrasts an expressive overview
with an operational project list, and compares inset and edge-to-edge content,
heading hierarchy, and visible or hidden contextual details. It is
a composition study, not a screenshot of current Kiso or a production component.
Its narrower navigation and 48 px overview title are study values, not accepted
tokens. The 22 and 30 px task headings reuse the current scale.

The next design decision is whether that workspace direction should become a
shared pattern. Only after evaluating it should repeated changes move into
contracts, tokens where needed, CSS, React components, and gallery examples.
