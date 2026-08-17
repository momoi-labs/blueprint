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
| **Design system** — *Kiso* | brand, principles, voice; color, type, spacing, shadow tokens | ✅ conceptual (#1) · 🚧 tokens (#2) |
| **Log format** | one structured JSON shape, levels, privacy rules | 🚧 epic planned |
| **Code standards** | commits, branches, per-language lint/format | 🔜 later |
| **Governance** | issue/PR templates, CONTRIBUTING, code of conduct | 🔜 later |

## Design system — Kiso

**Kiso** (基礎, "foundation") is Momoi Labs' design system for *products* — not
the marketing site. The marketing site ([momoi-labs.dev](https://momoi-labs.dev))
is a vibe reference; product UI borrows its spirit, not its literal surface.

The conceptual foundation — [brand](kiso/docs/brand.md),
[principles](kiso/docs/principles.md), and
[voice and tone](kiso/docs/voice-and-tone.md) — is in place. Machine-readable
tokens (W3C Design Tokens) and generated CSS targets come next.

- Dark theme by default, light ("slate") as the alternate
- Neutrals carry the interface; one accent carries attention
- Inter for interface text, JetBrains Mono for code

## Log format

One structured JSON shape across every service, so logs correlate, filter, and
read the same everywhere. The format and its rationale — levels, `trace_id`,
privacy rules — are specified in their own epic.

## Roadmap

The design system and log format pillars are driven by GitHub epics:

1. ~~**Brand & principles**~~ ✅ — conceptual foundation (brand, principles,
   voice and tone) landed in [#1](https://github.com/momoi-labs/blueprint/issues/1).
2. **Design tokens** — calibrate neutrals and accent to WCAG AA, then generate
   tokens (W3C Design Tokens) and CSS targets from that spec.
3. **Log format** — the shape, examples of use, and the reasoning behind it.

## License

Code, config, and templates: **MIT**. Brand assets (name, logo, type):
**CC BY 4.0** — brand usage rules live in [`kiso/docs/brand.md`](kiso/docs/brand.md).

© 2026 Momoi Labs — [momoi-labs.dev](https://momoi-labs.dev)
