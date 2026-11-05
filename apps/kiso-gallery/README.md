# Kiso gallery

Standalone app for `kiso.momoi-labs.dev`, built in the Blueprint workspace.
It opens an introduction to Kiso at `/`. Components are at `/#components`.
Layout tabs at `/#example` show a dashboard,
a list-detail screen, workspace settings, a login screen and a printable
report. Each composition uses sample data. Preview actions do not save, authenticate or send requests.
The component navigation stays available across all layouts.
The approved Kiso lockup appears in the open desktop sidebar. When the sidebar
is closed, or on smaller screens, it appears in the header. The introduction shows
`基礎` with the smaller reading `kiso` beside it. The symbol
follows the selected accent; the wordmark follows the foreground color.
The outlined artwork comes from `docs/brand/`. The shell lockup is 24 px high.
Canvas also offers Kiso enso, a large centered symbol in the selected accent.

The header links to the Kiso release notes. Its version comes from
`packages/kiso/package.json` at build time.

The app imports the gallery from
`kiso/blocks/react-prototype/src/gallery.tsx`. It does not import the Self Host
console or its mock data. There is one catalog and one set
of demonstrations, using the shared React components in both entry points.
Usage examples stay inside each component's preview panel and use CodeBlock
with syntax colors and a copy action. Diagram options apply to Basic, Groups
and Interactive. Explicit node overrides still take precedence.
With legacy `auto` elevation, Side rail, Weighted base and Offset outline use
matching border and shadow colors in both themes, including accent and state
colors. Explicit Hard and Soft shadows remain neutral.

## Appearance panel

Appearance is available on every page through the gear after the header search.
The same button opens and closes the panel. Navigation on the left
and settings on the right can close independently to give the preview more room.
The gallery composes the shared AppShellPanel and AppShellPanelToggle.
Both desktop rails animate with the existing motion tokens. Reduced motion
and browsers without Web Animations update immediately. Repeated clicks can
interrupt a transition. Demos retain their values while the workspace resizes.

Desktop keeps the preview interactive beside the panel. Small screens use a
modal Drawer with Escape dismissal and focus return. The old `/#appearance`
bookmark opens settings on Intro.

The panel uses the navigation sidebar background in Default and Inset frames.
Reset appearance and Share stay at the top while the options scroll. The
settings sit in five tabs: Look (colors and presets), Canvas (background and
charts), Frame (main style, where to apply, and layout), Phone, and Code (Use
in code). In Frame, Where to apply and Layout start closed. Below 1024px the
tabs become sections, one open at a time.
Compact choices keep visual samples, labels, and keyboard controls.
Table, Alert, ApplicationShell, and inline field demos add their own controls
above the tabs and open the panel on arrival. Closing it retains the current demo values.
Changing pages replaces the component controls and keeps global preferences.
The catalog overview and standalone prototype keep controls beside each demo.

Border styles include Solid, None, Side rail, Dashed outline, Double outline,
Weighted base, Offset outline, Manga and Brush. Corner type offers Square,
Rounded, Asymmetric and Pixel. Rounded uses Small, Medium and Large radii of
8, 16 and 24px. Square retains the previous size for a later shape change.
Non-Square corners disable Off. The published CSS accepts every size; the
gallery normalizes Off to Small when a selected shape needs a size.

Panel shadow offers None, Hard and Soft independently of borders, corners
and marks. Side rail casts left, Weighted base casts down, and other borders,
including None, cast down and right. Shadows stay neutral and do not affect
controls. Pixel, Manga and Brush use the panel contour. Main, outer and phone
shadows can differ; Diagram has its own inherited Node shadow option.
None borders hide outlines and marks without disabling an explicit shadow.

Global preferences include layouts and dialogs. New visits and Reset use the
SNES preset: system theme, SNES accent, rounded
Large corners, a floating header, a centered contained page, Glow background,
glass panels and Soft shadows. Existing presets
use Hard or Soft, except Drafting sheet, which keeps None. Pixel everywhere
adds Hard to the starting look. Explicit component variants can override the
global choices.

Preferences are local to this browser and origin. `public/appearance-init.js`
validates stored values before first paint. Theme and accent keep their
`kiso-theme` and `kiso-accent` keys; the complete selection uses
`kiso-gallery-appearance`. Unavailable storage falls back to defaults on reload.
Legacy border presets migrate to Solid plus a corner type. Subtle and Wide
migrate to Rounded with the nearest size. Published CSS retains the legacy
values. Stored `pageHeader` migrates to `visualStyle` unless already set;
Off mark sizes migrate to None with Medium size. Storage version 3 adds
shadow settings. Earlier valid saved looks restore `auto` elevation. The
Pixel detail-to-size migration runs only before version 2, so a version 3
reload does not replace the independent corner size.

Share includes main, outer, phone and Diagram shadows in copied JSON, bare
codes and URLs. New payloads use version 2. Version 1 links retain legacy
`auto` shadows; omitted shadows in version 2 use None. Phone overrides apply
below 700px and update when the viewport crosses that breakpoint.

Use in code generates HTML and JavaScript from the current global preferences,
with copy buttons and the required CSS imports. Syntax highlighting uses
existing theme colors as a local exception to the v1 monochrome code rule.
Copied code remains plain text. Gallery panel placement is not part of the
exported appearance settings. The HTML example includes the native panel
silhouette layer; React panel components supply it automatically.

`node --test scripts/check-panel-shadows-browser.mjs` checks all 5,760 raw
border/corner/size/mark/shadow/theme tuples on Card and DiagramNode. Separate
pixel comparisons cover Pixel, Manga and Brush with solid and translucent
fills. Sharing tests round-trip the same tuples and the independent overrides.

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

Routes use URL fragments, such as `/#components/button` and `/#example/crud`.
The selected layout is preserved in the URL, including on reload.
Only `/` needs to serve HTML; unknown asset paths return 404.

## Cloudflare publication

See [DEPLOY.md](DEPLOY.md) for the Workers Builds settings, custom domain,
production deployment and branch previews.
