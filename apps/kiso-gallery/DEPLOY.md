# Deploy to Cloudflare Workers

The gallery uses Workers Builds and static assets, following `momoi-labs/web`.
Wrangler uploads `apps/kiso-gallery/dist/`. There is no Worker script or SSR
adapter.

## First-time setup

In Cloudflare, open **Workers & Pages**, create a Worker, and connect the Git
repository `momoi-labs/blueprint`. Use these settings:

| Setting | Value |
| --- | --- |
| Worker name | `kiso-gallery` |
| Root directory | `/` |
| Build command | `npm run build:gallery` |
| Deploy command | `npm run deploy --workspace=kiso-gallery` |
| Non-production branch deploy command | `npm run deploy:preview --workspace=kiso-gallery` |
| Production branch | `main` |
| Build environment variable | `NODE_VERSION=24` |

Keep the root directory at `/`: npm must install the repository's workspaces
and build the shared Kiso packages before building the gallery. The deploy
scripts run inside `apps/kiso-gallery`, where Wrangler reads `wrangler.jsonc`.
Do not use a bare `npx wrangler deploy` from the repository root.

The Worker name must match `name` in `wrangler.jsonc`. The configuration supplies
the assets directory; no separate output directory setting is needed.
The app needs no backend bindings or runtime secrets. Workers Builds handles
deployment authentication through the connected Cloudflare account.

Enable builds for non-production branches to get preview URLs. After saving the
settings, deploy `main` once the gallery changes have merged.

## Domain

`wrangler.jsonc` declares `kiso.momoi-labs.dev` as a custom domain. Production
`wrangler deploy` configures it in the Cloudflare account that owns the active
`momoi-labs.dev` zone. Confirm the domain becomes active under the Worker's
**Settings > Domains & Routes** before sharing the URL.

The gallery uses fragment routes such as `/#components` and `/#example/settings`.
It needs no SPA fallback or redirect rules. Unmatched asset paths return 404.

## Ongoing deployments

Pushes to `main` build and deploy the gallery. Non-production builds run
`wrangler versions upload` through the workspace script to create previews
without promoting them to production.

## Local verification

Run from the repository root:

```sh
npm ci
npm run build:gallery
npm run check:deploy --workspace=kiso-gallery
npm run preview:gallery
```

The dry-run validates the Wrangler configuration and assets without uploading.
Open <http://127.0.0.1:4175> to inspect the build. It does not verify Cloudflare
account access or domain ownership.

References: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
and [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
