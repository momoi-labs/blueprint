# Theme generator: inventory of settings, share format and project configs

Research for a "Theme generator" section in the Kiso gallery. It covers what
exists today. The proposal is in
[ADR 0003](../adr/0003-theme-generator-config-format.md).

Facts were read on 2026-11-23 from this branch and from the delivery projects
in `~/Work/github.com/momoi-labs/` (read only, at the commits listed in
section 5). Paths without a repo prefix are in this repository.

## Summary

- `AppearanceSettings` has 44 fields: 38 map to a `data-*` attribute on
  `<html>`, 6 are phone overrides with no attribute of their own
  (`apps/kiso-gallery/src/appearance-settings.ts:9-54`).
- The share format (`{ v: 2, s: {...} }`) carries all 44 fields and the
  options of 11 demos. It cannot carry anything a project has that the gallery
  does not model (see section 6).
- No project uses an attribute the gallery does not know. Every project value
  is a valid gallery value. Only `self-host` sets all 38 attributes. The other
  web projects set 0 to 32, so a missing attribute is the common case and must
  not turn into a gallery default on import.
- Two settings do nothing in a project: `headerWidth` and `landingBands`. Their
  CSS is in gallery-only files that the npm package does not ship (section 3).
- The TUI can express: accent (13 of 14), light or dark, panel fill, a rail
  border, round ends, and the title and rule strokes. It also has
  `PageWidth`, `PageAlign` and a chart legend (table, inline, hidden). It
  cannot express any other setting (section 7). The gallery's TUI page follows only accent and
  theme (`apps/kiso-gallery/src/tui-gallery.tsx:104-107`).

## 1. Field inventory

### How the gallery applies a field

- `apps/kiso-gallery/public/appearance-init.js` runs before first paint. It
  holds the allowed values (`:3-45`), the defaults (`:47-50`), validation
  (`:54-82`), and the write to `document.documentElement.dataset` (`:107-118`).
- The attribute name is the field name in kebab case: `cornerSize` becomes
  `data-corner-size`. `theme` is the exception in behavior: the value
  `system` removes `data-theme` (`:114`).
- A phone override replaces its main field below 700px wide (`:46`, `:110`).
  Phone fields have no attribute.
- `appearance-settings.ts:3-53` repeats the same values as TypeScript types.
  Two lists must stay equal. `apps/kiso-gallery/tests/appearance-export-completeness.test.mjs:14-16`
  checks that `defaults` and `options` have the same keys. It does not compare
  the TypeScript types with `options`.
- Legacy values are accepted by `options` but hidden in the UI:
  `shadowStyle=auto`, `borderStyle=bevel`, `cornerMarks=dots`,
  `cornerSize=off` (`appearance-init.js:13-17`, `appearance.tsx:133-134`).
- "Gallery default" below is `defaults` in `appearance-init.js:50`. Fields it
  does not list use the first allowed value (`:47`): `neutral`, `primary`,
  `typeface`, `brandBar`.
- "Group" is the section in `apps/kiso-gallery/src/appearance.tsx` that shows
  the field, with the tab from `gallery-settings.tsx:12-19`.
- "Class" is appearance (A), page structure (S), or unclear (?). Reasons for
  "?" are in section 2.

### Fields

