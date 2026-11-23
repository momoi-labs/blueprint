# Theme generator: references from other design systems

Research for the "Theme generator" section of the Kiso gallery. It surveys how
other libraries build theme editors and proposes four directions. The config
format is in [ADR 0003](../adr/0003-theme-generator-config-format.md). The
settings the generator must cover are in
[the inventory](theme-generator-inventory.md).

Every URL below was opened on 2026-11-23 in headless Chromium. Claims about
controls, dialogs and export text come from what the page rendered in that
session. Claims marked "(docs)" come from the tool's own docs or repository.

## Summary

- Four patterns repeat in 11 tools: a control panel on the left with a live
  preview on the right, presets as the first control, light and dark as one
  toggle, and export as a copy-paste dialog.
- Few tools have a way back, and only for their own format. tweakcn pastes
  CSS variables in. Ant Design pastes its JSON config in. shadcn `create`
  reopens a short preset code and can apply it to an existing project.
  Material Theme Builder imports its own JSON export (docs). terminal.sexy
  imports the same formats it exports. The other six tools have no import.
- Two tools encode "only what you changed". Radix "Copy Theme" writes only the
  props that differ from the defaults. Ant Design shows a change counter. This
  is the closest match to ADR 0003's "unset" state. No tool shows unset as a
  visible state.
- The best previews are real pages with a page switcher (tweakcn, Ant Design,
  shadcn). Sticker sheets of loose components (Fluent, daisyUI) say less about
  structure, and Kiso has structure fields (shell, header, page width).
- No tool previews a terminal UI next to the web. terminal.sexy is the only
  editor with an import box and a code preview for a terminal.
- Recommendation: direction A, a workspace with a control rail, a page
  preview and an import, diff and export bar. Details in "Directions".

## Tools

### 1. tweakcn

- URL: https://tweakcn.com/editor/theme
- Controls: colors as named token pairs (primary, secondary, accent, base,
  card, popover, muted, destructive, border and input, chart, sidebar), each
  an oklch text field with a swatch. Tabs: Colors, Typography, Other, Generate
  (AI). A search box filters tokens.
- Layout: fixed left panel, 430 px. Toolbar on top of the preview: light and
  dark toggle, undo, redo, Reset, Import, Share, Save, Code.
- Preview: real compositions in tabs: Custom, Cards, Dashboard, Application,
  Marketing. "Open in v0" and a full-screen button.
- Import: a dialog "Import Custom CSS" takes a pasted `:root { }` and
  `.dark { }` block. This is the way back.
- Export: "Theme Code" dialog with Tailwind v4, oklch, `index.css` and
  `layout.tsx` tabs. A shadcn registry command appears after Save. Also
  "Export to Figma".
- Presets: a theme dropdown at the top left of the panel.
- Light and dark: one toggle. Each token has a light and a dark value.
- Good for us: paste-in import, page tabs, undo and redo, toolbar placement.
- Weak for us: it edits raw color values. Kiso fields are named choices
  (accent names, border styles), so a token list does not fit. No structure
  controls.
- Screenshots: `01-tweakcn.png`, `19-tweakcn-import.png`, `15-tweakcn-code.png`.

### 2. shadcn/ui create

- URL: https://ui.shadcn.com/create. https://ui.shadcn.com/themes showed the
  same builder in this session.
- Controls: style, base color, theme, chart color, heading font, body font,
  icon library, radius, and more, as one dark rail of named choices.
- Layout: floating left rail over a gray canvas. Buttons at the rail bottom:
  a preset code (`--preset b0`), Open Preset, Shuffle, Get Code.
- Preview: a dashboard of real blocks (charts, forms, lists). A page switcher
  (01, 02) at the bottom right.
- Import: "Open Preset" reopens a preset code. The "Existing Project" tab
  writes `shadcn apply --preset b0` with three scopes: full preset, theme
  only, fonts only. There is no paste of an existing `globals.css`.
- Export: "Get Code" dialog with three tabs. New Project: framework, base
  library and an `init --preset` command. Existing Project: the `apply`
  command. Theme: the CSS variables for `globals.css`.
