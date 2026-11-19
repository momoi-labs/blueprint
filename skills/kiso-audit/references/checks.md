# Checks

Search the product's sources, not `node_modules` or generated files. A
pattern finds candidates. Read the lines before you call one a finding.

The CLI column names what `npx @momoi-labs/kiso-check` reports for a check.
Static mode prints the same id. A dash means the check is by hand.

## Project

| Id | Question | How to find | CLI |
| --- | --- | --- | --- |
| P1 | Does the installed kiso-react export `ConsoleShell`, `ListPage`, `FormPage` and `DetailPage`? | `grep -E "ConsoleShell\|ListPage\|FormPage\|DetailPage" node_modules/@momoi-labs/kiso-react/dist/index.d.ts`. Without `node_modules`, read the lockfile: kiso 1.10.0 and kiso-react 0.32.0 or older do not have them. A no means every screen is not migrated until the upgrade. | static |
| P2 | Does the shell come from kiso-react? | The import of `ConsoleShell` names `@momoi-labs/kiso-react`. A local component with the same name does not count. An `ApplicationShell` with its own breadcrumb or account Popover is not migrated. | static |
| P3 | Does product CSS restate what Kiso ships? | Rules in product CSS on `.sidebar-header`, `.topbar`, `.app-shell`, `.app-shell-phone-brand`, `--app-shell-brand-inset`, a `box-shadow: inset` stripe, `.nav-item` icon padding, `.page-header` height, `[data-width]`, `.detail-tabs`, `.card-content > .empty`, `.form-page` radius. Each rule is drift. Name the file and lines to delete. | static, listed rules only |
| P4 | Does `docs/kiso.md` exist and list each screen in Pattern choices? | Read it. | - |

## Every screen

| Id | Question | How to find | CLI |
| --- | --- | --- | --- |
| S1 | Does it use the component for its kind? | list: `ListPage`. detail: `DetailPage`. form: `FormPage`. Import from `@momoi-labs/kiso-react`. | static, not the kind |
| S2 | Is there one `.page`? | `className="page"` or `<Page` inside the screen while the shell already renders one. Measured: `.page` count is 1. | static; live `jump` |
| S3 | No description under the header? | `PageHeaderDescription`, or a `<p>` or muted text between the PageHeader and the first block. | static, `PageHeaderDescription` only |
| S4 | No button in an empty state? | An `EmptyState` with an action prop or a `Button` child. | static |
| S5 | Is the primary action never disabled? | A `disabled` prop on the PageHeader action or on `action`. | static, header and `action` only |
| S6 | One action in one place? | The header action repeated in an empty state, a tab or a step list. | - |
| S7 | Width the same as the other screens of its kind? | The `width` or `data-width` value, or a product-wide setting such as `data-page-width` on `<html>`. A form follows the form default (`left`) unless an Exceptions row says otherwise. | live `layouts` |
| S8 | No hint on a read-only field? | A `hint` or helper text on a field that is `readOnly` or `disabled`. | - |

## Measured, when the app runs

| Measurement | Pass |
| --- | --- |
| `jump` | Title top and first block top equal on every page. 86.8 and 140 at 1280 px with the Kiso shell. |
| `layouts` | Every case passes for the kind and the layout from S7. |
| `margins` | 24 px margins at 390 px, no sideways scroll. |
| `brand` | Every value passes. It takes the first list case and the first form case. Pass `--brand` and `--brand-other` for a list URL and a URL without a header action. |

A failed measurement on a screen that passes S1 is drift. Quote the CLI line.

## Report template

```md
# Kiso audit: <project> at <branch> <commit>

Kiso <version>, kiso-react <version>. Standard: console-pages.md from
kiso-page <commit or date>. Measured: yes or no, and why.

| Screen | Route | Kind | Status | Main finding |
| --- | --- | --- | --- | --- |

## Project findings

- P3 drift: `src/styles/brand.css:41-43` sets `--app-shell-brand-inset`.
  Kiso ships it. Delete the rule.

## <Screen name> (`path/to/File.tsx`)

Status: not migrated

| Check | Result | Evidence |
| --- | --- | --- |
| S1 | fail | `File.tsx:12` renders `PageHeader` and `Table` by hand |

Migration:

1. Replace lines 12-80 with `<ListPage title=... action=... state=...>`.
2. Delete ...

## Gaps in the standard

- Parts of a screen that no component slot holds.

## Not covered

- What was not read or measured, and why.
```
