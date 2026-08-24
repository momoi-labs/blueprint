# Kiso consumption rules

These instructions govern how agents consume Kiso when designing or building
Momoi Labs product interfaces. Engineering rules remain in the repository root
[`AGENTS.md`](../AGENTS.md).

Read [`README.md`](README.md) for the system map, then consult the relevant
token, component, and pattern contracts before making interface decisions.

## Hard rules

1. **Before creating a new component, check whether Kiso already has a
   component or pattern that solves the problem.** Start with the
   [component catalog](docs/components/README.md) and
   [pattern catalog](docs/patterns/README.md).
2. **Do not introduce ad-hoc colors, spacing, radius, typography, or
   interaction patterns if an equivalent token or pattern already exists.**
   Use the documented [tokens](docs/tokens.md) and existing contracts. A
   convenient local default is not permission to fork the system.
3. **When a new need arises repeatedly, propose its incorporation into Kiso
   rather than copying it independently across applications.** Record the need
   and evidence so the system can evolve from real product work.

## Decision boundary

| May decide alone | Must not decide alone |
| --- | --- |
| Layout details within the constraints of an existing pattern | Add or change a token |
| Product copy that follows the [voice and tone](docs/voice-and-tone.md) rules | Add or change a component contract |
| Which existing component, pattern, or semantic token best fits the documented need | Add or change a pattern contract |
| Responsive composition when the relevant contracts leave the choice open | Deviate from the [accessibility rules](docs/accessibility.md) |

For a decision in the right-hand column, stop and propose the change instead
of silently implementing it. A one-off product exception must be explicit and
documented; it does not become Kiso by repetition or copy-paste.

## Consumption sequence

1. Identify the product task and required states.
2. Choose the closest existing [pattern](docs/patterns/README.md).
3. Compose it from documented [components](docs/components/README.md).
4. Apply semantic [tokens](docs/tokens.md), not raw visual values.
5. Apply [voice and tone](docs/voice-and-tone.md) and
   [accessibility](docs/accessibility.md) requirements.
6. If no contract fits, describe the gap and propose an addition. Do not
   create a parallel local system.

Kiso is spec-first: its Markdown files are contracts and carry no
implementation code. Two files carry implementation instead —
[`ui.css`](ui.css), the component layer, published as
`@momoi-labs/kiso/ui.css`; and [`blocks/`](blocks/README.md), reference
screens built from it, meant to be copied and not published. Neither is a
contract: when one disagrees with a contract, the contract is right and the
implementation is the bug.

Deliberate omissions and the evidence-based growth model are recorded in
[`docs/evolution.md`](docs/evolution.md).
