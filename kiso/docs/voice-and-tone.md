# Voice and Tone — Product UI Microcopy

This document governs how product UI copy **sounds**. It is the voice layer of
the [brand](./brand.md), made concrete for the words on screen.

It covers **product UI** — labels, buttons, states, errors, empty states,
confirmations. It does not cover marketing copy, documentation prose, or the
marketing site's voice. The marketing site is more experimental; products are
lived in.

## The core decision: universal directness vs reserved terminal flourish

Momoi's marketing site has a terminal-inspired voice. For products, that voice
splits into two layers with different rules:

### Universal directness (applies everywhere)

All product UI copy is **direct, brief, and structured**. This is not a style
preference — it is a baseline requirement for every word on screen.

- **Direct.** Say what the thing is and what it does. No hedging, no
  filler, no "please" or "sorry" in functional copy.
- **Brief.** The fewest words that are still clear. If a label works at two
  words, it does not need three.
- **Structured.** Prefer scannable structure (labels, lists, known patterns)
  over prose paragraphs. Dense data gets a table, not a sentence.

### Reserved terminal flourish (chrome and metadata only)

The site's literal terminal flourishes — "~/ABOUT" navigation prefixes, "$
export THEME=light" command-style actions — are **reserved for chrome and
metadata**. They do not appear in:

- **Body copy.** Explanatory text is plain and direct.
- **Error messages.** Errors follow their own mandatory structure (below).
- **Functional UI text.** Buttons, form labels, status indicators, and
  navigation use plain language.

Terminal flourish is appropriate in chrome where it reinforces identity without
costing clarity — e.g. a subtle metadata label, a decorative section eyebrow.
When in doubt, leave it out. Directness always works; flourish is optional.

## Error messages (hard rule)

Error messages **must** follow this three-part structure:

1. **What happened.** State the problem in plain language.
2. **Why, when possible.** If the cause is knowable, explain it briefly. If it
   is not, skip this part rather than guess.
3. **What the person can do now.** Offer a concrete next step or recovery
   action.

This is a **hard rule**, not a suggestion. An error without a recovery path is
incomplete.

**Examples:**

> Connection to the database failed. The server at `db.example.com:5432` did
> not respond within 5 seconds. Check that the database is running and
> reachable, then retry.

> This query was canceled. It exceeded the 30-second timeout. Narrow the query
> scope or increase the timeout in Settings.

> You don't have permission to delete this record. Only workspace admins can
> delete records. Ask an admin to perform this action or to grant you the
> role.

**Anti-patterns** (never do these):

- Cryptic codes without context: `Error: ECONNREFUSED`
- Accusatory tone: "You entered an invalid value."
- Apologetic filler: "Oops! We're sorry, but something went wrong."
- No recovery path: "Operation failed."

## Specific UI states

### Empty states

Helpful and actionable, not apologetic or cute. State what is empty, why it
might be, and what to do next.

> No queries yet. Create your first query to see it here.

> This workspace has no members. Invite people to collaborate.

Do not say "Nothing to see here" or "It's lonely in here." Empty states are a
signpost, not a joke.

### Loading states

Informative without being chatty. State what is happening; do not narrate
enthusiasm.

> Loading queries…

> Connecting to database…

Do not say "Hang tight!" or "Cooking something up…". A loading state that takes
longer than a moment may add a reason ("Loading 1,240 rows…").

### Destructive actions and confirmations

Clear without being alarming. Name the action and its consequence; let the
person decide.

> Delete "production-db"? This cannot be undone.

> Disconnect from `staging-db`? Active queries will be terminated.

Do not say "Are you absolutely sure?" or wrap confirmations in warning colors
that imply danger beyond the actual stakes. Match the confirmation's weight to
the action's irreversibility.

### Permission denied

Explain clearly without sounding accusatory or corporate. State what was
denied, why, and what to do.

> You can't edit this query. Only the query author and workspace admins can
> edit it. Ask an admin to grant you access.

Do not say "Access Denied" in red with no context. Do not say "You are not
authorized to perform this action" — it is corporate and unhelpful.

## Product UI voice vs documentation tone

Product UI copy is **terse and structural**. Documentation is **prose that
explains**. They share directness but differ in form:

- **Product UI:** "Delete query" / "3 of 12 rows selected" / "Reconnect"
- **Documentation:** "To delete a query, open its menu and choose Delete. The
  query is removed from the workspace; its results are not exported anywhere."

Do not write product UI copy as documentation, and do not write documentation
as a series of labels. If a UI element needs more explanation than a label
allows, link to documentation rather than inflating the label.

## Quick reference

| Situation | Rule |
| --- | --- |
| Any copy | Direct, brief, structured |
| Error | What happened → why (if possible) → what to do now |
| Empty state | What's empty → why → what to do |
| Loading | What's happening, no chatter |
| Destructive | Name action + consequence, match weight to stakes |
| Permission denied | What was denied → why → what to do |
| Terminal flourish | Chrome/metadata only, never body/errors/functional text |

---

*Directness is universal. Terminal flourish is reserved. Errors always have a
recovery path.*
