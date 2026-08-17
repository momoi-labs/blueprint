# Design Principles

These principles govern *how Momoi Labs product interfaces are designed*. They
are the design analog to the repository's
[engineering principles](../../docs/PRINCIPLES.md) — separate in domain, but
philosophically coherent with them.

Use them when a design choice has more than one correct answer. When a
principle and a convenience conflict, the principle wins. When two principles
conflict, the order below is the tie-breaker.

## Relationship to engineering principles

The engineering principles (`docs/PRINCIPLES.md`) govern *how this repository
is built*: smallest viable change, commit history tells a story, interfaces are
a compatibility contract, no silent defaults, decisions are recorded
append-only.

These design principles govern *how product interfaces look and feel*. They do
not duplicate the engineering principles. They are coherent with them in
spirit:

- Engineering's "no silent defaults" has a design analog — "no ad-hoc
  tokens/components when an equivalent exists" — which will live in
  `kiso/AGENTS.md` (a later epic), not here.
- Engineering's "smallest viable change" echoes in design's "useful over
  decorative": both ask *does this need to be here?*
- Engineering's "decisions are recorded" echoes in design's "opinionated, not
  restrictive": have a position, and make it findable.

Do not conflate the two. When an engineering question arises in design work
(e.g. "should this be a new component?"), defer to the engineering principles.

## 1. Useful over decorative

Every element in a product interface must serve a purpose. Decoration that does
not help the person do something is removed — not minimized, removed.

When choosing between two directions, prefer the one that:

- helps the person understand or act, rather than merely impresses;
- uses whitespace and hierarchy instead of ornament to create structure;
- defers any visual flourish that the task does not require.

This is the first principle because it is the most common question: *should
this be here?* If it does not help, it does not belong.

## 2. Clarity over cleverness

A clear interface is better than a clever one. Novelty for its own sake makes a
product harder to learn and harder to maintain.

When choosing between two directions, prefer the one that:

- uses familiar patterns where a familiar pattern already works;
- makes the current state and available actions obvious;
- resists a novel solution unless the novel solution is materially better — and
  if it is, records why.

## 3. Technical, not intimidating

Momoi builds developer tools, DB/infra tooling, and data-heavy interfaces.
These can be dense and precise without being hostile.

When choosing between two directions, prefer the one that:

- trusts the person's competence — show exact values, raw data, and technical
  terms where they are the clearest language;
- adds context and affordance rather than dumbing down — explain, don't hide;
- keeps density high where density aids understanding, and uses hierarchy to
  keep it navigable.

## 4. Quiet interfaces, strong hierarchy

Calm surfaces with strong information hierarchy. Visual noise is low; the
structure does the guiding.

When choosing between two directions, prefer the one that:

- uses one accent for attention, not a palette competing for it;
- lets typography and spacing establish rank, rather than color or weight
  escalation;
- reserves emphasis for the thing that matters most on the screen right now.

## 5. Opinionated, not restrictive

Momoi has a position on how things should look and sound. That position makes
decisions faster and products more consistent. But it should never block a
legitimate need.

When choosing between two directions, prefer the one that:

- has a clear default and a documented reason for it;
- allows escape hatches when a genuine case demands it — and records the
  escape;
- does not invent a rule just to forbid something; every restriction should
  trace back to a principle above.

## Conflict resolution (tie-breaker)

When two principles conflict, resolve in this order:

1. **Useful over decorative** — if one option serves the person and the other
   decorates, the useful one wins. This is almost always the first cut.
2. **Clarity over cleverness** — if both are useful, the clearer one wins.
3. **Technical, not intimidating** — if both are clear, prefer the one that
   respects and engages the person's competence.
4. **Quiet interfaces, strong hierarchy** — if both are technical, prefer the
   calmer, more hierarchically structured one.
5. **Opinionated, not restrictive** — apply defaults and positions, but yield
   to a documented, genuine exception.

The order moves from *does it belong?* through *is it clear?* through *is it
respectful?* through *is it calm?* to *is it consistent?* — a funnel from
existence to polish. If a conflict is not resolved after walking this list, the
design principle is missing and should be added (in a later epic, through real
product need — not speculatively here).

---

*Design principles are separate from engineering principles but philosophically
coherent. Read both. Do not duplicate.*
