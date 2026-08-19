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
