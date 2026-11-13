# Changesets

Add a changeset for every change to published package sources (`packages/`,
`kiso/` outside `blocks/`, `tokens/`, and the crates under `crates/` that have
a `package.json`):

```sh
npm run changeset
```

Choose `patch` for compatible fixes or documentation clarifications, `minor`
for backward-compatible additions, and `major` for breaking token or contract
changes. The `changeset-check` workflow fails a pull request that touches
published sources without one.

The release workflow turns merged changesets into a "chore: release kiso" PR.
Merging that PR publishes the bumped packages to npm and tags the release.

The Rust crates `kiso-tokens`, `kiso-core` and `tui-kiso` are versioned the
same way, through a private `package.json` in each crate. The version PR copies
the new versions into `Cargo.toml` and into the crates that depend on them. On
merge, Changesets tags them and the release workflow publishes them to
crates.io. A change to `tokens/tokens.json` regenerates `kiso-tokens`, so it
needs a `kiso-tokens` entry too.
