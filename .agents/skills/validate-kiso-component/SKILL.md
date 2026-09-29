---
name: validate-kiso-component
description: Validate a Kiso component against its contract, accessibility rules, packaged behavior, and real consumer compositions. Use for deep component audits, release-readiness reviews, or a requested catalog-wide validation.
---

# Validate Kiso component

Produce reproducible evidence for each applicable behavior and a clear account
of what remains untested. An export existing, a screenshot rendering, or the
current test suite passing does not establish that a component works.

## Establish the contract and scope

1. Record the repository SHA, package versions, component names, and requested
   baseline. For a release review, resolve the release PR head rather than
   assuming the checkout is current. Separate existing defects from regressions.
2. Read the relevant contracts in `kiso/docs/components/`, related patterns,
   `kiso/docs/accessibility.md`, and repository instructions. Map them to React
   exports, shared implementation, CSS, and existing checks. A documented
   behavior is the oracle; report ambiguities instead of inventing a contract.
3. Locate consumer usages when available. Include imported subcomponents and
   hooks, custom labels, disabled states, controlled values, and surrounding
   forms. Distinguish a library defect from a caller omitting a required prop.
4. Read [the scenario matrix](references/scenario-matrix.md). Create a case list
   with an expected observable result before running probes. Mark each matrix
   category applicable or not applicable, with a reason.

For a catalog-wide request, first reconcile the component catalog, contract
files, and package entry points. Group related exports for testing, but account
for every export individually. Include components unused by the current
consumer. Record contract-only components and implementation-only exports
explicitly; a missing dedicated export is not a defect when a documented
composition implements the contract. Maintain an inventory with component,
exports, contract, scenarios, result, evidence, and issue links.

## Exercise the implementation

Use an isolated fixture importing the built package and its distributed CSS.
Inspect the available package scripts and reuse the maintained test tooling.
For package/export concerns, also test an isolated tarball installation so
workspace resolution cannot conceal missing exports, files, or dependencies.

Run applicable scenarios through real browser interactions. Assert the outcome
that matters: callback count and payload, retained data, focused element,
scroll reachability, accessible state, or hit-tested target. Pair failure
probes with positive controls such as ordinary Enter after composition ends.
Source inspection helps explain a failure; it does not replace a reproduction.

For interactive components, include both an isolated fixture and a realistic
consumer composition when one is available. A controlled parent must rerender
as the real application does. Mock external effects and record those limits;
opening a local form and executing a backend deployment are different outcomes.

Use the matrix to cover meaningful boundaries and state transitions, not an
arbitrary test count. Seed generated inputs and retain failing inputs. For a
shared handler or CSS rule, inspect its other consumers and exercise each
behaviorally distinct path before declaring the failure isolated or fixed.

## Confirm and record findings

Reduce each failure to a stable reproduction. Record:

- Expected behavior and the contract or accessibility rule that supports it.
- Actual behavior, user consequence, environment, and tested SHA.
- Minimal composition, inputs, interaction steps, and observable assertion.
- Owning layer, source location, and affected shared paths.
- Positive controls and regression acceptance criteria.

Keep unknowns separate from defects. Browser dispatch of composition events is
an IME regression probe, not native IME verification. DOM semantics do not prove
screen-reader announcements. Synthetic clicks do not prove touch reachability.
Record unsupported browser, assistive-technology, or backend checks as untested.

Search existing issues before proposing a new one. Group manifestations of the
same cause and link related defects; do not multiply generated failing inputs
into separate issues. Publish issues only when the user requested it or gave
standing authorization. Otherwise provide reviewable issue drafts. Use English
and include enough evidence to reproduce without access to local scratch files.

Audit requests authorize diagnosis. Implement fixes, alter contracts, or add
maintained regression tests when included in the requested scope. Preserve
scratch reproductions and results for handoff; keep screenshots and temporary
fixtures out of commits according to repository rules.

## Complete the review

A component is covered when every mapped requirement and applicable matrix
category has a recorded result: passed, failed with evidence, or untested with
a reason. Report untested material requirements as gaps, not as a pass. An
all-component audit additionally accounts for every catalog entry and export.

Before publishing, check whether the target SHA and linked issue states changed.
Inspect the intervening diff and rerun affected scenarios; keep the original SHA
on evidence that was not rerun. Recheck issue state immediately before creating
or updating tickets to avoid reporting a resolved finding as outstanding.

Report behavior findings and standards findings separately. State release
blockers with their concrete impact, then lesser defects, test scope, and
remaining gaps. Distinguish completed automated checks from manual steps still
needed. Link evidence and published issues. Stop expanding the audit once the
requested inventory and relevant scenarios are accounted for; a green result
is bounded by those scenarios, environments, and versions.
