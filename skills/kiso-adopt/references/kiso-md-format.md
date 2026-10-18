# The docs/kiso.md format

Each Kiso consumer keeps one `docs/kiso.md`. It records only what Kiso leaves
to the product. The Kiso skills read it after the installed contracts. A rule
that two products share belongs in Kiso, not here.

Use these sections, in this order. Keep a section with "None." when it is
empty, so a reader knows it was checked.

1. **Contracts.** The package, the installed Kiso version, and the path to
   the installed contracts. Compare against this version, not the blueprint
   checkout.
2. **Paths.** Where screens, product components and product CSS live, as
   repository-relative paths. List every CSS file.
3. **Product components.** Exported components and helpers a new screen
   should reuse. Leave out private ones.
4. **Product rules.** Product decisions on top of the contracts. Do not
   restate a contract rule.
5. **Pattern choices.** Every screen and the pattern it follows. A screen
   that follows no pattern says so.
6. **Exceptions.** Deliberate breaks of a contract. One row each: contract,
   what and why, where, Kiso issue, and when to remove it. An accidental
   break is a bug to fix, not an exception.
7. **Verify.** The project's commands, their prerequisites, and the checks
   only this product needs. Checks shared by every product live in the
   skills.

## Template

```markdown
# Kiso in <product>

The <app> follows Kiso. This file records only what Kiso leaves to the
product. The rules live in the installed contracts. If this file and a
contract disagree, the contract wins and this file has a bug.

## Contracts

- Package: `@momoi-labs/kiso-react` <version> and `@momoi-labs/kiso`
  <version> in `<package dir>/`.
- Contracts: `<package dir>/node_modules/@momoi-labs/kiso/kiso/`. Start at
  `AGENTS.md`.

## Paths

| What | Where |
| --- | --- |
| Screens | `<path>` |
| Product components | `<path>` |
| Product CSS | `<path>` |

## Product components

None.

## Product rules

None.

## Pattern choices

| Screen | Pattern |
| --- | --- |

## Exceptions

None.

## Verify

1. <install and prerequisites>
2. <test, typecheck and build commands>
3. <how to load the screen in the real app>
```