| Field | Type or allowed values | Gallery default | Applied where | Group (tab) | Class |
|---|---|---|---|---|---|
| `theme` | `system`, `light`, `dark` (`appearance-init.js:4`) | `system` | `data-theme`, `tokens/build/tokens.css:395,399`. Removed for `system`. | colors (Look) | A |
| `accent` | 14: violet terracotta teal cobalt nocturne tangerine red gold lime plum stone steel snes pine (`:5`) | `snes` | `data-accent`, per-accent blocks from `tokens/build/tokens.css` (the first is `kiso/ui.css:403`). Also `packages/kiso-react/src/accent-selector.tsx`. | colors (Look) | A |
| `neutral` | `warm`, `zinc` | `warm` | `data-neutral="zinc"`, `tokens/build/tokens.css:805` | colors (Look) | A |
| `primary` | `accent`, `contrast` | `accent` | `data-primary="contrast"`, `tokens/build/tokens.css:834` | colors (Look) | A |
| `typeface` | `inter`, `dm-sans` | `inter` | `data-typeface="dm-sans"`, `tokens/build/tokens.css:840` | colors (Look) | A |
| `visualStyle` | `default`, `editorial` | `default` | `kiso/ui.css:40,52` (type scale, page padding, gaps) | colors (Look) | ? |
| `chartLine` | `straight`, `stepped`, `curved` | `straight` | `kiso/ui.css:3599` | charts (Canvas) | A |
| `chartFill` | `none`, `dots`, `tint`, `squares`, `scanlines` | `none` | `kiso/ui.css:3603` | charts (Canvas) | A |
| `chartLayout` | `standard`, `compact`, `split` | `standard` | `kiso/ui.css:3609` | charts (Canvas) | ? |
| `chartLegend` | `table`, `inline`, `sidebar` | `table` | `kiso/ui.css:3612` | charts (Canvas) | ? |
| `borderStyle` | `solid none rail dash bevel double base offset manga brush` | `solid` | `kiso/ui.css:2319` | panels (Frame) | A |
| `shadowStyle` | `none hard soft auto` | `soft` | `kiso/ui.css:2483-2492` | panels (Frame) | A |
| `cornerStyle` | `square rounded asym pixel` | `rounded` | `kiso/ui.css:2417,2425` | panels (Frame) | A |
| `cornerSize` | `off small medium large` | `large` | `kiso/ui.css:2315-2316` | panels (Frame) | A |
| `frameDetail` | `small medium large` | `medium` | `kiso/ui.css:2751` | panels (Frame), shown only for manga or brush borders (`appearance.tsx:237`) | A |
| `panelFill` | `solid translucent glass` | `glass` | `kiso/ui.css:4100,4106` | panels (Frame) | A |
| `cornerMarks` | `none ticks brackets arcs dots diagonal` | `none` | `kiso/ui.css:2594,2610` | marks (Frame) | A |
| `markSize` | `small medium large` | `medium` | `kiso/ui.css:2591-2592` | marks (Frame) | A |
| `markClearance` | `normal`, `sheet` | `normal` | `kiso/ui.css:2708,2711` | marks (Frame) | ? |
| `frameScope` | `all`, `panels`, `outer` | `all` | `kiso/ui.css`, `packages/kiso-react/src/styles.css:402` | scope (Frame) | A |
| `markScope` | `panels`, `all`, `outer` | `panels` | `kiso/ui.css:2289,3035` | scope (Frame) | A |
| `outerShadowStyle` | `inherit` + shadow values | `none` | `kiso/ui.css:2484,2492`, inset shell only | outer (Frame) | ? |
| `outerBorderStyle` | `inherit` + border values | `none` | `kiso/ui.css:1487`, inset shell only | outer (Frame) | ? |
| `outerCornerStyle` | `inherit` + corner values | `square` | `kiso/ui.css:2418-2419`, inset shell only | outer (Frame) | ? |
| `outerCornerMarks` | `inherit` + mark values | `none` | `kiso/ui.css:2595,2611`, inset shell only | outer (Frame) | ? |
| `backgroundStyle` | 14: solid dots grid crosses construction guides fibers momoi momoi-repeat enso checker glow stripes rings | `glow` | `kiso/ui.css:3912` and the blocks after it | background (Canvas) | A |
| `backgroundStrength` | `quiet`, `visible` | `quiet` | `kiso/ui.css:3908-3909` | background (Canvas) | A |
| `backgroundPlacement` | `both inside outside` | `both` | `kiso/ui.css:4512` | background (Canvas) | ? |
| `paperTone` | `theme`, `accent` | `theme` | `kiso/ui.css:3939,3943` | background (Canvas) | A |
| `appShell` | `default`, `inset` | `inset` | `kiso/ui.css:1399,1505`, `packages/kiso-react/src/app-shell.tsx` | shell (Layout) | S |
| `appShellOuter` | `auto full compact none` | `full` | `kiso/ui.css:1400-1402` | shell (Layout) | ? |
| `brandBar` | `separate`, `full` | `separate` | `kiso/ui.css:1505-1506` | shell (Layout) | S |
| `landingBands` | `inside`, `full` | `full` | `apps/kiso-gallery/src/landing.css:72` only | shell (Layout) | ? |
| `headerVariant` | `default plain floating` | `floating` | `kiso/ui.css:4676-4678` | header (Layout) | S |
| `headerSize` | `default compact editorial` | `default` | `kiso/ui.css:5221-5222`, `packages/kiso-react/src/app-shell.tsx` | header (Layout) | S |
| `headerWidth` | `page`, `outset` | `page` | `kiso/blocks/react-prototype/src/gallery.css:512-513` only | header (Layout) | ? |
| `pageWidth` | `full`, `contained` | `contained` | `kiso/ui.css:1820` | page (Layout) | S |
| `pageAlign` | `start center end` | `center` | `kiso/ui.css:1822` | page (Layout) | S |
| `phoneShadowStyle` | `inherit` + shadow values | `inherit` | replaces `shadowStyle` below 700px | phone (Phone) | A |
| `phoneBackgroundStyle` | `inherit` + background values | `inherit` | replaces `backgroundStyle` | phone (Phone) | A |
| `phoneBorderStyle` | `inherit` + border values | `inherit` | replaces `borderStyle` | phone (Phone) | A |
| `phoneCornerStyle` | `inherit` + corner values | `inherit` | replaces `cornerStyle` | phone (Phone) | A |
| `phoneCornerMarks` | `inherit` + mark values | `inherit` | replaces `cornerMarks` | phone (Phone) | A |
| `phonePanelFill` | `inherit` + fill values | `inherit` | replaces `panelFill` | phone (Phone) | A |

Notes on the table:

- Rules also exist where a field combines with another. The UI blocks some
  pairs but keeps the saved value (`appearance.tsx:135-137`, `:270`):
  `arcs` marks do not pair with `pixel`, `manga` or `brush`; `brackets` marks do
  not pair with `brush`; `pixel` corners need `solid`, `none`, `manga` or
  `brush` borders; `cornerSize=off` is reset when a non-square corner is used
  (`appearance-init.js:80`).
