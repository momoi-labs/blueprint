# FormPage

The body of a create or edit screen: a title, a form in a card, and
FormActions with the right buttons for the mode.

## Purpose

FormPage renders the create screen of the [CRUD](../patterns/crud.md)
pattern and the edit screen that shares its form. It picks the buttons and
the message tone from `mode`, `dirty` and `failed`, so every form page
behaves the same.

## Anatomy

```
FormPage
├── PageHeader
│   └── PageHeaderTitle
└── Card.form-page[data-fill="false"]
    └── Form
        ├── .form-body
        │   └── children (FormField...)
        └── FormActions (sticky)
            ├── Cancel (create) or Discard (edit, dirty)
            └── submit (primary)
```

The card is at most 720px wide unless `width="full"`.

## Props

| Prop | Type | Use |
| --- | --- | --- |
| `title` | string | The page title and the form's accessible name. |
| `mode` | `"create" \| "edit"` | Create shows Cancel. Edit shows Discard while dirty and disables submit while clean. |
| `submitLabel` | string | The primary verb, such as `Create cluster` or `Save`. |
| `onSubmit` | form handler | Runs on submit. Call `preventDefault` for a client form. |
| `onCancel` | function | Create mode. Leaves without saving. |
| `onDiscard` | function | Edit mode. Restores the saved values. |
| `dirty` | boolean | The form has unsaved changes. |
| `message` | node | Text in FormActions, such as the unsaved-changes notice. |
| `failed` | boolean | The last submit failed. Gives the message the danger tone. |
| `width` | `"left" \| "center" \| "right" \| "full"` | Sets `data-width` on the card. Defaults to `left`. |
| `children` | node | The fields. |

```tsx
<FormPage
  title="Edit cluster main"
  mode="edit"
  submitLabel="Save"
  onSubmit={save}
  onDiscard={reset}
  dirty={dirty}
  message={dirty ? "Unsaved changes." : "Saved."}
>
  <FormField label="Name" name="name" value={name} onChange={rename} />
</FormPage>
```

## States

| State | Behavior |
| --- | --- |
| create | Cancel and the primary verb. Neutral tone. |
| edit, clean | Submit disabled, no Discard. Neutral tone. |
| edit, dirty | Discard and submit. Warning tone on the message. |
| failed | Danger tone on the message. Fields keep their values. |

## Accessibility

The title is the page's `<h1>` and names the form. Put field errors in
[ValidationMessage](validation-message.md) through [FormField](form-field.md);
the FormActions message is for the whole form. Keep the unsaved-changes
message in text, never in colour alone.

## When to use

- For a create or edit screen with more fields than a dialog holds.

## When NOT to use

- For a few fields; use a [Modal / Dialog](modal-dialog.md).
- For settings that apply at once; use controls without FormActions, as in
  [Form](form.md).

## Radix/shadcn mapping

No Radix or shadcn equivalent. FormPage composes Kiso PageHeader, Card, Form,
FormActions and Button.