- Presets: the preset code is the share format. Shuffle makes a random one.
- Light and dark: a site toggle in the header.
- Good for us: named choices, not raw values, the same as Kiso. A short code
  as the share. "Apply to existing project" with a scope (theme only, fonts
  only) is close to our appearance and structure split.
- Weak for us: the way back goes through a CLI and a hosted preset, not
  through the project's own file.
- Screenshots: `14-shadcn-create.png`, `16-shadcn-create-code.png`.

### 3. Radix Themes playground

- URL: https://www.radix-ui.com/themes/playground
- Controls: accent color (swatches), gray color, appearance (light, dark),
  radius (none to full, drawn as corner tiles), scaling (90% to 110%), panel
  background (solid, translucent).
- Layout: a floating `ThemePanel` card on the right, over the real docs page.
  A "T" key hint toggles it.
- Preview: the playground page of every component, in place.
- Import: none.
- Export: "Copy Theme" puts JSX on the clipboard. With default settings it
  copied `<Theme>`, so it writes only the props that differ from the defaults.
- Presets: none.
- Light and dark: a segmented control in the panel.
- Good for us: Radix fields are close to ours (accent, gray, radius, panel
  fill). Corner tiles show radius better than words. "Write only what
  changed" fits ADR 0003. Kiso's gallery drawer already works like this panel.
- Weak for us: no import. No structure. The panel is small for 44 fields.
- Screenshot: `03-radix-themes.png`.

### 4. Material Theme Builder

- URL: https://material-foundation.github.io/material-theme-builder/
- Controls: source image or source color, then core colors (primary,
  secondary, tertiary, neutral) with a "color match" check box. Step 2 is
  fonts.
- Layout: a wizard. Controls on the left, footer "1 of 2, Add Theme Colors"
  with a "Pick your fonts" button.
- Preview: a phone mock of a sample app, with light, contrast and dark
  buttons above it.
- Import: JSON import of an earlier export (docs, the repository README).
- Export: code for several platforms (docs). The repository was archived on
  2026-07-23 (docs), but the web app still loads.
- Presets: four wallpapers.
- Light and dark: generated together. Three buttons switch the preview.
- Good for us: the preview mode buttons sit next to the preview, not in the
  panel.
- Weak for us: a wizard is slow for small edits. Color-first. Archived.
- Screenshot: `04-material-theme-builder.png`.

### 5. daisyUI theme generator

- URL: https://daisyui.com/theme-generator/
- Controls: theme name, Random, CSS. Color tiles for base, primary,
  secondary, accent, neutral, info, success, warning, error. Radius for boxes
  and fields as corner tiles.
