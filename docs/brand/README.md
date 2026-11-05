# Kiso brand

The emblem is an open geometric enso, with a rounded start and three tapered
cuts at the end. It was traced from the approved concept image. The horizontal
lockup follows option A. The wordmark is "kiso" in Inter Bold, converted to paths.

## Colors

| Part | On light | On dark |
| --- | --- | --- |
| Emblem | `#5b3fc4` | `#a793f4` |
| Wordmark | `#1b1a1e` | `#eeece9` |

The emblem uses Kiso's violet accent ink in each theme. The reference image's
brighter purple is replaced with these existing token values.

## Files

| File | Use |
| --- | --- |
| `mark.svg`, `mark-dark.svg` | Emblem for light and dark backgrounds. |
| `mark-mono.svg` | Emblem in `currentColor`. |
| `lockup.svg`, `lockup-dark.svg`, `lockup-mono.svg` | Horizontal emblem and wordmark. |
| `lockup-stacked.svg`, `lockup-stacked-dark.svg`, `lockup-stacked-mono.svg` | Emblem above the wordmark. |
| `wordmark.svg` | Wordmark in `currentColor`. |
| `favicon.svg` | Emblem that switches color with the system theme. |
| `png/` | Transparent PNG exports of each SVG. |
| `usage.html` | Local preview of the variants and small sizes. |

## Use

- SVG files have transparent backgrounds and no embedded raster images or fonts.
- Inline monochrome SVG files inherit CSS `color`. Through `<img>`, they are black.
- Keep clear space of at least one quarter of the emblem's width around a lockup.
- Use the standalone emblem for square slots. Do not stretch or rotate it.
- Prefer 32 px or larger when the tapered cuts must remain distinct. At 16 px,
  the open ring remains visible, but the fine tips merge.
- The favicon retains the approved silhouette. It is not a separate simplified design.
- Inter is licensed under the SIL Open Font License. Its upstream source is
  https://github.com/rsms/inter. The outlines use weight 700 and optical size 32.

The gallery uses these outlines in `apps/kiso-gallery/src/kiso-brand.tsx`.
Its symbol follows the selected accent. Existing shared React components
and Momoi assets keep their own marks.
