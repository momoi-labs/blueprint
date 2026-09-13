## Agent skills

For design-system consumption rules, read [`kiso/AGENTS.md`](kiso/AGENTS.md).

### Issue tracker

Issues and specs for this repository live in GitHub Issues. See
`docs/agents/issue-tracker.md`.

### Triage labels

This repository uses the default triage labels. See
`docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

### Changesets

Every PR that touches published package sources (`packages/`, `kiso/` outside
`blocks/`, `tokens/`) must include a changeset. Run `npm run changeset`, pick
the bump for each affected package, and commit the file in `.changeset/`. See
`.changeset/README.md` for how to choose the bump. Merging the generated
"chore: release kiso" PR publishes to npm.

### Component PRs

When a PR adds or changes a component, attach screenshots of the result to the
PR description. Show every new variant or state; for a changed component, add a
before/after pair. Reviewers use them to see what changed without running the
gallery. Upload images as GitHub attachments and embed their URLs in the
description. Keep review screenshots and temporary prototypes out of commits.

### Commit convention

Create commits with `my-commit` (conventional commits). PR titles and commit
messages are validated by the `conventional-commits` workflow; merges use
rebase-and-merge.