- `randomAppearance` (`appearance-settings.ts:91-121`) skips `theme`,
  `neutral`, `primary`, `typeface`, the header, page and shell-outer fields,
  and all phone fields.
- The page-structure fields `appShell` and `pageWidth` also have gallery-only
  rules (`kiso/blocks/react-prototype/src/gallery.css:631-632,723`). The
  shipped rules are in `kiso/ui.css`.

## 2. Appearance or page structure

Rule used: a field is **appearance** when it changes how a surface is painted
without moving it (color, type, border, corner, shadow, chart paint, canvas
background). It is **page structure** when it changes where regions go or how
big they are (shell, header, page width).

- **Appearance (26 fields):** `theme`, `accent`, `neutral`, `primary`,
  `typeface`, `chartLine`, `chartFill`, `borderStyle`, `shadowStyle`,
  `cornerStyle`, `cornerSize`, `frameDetail`, `panelFill`, `cornerMarks`,
  `markSize`, `frameScope`, `markScope`, `backgroundStyle`,
  `backgroundStrength`, `paperTone`, and the 6 `phone*` fields (phone fields
  are appearance overrides, valid only under 700px).
- **Page structure (6 fields):** `appShell`, `brandBar`, `headerVariant`,
  `headerSize`, `pageWidth`, `pageAlign`.
- **Unclear (12 fields):**

| Field | Why unclear |
|---|---|
| `visualStyle` | `editorial` changes the type scale, page padding and section gaps (`kiso/ui.css:40-62`). That is typography and density, and it moves content. |
| `chartLayout`, `chartLegend` | They change where a chart's legend sits (`standard/compact/split`, `table/inline/sidebar`). That is the structure of one component, not paint. |
| `markClearance` | `sheet` adds clearance around marks (`kiso/ui.css:2711`). It is geometry, but it only serves the mark paint. |
| `outerShadowStyle`, `outerBorderStyle`, `outerCornerStyle`, `outerCornerMarks` | They paint the outer frame, so they are appearance. They apply only when `appShell=inset` (`kiso/ui.css:1487`, `:2418`). They depend on a structure field. |
| `backgroundPlacement` | Paint, but it is relative to the frame: `inside` and `outside` mean inside or outside the inset shell (`kiso/ui.css:4512`). |
| `appShellOuter` | It sets the margin around the inset frame (`kiso/ui.css:1400-1402`), so it is structure. The value `none` also removes the outer border (`kiso/ui.css:1487`), so it changes paint. |
| `landingBands` | Structure, but only for the gallery landing (`apps/kiso-gallery/src/landing.css:72`). No project has it, and the shipped CSS ignores it. |
| `headerWidth` | Structure, but its CSS is only in the gallery prototype (`gallery.css:512-513`), so it does nothing in a project. |

The generator edits both appearance and page structure, so the split is for
the export format, not for hiding fields. See the ADR.

## 3. What ships to projects

`@momoi-labs/kiso` publishes `kiso/` without `kiso/blocks/` and
`tokens/build/` (`packages/kiso/package.json:12-16`). Its exports are
`tokens.css` and `ui.css` (`:17-19`). Current versions: `@momoi-labs/kiso`
1.13.0 (`packages/kiso/package.json:3`), `@momoi-labs/kiso-react` 0.36.0
(`packages/kiso-react/package.json:3`).

Consequences:

- `data-header-width` appears only in `kiso/blocks/react-prototype/src/gallery.css`
  and `data-landing-bands` only in `apps/kiso-gallery/src/landing.css`. A
  project never gets those rules. `self-host` sets both attributes anyway
  (`self-host/console/index.html`), so they are dead values there.
- The generator does not export these two fields and marks them gallery-only
  (ADR 0003, Decisions).

## 4. Presets

Defined in one place: `compositions` in
`apps/kiso-gallery/src/appearance.tsx:39-51`. There are 11, plus a "Random"
button (`:182`, using `randomAppearance`).

How a preset becomes a value (`appearance.tsx:173`): start from
`window.kisoAppearance.presetDefaults`, keep the current `theme`, set
`cornerStyle=square`, `cornerSize=medium`, `backgroundStyle=solid`,
`visualStyle=default`, `appShell=inset`, `frameScope=panels`, then apply the
preset's own values. `presetDefaults` is the first allowed value of every
field (`appearance-init.js:47`), with `cornerStyle=pixel`, `cornerSize=small`,
`appShell=inset`, `backgroundStyle=fibers`, `visualStyle=editorial` set after
(`:48`). The base after both steps is:

`accent=violet neutral=warm primary=accent typeface=inter chartLine=straight chartFill=none chartLayout=standard chartLegend=table shadowStyle=none borderStyle=solid cornerStyle=square cornerMarks=ticks cornerSize=medium markSize=medium visualStyle=default appShell=inset headerVariant=default headerSize=default headerWidth=page appShellOuter=auto brandBar=separate pageWidth=full pageAlign=start frameScope=panels markScope=panels markClearance=normal backgroundStyle=solid backgroundStrength=quiet backgroundPlacement=both frameDetail=medium paperTone=theme panelFill=solid landingBands=inside outer*=inherit phone*=inherit`

