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

After building packages, run `node .agents/skills/validate-kiso-component/scripts/inventory.mjs`
from the repository root to enumerate catalog files and built runtime exports
by module. Review the mapping rather than inferring coverage from name matches.
Account for exported variant helpers and hooks, and distinguish type-only and
internal exports from the public runtime API. Record documented compositions
under their contracts even when they share another component's exports.

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

Keep a case ledger: component/exports, input and action, expected assertion,
environment, observed result, and evidence location. Reset between independent
cases. A failed open overlay can hide unrelated controls from role queries and
turn subsequent failures into noise. Wait for the asserted focus/state change,
not only for popup visibility. Confirm fixture readiness, locator identity, and
caller-required layout before classifying a timeout or overflow as a defect.

When reusing checks across browsers, verify their native-control assumptions.
Button tab/click focus can follow platform policy, and an automation fill can
emit composition events. Compare a plain HTML control and inspect the event
sequence before attributing those differences to the component. Preserve failed
suite results; report a portable subset with its exclusions, not as a suite pass.

Run consumer examples with their required layout styles, then reduce failures
against distributed package CSS alone. Record which styles and mocked effects
each run used. Load styles before mount for initial layout/scroll assertions;
late development-server CSS can invalidate that precondition. Test late style
or font changes separately when the contract or consumer requires them.
Preserve the failed probe and the corrected fixture result when
the harness, rather than the component, caused the failure.

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

When the user assigns known defects to parallel work, link that owner issue and
mark its affected checks pending verification. Continue unrelated checks in the
same components. Rerun the affected checks after the fixes merge; neither an
open fix branch nor a closed issue alone is evidence of a pass.

Audit requests authorize diagnosis. Implement fixes, alter contracts, or add
maintained regression tests when included in the requested scope. Preserve
scratch reproductions and results for handoff; keep screenshots and temporary
fixtures out of commits according to repository rules.

## Complete the review

A component is covered when every mapped requirement and applicable matrix
category has a recorded result: passed, failed with evidence, or untested with
a reason. Report untested material requirements as gaps, not as a pass. An
all-component audit additionally accounts for every catalog entry and export.

Give exclusions an explicit not-applicable reason. Keep pending verification
separate from executed failures and passes. A suite result applies only to its
assertions, not every scenario for the exports it imports. Link follow-up work
for material gaps, including native IME, assistive technology, real touch
hardware, and text-only zoom when those environments were unavailable.

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
