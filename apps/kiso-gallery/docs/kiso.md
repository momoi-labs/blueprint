# Kiso in the gallery

## Contracts

- This is the design system's own workspace gallery, not an external consumer.
- `@momoi-labs/kiso` 1.6.0 and `@momoi-labs/kiso-react` 0.28.0 are local workspaces.
- Contracts: repository `kiso/`. Components: `packages/kiso-react/`.

## Paths

- Screens and product components: `apps/kiso-gallery/src/`.
- Shared catalog: `kiso/blocks/react-prototype/src/`.
- Product CSS: `app.css`, `appearance.css`, `gallery-settings.css`,
  `landing.css`, and `accents.css` under `apps/kiso-gallery/src/`.
- Shared catalog CSS: `kiso/blocks/react-prototype/src/gallery.css`.

## Product components

- `KisoBrand` renders the approved horizontal lockup with outlined text.
- `GallerySettings` owns appearance controls.
- `ComponentOrbit` demonstrates connected switches, an input and an action.
- `FoundationLab` compares light and dark tokens with a draggable light boundary.
- `HeroPanels` composes three interactive examples, with the project summary in front.
- `ShellAssembly` builds a header, sidebar and content from switches. Steps shows which pieces are on. It assembles once, on the first visit.

## Product rules

The Kiso symbol follows `--color-accent-base`. The wordmark follows
`--color-foreground`. Keep its outlines in sync with `docs/brand/`.
The lockup sits directly in the shell brand link, without a BrandMark tile.
The introduction uses `基礎` with a smaller `kiso` reading in foreground color.
New visits and Reset appearance use the complete SNES preset. Saved preferences
remain in effect until reset.
The shell lockup is 24 px high. Show it in the sidebar while desktop navigation
is open, and in the header when navigation is closed or on smaller screens.
Canvas offers the centered Kiso enso background.
The landing follows the gallery page width and alignment without another
content width cap. Its contrast bands span that width.
On Intro, the existing header and landing share one continuous panel, with
no floating header frame or outer content gutter. Other routes keep the
selected header variant. Intro removes the inset shell margin in both width modes. Landing bands sets
where section backgrounds stop: Inside frame (default) keeps them within the
outer frame, so its border, ink and shadow stay whole; Full width reaches the
shell edges over the frame. Full, Contained and alignment apply to inner content. The closing links use a light violet section. The hero uses the approved A + E + B stack, with E in front, click to reveal
and a 6px float that pauses on interaction and respects reduced motion.

## Pattern choices

| Screen | Pattern |
| --- | --- |
| Gallery shell | Application shell |
| Introduction and landing layout | Compact landing composition: split hero with a component card in perspective, three live examples in the inverse theme and accent CTA. Uses page layout as a width reference. No marketing pattern contract yet. |
| Components | Interactive component catalog, no catalog pattern |
| Layout examples | Existing dashboard, CRUD, settings, login and report patterns |

## Exceptions

None.

## Verify

1. Install with `npm ci` at the repository root, using Node 24 or later.
2. Run `npm run build:gallery`.
3. Run `npm run gallery` and open `http://127.0.0.1:5175`.
4. Change accent and theme. Check the brand on Intro and Components at desktop
   and phone widths.
