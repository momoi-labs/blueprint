# Momoi Labs Blueprint

> The shared foundation every Momoi Labs project builds on — a **design
> system** (Kiso), a **log format**, and the engineering standards that keep
> the studio's output consistent, recognizable, and fast to start.

**Blueprint** is the "floor plan" of the house. It stays deliberately small: a
pillar is added only when a real project needs it, and each pillar is a single
source of truth that everything else generates from — never a copy.

## Status

| Pillar | What it defines | Status |
| --- | --- | --- |
| **Design system** — *Kiso* | brand, tokens, component contracts, product patterns, accessibility | ✅ v1 complete (#1–#5) |
| **Architecture patterns** | default stack, API contracts, rendering | ✅ web applications |
| **Log format** | one structured JSON shape, levels, privacy rules | 🚧 epic planned |
| **Code standards** | commits, branches, per-language lint/format | 🔜 later |
| **Governance** | issue/PR templates, CONTRIBUTING, code of conduct | 🔜 later |

## Design system — Kiso

**Kiso** (基礎, "foundation") is Momoi Labs' design system for *products* — not
the marketing site. The marketing site ([momoi-labs.dev](https://momoi-labs.dev))
is a vibe reference; product UI borrows its spirit, not its literal surface.

Kiso v1 is complete and ready to consume. Start with the
[Kiso entry point](kiso/README.md); agents must also follow the scoped
[consumption rules](kiso/AGENTS.md). The system includes its conceptual
foundation, machine-readable tokens and generated CSS, component contracts,
product patterns, data-interface guidance, and cross-layer accessibility rules.

- Dark theme by default, light ("slate") as the alternate
- Neutrals carry the interface; one accent carries attention
- Inter for interface text, JetBrains Mono for code

### Agent skills for Kiso products

Products that use Kiso install four agent skills from this repository:

- `kiso-adopt` connects a project to Kiso and creates its `docs/kiso.md`.
- `kiso-page` builds or checks a screen against the installed contracts and
  the project's `docs/kiso.md`.
- `kiso-review` reviews a diff or a product against the same contracts.
- `kiso-propose` turns a gap in Kiso into an issue here.

```bash
npx skills@latest add momoi-labs/blueprint
```

They are also the `kiso` plugin. In Claude Code:

```bash
/plugin install kiso --marketplace momoi-labs/blueprint
```

Plugin skills carry the plugin name as a prefix, such as `/kiso:kiso-page`.

The repository also has an internal skill for Kiso maintainers,
`validate-kiso-component`. Agents working here load it from `.agents/skills/`.
The skills CLI hides it. To install it elsewhere:

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills@latest add momoi-labs/blueprint --skill validate-kiso-component
```

## Architecture patterns

Default architecture choices, recorded once so projects do not make them
again. The first covers [web applications](docs/patterns/web-application.md):
React, Kiso, and TanStack in the browser, Rust and PostgreSQL on the server,
API contracts owned by Rust, and client-side rendering by default.

## Log format

One structured JSON shape across every service, so logs correlate, filter, and
read the same everywhere. The format and its rationale — levels, `trace_id`,
privacy rules — are specified in their own epic.

## Roadmap

The design system and log format pillars are driven by GitHub epics:

1. ~~**Brand and principles**~~ ✅ — brand, principles, and voice in
   [#1](https://github.com/momoi-labs/blueprint/issues/1).
2. ~~**Design tokens**~~ ✅ — WCAG AA-calibrated semantic tokens and generated
   CSS in [#2](https://github.com/momoi-labs/blueprint/issues/2).
3. ~~**Component contracts**~~ ✅ — the spec-first component catalog in
   [#3](https://github.com/momoi-labs/blueprint/issues/3).
4. ~~**Product patterns**~~ ✅ — screen compositions and data-heavy interface
   guidance in [#4](https://github.com/momoi-labs/blueprint/issues/4).
5. ~~**Consumption layer**~~ ✅ — agent rules, entry point, accessibility, and
   evolution guidance in [#5](https://github.com/momoi-labs/blueprint/issues/5).
6. **Log format** — the shape, examples of use, and the reasoning behind it.

## License

Code, config, and templates: **MIT**. Brand assets (name, logo, type):
**CC BY 4.0** — brand usage rules live in [`kiso/docs/brand.md`](kiso/docs/brand.md).

© 2026 Momoi Labs — [momoi-labs.dev](https://momoi-labs.dev)

## React components and releases

[`@momoi-labs/kiso-react`](packages/kiso-react/README.md) provides React components
using Kiso tokens and CSS. Run `npm ci` and `npm run prototype` to open the
component gallery, where every entry renders the published component.

The [standalone Kiso gallery](apps/kiso-gallery/README.md) has its own build
and Cloudflare configuration for `kiso.momoi-labs.dev`. Run `npm run gallery`
to open it locally, or `npm run build:gallery` to produce the static site.

See [Publishing Kiso](docs/publishing.md) for the first npm publication, trusted
publisher setup, release PRs, and version tags.

Run `npx playwright install chromium` once, then `npm run check:browser` to
check touch targets, taps, disabled controls, and keyboard interaction for
Lifecycle, Checkbox, Switch, Tabs, and TimeRangeControl in Chromium. Checks
cover coarse and fine pointers at 390px and 1280px in both themes. Set
`SCREENSHOT_DIR=artifacts/touch-controls` to save screenshots.

`npm run check:browser` runs every `scripts/check-*-browser.mjs` in parallel
(`KISO_BROWSER_CONCURRENCY` sets the limit). `npm run check:changed` runs only
the browser checks and gallery tests related to files changed against
`origin/main`, and everything when `ui.css` or other shared code changed. Gallery
tests run one viewport per sweep unless `KISO_FULL_SWEEP=1`, which CI sets on
`main` and nightly.
