# Kiso

Kiso is the Momoi Labs product design system. It combines product identity,
semantic tokens, component contracts, and reusable screen patterns so products
with different purposes still belong to the same family. Kiso is spec-first:
its Markdown files document what to build and how it behaves, and they carry
no implementation. Two files are the exception: [`ui.css`](ui.css), the
component layer every contract's visual values resolve through, and
[`blocks/`](blocks/README.md), reference screens built from it to copy from.
Neither overrides a contract — if a block and a contract disagree, the
contract is right.

## For agents

Read [`AGENTS.md`](AGENTS.md) before designing or implementing an interface.
It defines the reuse rules, the decisions you may make alone, and the changes
you must propose rather than invent locally.

Use this path through the system:

1. Understand the [brand](docs/brand.md), [principles](docs/principles.md), and
   [voice and tone](docs/voice-and-tone.md).
2. Select a screen-level composition from the
   [pattern catalog](docs/patterns/README.md).
3. Compose it with contracts from the
   [component catalog](docs/components/README.md).
4. Apply the semantic values documented in [tokens](docs/tokens.md).
5. Verify the cross-layer [accessibility rules](docs/accessibility.md).
6. For dense technical products, also follow
   [data-interface guidance](docs/data-interfaces.md).

## For humans

Start with the conceptual documents to understand what makes a product feel
like Momoi Labs. Browse the component catalog for individual UI contracts and
the pattern catalog for complete flows and screen compositions. Each component
document covers anatomy, states, accessibility, usage, and token consumption;
each pattern document covers composition, behavior, responsive rules, and
keyboard flow where relevant.

## Directory map

| Path | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Consumption contract and decision boundaries |
| [`ui.css`](ui.css) | Component layer — published as `@momoi-labs/kiso/ui.css` |
| [`docs/brand.md`](docs/brand.md) | Product personality and visual direction |
| [`docs/principles.md`](docs/principles.md) | Design principles and tie-breakers |
| [`docs/voice-and-tone.md`](docs/voice-and-tone.md) | Product UI copy rules |
| [`docs/tokens.md`](docs/tokens.md) | Semantic token model and generated outputs |
| [`docs/components/`](docs/components/README.md) | Component contracts and catalog |
| [`docs/patterns/`](docs/patterns/README.md) | Screen and behavior patterns |
| [`docs/data-interfaces.md`](docs/data-interfaces.md) | Data-heavy interface rules |
| [`docs/accessibility.md`](docs/accessibility.md) | Accessibility requirements across all layers |
| [`docs/evolution.md`](docs/evolution.md) | Deliberate deferrals and evidence-based growth |
| [`blocks/`](blocks/README.md) | Reference screens built from `ui.css` (not published) |

Token sources and generated artifacts live in the repository-level `tokens/`
directory; validation scripts live in `scripts/`.

## Installing

Contracts, tokens, and the component layer ship in one versioned package, so a
project pins the whole system to a single version:

```bash
npm install @momoi-labs/kiso
```

```css
@import "@momoi-labs/kiso/tokens.css";
@import "@momoi-labs/kiso/ui.css";
```

`ui.css` reads tokens as custom properties, so import it after `tokens.css`.

## Proposing a change

First confirm that an existing token, component, or pattern cannot express the
need. Then capture the product case, the limitation in the current contract,
and evidence that the need recurs. Propose the smallest system-level addition
instead of copying a local solution between applications. See
[`docs/evolution.md`](docs/evolution.md) for what v1 deliberately defers and
when those decisions should be reconsidered.
