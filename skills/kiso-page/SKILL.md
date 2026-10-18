---
name: kiso-page
description: Build, change or check a screen in a product that uses Kiso, the Momoi Labs design system. Use when adding or changing a page, view, list, detail, create, settings, dashboard or login screen, or when checking a screen against Kiso's patterns.
---

# Build a Kiso screen

The rules live in the Kiso contracts installed with the project. The product's
decisions live in `docs/kiso.md`. This skill walks the agent through both. It
holds no rules of its own.

## 1. Load the context

1. Read the project's `docs/kiso.md`. If it does not exist, stop and use the
   `kiso-adopt` skill first.
2. Read `kiso/AGENTS.md` from the Contracts path in `docs/kiso.md`. Use the
   installed contracts, never a blueprint checkout.
3. Check that the version in Contracts matches `package-lock.json`. If not,
   say so and use the installed version.

## 2. Choose the pattern

1. Name the product task and the states the screen needs.
2. Check Pattern choices in `docs/kiso.md`. A changed screen keeps its pattern.
3. For a new screen, pick the closest pattern in `kiso/docs/patterns/`. Read
   the pattern file in full.
4. If no pattern fits, say so in one or two sentences, with what the screen
   needs. Do not force a pattern and do not invent a layout. Ask the user
   before going on.

## 3. Compose the screen

1. Read each component contract the pattern links to.
2. Reuse the Product components listed in `docs/kiso.md`.
3. Build from `@momoi-labs/kiso-react` components and the `ui.css` classes.
   Use semantic tokens, never raw colors, spacing or radius.
4. Apply Product rules and Exceptions from `docs/kiso.md`. An exception
   applies only where its row says.
5. Put product CSS only in the paths listed in Paths. Name a class for what
   it is, not for the screen that needed it first.
6. Follow `kiso/docs/voice-and-tone.md` for copy and
   `kiso/docs/accessibility.md` for every state.

Stop and ask before you add or change a token, a component contract or a
pattern. The decision boundary in `kiso/AGENTS.md` lists what you may decide
alone. A one-off break needs a row in Exceptions and a blueprint issue. Use
the `kiso-propose` skill to write that issue.

## 4. Update docs/kiso.md

- A new screen gets a row in Pattern choices.
- A new reusable product component gets a row in Product components.
- A new CSS file gets a row in Paths.

## 5. Check it

Answer each question with yes or no. For a no, fix it or name the exception.

1. Does the screen follow every rule and state in its pattern file?
2. Does it use Kiso components and classes instead of new CSS that restates
   them?
3. Does every class used exist in `ui.css` or in the product CSS?
4. Is every color, size and radius a semantic token?
5. Does the screen render the loading, empty and error states the pattern
   asks for?
6. Does it handle a missing or null value without crashing?
7. Does it work in both themes and at 390px, without sideways scroll?
8. Can a keyboard user reach and use every control, with visible focus?
9. Do the Verify steps in `docs/kiso.md` pass, and did the screen load in the
   real app? A screenshot of a prototype is not evidence.

Report automated results apart from manual checks. Do not claim a check you
did not run.
