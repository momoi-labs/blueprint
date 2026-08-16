# Momoi Labs Blueprint

> The shared foundation every Momoi Labs project builds on — **design tokens**, a
> **log format**, and the engineering standards that keep the studio's output
> consistent, recognizable, and fast to start.

**Blueprint** is the "floor plan" of the house. It stays deliberately small: a
pillar is added only when a real project needs it, and each pillar is a single
source of truth that everything else generates from — never a copy.

## Status

| Pillar | What it defines | Status |
| --- | --- | --- |
| **Design system** — *Nocturne* | color, type, spacing, shadow tokens | 🚧 epic planned |
| **Log format** | one structured JSON shape, levels, privacy rules | 🚧 epic planned |
| **Brand spec** | logo, palette, voice — source for all brand material | 🔜 later |
| **Code standards** | commits, branches, per-language lint/format | 🔜 later |
| **Governance** | issue/PR templates, CONTRIBUTING, code of conduct | 🔜 later |

## Design system — Nocturne

Momoi Labs' design system already powers [momoi-labs.dev](https://momoi-labs.dev).
Blueprint will promote it into a machine-readable token source (W3C Design
Tokens) from which CSS and other targets are generated.

- Dark theme by default, light ("slate") as the alternate
- Accent violet `#9184d9`; neutrals tuned for both themes
- Inter for interface text, JetBrains Mono for code

## Log format

One structured JSON shape across every service, so logs correlate, filter, and
read the same everywhere. The format and its rationale — levels, `trace_id`,
privacy rules — are specified in their own epic.

## Roadmap

The first two pillars are driven by GitHub epics:

1. **Brand + design tokens** — spec the brand (not a copy of today's CSS), then
   generate tokens from that spec.
2. **Log format** — the shape, examples of use, and the reasoning behind it.

## License

Code, config, and templates: **MIT**. Brand assets (name, logo, type):
**CC BY 4.0** — a `BRAND.md` will carry the usage rules when the assets land.

© 2026 Momoi Labs — [momoi-labs.dev](https://momoi-labs.dev)
