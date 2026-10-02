# Kiso gallery

Standalone app for `kiso.momoi-labs.dev`, built in the Blueprint workspace.
It opens an introduction to Kiso at `/`. Components are at `/#components`.
Layout tabs at `/#example` show a dashboard,
a list-detail screen, workspace settings and a login screen. Each composition
uses sample data. Preview actions do not save, authenticate or send requests.
The component navigation stays available across all layouts.
The header links to the Kiso release notes. Its version comes from
`packages/kiso/package.json` at build time.

The app imports the gallery from
`kiso/blocks/react-prototype/src/gallery.tsx`. It does not import the Self Host
console or its mock data. There is one catalog and one set
of demonstrations, using the shared React components in both entry points.

## Appearance panel

Appearance is available on every page through the gear after the header search.
The same button opens and closes the panel. Use Appearance > Layout > Settings
toggle to choose Floating placement. Navigation on the left
and settings on the right can close independently to give the preview more room.
The gallery composes the shared AppShellPanel and AppShellPanelToggle.

Desktop keeps the preview interactive beside the panel. Small screens use a
modal Drawer with Escape dismissal and focus return. The old `/#appearance`
bookmark opens settings on Intro.

The panel uses the navigation sidebar background in Default and Inset frames.
Reset appearance stays at the top while the options scroll. Colors, Layout,
Borders, Corner style, and Corner marks remain open, separated by lines.
Compact choices keep visual samples, labels, and keyboard controls.
Table, Alert, ApplicationShell, and inline field demos append their own controls
and open the panel on arrival. Closing it retains the current demo values.
Changing pages replaces the component controls and keeps global preferences.
The catalog overview and standalone prototype keep controls beside each demo.

Border styles include Solid, None, Side rail, Dashed outline, Inset edge, Double
outline, Weighted base, and Offset outline. Corner type offers Square, Rounded,
and Asymmetric. Rounded uses one type with separate Small, Medium, and Large
sizes: panel radii are 8, 16, and 24px. Off removes all rounding. Square keeps
its existing control radii unless size is Off. Corner marks and their size stay
independent. None borders hide panel outlines, shadows, and marks while keeping
control borders and focus indicators.

Global preferences apply throughout the gallery, including layouts and dialogs.
Reset appearance restores system theme, violet, Solid borders, Square corners,
original ticks, Medium sizes, and Default visual style and application frame.
Visual style offers Default and Editorial; application frame offers Default
and Inset. Explicit component variants can override the global choices.

Preferences are local to this browser and origin. `public/appearance-init.js`
validates stored values before first paint. Theme and accent keep their
`kiso-theme` and `kiso-accent` keys; the complete selection uses
`kiso-gallery-appearance`. Unavailable storage falls back to defaults on reload.
Legacy border presets migrate to Solid plus a corner type. Subtle and Wide
migrate to Rounded with the nearest size. Published CSS retains the legacy
values. Stored `pageHeader` migrates to `visualStyle` unless already set;
Off mark sizes migrate to None with Medium size.

Use in code generates HTML and JavaScript from the current global preferences,
with copy buttons and the required CSS imports. Syntax highlighting uses
existing theme colors as a local exception to the v1 monochrome code rule.
Copied code remains plain text. Gallery panel placement is not part of the
exported appearance settings.

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
