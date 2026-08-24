# Handoff prompt — Kiso v1.1 (run this in the `blueprint` repo)

Paste everything below the line into a session opened at the blueprint repo.

---

You are working in `momoi-labs/blueprint`, the repo that holds the Kiso design
system. Read `AGENTS.md` and `kiso/AGENTS.md` first. Everything you write —
docs, commits, PR — must be in English.

## What you are doing

Implementing **Kiso v1.1**: a sizing, structure, and contract change driven by
real evidence from the first product built on Kiso v1.

There is a **working reference implementation already in this repo**, on the
branch `kiso/blocks-scaffold`:

```
kiso/blocks/
  README.md      what it is, and why it is the one non-spec folder
  index.html     every component, in every documented state
  console.html   a full product screen composed from them
  ui.css         the component layer — every value resolves to a token
  tokens.css     the proposed tokens, with the rationale in comments
  app.js         prototype behaviour only
```

Serve it (`python3 -m http.server 8777` inside that folder) and look at it
before you start. It answers most questions about intent. The full written
proposal is in `HANDOFF.md` alongside these files.

## Hard constraint: no colour value changes

**Do not edit a single hex in `color.neutral.*`, `color.accent.*`, or
`color.status.*`.** The brand palette stays exactly as it is, including the
light-theme status calibration and the theme-swapped `accent.base`.

The only colour work is **adding** steps to existing ramps, because v1 has no
endpoints: light needs a page background beneath a white card, dark needs a
violet dark enough to fill a selected row.

This constraint exists because an earlier pass neutralised the palette into
greys and it was rejected. Do not re-litigate it.

## The evidence

self-host was the first product on Kiso v1 (`f7d88ea`). Three gaps surfaced
that a consuming product cannot fix on its own:

1. **No control-size token.** The console filled the gap with
   `min-height: 44px` — the WCAG touch target — applied unconditionally
   including on desktop. With `type.size.body` at 16px, every screen read
   oversized. This is the largest single cause of the complaint.
2. **The semantic layer is too small.** `.button` had to hover onto
   `elevated-surface` (a surface role, not an interaction role), and
   `.button-primary` could not be a solid fill because there is no
   `primary-foreground`. So the primary action shipped as a violet outline —
   which is why a violet design system rendered as a grey one.
3. **The ramps have no endpoints** (see the constraint above).

## The changes

`HANDOFF.md` in `kiso/blocks/` lists all nine token changes with exact
values and a de/para table, the contract changes per file, and the validation
plan. Follow it. In summary:

- ramp extensions: `neutral.50/950`, `accent.50/500/950`
- NEW `size.*` group — control heights, icon sizes, sidebar width
- type scale base 16px → 14px; letter-spacing `rem` → `em`
- radius two steps tighter; `xl`/`2xl` deliberately not added
- NEW corner treatment: `radius.surface`, `corner.mark*` — registration marks
  instead of curves, on every panel
- NEW hatch: three sanctioned uses, explicit prohibition everywhere else
- elevation: shadow colour becomes a token so it follows the theme
- semantic layer 15 → ~30 slots, declared once with `light-dark()`
- **system is the default theme**; an explicit choice is a one-property
  override and persists

## Decisions already made — do not reopen

These were settled by building the alternatives and comparing them on screen.
Implement them as specified.

| Decision | Settled on |
| --- | --- |
| Default theme | **System**, via `color-scheme`. Explicit choice persists. |
| Theme selector | Icon-only segmented, settings row: label left, control right. |
| Corner language | Marks only. No rounded mode, no `data-corners` attribute. |
| Corner mark density | **Every panel.** No exception for tiles or nested panels. |
| Mark geometry | Two ticks per corner, `tick 4px`, `gap 2px`. |
| Blocks location | `kiso/blocks/`, non-normative. |

## Validation

`npm run check` must pass. Two things will break and need fixing as part of
this work:

1. **`scripts/check-contrast.mjs`** does not check fill/foreground pairs at
   all. The new solid primary needs covering — `#5b3fc4` on white = 7.1:1,
   `#cbbdf7` on `#1b1a1e` = 10.0:1, both pass, but the script cannot tell.
2. **`scripts/check-component-token-refs.mjs`** will fail until the component
   docs name the new `size.*`, corner, hatch, and semantic tokens.

One more thing to check: if style-dictionary cannot emit `light-dark()`, that
is the one build change this proposal needs. Solve it before hand-writing the
semantic layer.

Finish with a changeset. This is a breaking token change; every consumer
re-themes.

## Two things to raise, not decide

1. **`kiso/blocks/` ships in the npm package.** `files: ["kiso/",
   "tokens/build/"]`, verified with `npm pack --dry-run` — about 143 KB. It is
   also exported as `@momoi-labs/kiso/contracts/blocks/*`, an odd name for
   something that is not a contract. Ask whether to add `"!kiso/blocks"` to
   `files` and whether the export needs its own key.
2. **`kiso/AGENTS.md` says Kiso is spec-first**, "its Markdown files are
   contracts, not implementation code". `kiso/blocks/` is an exception to that
   sentence. Amend the sentence to acknowledge it rather than leaving the repo
   contradicting itself.

## Known issue, out of scope, worth an issue

The v1 neutral ramp has **two hues**: `neutral.100–600` sit around 40° (warm
beige) while `neutral.700–900` sit around 260° (cool violet), so light and dark
do not read as the same family. This proposal deliberately does not touch it.
If it is ever fixed, the move that keeps the brand is warming 700–900 toward
the beige family, not cooling 100–600. Open an issue; do not fix it here.
