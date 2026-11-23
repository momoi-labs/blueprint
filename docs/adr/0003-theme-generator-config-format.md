---
status: proposed
date: 2026-11-23
supersedes: []
superseded_by: null
tags: [kiso, gallery, theme-generator, share, tui-kiso]
---

# Theme generator config format

The gallery needs a format a person can import from a project, edit, and export back without retyping values. We propose to grow the current share JSON (`apps/kiso-gallery/src/appearance-share.ts:16,48-50`) into version 3. Version 3 splits appearance from page structure, keeps "unset" as a state, maps to the `data-*` attributes of a project's `index.html`, and adds an optional TUI preset for the Rust side. Facts behind this are in [the inventory](../research/theme-generator-inventory.md).

> **Append-only:** never edit an accepted ADR. To change a decision, write a
> new ADR and link it to the old one via `supersedes` / `superseded_by`.

## Format

```json
{
  "v": 3,
  "appearance": { "accent": "gold", "cornerStyle": "rounded", "phone": { "borderStyle": "none" } },
  "structure":  { "appShell": "default", "pageWidth": "contained" },
  "tui":        { "accent": "gold", "mode": "dark", "look": { "fill": "translucent" } },
  "demos":      { "diagram": { "edges": "curve" } }
}
```

- `v`: 3. Version 1 and 2 stay readable (`readShare` already handles both, `appearance-share.ts:82-91`).
- `appearance` and `structure`: flat maps of field name to value. The split follows the inventory (section 2). A field that is not present is **unset**. It is not the gallery default.
- `appearance.phone`: the six phone overrides, with the `phone` prefix dropped, as `appearanceCode` already does (`appearance-settings.ts:72-74`). Absence means "inherit".
- `tui`: optional, see below.
- `demos`: unchanged from version 2 (`appearance-share-ui.tsx:15-20`).
- Field names and allowed values stay the ones in `appearance-init.js:3-45`. No new vocabulary.

The field split:

- `appearance`: `theme`, `accent`, `neutral`, `primary`, `typeface`, `chartLine`, `chartFill`, `borderStyle`, `shadowStyle`, `cornerStyle`, `cornerSize`, `frameDetail`, `panelFill`, `cornerMarks`, `markSize`, `frameScope`, `markScope`, `backgroundStyle`, `backgroundStrength`, `paperTone`, `phone*`.
- `structure`: `appShell`, `brandBar`, `headerVariant`, `headerSize`, `pageWidth`, `pageAlign`.
- Unclear fields go where the inventory's section 2 reasons put them:
  - `visualStyle`, `outer*`, `markClearance`, `backgroundPlacement`: `appearance`. They paint, even when they depend on another field.
  - `chartLayout`, `chartLegend`: `structure`. They place parts of one component.
  - `appShellOuter`: `structure`.
  - `headerWidth`, `landingBands`: `structure`, flagged `gallery-only` because no shipped CSS reads them (`kiso/blocks/react-prototype/src/gallery.css:512-513`, `apps/kiso-gallery/src/landing.css:72`).

## Mapping to a project

The way back is two functions, both pure.

- **Export to HTML.** Write `data-<kebab-case-key>="<value>"` for each present field, as `appearanceCode` does (`appearance-settings.ts:75-77`). Skip `theme` when it is `system` or unset. Write no attribute for an unset field. Phone overrides need the JavaScript form (`appearance-settings.ts:84-87`).
- **Import from HTML.** Read every `data-*` on `<html>` whose name is a gallery field. Put it in `appearance` or `structure`. Keep other attributes in a `rest` list and write them back unchanged. Do not fill missing fields from defaults. An absent attribute means the project uses Kiso's CSS fallback, which differs from the gallery default (for example `kiso/ui.css:2483` for the shadow).
- **Import from interview-kit's object form** (`interview-kit/web/src/routes/__root.tsx:19-50`): a second reader that takes a JS object literal of `"data-*"` keys. Export for this project is a copy-ready object, not an HTML snippet.
- **Check against the 11 projects.** All 38 attributes of every project map without loss (inventory section 6). The test is: import each project's file, export, and compare attribute sets. That is the "100% of configs" gate for attributes. It does not cover CSS variable overrides (interview-kit fonts and muted text, self-host chart colors, inventory section 6), which the format does not carry. The generator must leave project CSS alone. The 11 gallery presets are the second gate: share, read, compare.

## Rust and the TUI preset