The table lists only what each preset sets on top of that base
(`appearance.tsx:40-50`). A preset is pressed when every field equals the
resolved value (`:174`).

| Preset | Values set on the base |
|---|---|
| Default | `shadowStyle=soft theme=system appShell=default` |
| Blueprint | `shadowStyle=hard accent=cobalt paperTone=accent backgroundStyle=guides backgroundPlacement=inside outerBorderStyle=double` |
| Drawing plate | `shadowStyle=hard accent=terracotta backgroundStyle=fibers outerBorderStyle=double cornerMarks=none outerCornerMarks=ticks markScope=outer` |
| Drafting sheet | `shadowStyle=none backgroundStyle=dots cornerMarks=none outerCornerMarks=ticks markScope=outer` |
| Pixel workshop | `shadowStyle=hard backgroundStyle=dots outerCornerStyle=pixel cornerMarks=none outerCornerMarks=brackets markScope=outer` |
| Manga board | `shadowStyle=hard backgroundStyle=grid phoneBackgroundStyle=dots outerBorderStyle=manga cornerMarks=none outerCornerMarks=diagonal markScope=outer` |
| Brush study | `shadowStyle=soft backgroundStyle=fibers outerBorderStyle=brush cornerMarks=none frameScope=outer markScope=outer` |
| Momoi signature | complete set: `theme=light accent=violet neutral=warm primary=accent typeface=inter` charts `straight/none/standard/table`, `shadowStyle=soft borderStyle=solid cornerStyle=asym cornerMarks=none cornerSize=medium markSize=medium visualStyle=default appShell=inset headerVariant=default headerSize=default headerWidth=page appShellOuter=full brandBar=full pageWidth=contained pageAlign=center frameScope=panels markScope=outer markClearance=normal backgroundStyle=momoi-repeat backgroundStrength=quiet backgroundPlacement=both frameDetail=medium paperTone=theme panelFill=translucent landingBands=inside`, `outerCornerStyle=asym`, other outer and phone `inherit` (`appearance.tsx:47`) |
| SNES | complete set: `theme=system accent=snes` charts `straight/none/standard/table`, `shadowStyle=soft borderStyle=solid cornerStyle=rounded cornerMarks=none cornerSize=large markSize=medium visualStyle=default appShell=inset headerVariant=floating headerSize=default headerWidth=page appShellOuter=full pageWidth=contained pageAlign=center frameScope=all markScope=panels markClearance=normal backgroundStyle=glow backgroundStrength=quiet backgroundPlacement=both frameDetail=medium paperTone=theme panelFill=glass landingBands=full outerBorderStyle=none outerCornerStyle=square outerCornerMarks=none outerShadowStyle=none`, phone `inherit` (`:48`). It equals the gallery default. |
| pg-probe | `theme=dark accent=gold neutral=zinc primary=contrast typeface=dm-sans shadowStyle=none borderStyle=solid cornerStyle=rounded cornerSize=small cornerMarks=none visualStyle=default appShell=default headerVariant=default pageWidth=contained pageAlign=center frameScope=all markScope=panels backgroundStyle=solid panelFill=solid paperTone=theme` (`:49`) |
| Pixel everywhere | `shadowStyle=hard theme=system cornerStyle=pixel cornerSize=small backgroundStyle=fibers visualStyle=editorial frameScope=all markScope=panels` |

Findings:

- The "pg-probe" preset does **not** match the pg-probe project's
  `web/index.html` (section 5). The project sets `chartFill=dots`,
  `backgroundStyle=dots`, `appShellOuter=auto`, `markSize`... and no `neutral`,
  `primary`, `typeface`, or `theme`. The preset sets `neutral=zinc`,
  `primary=contrast`, `typeface=dm-sans`, `theme=dark`,
  `backgroundStyle=solid`, `pageWidth=contained`. The preset is not a copy of
  the project.
- Five presets (Default, Momoi signature, SNES, pg-probe, Pixel everywhere)
  set `theme`. Others keep the current theme.
- No preset sets a chart field except Momoi signature and SNES, and both set
  the same values as the base.
- No TUI preset exists today (section 7).

## 5. Share format today

Source: `apps/kiso-gallery/src/appearance-share.ts`, UI in
`appearance-share-ui.tsx`.

- **Shape** (`appearance-share.ts:11-16,48-50`): JSON
  `{ "v": 2, "s": { <every AppearanceSettings field> }, "<demo>": { "<prop>": "<value>" } }`.
  `s` is a flat object of strings. Each demo key holds that demo's component
  props.
- **shareCode** (`:52-54`): the JSON as UTF-8, base64url, no padding.
- **shareLink** (`:56-61`): current URL with the query replaced by
  `?appearance=<shareCode>`. The hash is kept for the gallery route (`:14`).
