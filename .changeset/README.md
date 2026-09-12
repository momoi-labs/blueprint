# Changesets

Add a changeset for every change to published package sources (`packages/`,
`kiso/` outside `blocks/`, and `tokens/`):

```sh
npm run changeset
```

Choose `patch` for compatible fixes or documentation clarifications, `minor`
for backward-compatible additions, and `major` for breaking token or contract
changes. The `changeset-check` workflow fails a pull request that touches
published sources without one.

The release workflow turns merged changesets into a "chore: release kiso" PR.
Merging that PR publishes the bumped packages to npm and tags the release.
