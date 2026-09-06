# Kiso gallery

Standalone app for `kiso.momoi-labs.dev`, built in the Blueprint workspace.
It opens an introduction to Kiso at `/`. Components are at `/#components`.
Layout tabs at `/#example` show a dashboard,
a list-detail screen, workspace settings and a login screen. Each composition
uses sample data. Preview actions do not save, authenticate or send requests.
The component navigation stays available across all layouts.

The app imports the gallery from
`kiso/blocks/react-prototype/src/gallery.tsx`. It does not import the Self Host
console or its mock data. There is one catalog and one set
of demonstrations, using the shared React components in both entry points.

## Local development

Run from the repository root with Node 24 or later:

```sh
npm ci
npm run gallery
```

Open <http://127.0.0.1:5175>. The original `npm run prototype` entry point
opens the component catalog.

## Build and verify

```sh
npm run build:gallery
npm run check:deploy --workspace=kiso-gallery
npm run preview:gallery
```

The build produces `apps/kiso-gallery/dist/`. Preview it at
<http://127.0.0.1:4175>. The deployment check validates the Cloudflare
configuration without uploading the app.

Routes use URL fragments, such as `/#components/button` and `/#example/settings`.
The selected layout is preserved in the URL, including on reload.
Only `/` needs to serve HTML; unknown asset paths return 404.

## Cloudflare publication

See [DEPLOY.md](DEPLOY.md) for the Workers Builds settings, custom domain,
production deployment and branch previews.
