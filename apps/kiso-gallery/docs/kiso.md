# Kiso in the gallery

## Contracts

- This is the design system's own workspace gallery, not an external consumer.
- `@momoi-labs/kiso` 1.6.0 and `@momoi-labs/kiso-react` 0.28.0 are local workspaces.
- Contracts: repository `kiso/`. Components: `packages/kiso-react/`.

## Paths

- Screens and product components: `apps/kiso-gallery/src/`.
- Shared catalog: `kiso/blocks/react-prototype/src/`.
- Product CSS: `app.css`, `appearance.css`, `gallery-settings.css`, and
  `accents.css` under `apps/kiso-gallery/src/`.
- Shared catalog CSS: `kiso/blocks/react-prototype/src/gallery.css`.

## Product components

- `KisoBrand` renders the approved horizontal lockup with outlined text.
- `GallerySettings` owns appearance controls.

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

## Pattern choices

| Screen | Pattern |
| --- | --- |
| Gallery shell | Application shell |
| Introduction | Product introduction, no catalog pattern |
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
