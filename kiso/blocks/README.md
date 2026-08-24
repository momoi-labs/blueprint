# Blocks

Reference screens built from the Kiso contracts. Copy one, adapt it, ship it.

## These are not contracts

Everything in this folder is an **illustration**, not a rule. The contracts
live in [`../docs/components/`](../docs/components/README.md) and
[`../docs/patterns/`](../docs/patterns/README.md).

**If a block and a contract disagree, the contract is right and the block is
the bug.** Fix the block.

That distinction matters because the rest of Kiso is spec-first: its Markdown
files are the source of truth and carry no implementation. Blocks are the one
exception, and they earn it by being copyable — a new project should not have
to re-derive a working screen from prose.

## What is here

| File | What it is |
| --- | --- |
| `index.html` | Every component, in every documented state. The thing to look at when you are choosing one. |
| `console.html` | A full product screen — sidebar, stat row, chart, table, list-detail — composed only from those components. |
| `ui.css` | The component layer. Every value resolves to a token; no raw hex, no raw px where a token exists. |
| `tokens.css` | See the warning below. |
| `app.js` | Enough behaviour to review states. Not production code. |
| `HANDOFF.md` | The Kiso v1.1 proposal these screens demonstrate. |
| `BLUEPRINT-PROMPT.md` | A self-contained prompt for implementing that proposal in this repo. |

## `tokens.css` is ahead of `tokens/build/`

Right now it is **not** a copy. It holds the tokens proposed in
[`HANDOFF.md`](./HANDOFF.md), which have not landed in `tokens/tokens.json`
yet — that is a separate change. Until it does, these screens show what the
system *would* look like, not what it currently emits.

Once the token change lands, this file becomes a plain copy of
`tokens/build/tokens.css`, regenerated rather than hand-edited, and a diff
between the two is a bug in this folder.

## Running it

```bash
python3 -m http.server 8777
```

Any static server works; there is no build step.
