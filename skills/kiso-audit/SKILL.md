---
name: kiso-audit
description: Audit every screen of a product built on Kiso, the Momoi Labs design system, against the console page standard, and write a report with the migration for each screen. Read-only. Use when asked to audit, review or check a whole product's screens against Kiso, or to plan a move to ConsoleShell, ListPage, FormPage and DetailPage.
---

# Audit a Kiso product

Find every screen, compare it with the console page standard, and report.
Never change the product's code, config or git state. The only file you write
is the report.

## 1. Load the standard

1. Read `../kiso-page/references/console-pages.md` next to this skill. It is
   the standard. `npx @momoi-labs/kiso-check` runs its automated checks.
2. Read the project's `docs/kiso.md`. Its Exceptions rows turn a matching
   finding into ok. A missing file is a finding of its own, not a stop.
3. Read the versions of `@momoi-labs/kiso` and `@momoi-labs/kiso-react`
   from the lockfile. If the checkout is on another branch than the one
   asked for, read that branch with `git show`, never with a checkout.

## 2. Find and classify the screens

1. Start from the router: every route that renders a page. Add pages reached
   only by a dialog or a redirect when they render their own PageHeader.
2. Give each screen one kind:
   - list: a table or grid of records, maybe a create action;
   - detail: one record, often with tabs;
   - form: create, edit or account, with a save or create action;
   - other: overview, dashboard, sign-in, error. Only the shell and every
     screen checks apply. A screen outside the shell, such as sign-in, skips
     the shell checks.
3. A route that renders two kinds, such as a list with a selected record,
   gives one row per kind.
4. Record the file and the route of each.

## 3. Check each screen

1. Run `npx @momoi-labs/kiso-check <source folder> --json`. It reports the
   versions, each screen and shell file with what it imports, and findings for
   P1, P2, P3, S1, S2, S3, S4 and S5.
2. Read the lines of each finding before you keep it. The CLI matches
   patterns. A finding can be wrong, and it misses some cases. checks.md says
   which.
3. Do the other checks in [references/checks.md](references/checks.md) by
   hand.

Each finding needs evidence: `file:line` from the CLI or a search, or a number
from live mode. No evidence, no finding.

When the app is running, also run live mode. Do not start or restart a server
unless the user asks. Write a cases file with one line per screen (see
console-pages.md) in a temporary folder, outside the project, and run
`npx @momoi-labs/kiso-check --cases <file> --base <app url>` once. Live mode
needs playwright with Chromium. If it exits 2 for that, say so and do not
install it in the project. Live mode needs the shell's `.page`.
Leave out sign-in and error pages that render outside the shell. For a screen
behind a sign-in, use an account the user gives you, or stub its API calls as
console-pages.md says. Never create an account or a session in a shared
service. Say which screens were not measured and why.

## 4. Give a status

- ok: every check passes, or the failure has an Exceptions row.
- not migrated: the screen does not use the kiso-react component for its
  kind, or the app shell is not kiso-react's `ConsoleShell`.
- drift: the component is used, but another check fails.

When P1 fails, every screen is not migrated. Still list each screen's other
findings, so the reader sees which screens are close.

An Exceptions row for a gap that the components now close does not make a
finding ok. Report the row as one to remove.

## 5. Write the report

Use the template in [references/checks.md](references/checks.md). Write it
where the user asks. With no place named, show it in the reply. Screens with
the same findings can share one section. Each migration step names the
component, the props and the lines to delete. Do not write patches. List each
screen part the standard has no slot for (for example a status row or chips
in the header) under "Gaps in the standard".
