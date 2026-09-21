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

## Appearance study

Open `/#appearance` to choose the theme, accent, border style, corner marks,
and size presets. Corner size offers Off, Small, Medium, and Large. Mark size
offers Small, Medium, and Large. Theme and accent controls live on
this page rather than in the gallery header or sidebar. Changes apply throughout
the gallery,
including layouts and dialogs. Reset appearance restores system theme, violet,
square panels, original ticks, and Medium sizes.

Preferences are local to this browser and origin. The blocking
`public/appearance-init.js` script validates stored values before first paint.
Theme and accent retain their `kiso-theme` and `kiso-accent` keys; the complete
selection uses `kiso-gallery-appearance`. Unavailable storage falls back to the
defaults on reload.

This is an explicit gallery-only design experiment approved for validation.
`src/appearance.css` overrides the current square-panel contract locally;
the published packages and their contracts keep their existing behavior.
Panels show the full border treatment. Buttons, inputs, and navigation retain
solid contours with proportional corners. Corner marks apply only to panels.
Corner size Off removes rounding, including on controls. Choose None under
Corner marks to hide them; Mark size is disabled until a mark style is selected.
Saved Off mark sizes migrate to None with Medium size. Circular controls such
as radios keep their shape.

The Use in code section generates HTML and JavaScript from the current
selection, with copy buttons. It also shows the required CSS imports and
explains which settings still need the gallery's experimental stylesheet.

After validation, promoting these options to Kiso requires updating the shared
tokens, component contracts, and package implementations together.

Medium matches the prototype: panel radii are 0, 8, 16, 12, and 6 px for
square, subtle, wide, asymmetric, and rail styles; other styles use 8 px.
Small uses half the radius and Large uses 1.5 times the radius. Square keeps
its existing control radii. Mark length/gap presets are 2/1, 4/2, and 8/4 px.

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
node --test apps/kiso-gallery/tests/*.test.mjs
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