- **settingsText** (`:48-50`): the same JSON, uncompressed. "Copy settings"
  uses it (`appearance-share-ui.tsx:72`). It carries every field so it does not
  depend on the receiver's defaults (`:46-47`).
- **readShare** (`:64-114`): accepts a link, a bare code, or JSON.
  - A key that is not in `options` is skipped as "unknown setting" (`:94`). A
    value not in the allowed list is skipped as "invalid value" (`:95`).
  - Missing keys take the receiver's `defaults` (`:83`), except
    `shadowStyle`, which is `auto` for `v=1` and `none` otherwise.
  - A wrong `v` is only noted in `skipped` (`:82`).
  - Old `chartStyle` is split into `chartLine` and `chartFill` (`:4-9,85-91`).
  - Demo scopes are checked against `demoSchema`: alert, applicationShell,
    diagram, inlineFields, paneGrid, scopeSwitcher, table, toast, siteSection,
    siteHeader, siteHeading (`appearance-share-ui.tsx:15-20`).
  - The result is `{ settings, demos, skipped, error? }`.
- **Also exported:** `appearanceCode` (`appearance-settings.ts:69-89`) builds an
  HTML snippet with the `data-*` attributes and a JavaScript version when
  phone overrides exist. It omits `data-theme` for `system` and writes no phone
  fields to HTML (`:84`). That is the only existing path to a project's
  `index.html`, and it is one way.
- **Coverage test:** `apps/kiso-gallery/tests/appearance-export-completeness.test.mjs`
  checks that every value of every field survives the JSON, code, link, HTML
  and JavaScript exports.

Can it carry every field? **Yes for the 44 fields.** It cannot carry:

- A field that is absent. `s` has no "unset". On read, a missing key takes the
  receiver's default, so "this project did not set `shadowStyle`" cannot be
  told from "set to the default". Project configs have this case a lot
  (section 6).
- Rust or TUI settings. There is no key for them.
- Anything beyond `AppearanceSettings` and the 11 demos: a project's own CSS
  variable overrides, the list of attributes a project sets, or the project
  name.
- A reference to the source (which project, which commit).

The format is also not verified for a path back to a project: nothing reads an
`index.html`, a `look` object or a Cargo file. Export to `data-*` exists
(`appearanceCode`). Import from a project does not.

## 6. Project configs today

Web projects keep the look as `data-*` attributes on `<html>`. Counts are
attributes set, out of the 38 the gallery can write.

| Project | Where | Attributes | Commit | `@momoi-labs/kiso` / `kiso-react` |
|---|---|---|---|---|
| interview-kit | `web/src/routes/__root.tsx:19-50`, object `look`, spread on `<html>` at `:80-84` | 32 | `9b4a42e` 2026-11-09 | 1.6.0 / 0.28.0 (`web/package.json:12-13`) |
| pgconfig | `web/index.html:3-10` | 8 | `c060b77` 2026-10-03 | none / ^0.11.0 (`web/package.json:15`) |
| pg-probe | `web/index.html:4-25`; demo copy `site/public/demo/console/index.html:3` | 22; demo 23 | `68ce781` 2026-11-13 | ^1.0.0 / ^0.22.0 (`web/package.json:12-13`) |
| pg-probe-private | `web/index.html:4-25`; demo copy `site/public/demo/console/index.html:3` | 22; demo 23 | `f2b699e` 2026-10-25 | ^1.0.0 / ^0.22.0 |
| pg-probe-report-title | `web/index.html:4-25` | 22 | `ed07886` 2026-10-24 | ^1.0.0 / ^0.22.0 |
| pg-yard | `web/index.html:4-28` | 25 | `c890df2` 2026-10-31 | ^1.2.0 / ^0.23.0 (`web/package.json:14-15`) |
| quiet-inbox | `index.html:3-22` | 20 | `d228ce2` 2026-10-03 | none / 0.11.0 exact (`package.json:15`) |
| self-host | `console/index.html:3-40`, `login.html`, `setup.html` | 38 | `f7c788f` 2026-11-22 | ^1.12.1 / ^0.35.0 (`console/package.json:13-14`) |
| simulators | `src/layouts/Base.astro:10-16` | 22 | `f5f07cc` 2026-10-30 | ^1.1.0 / ^0.23.0 (`package.json:13-14`) |
| startup-kf-diagnostic | none. `app/index.html` has no `data-*`. It imports `@momoi-labs/kiso/tokens.css` only (`app/src/index.css:7`). | 0 | `24821fa` 2026-11-04 | ^1.5.1 / none (`app/package.json:13`) |
| template-web-app | none. `web/index.html:2` is `<html lang="en">`. | 0 | `0a8304a` 2026-10-26 | ^1.0.0 / ^0.22.0 (`web/package.json:14-15`) |

Values per project (attribute name without `data-`; only the fields the
project sets):

