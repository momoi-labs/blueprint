---
name: kiso-propose
description: Propose a change to Kiso, the Momoi Labs design system, as an issue in momoi-labs/blueprint. Use when a product needs a token, component or pattern that Kiso lacks, when a contract blocks a real product need, or when the user says Kiso should have something.
---

# Propose a change to Kiso

A product that needs something Kiso lacks proposes it upstream. It does not
build a local copy that the next product copies again.

## 1. Confirm the gap

1. Read `kiso/AGENTS.md`, the component catalog and the pattern catalog from
   the installed contracts.
2. Check that no token, component or pattern already covers the need,
   alone or composed.
3. Read `kiso/docs/evolution.md`. If the need is a deliberate deferral, say
   so and quote its "When to reconsider" column.
4. Search open and closed issues in `momoi-labs/blueprint` for the same need.
   If one exists, add the new evidence as a comment instead.

## 2. Gather evidence

- Describe the product case: the screen, the task, and what the current
  contract cannot express.
- Look for the same need in other Momoi Labs products, and list the files.
  Repetition is the signal Kiso grows from.
- Name what the product does today, if it already built something.

## 3. Write the issue

Use this structure, following earlier issues such as
[#112](https://github.com/momoi-labs/blueprint/issues/112):

```markdown
## Problem

<the product case and the limit in the current contract>

## Evidence

<each product and file where the need appears>

## Proposal

<the smallest addition: token, component contract, pattern or class>

Out of scope: <what stays in the product>

## Sources

<files and ADRs in each product>
```

Show the issue to the user before you create it. The issue is public.

## 4. Record the exception

If the product cannot wait, add a row to Exceptions in its `docs/kiso.md`:
the contract, what and why, where, the new issue, and when to remove it.
