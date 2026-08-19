# Changesets

Add a changeset for every user-visible Kiso change:

```sh
npm run changeset
```

Choose `patch` for compatible fixes or documentation clarifications, `minor`
for backward-compatible additions, and `major` for breaking token or contract
changes. The release workflow turns merged changesets into a version PR. A
subsequent merge of that PR publishes the package after registry publishing is
explicitly approved by manually running the release workflow with its
confirmation phrase.