| Project | Values |
|---|---|
| pgconfig | `accent=cobalt border-style=solid corner-style=square corner-marks=none corner-size=off mark-size=large visual-style=default app-shell=default` |
| pg-probe, pg-probe-private, pg-probe-report-title (identical) | `accent=gold chart-line=straight chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=dots background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid`. The `site/public/demo/console/index.html` copies add `theme=dark`. |
| pg-yard | `accent=nocturne chart-line=stepped chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=square corner-marks=brackets corner-size=medium mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=all mark-scope=panels mark-clearance=sheet background-style=guides background-strength=visible background-placement=both frame-detail=large paper-tone=theme panel-fill=solid outer-border-style=double outer-corner-style=rounded outer-corner-marks=brackets` |
| quiet-inbox | `accent=teal border-style=solid corner-style=rounded corner-marks=arcs corner-size=medium mark-size=small visual-style=default app-shell=inset frame-scope=all mark-scope=panels mark-clearance=normal background-style=momoi background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=ticks` |
| self-host | `theme=light accent=tangerine neutral=warm primary=accent typeface=inter chart-line=straight chart-fill=none chart-layout=standard chart-legend=table shadow-style=none border-style=solid corner-style=pixel corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=inset header-variant=default header-size=default header-width=page app-shell-outer=auto brand-bar=full page-width=full page-align=start frame-scope=all mark-scope=panels mark-clearance=normal background-style=construction background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid landing-bands=inside outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=inherit outer-shadow-style=hard`. `login.html` and `setup.html` set `header-variant=floating`, otherwise the same. |
| simulators | `accent=cobalt chart-line=straight chart-fill=none chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=momoi-repeat background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent` |
| interview-kit | `accent=plum chart-line=straight chart-fill=tint chart-layout=standard chart-legend=inline shadow-style=soft border-style=double corner-style=rounded corner-marks=none corner-size=medium mark-size=medium visual-style=default app-shell=inset header-variant=default header-size=default header-width=page app-shell-outer=auto page-width=contained page-align=center frame-scope=all mark-scope=outer mark-clearance=normal background-style=crosses background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=inherit outer-shadow-style=inherit`. The comment at `__root.tsx:17-18` says "picked in kiso's configurator. The theme stays the reader's choice." |

### Runtime overrides

Searched in each repo with `git grep` for `dataset.<field>`,
`setAttribute("data-...")`, `kiso-theme`, `kiso-accent`,
`kiso-gallery-appearance`, and for custom property overrides of
`--color-*`, `--radius*`, `--font-*`, `--spacing*` in CSS.

- **Theme only (every web project):** a script or module sets or removes
  `data-theme` from a stored choice. Keys: `kiso-theme` in pg-yard
  (`web/public/theme.js:4`, `web/src/components/theme.ts:3`), self-host
  (`console/index.html:54`, `console/src/lib/theme.ts:3`), simulators
  (`src/layouts/Base.astro:23`, `src/simulators/pg-ha/App.jsx:203`) and
  template-web-app (`web/public/theme.js:4`). pgconfig uses the key `theme`
  (`web/index.html:22`, `web/src/lib/theme.ts:27-28`). quiet-inbox sets it in
  `index.html:30` and `src/main.tsx:25-26`. interview-kit renders it from a
  store (`__root.tsx:82`). startup-kf-diagnostic: `app/src/App.tsx:27-28`.
- **Accent override, one case:** pg-yard `web/src/admin/AdminAccent.tsx:12-16`
  sets `data-accent=red` while the admin page is open and restores the
  previous value after. A static `index.html` export cannot show this.
- **Other fields:** no project changes any other attribute at runtime. None
  uses `kiso-accent` or `kiso-gallery-appearance`.
- **CSS variable overrides (not in `AppearanceSettings`):**
  - interview-kit `web/src/app.css:5-6` sets `--font-heading` and
    `--font-body` to Plus Jakarta Sans. `:48` sets `--color-muted-foreground`
    on `.guide, .live, .page`. The font override has no equivalent: `typeface`
    allows only `inter` and `dm-sans`.
  - self-host `console/src/console.css:96` sets `--color-chart-1` and
    `--color-chart-2` on `.network-chart`. No gallery field covers chart colors.
  - startup-kf-diagnostic `design/kiso-tokens.base.css` is a design-mock copy
    of the tokens, not used by `app/`. Its `app/src/index.css:68` defines
    `--border-strong`.
  - Search was `git grep` for `--color-`, `--font-`, `--radius-`,
    `--spacing-`, `--shadow-`, `--border-`, `--chart-` declarations in `*.css`.
    It is not proven exhaustive: a declaration in a TSX style block or an
    `@theme` block may be missed.
  - These overrides cannot be imported or exported with the data-* attributes.
    A round trip keeps them only if the generator leaves the CSS alone.
- **Static-in-HTML versus JS object:** interview-kit is the only project that
  keeps the look in a JS object (`look`), not in `index.html`. An importer
  that reads only `<html>` attributes misses it. The ADR names this.

### Mapping to `AppearanceSettings`

- **1:1 by name:** yes. Every attribute in every project is `data-` plus the
  kebab-case of a gallery field, and every value is in the gallery's allowed
  list. No project uses an attribute the gallery does not know. (Compared by
  text against `appearance-init.js:3-45`.)
