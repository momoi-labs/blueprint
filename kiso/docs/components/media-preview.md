# MediaPreview

## Purpose

Show what a media item looks or sounds like inside a list or an option, so a
person can recognize it without opening it elsewhere. `ImagePreview` shows a
thumbnail. `AudioPreview` plays and pauses a short sound. Use either as the
`illustration` of a [DetailSelect](detail-select.md) option or a
[DetailOption](detail-option.md).

Use a full media player when people need to seek, change the volume, or read
a transcript. A preview only starts and stops.

## Anatomy and layout

`ImagePreview` is a native `img` that fills the width of its container with a
4:3 box and crops the image to cover it. In a compact DetailOption the box is
square. It loads lazily.

`AudioPreview` is a small icon button with a play or pause icon. It creates
its audio element on the first press, so a long list loads no sound until
someone asks for it.

## React API

| Component | Props |
| --- | --- |
| `ImagePreview` | Required `src` and `alt`. Other `img` attributes pass through. |
| `AudioPreview` | Required `src` and `label`. Other `button` attributes and `ref` pass through. |

| Helper | Behavior |
| --- | --- |
| `isPlayPreviewKey(event)` | True for Ctrl+Enter, or Cmd+Enter on macOS, without Alt or Shift. |
| `toggleAudioPreview(element)` | Presses the first enabled AudioPreview inside `element`. Returns false when there is none. |

Previews never play by themselves. Only one AudioPreview plays at a time:
starting one pauses the one that was playing. A sound that ends returns to its
start. A new `src`, a failed load, or unmounting stops the sound.

## Accessibility

`AudioPreview` is named "Play {label}" while paused and "Pause {label}" while
playing. Its `data-state` is `paused` or `playing`. Give `label` the name the
person sees beside the preview.

Set `alt` to describe a meaningful image. Set `alt=""` when the text beside
the thumbnail already names it.

A listbox option exposes no nested controls to assistive technology, and the
focus usually stays on the field or the selection. Lists that hold audio
previews therefore offer a key: Ctrl+Enter or Cmd+Enter plays or pauses the
preview of the highlighted option without changing the selection. Use
`isPlayPreviewKey` and `toggleAudioPreview` to implement it, and tell people
about the key near the list. DetailSelect supports it already.

## Tokens and appearance

The thumbnail uses `--radius-sm` and `--color-muted` behind images that are
still loading. The play button uses the outline, small, icon Button styles.
