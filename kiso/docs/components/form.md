# Form

## Purpose

Form composes fields and their submission actions in a native HTML form.
Every form with explicit submission includes [FormActions](form-actions.md).
The action can sign in, create, save, search, or apply a choice.

Immediate preferences and automatic filters do not need a submit action.
Use the existing Switch and search patterns for those interactions.

## Anatomy

1. A native `form`, optionally named by a heading with `aria-labelledby`.
2. A content region containing FormFields, sections, or fieldsets.
3. FormActions after the content, with one primary submit Button and any
   secondary actions the task needs.

```tsx
<Form onSubmit={handleSubmit} aria-labelledby="project-title">
  <div className="form-body">
    <h2 id="project-title">Create project</h2>
    <FormField label="Project name" name="name" required />
  </div>
  <FormActions>
    <Button type="submit" variant="primary">Create project</Button>
  </FormActions>
</Form>
```

The `form-body` CSS class provides content padding and field spacing. It can
be applied to a div or fieldset. Products can instead compose content from
Cards and existing layout utilities. Form adds no padding around its actions.
Do not wrap FormActions in a padded content region or another footer.

## React API

Form accepts native form props, including `action`, `method`, `onSubmit`,
`id`, `ref`, and ARIA attributes. It forwards them to the form element and
merges `className` with `form`.

Form does not create buttons, enforce its children at runtime, intercept
submission, select a validation library, or track values and dirty state.
The application owns those behaviors. Explicit-submit forms must follow the
composition contract even though the React component accepts arbitrary content.

## Layouts

- Short forms keep FormActions in normal flow.
- Long forms use sticky FormActions on a page or inside a scrolling panel.
- A form in a bounded panel fills at least the panel height, so actions also
  reach the panel bottom when content is short.
- A form can contain multiple Cards. A Card is not required for Form.
- In Dialog, compose DialogHeader and a Form containing its fields and
  FormActions. Use `form-scroll` on the form when the dialog constrains its
  height. Keep the dialog's existing focus and dismissal behavior.

See [FormActions](form-actions.md) for scroll ownership, padded containers,
responsive actions, and status announcements.

## States and ownership

| State | Application behavior |
| --- | --- |
| Initial | Provide fields and an explicit submit action; a status message is optional. |
| Dirty | Compare current values with the last saved values. Show feedback and Discard when useful. |
| Invalid | Preserve entries, show field errors, and focus the first invalid field. |
| Submitting | Show loading on the submit Button and prevent duplicate requests. |
| Failed | Keep entries and show a recoverable message. Use field errors for field failures. |
| Saved | Update the saved baseline and clear dirty state. Confirm inline or navigate as appropriate. |

Discard restores the saved baseline. Native reset restores initial defaults,
which may differ after a successful save. Cancel leaves the task; it does not
necessarily mean Discard. The application handles navigation and any warning
needed before losing material edits.

## Accessibility

Preserve native submit and validation behavior. Use `type="submit"` on the
primary Button and `type="button"` on other buttons. Never nest forms.
Group related controls with fieldset and legend when they share a question.
FormField continues to own label, help, and field-error associations.

DOM order is content followed by actions. Sticky placement must not obscure
focused controls or their errors; verify keyboard use and zoom in the actual
scroll container. Do not announce the whole form as a live region.

## Terminal

In a terminal, a form is `tui-kiso` `Form`, made of `Field`s: text,
secret, area, checkbox, switch, radio, select, combobox and chips. Each
field is a row, as in a list: the label in a column on the left in
`muted-foreground`, the value on the same row. The focused field is the
selected row, with a `primary` `▌`, its label in bold `foreground` and a
block cursor in `primary`.

| State | Terminal form |
| --- | --- |
| hint | The row under the field, in `subtle-foreground`, while it has focus. |
| error | Replaces the hint, in `danger-on-dark` with a `×`; the label turns `danger-on-dark` and the field keeps `danger` bars. |
| hidden | A field that applies only after a choice stays hidden until then. |
| open list | A select or combobox draws its list over the fields under it. |

- A text field shows its placeholder in `subtle-foreground` while empty. A
  secret shows dots until `Ctrl+R`.
- A checkbox and a switch toggle with `Space`.
- A radio group is a row; `←` `→` choose.
- A select is `‹ value ›`. `←` `→` change it and `Enter` opens the list.
- A combobox filters as you type; `Enter` takes the selected match.
- Chips come from `Enter` or a comma, and go with `Backspace`.

End the form with [FormActions](form-actions.md) from `Form::actions`. A
short form, up to four fields, sits in a [Modal](modal-dialog.md). A form
that creates something takes the page. Editing one section of a detail
page happens in place. `Tab`, `Shift+Tab` and `↑` `↓` move, typing edits,
`Enter` moves on and submits from the last field, `Ctrl+S` submits from
anywhere, and `Esc` closes an open list, or cancels after asking when
something changed. See [terminal interfaces](../terminal-interfaces.md#keys).

## Tokens

`form-body` uses `--spacing-lg` padding and `--spacing-xl` gaps. Form delegates
surfaces and borders to its container, and action styling to FormActions.

## Related contracts

- [FormField](form-field.md) for one labeled control.
- [FormActions](form-actions.md) for submission controls and feedback.
- [CRUD](../patterns/crud.md) and [Settings](../patterns/settings.md) for flows.

## Radix/shadcn mapping

Form uses native HTML semantics. It introduces no Radix primitive or form-state
library dependency.
