---
"@momoi-labs/kiso": minor
---

Publish the component layer as `@momoi-labs/kiso/ui.css`

`ui.css` moves from `kiso/blocks/` to `kiso/`, so it ships with the package
instead of being copied out of the repository with `curl`. `kiso/blocks/`
stays unpublished and now links `../ui.css`, keeping the blocks illustrations
of a layer rather than the source of it. Consumers can pin contracts, tokens,
and the component layer to one version.
