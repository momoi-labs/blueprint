---
name: kiso-review
description: Review a diff, a pull request or a whole product against Kiso, the Momoi Labs design system. Use when asked to audit, review or check UI code for Kiso compliance, or before a release of a product that uses Kiso.
---

# Review against Kiso

Find where the code breaks the installed Kiso contracts or the project's
`docs/kiso.md`. Report the findings. Do not fix them unless the user asks.

## 1. Load the context

1. Read the project's `docs/kiso.md`. If it does not exist, say so and
   suggest the `kiso-adopt` skill.
2. Read `kiso/AGENTS.md` from the Contracts path in `docs/kiso.md`. Use the
   installed contracts, never a blueprint checkout.
3. Set the scope: the diff, the pull request, or every path in Paths.

## 2. Run the mechanical checks

Search the files in scope for:

- Raw colors: hex, `rgb(`, `hsl(` and `oklch(` values outside a token.
- Raw spacing, radius and font sizes where a token exists.
- Classes that exist neither in `@momoi-labs/kiso/ui.css` nor in the product
  CSS listed in Paths.
- Product components that restate a Kiso component. Compare them with the
  component catalog in `kiso/docs/components/README.md`.
- New CSS files missing from Paths.

## 3. Check each screen

For each screen in scope:

1. Find its row in Pattern choices. A screen without a row is a finding.
2. Read the pattern file and the component contracts it links to.
3. Compare the screen with every rule and state in the pattern: placement,
   loading, empty and error states, responsive behavior and keyboard flow.
4. Check copy against `kiso/docs/voice-and-tone.md` and every state against
   `kiso/docs/accessibility.md`.

## 4. Sort the findings

- A break listed in Exceptions, in the place its row names, is not a finding.
  An exception whose Kiso issue is closed is a finding: it should be removed.
- A break of a contract without an exception row is a bug.
- A need no contract covers is a gap. Suggest the `kiso-propose` skill.
- A rule in `docs/kiso.md` that restates or contradicts a contract is a bug
  in `docs/kiso.md`.

## 5. Report

One line per finding, most severe first: `file:line`, the rule broken, and
the contract file that holds it. Say which checks ran and which did not.
