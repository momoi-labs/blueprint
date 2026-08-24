---
"@momoi-labs/kiso": minor
---

Add `kiso/blocks/` — reference screens built from the Kiso contracts.

Two static pages (a component gallery and a full console screen) plus the CSS
and behaviour behind them, copyable as a starting point instead of re-derived
from prose. They are illustrations, not contracts: where a block and a
contract disagree, the contract wins and the block is the bug.

The folder also carries the Kiso v1.1 proposal these screens demonstrate.
Those tokens are **not** implemented yet — `kiso/blocks/tokens.css` is
currently ahead of `tokens/build/tokens.css` by design, and nothing consuming
`@momoi-labs/kiso` changes behaviour in this release.