- **Gallery fields with no project equivalent:**
  - The 6 `phone*` fields. No project has them, because phone overrides need
    the JavaScript export (`appearance-settings.ts:84-87`).
  - `landingBands` is set only by self-host, and does nothing there.
  - `neutral`, `primary`, `typeface` are set only by self-host.
  - `theme` is set in HTML only by self-host and the pg-probe demo copies.
    Everywhere else it is a runtime choice.
  - `brandBar`, `headerVariant`, `headerSize`, `headerWidth`, `pageWidth`,
    `pageAlign` are set only by self-host and interview-kit (not `brandBar`).
- **Project attributes with no gallery field:** none today.
- **Absent versus default:** a project that omits an attribute gets Kiso's own
  CSS fallback, not the gallery default. Examples: gallery default
  `cornerSize=large` and `shadowStyle=soft`, while an absent
  `data-shadow-style` means legacy `auto` (`kiso/ui.css:2483`), and
  `corner-size` has no fallback in pgconfig only because it sets `off`.
  Import must keep "absent" as a distinct state.
- **A project's value can differ from "the same preset":** `quiet-inbox`
  and `interview-kit` set `outer-*=inherit`, which equals "not set" for the
  gallery but is a written attribute in the project.
- **Static versus gallery default for `theme`:** the gallery default is
  `system`, which removes the attribute. A project with `data-theme` in
  HTML (self-host) forces a theme until the stored choice overrides it.
- **Projects that do not use data-\* at all:** template-web-app and
  startup-kf-diagnostic use Kiso defaults. Their config is "empty".
  pg-yard, pgconfig, quiet-inbox pin older kiso-react (0.11 to 0.23). The
  attribute set an old release understands may be smaller than today's.
  Not checked per release.

### Rust projects (pg-probe family)

| Project | `tui-kiso` | `kiso-tokens` | Where used |
|---|---|---|---|
| pg-probe | `0.1.0` from crates.io (`Cargo.toml:32`; lock: `tui-kiso 0.1.0`) | `0.5.0` from crates.io (`Cargo.toml:33`; lock: `0.5.0`) | `src/top.rs:611-617`: `Theme::new(kiso_tokens::GOLD_DARK).with_look(Look { fill: PanelFill::Translucent, border: Border::None, round: false, ..Look::DEFAULT })` |
| pg-probe-private | git `momoi-labs/blueprint` rev `49350a4f960501f3e4b2c86936586a295c9b7964` (`Cargo.toml:31`) | same rev (`:32`) | `src/top.rs:540`: `Theme::new(kiso_tokens::GOLD_DARK)` with the default `Look` |
| pg-probe-report-title | same rev as private (`Cargo.toml:31-32`) | same rev | `src/top.rs:540`, same as private |

- At that rev, this repository has `tui-kiso` 0.1.0 and `kiso-tokens` 0.2.0
  (`git show 49350a4f:crates/*/Cargo.toml`, matches each project's
  `Cargo.lock:1228-1229,2930-2931`). Current here: `tui-kiso` 0.2.0
  (`crates/tui-kiso/Cargo.toml:3`), `kiso-tokens` 0.7.0
  (`crates/kiso-tokens/Cargo.toml:3`).
- All three use one accent and one mode: `GOLD_DARK`. The web part of the same
  projects sets `accent=gold` and follows the system theme, so the TUI is
  always dark while the web can be light.
- pg-probe sets `PanelFill::Translucent` in the TUI while its web sets
  `panel-fill=solid`. The Rust and the web sides already differ today.
- The TUI reads `COLORTERM` for 24-bit versus xterm-256
  (`crates/tui-kiso/src/theme.rs:30-34`). That is a runtime capability, not a
  theme setting.
- pg-yard, self-host and template-web-app have Rust workspaces. Their
  `Cargo.toml` files have no `tui-kiso` or `kiso-tokens` dependency (`rg`
  over `Cargo.toml` in each repo found none).
- Neither pg-probe nor the other two keep a Kiso theme file for Rust. The
  theme is a code constant.

## 7. How tokens reach Rust, and what the TUI can express

### Path

1. `tokens/tokens.json` is the source.
2. `style-dictionary.config.mjs:215-263` has a `rust/kiso-themes` format. The
   build (`npm run build`) writes `crates/kiso-tokens/src/tokens.rs`
   (`:301-304`). The file is generated and must not be edited
   (`crates/kiso-tokens/README.md`).
3. `crates/kiso-tokens/src/lib.rs:15-17` is `#![no_std]`, defines
   `Rgb = [u8; 3]`, and includes `tokens.rs`. `tokens.rs` has the `Theme`
   struct (opaque roles only; roles with alpha are left out, per the README),
   `LIGHT`, `DARK`, and a `{ACCENT}_{LIGHT|DARK}` constant for each accent
   (for example `GOLD_DARK`, `tokens.rs:1944` for `SNES_DARK`). 30
   constants in total.
4. `crates/tui-kiso/src/accent.rs:11-26` lists `ACCENTS` (13 accents, each with
   a dark and a light `kiso_tokens::Theme`). `Accent::by_name` and
   `Accent::tokens(light)` look one up.
