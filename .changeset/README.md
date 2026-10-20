# Changesets

Add a changeset for every change to published package sources (`packages/`,
`kiso/` outside `blocks/`, `tokens/`, and `crates/`):

```sh
npm run changeset
```

Choose `patch` for compatible fixes or documentation clarifications, `minor`
for backward-compatible additions, and `major` for breaking token or contract
changes. The `changeset-check` workflow fails a pull request that touches
published sources without one.

The release workflow turns merged changesets into a "chore: release kiso" PR.
Merging that PR publishes the bumped packages to npm and tags the release.

The `kiso-tokens` Rust crate is versioned the same way, through its private
`crates/kiso-tokens/package.json`. The version PR copies the new version into
`Cargo.toml`. On merge, Changesets tags it and the release workflow publishes
it to crates.io. A change to `tokens/tokens.json` regenerates the crate, so it
needs a `kiso-tokens` entry too.