The web and the TUI use the same accent names and the same light and dark modes, but the TUI cannot express most fields (inventory section 7). The `tui` key holds only what Rust can use today:

- `accent`: one of the 13 names in `crates/tui-kiso/src/accent.rs:11`. `snes` is not valid until `tui-kiso` adds it.
- `mode`: `light` or `dark`.
- `chartLegend`: `table`, `inline` or `hidden` (`crates/tui-kiso/src/chart.rs:58-66`). Web `sidebar` has no TUI value.
- `look`: the `Look` fields: `fill` (`glass`, `translucent`, `solid`), `border` (`none`, `rail`), `round` (boolean), `title` and `rule` (a pattern plus an ink) (`crates/tui-kiso/src/look.rs`).
- `pageWidth` and `pageAlign` are not repeated. They are read from `structure`, since `tui-kiso` names them the same (`crates/tui-kiso/src/app_shell.rs:9-24`).

A TUI preset is a `tui` object with these keys. It represents today's Rust effect, and nothing more. It does not claim the web `cornerStyle`, `shadowStyle` or `cornerMarks` appear in a terminal.

Export for Rust writes `Theme::new(kiso_tokens::<ACCENT>_DARK).with_look(Look { ... })` for dark, the form pg-probe uses (`pg-probe/src/top.rs:611-617`). For light it writes `Theme::new(Accent::by_name("<accent>").unwrap().tokens(true))`, because `Accent::tokens(true)` swaps the four `*_on_dark` status roles that a bare `<ACCENT>_LIGHT` constant keeps (`crates/tui-kiso/src/accent.rs:33-44`). Import reads that expression back with a fixed pattern, not a Rust parser, and fails with a message when the code has another shape.

A project with both sides gets one file with both `appearance`/`structure` and `tui`. When the web `accent` and `tui.accent` differ, the generator shows both and does not merge them.

## Considered options

- **Keep v2 and add fields.** Rejected: v2 has one flat map and cannot tell "unset" from a value. Every project missing an attribute would get the receiver's default on import (`appearance-share.ts:83`).
- **A new format that is not the share.** Rejected: the share already carries all 44 fields, demos, validation and legacy migration, and has a completeness test (`apps/kiso-gallery/tests/appearance-export-completeness.test.mjs`).
- **Keep one flat map and mark the split by a list.** Rejected: two maps make the split visible in a hand edit and in a diff.
- **Put Rust values under the web fields** (for example `cornerStyle` carrying a TUI value). Rejected: the web cannot be derived from the TUI or the reverse, and the values would claim effects the terminal does not have.
- **Parse `index.html` with a full HTML parser.** Rejected for now: the `<html>` tag is enough. A regular expression over the first tag fails on interview-kit, so that project has its own reader.

## Consequences

- `readShare` gains a v3 branch, and `options` must be available to it. The duplicate sources `appearance-init.js` and `appearance-settings.ts` stay a risk until one derives from the other.
- The generator must show `headerWidth` and `landingBands` as gallery-only, or leave them out of export.
- `snes` is the gallery default accent but has no TUI. The gallery TUI page already falls back to `violet-dark` without a message (`apps/kiso-gallery/src/tui-gallery.tsx:106-107`). The generator needs `tui-kiso` to add `snes`, or a visible warning.
- The `pg-probe` gallery preset differs from the pg-probe project, so it is not a usable import for that project (inventory section 4).
- Old pinned releases (kiso-react 0.11 to 0.23) may not read every field. A v3 export for those projects should list what the pinned version supports. This is not checked.

## Open questions

1. Should `theme` be in the export? Projects set it at runtime from the reader's choice. Only self-host and the pg-probe demo copies write it in HTML.
2. Should the generator export `headerWidth` and `landingBands`, which have no effect in a project?
3. Do we add `snes` to `tui-kiso` first, or show a warning in the generator?
4. How do we export interview-kit's object form: a second output, or a change in that project to use `index.html`?
5. Should phone overrides be exported at all? No project uses them, and they need JavaScript.
6. Should the "pg-probe" preset be replaced by the real project config, or renamed?
7. pg-probe sets web `panel-fill=solid` and TUI `Translucent`. Is that intended, or should the generator warn on a mismatch between the two sides?
8. Should the pinned Kiso version be part of the file, so the generator can warn about unsupported fields?
9. Should `appearance-init.js` and `appearance-settings.ts` share one source before v3?
10. Is a regex-based Rust reader acceptable, or should the Rust side export only?
