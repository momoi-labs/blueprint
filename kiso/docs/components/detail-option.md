# DetailOption

## Purpose

Lay out an option as DetailSelect does, with an illustration beside a title
and its description, in a list that DetailSelect does not own. An
autocomplete inside a [CodeEditor](code-editor.md) is one example: the
product owns the listbox, the keyboard, and the focus, and DetailOption draws
each row.

Use [DetailSelect](detail-select.md) when a field chooses one value from a
trigger.

## Anatomy and layout

The illustration column comes first, then the body with the title and an
optional description. Without an illustration, the body takes the whole row.

| Size | Layout |
| --- | --- |
| `md` | The DetailSelect row: an illustration column up to 8rem, `--spacing-md` padding, `--spacing-lg` between columns. |
| `sm` | One compact row: a square illustration the height of a small control, `--spacing-xs` and `--spacing-sm` padding, and a label-size title. |

## React API

| Prop | Behavior |
| --- | --- |
| `label` | Required title. It names the option. |
| `illustration` | Optional content on the left, such as a [MediaPreview](media-preview.md). |
| `description` | Optional content under the title. It describes the option. |
| `size` | `md` (default) or `sm`. |

Other `div` attributes pass through, including `role`, `aria-selected`, `id`,
and event handlers.

## Accessibility

DetailOption labels itself with its title and describes itself with its
description, so a control in the illustration, such as an AudioPreview, does
not become part of the option's name.

To use it in a listbox, pass `role="option"` and `aria-selected`, and keep the
listbox semantics, the keyboard, and `aria-activedescendant` in the product.
A listbox option exposes no nested controls, so offer the play key described
in [MediaPreview](media-preview.md) when options hold audio.

## Tokens and appearance

An option with `aria-selected="true"` fills with `--color-selected` and
`--color-selected-foreground`. Forced colors add a visible outline. Hover
fills an enabled option with `--color-accent-surface-hover`. The description
uses `--color-muted-foreground` until the option is selected.
