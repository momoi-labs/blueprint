---
name: kiso-adopt
description: Connect a project to Kiso, the Momoi Labs design system, and create its docs/kiso.md. Use when starting a new app on Kiso, when a project uses Kiso without a docs/kiso.md, or when asked to adopt or set up Kiso.
---

# Adopt Kiso

Connect the project to the installed Kiso package and record what Kiso leaves
to the product in `docs/kiso.md`. The rules stay in the package. This skill
copies no rule into the project.

## 1. Find the starting point

- Find the web package: the directory with the `package.json` that builds the
  UI. Call it the package dir.
- Check `package.json` for `@momoi-labs/kiso-react` and `@momoi-labs/kiso`.
- Find the terminal UI, if any: a `Cargo.toml` that depends on a TUI library
  such as ratatui. A project can have both. A project with only a terminal UI
  skips steps 2 and 3 and follows "Terminal UI" below.
- Check for an existing `docs/kiso.md`. If it exists, stop and say so. This
  skill does not rewrite it.
- For a new app, the default stack is in the blueprint's
  [web application pattern](https://github.com/momoi-labs/blueprint/blob/main/docs/patterns/web-application.md).
  Follow it unless the user chose otherwise.

## 2. Install the packages

In the package dir:

```sh
npm install @momoi-labs/kiso-react @momoi-labs/kiso
```

Install `@momoi-labs/kiso` as a direct dependency even though `kiso-react`
brings it. Without it, the contracts path depends on npm hoisting.

## 3. Wire the styles

- Import `@momoi-labs/kiso-react/styles.css` once, in the entry point, before
  the product CSS. It loads the fonts, the tokens and `ui.css`. Do not import
  them again.
- Leave `data-theme` off `<html>` so the app follows the system theme. Read
  the appearance attributes in `kiso/docs/tokens.md` before adding any.
- Product CSS goes in its own file, imported after the Kiso stylesheet.

## Terminal UI

1. Add the tokens: `cargo add kiso-tokens`.
2. Pick one accent: the web UI's if the project has one, else ask the user.
3. Put every style in one palette module, built from one theme constant such
   as `kiso_tokens::GOLD_DARK`. The rest of the code takes styles from that
   module and never names a color.
4. Read `kiso/docs/terminal-interfaces.md` before step 5.

## 4. Read the contracts

Read `<package dir>/node_modules/@momoi-labs/kiso/kiso/AGENTS.md`, then the
pattern catalog in `kiso/docs/patterns/README.md`. Use them to fill Pattern
choices. Never read the contracts from a blueprint checkout: the installed
version is the one the project ships.

A project with only a terminal UI has no installed contracts. Read them from
GitHub at the newest `@momoi-labs/kiso@<version>` tag, and record that
version in Contracts.

## 5. Write docs/kiso.md

Use the format and template in
[references/kiso-md-format.md](references/kiso-md-format.md).

- Fill Contracts with the installed versions from `package-lock.json`.
- Fill Paths, Product components and Pattern choices from the code. For a new
  app, write "None." where nothing exists yet.
- Write Exceptions only for a break that was decided on purpose and has a
  blueprint issue. A break nobody decided is a bug. List it in the report,
  not in the file.
- Fill Verify with commands you ran or read in `package.json`.

## 6. Point agents at it

Add this to the project's `AGENTS.md`, creating the file if needed:

```markdown
## Kiso

The UI follows Kiso. Read `docs/kiso.md` before changing a screen, and use
the `kiso-page` skill to build or change one.
```

## 7. Verify and report

1. Run the build from Verify. The app must load with the Kiso fonts and both
   themes. A terminal UI must pass the Verify steps in
   `kiso/docs/terminal-interfaces.md`.
2. Report the installed versions, the files changed, and any break of a
   contract you found in existing code.