- Layout: three columns. A theme list on the left (built-in themes and "My
  themes"), controls in the middle, a component demo on the right.
- Preview: a "Components Demo" sticker sheet with three view buttons.
- Import: no paste-in import seen. State lives in the URL hash
  (`#theme=eJx...`, a compressed string).
- Export: a "CSS" dialog: "Add it after `@plugin "daisyui";`".
- Presets: 35 or more built-in themes in the left list.
- Light and dark: each theme is light or dark. No paired editing.
- Good for us: the preset list as a permanent column. Corner tiles. URL state.
- Weak for us: no way back from a project file. The preview is loose parts.
- Screenshots: `05-daisyui.png`, `17-daisyui-css.png`.

### 6. Ant Design theme editor

- URL: https://ant.design/theme-editor
- Controls: Global and Component modes. Tabs Color, Size, Style. Each seed
  token (colorPrimary, colorSuccess and others) has a color field and a "Map
  Token" disclosure for derived values. "Follow Brand Color" switches.
- Layout: left panel, top bar with light and dark buttons, a change counter
  ("0 Changes"), Config and Save.
- Preview: a real admin page (Ant Design Pro) with Page and Overview tabs and
  zoom (40%, plus, minus, full screen).
- Import: the Config dialog is a JSON editor with Import and Export buttons.
  Pasting a config in is the way back.
- Export: the same JSON. A note says the strings `dark` and `compact` stand
  for `theme.darkAlgorithm` and `theme.compactAlgorithm` in code.
- Presets: none in the editor.
- Light and dark: algorithms switched from the top bar.
- Good for us: the change counter, which is "what differs from unset". JSON
  in and out in one dialog. A zoomed real page shows the shell.
- Weak for us: token names, not choices. Dense.
- Screenshots: `06-antd.png`, `18-antd-config.png`.

### 7. Mantine colors generator

- URL: https://mantine.dev/colors-generator/
- Controls: one base color (text field and picker), 28 named presets.
- Layout: a single page. Controls on top, the 10-shade palette below, then a
  "Variants preview" table (filled, light, outline, subtle).
- Preview: buttons in each variant.
- Import: the base color field takes a hex value. Nothing else.
- Export: "Copy URL". The state is in the URL.
- Light and dark: the site toggle.
- Good for us: "variants preview" shows one choice across all variants.
- Weak for us: one color only.
- Screenshot: `07-mantine-colors.png`.

### 8. Park UI (Chakra)

- URL: https://park-ui.com/
- Controls: "Make it yours" drawer: framework, font family, gray color (6),
  accent color (25), radius (none to 2xl).
- Layout: a left drawer over the landing page.
- Preview: the landing page blocks behind the drawer.
- Import and export: only Reset in the drawer. No export seen.
- Presets: none.
- Light and dark: the site toggle.
- Good for us: the drawer over a real page is the cheapest form.
- Weak for us: no export, so no round trip.
- Screenshot: `08-park-ui.png`.

### 9. Fluent UI theme designer

- URL: https://react.fluentui.dev/?path=/docs/theme-theme-designer--docs
- Controls: "Step 1, Color settings": key color, hue torsion, vibrancy.
  "Step 2, Export": theme name and an Export button.
- Layout: a stepper panel in the middle column of the Storybook docs.
- Preview: a 16-step ramp, a sticker sheet (persona, tabs, inputs, switch,
  slider, check boxes) and an "All Tokens" disclosure.
- Import: none.
- Export: code from the Export button. The dialog did not open in the
  headless run, so its content is not recorded here.
- Good for us: the export step names the theme.
- Presets: none seen.
- Light and dark: no control in the designer. Not verified.
- Weak for us: color only. No import.
- Screenshot: `10-fluent-theme-designer.png`.

### 10. terminal.sexy (TUI side)

- URL: https://terminal.sexy/
- Controls: background, foreground and the 16 ANSI colors as tiles. A color
  picker panel and a randomiser.
- Layout: tiling panels the user can close and rearrange: Editor, Settings,
  Color Picker, Randomiser, Import, Export, Scheme Browser, Template Browser.
- Preview: code templates (`/vim/hybrid/javascript`, tig) in terminal colors.
- Import: a format select (Xresources and others) and a paste box.
- Export: the same formats.
- Presets: a scheme browser.
- Light and dark: no mode. A scheme is one palette, light or dark.
- Good for us: import and export as two tabs of one panel, with a format
  select. A preview of real terminal screens.
- Weak for us: palette only. Kiso's TUI uses accent names and a `Look`, not
  16 colors.
- Screenshot: `12-terminal-sexy.png`.

### 11. Gogh (TUI side)

- URL: https://gogh-co.github.io/Gogh/
- Controls: filters (light, dark, popular, favorites, by color), sort, name
  search, compact and detailed views.
- Layout: a gallery grid of scheme cards, each with 16 swatches.
- Export: an install script per platform.
- Good for us: a light and dark filter on a preset gallery.
- Weak for us: a catalog, not an editor.
- Screenshot: `13-gogh.png`.

### Checked and left out

- Carbon (https://carbondesignsystem.com/elements/themes/overview/): a docs
  page about four fixed themes. No generator.
- Open Props (https://open-props.style/): a token library. No generator page.
- Inspo MCP: a search for "theme editor with control sidebar and live
  component preview" returned landing pages (e2b, Excalidraw, Feedly,
  shadcn, Headless UI), none of them an editor. Nothing was taken from it.

## Patterns

| Pattern | Tools | Fit for Kiso |
|---|---|---|
| Left control panel, preview on the right | tweakcn, Ant Design, shadcn, daisyUI, Fluent | Good. Matches the gallery drawer tabs. |
| Floating panel over the real site | Radix, Park UI | Good and cheap. The gallery already does it. |
| Wizard steps | Material, Fluent | Weak. Slow for small edits. |
| Page tabs in the preview | tweakcn, Ant Design, shadcn | Needed for structure fields. |
| Paste-in import | tweakcn (CSS), Ant Design (JSON), terminal.sexy | Needed. Kiso pastes the `<html>` tag or the share JSON. |
| Short code or URL as share | shadcn, daisyUI, Mantine | Kiso has it (share JSON in the URL). |
| Only changed values exported | Radix, Ant Design counter | Needed for "unset". |
| Corner tiles for radius | Radix, daisyUI | Kiso's `VisualSelector` already draws options. |

## Directions

Each direction uses the same format (ADR 0003) and the same controls
(`AppearanceControls`). They differ in where the controls sit, what the
preview is, and how import and export are reached.

### A. Workspace with a round-trip bar

The idea: a full gallery page with the control rail on the left, a real-page
preview on the right, and a top bar for import, changes and export.

- Inspired by: tweakcn (toolbar, page tabs, paste import), Ant Design (change
  counter, JSON dialog), shadcn (export tabs per target).
- Import and export: "Import" opens a dialog that takes a pasted `<html ...>`
  tag or share JSON. Fields the project does not set show as "unset" in the
  rail. "N changes" lists what differs from the import. "Export" has tabs:
  HTML attributes with the phone override script (ADR 0003, decision 5),
  share JSON v3, Rust.
- Preview: tabs for Dashboard, Form, Landing and TUI. Web and phone width.
- Risk: the most UI to build. The rail must fit 44 fields, so it reuses the
  current tabs (Look, Layout, Frame, Canvas, Phone).

```
+----------------------------------------------------------------------+
| Theme generator   [Import] [3 changes] [light|dark]  [Export v]      |
+---------------------+------------------------------------------------+
| Look Layout Frame   | [Dashboard] [Form] [Landing] [TUI]  [web|phone]|
| Canvas Phone        |                                                |
|                     |  +------------------------------------------+  |
| Presets             |  | real Kiso page in the chosen settings    |  |
|  o Default  o SNES  |  |                                          |  |
| Accent              |  |                                          |  |
|  [gold v]  changed  |  |                                          |  |
| Neutral             |  |                                          |  |
|  [unset]  uses CSS  |  +------------------------------------------+  |
+---------------------+------------------------------------------------+
```

### B. Import first, diff view

The idea: the page starts with "paste your project", and the main view is a
diff between the project and the edit, with the preview as a secondary pane.

- Inspired by: shadcn "Existing Project" with scopes, Ant Design counter,
  Radix "only what changed".
- Import and export: import is the first screen. The center column lists
  every field as before, after, or unset. Export writes every present field,
  as ADR 0003 requires, and keeps `rest` attributes as they were. The diff is
  for review only.
- Preview: a smaller pane with before and after side by side.
- Risk: weak for a new project with no file. Less visual. The user looks at
  a list more than at a page.

```
+----------------------------------------------------------------------+
| 1 Paste project   2 Adjust   3 Export                                |
+-----------------------+----------------------+-----------------------+
| project <html>        | field     before after| preview               |
| data-accent="gold"    | accent    gold   gold | +-------+ +-------+   |
| data-corner-size=     | corners   small  med *| |before | | after |   |
|   "small"             | shadow    unset  soft*| |       | |       |   |
| data-theme="dark" rest| shell     unset  unset| +-------+ +-------+   |
+-----------------------+----------------------+-----------------------+
```

### C. Panel over the gallery, plus import and export

The idea: keep the current gallery settings drawer and add Import and Export
to its Code tab. The whole gallery is the preview.

- Inspired by: Radix `ThemePanel`, Park UI "Make it yours".
- Import and export: the Code tab gets a paste box and export tabs. Unset
  fields show a mark in each section.
- Preview: any gallery page, including the TUI page.
- Risk: the cheapest, but it is not a "section". Hard to compare before and
  after. The drawer is narrow for the import list and warnings.

```
+------------------------------------------------+---------------------+
| gallery page (any route)                       | Look Layout ... Code|
|                                                |                     |
|   components in the current settings           | Import              |
|                                                | [paste <html> ...]  |
|                                                | Export              |
|                                                | [HTML][JSON][Rust]  |
|                                                | 2 unset fields  [i] |
+------------------------------------------------+---------------------+
```

### D. Twin preview, web and terminal

The idea: the preview is split in two, a web page and a TUI screen, with
controls on the left, and divergence warnings between them.

- Inspired by: terminal.sexy (import and export tabs, template preview),
  Material (preview mode buttons), Gogh (light and dark filter on presets).
- Import and export: as in A for the web. The TUI column is export only
  (ADR 0003, decision 10). It shows which web fields have no TUI effect.
- Preview: web left, TUI right, both live. Warnings such as "web
  `panelFill=solid`, TUI `fill=translucent`" sit between them.
- Risk: the TUI must render in the browser (the gallery has a TUI page, but
  it follows only accent and theme). Half the width for each preview.

```
+---------------------+--------------------------+---------------------+
| controls            | web                      | terminal            |
| Look Layout Frame   | +----------------------+ | +-----------------+ |
| ... TUI             | | dashboard            | | | > pg-probe      | |
|                     | |                      | | | ━━ title ━━━━━  | |
| TUI                 | +----------------------+ | +-----------------+ |
|  fill [translucent] |   ! panel fill differs: web solid, TUI translucent|
+---------------------+--------------------------+---------------------+
| [Import] [Export: HTML | JSON | Rust]                                |
+----------------------------------------------------------------------+
```

### Recommendation

Choose A. It is the pattern the strongest tools share (tweakcn, Ant Design,
shadcn), it gives structure fields a real page to change, and its top bar
holds the round trip that most tools lack. Take two parts from the others:

- From B: the "N changes" list and the unset state in the rail, so export
  writes only what the project had or the user changed.
- From D: a TUI tab in the preview with the divergence warnings, instead of a
  permanent split.

C is the fallback if the section must ship quickly. It adds import and export
to the drawer that exists today.

## Screenshots

Saved in `~/.local/state/nami/shots/blueprint-20261123-3/`, not committed,
1440 by 900:

- `01-tweakcn.png`: editor, token rail and Cards preview.
- `19-tweakcn-import.png`: "Import Custom CSS" paste dialog.
- `15-tweakcn-code.png`: "Theme Code" export dialog.
- `02-shadcn-themes.png`: `/themes` showing the Create builder and its intro
  dialog.
- `14-shadcn-create.png`: Create rail and dashboard preview.
- `16-shadcn-create-code.png`: Get Code dialog, Theme tab.
- `03-radix-themes.png`: ThemePanel over the playground.
- `04-material-theme-builder.png`: step 1 of 2 with the phone preview.
- `05-daisyui.png`: theme list, controls and component demo.
- `17-daisyui-css.png`: CSS export dialog.
- `06-antd.png`: editor with the zoomed admin page preview.
- `18-antd-config.png`: Config dialog with Import and Export.
- `07-mantine-colors.png`: base color, presets and palette.
- `08-park-ui.png`: "Make it yours" drawer.
- `10-fluent-theme-designer.png`: two-step designer and sticker sheet.
- `12-terminal-sexy.png`: tiling editor with Import panel.
- `13-gogh.png`: terminal scheme gallery.

## Open questions

- Is the generator a new route, or the gallery drawer grown (A or C)?
- Which pages make the preview tabs? The gallery has a dashboard, forms, a
  landing page and the TUI page.
- Must the TUI preview follow `Look` before the generator ships? Today it
  follows only accent and theme (`apps/kiso-gallery/src/tui-gallery.tsx:104-107`).
