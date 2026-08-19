---
status: accepted
date: 2026-08-19
supersedes: []
superseded_by: null
tags: [kiso, packaging, releases]
---

# Publish Kiso as a versioned npm package

Kiso consumers need an explicit, reviewable version boundary instead of copying generated artifacts from Blueprint. We will publish the public `@momoi-labs/kiso` package from this repository to npm, use Changesets to select SemVer increments and maintain release PRs, and use a manually dispatched GitHub Actions job with npm trusted publishing to publish provenance-bearing releases after the package and publisher are configured. The package contains both the generated token artifacts and Kiso's Markdown contracts so code and agent consumers can pin the same system definition.

## Considered options

- **Git references or copied files.** Rejected because they provide a weaker upgrade boundary and make artifact provenance and release history harder to inspect.
- **GitHub Packages.** Rejected because it requires registry configuration and authentication for consumers even though Kiso is intended to be public.
- **release-please or semantic-release.** Rejected because conventional commit history alone cannot reliably express whether a design-token or contract change is breaking; Changesets makes that choice explicit in the change that introduces it.

## Consequences

- Compatible fixes and clarifications use patch releases, backward-compatible additions use minor releases, and breaking token or contract changes use major releases.
- A pull request that changes the published surface must include a changeset; release PRs consume those changesets and update the package version and changelog.
- Publishing requires a maintainer to manually dispatch the protected `npm` environment with an explicit confirmation phrase; the first release additionally requires the `@momoi-labs` npm organization to grant publish access for `@momoi-labs/kiso` and configure this workflow as its trusted publisher.