5. `crates/tui-kiso/src/theme.rs` wraps tokens, color depth and a `Look`
   (`Theme::new`, `with_tokens`, `with_look`).
6. For the site, `cargo run ... --example gallery -- --json
   apps/kiso-gallery/src/generated/tui-gallery.json` writes every screen with
   token names, and CI checks it (`crates/tui-kiso/README.md:113-121`).

### What the TUI expresses

Contract: `kiso/docs/terminal-interfaces.md`. Surfaces are fills of cells.
"There are no borders, radii or shadows to" draw (`:24`).

| Gallery field | In the TUI today |
|---|---|
| `accent` | Yes, 13 of 14. `snes` exists in `kiso-tokens` (`tokens.rs:1877,1944`, `CHANGELOG.md:21`) but not in `tui-kiso` `ACCENTS` (`accent.rs:11`). |
| `theme` | Yes, dark or light with `Accent::tokens(light)` (`theme.rs:42-44` docs). The contract says use dark by default (`terminal-interfaces.md:50`). |
| `panelFill` | Yes: `PanelFill::{Glass, Translucent, Solid}` (`look.rs`), the same three names as the web. |
| `borderStyle` | Partly: `Border::{None, Rail}` only (`terminal-interfaces.md:143-146`). `none` and `rail` match web values. |
| `cornerStyle`, `cornerSize` | No. Square only. `Look.round` turns on Nerd Font round ends for badges and small buttons (`terminal-interfaces.md:148-153`). |
| `cornerMarks`, `markSize`, `markClearance`, `frameScope`, `markScope`, `frameDetail`, `outer*` | No. "no corner options" (`terminal-interfaces.md:146`). |
| `shadowStyle` | No. "no shadow" (`:200-201`). |
| `backgroundStyle` | One value: `Backdrop` `Glow` draws a wash of `primary` from two corners (`terminal-interfaces.md:91`); in 256 colors it draws nothing. Not selectable from the web names. |
| `paperTone`, `backgroundStrength`, `backgroundPlacement` | No. |
| `neutral`, `primary`, `typeface` | No. `kiso-tokens` has no zinc neutral and no contrast primary (`rg "zinc"` found nothing in `tokens.rs`). A terminal has its own font. |
| `visualStyle` | No. |
| `chartLine`, `chartFill`, `chartLayout`, `chartLegend` | `ChartLegend` only (`crates/tui-kiso/src/chart.rs:58-66`): `Table` and `Inline` match web `table` and `inline`. `Hidden` has no web value, and web `sidebar` has no TUI value. No line, fill or layout option. |
| `appShell`, header fields, `brandBar` | No equivalent options. `AppShell` has a sidebar side and a header flag (`app_shell.rs:68-95`). |
| `pageWidth`, `pageAlign` | Yes. `PageWidth` and `PageAlign` "as `data-page-width`" and "as `data-page-align`" (`app_shell.rs:9-24`). |
| `phone*` | No. |
| TUI-only: `Look.title`, `Look.rule` | `Stroke { pattern, ink }`: 15 patterns, 3 inks (`look.rs`, `Pattern::ALL`; `Ink::{Primary, Gradient, Faint}`). The default is `Heavy` + `Primary` and `Thin` + `Faint` (`terminal-interfaces.md:155-162`). No web equivalent. |
| TUI-only: `Look.round` | A boolean for Nerd Font ends. No web equivalent. |

### What the gallery TUI page shows

`apps/kiso-gallery/src/tui-gallery.tsx`:

- The page picks a theme named `${accent}-${mode}` (`:106`). `mode` is
  `light` or `dark`, with `system` read from `prefers-color-scheme` (`:56-66`).
- If the name is not in `data.themes`, the index falls back to the first theme
  (`:107`, `Math.max(0, indexOf)`). `apps/kiso-gallery/src/generated/tui-gallery.json`
  has 26 themes: 13 accents times 2 modes, **no `snes`**. With the gallery
  default accent `snes`, the TUI page shows `violet-dark` colors silently.
- No other setting reaches it. The `Look` of the gallery TUI is the default
  one. `Theme` page `theme` in the JSON is one of 71 pages.

## 8. Gaps this research found

1. `AppearanceSettings` has no "unset". Project configs need it.
2. `snes` is missing from `tui-kiso` `ACCENTS`.
3. `headerWidth` and `landingBands` have no shipped CSS.
4. Two lists of allowed values (`appearance-init.js` and
   `appearance-settings.ts`) must be edited together.
5. interview-kit keeps its look in TypeScript, not in `index.html`.
6. The "pg-probe" preset is not the pg-probe project.
7. Rust projects pin `kiso-tokens`/`tui-kiso` at three different points
   (0.5.0 and 0.1.0 from crates.io; a git rev with 0.2.0 and 0.1.0), and the
   look is a code constant, not data.

Not checked: which attributes each old pinned release of `kiso-react`
understood; the 71 TUI pages one by one; the pg-probe `site/` pages beyond the
`demo/console` copy; Cargo features in the workspaces without a Kiso
dependency.
