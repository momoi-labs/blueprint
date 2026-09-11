# Kiso evolution

Kiso v1 is deliberately small and spec-first. The items below are not missing
work: they are choices postponed until a real product provides evidence that
the system needs them. This is the honest roadmap for those choices.

## Deliberate v1 deferrals

| What | Why it is deferred | When to reconsider |
| --- | --- | --- |
| **Component implementation code** | V1 ships Markdown contracts and tokens, not React components. Keeping the specification separate lets product needs shape an implementation instead of freezing an assumed API. This boundary was set in [epic #3](https://github.com/momoi-labs/blueprint/issues/3). | When repeated product implementations make a stable reference API evident. Build it as Kiso v2 or in a separate `kiso-ui` repository, using shadcn/Radix behavior adapted to Kiso rather than copied unchanged. |
| **Radio / RadioGroup** | Select and Switch cover the v1 choice cases, so [epic #3](https://github.com/momoi-labs/blueprint/issues/3) did not add another selection primitive without a product need. | When a product genuinely needs mutually exclusive selection from a small, fixed set whose options should remain visible. |
| **Interactive framed charts** | [#84](https://github.com/momoi-labs/blueprint/issues/84) shipped [Sparkline](components/sparkline.md) for the single-series metric shapes products actually had. No product has yet needed an axis, a legend, or crosshair reading. | When a product needs exploratory reading of a series: axes, multi-series overlays, or hover inspection. Settle the framed `.chart` contract then. |
| **Figma Tokens Studio integration** | [Epic #2](https://github.com/momoi-labs/blueprint/issues/2) kept the token pipeline focused on its committed outputs. Tokens Studio is a Figma plugin workflow built through Style Dictionary and `@tokens-studio/sd-transforms`, not a standalone emitter. | When design-to-code synchronization through Figma becomes a real team workflow rather than a hypothetical integration. |
| **DTCG 2025.10 Resolver module** | The multiple-context and theme Resolver considered in [epic #2](https://github.com/momoi-labs/blueprint/issues/2) is a preview draft marked “do not implement.” V1 uses an explicit, stable theme model instead. | When the Resolver module reaches stable status and Kiso has a concrete context or theme problem it would solve. |
| **`--shadow-lg`** | The elevation scale intentionally stops at `--shadow-sm` and `--shadow-md`; [#25](https://github.com/momoi-labs/blueprint/issues/25) fixed component references without inventing a larger elevation. | When a real overlay or hierarchy cannot be expressed clearly with `--shadow-md`. Propose the token in the source, then regenerate its outputs. |
| **A dedicated multi-step-flow pattern** | [#26](https://github.com/momoi-labs/blueprint/issues/26) added step indication as a Pagination variant, which satisfies the current bounded-flow need without another pattern. | When recurring multi-step flows need behavior, composition, or guidance beyond Pagination's scope. |
| **Additional patterns** | The pattern set from [epic #4](https://github.com/momoi-labs/blueprint/issues/4) is an intentionally lean cut of roughly 21 recurring product structures. Speculative completeness would encode guesses. | When a real product exposes a repeated structure that the current patterns cannot express without an ad-hoc solution. |
| **Additional components** | The roughly 28-component cut from [epic #3](https://github.com/momoi-labs/blueprint/issues/3) covers the intended v1 product surface. Adding primitives in anticipation would enlarge the interface before their contracts are understood. | When a need recurs across products. Propose a component and its contract; do not invent one locally or copy one in unchanged. |
| **Heavy governance** | A two-person lab does not need a contribution bureaucracy or design-review board. For v1, the propose-don't-copy rule in [`kiso/AGENTS.md`](../AGENTS.md) is the governance mechanism, as scoped by [epic #5](https://github.com/momoi-labs/blueprint/issues/5). | When more contributors, products, or incompatible proposals make ownership and decision-making unclear. Add only the process needed to resolve an observed coordination problem. |

## Accepted additions

The growth model below is not theory. What it has produced so far:

| What | Evidence | Where |
| --- | --- | --- |
| **[ChipInput](components/chip-input.md)** | A self-hosted console had to collect a development image's dependencies: a list a person types, where every entry carries a backend, a version, and installer options. One form section per entry grew without limit and buried the list. | Added as a component contract with the segmented chip, the in-place value, and one segment per option. |
| **[Sparkline](components/sparkline.md)** | The self-host console collects metrics in-process, one sample per tick on an evenly spaced window, and needed the same shape three times over: a trend cell per application row, context under a KPI value, and one series per container. [#84](https://github.com/momoi-labs/blueprint/issues/84) records the evidence. | Added as a component contract and a Recharts-based component, single series, neutral by default, primary only for the series a tile is about. |

## Growth model: grow with real products

Kiso is not an abstract design-system project. It evolves through product work:

1. Build the next real product with Kiso.
2. Observe what works and what is missing.
3. Identify gaps, without filling them with ad-hoc components or patterns.
4. Incorporate needs that recur into Kiso as documented contracts.
5. Evolve toward v2 from that evidence, not from speculation.

A one-off need may remain a documented product exception. Repetition is the
signal to propose a system addition; it is not permission to copy an external
component into Kiso. The rule and proposal path belong in
[`kiso/AGENTS.md`](../AGENTS.md).
