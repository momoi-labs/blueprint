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
| `app.js` | Enough behaviour to review states. Not production code. |

Neither `tokens.css` nor `ui.css` lives here, on purpose. Both pages link
`../../tokens/build/tokens.css` and `../ui.css` directly, so a block can never
drift from what the system actually ships — if a token or the component layer
changes, these screens change with it or they visibly break, which is the
point.

## Running it

```bash
python3 -m http.server 8777
```

Then open `/kiso/blocks/index.html`. Serve from the repo root, not from this
folder, or the token link resolves above the server root. There is no build
step beyond `npm run build` for the tokens themselves.

## Not published

`kiso/blocks/` is excluded from the npm package. It is for people reading and
copying from this repo, not a runtime dependency. The component layer it is
built from *is* published, as `@momoi-labs/kiso/ui.css` — see
[`../ui.css`](../ui.css).
