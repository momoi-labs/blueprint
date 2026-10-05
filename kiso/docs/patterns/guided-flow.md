# Guided flow

Collects input through a bounded sequence with one focused task at a time.
The application owns the sequence and validation.

## Composition

Use ApplicationShell's topbar layout, optionally with `headerVariant="plain"`.
Place Steps beside the active task on wide screens and above it on narrow
screens. A narrow vertical rail can set `responsive={false}` on wide screens;
the application layout switches to the compact indicator on mobile.

Compose PageHeader, Form, FormField, Input, Select, RadioGroup and FileDropzone
as needed. Use RadioGroup for selection followed by Continue. Use Button's
tile presentation for an immediate action. Use `xl` controls and
`.t-body-large` when the task benefits from larger input and reading text.

The caller supplies every label, option, step state and file rule. Components
contain no application-specific data or workflow decisions.

## Flow and focus

1. Present the current task with a heading and a visible field label.
2. Preserve input while validating or waiting. Mark the region busy and prevent
   duplicate submission when necessary.
3. Show field errors beside the relevant control. Focus the first invalid
   field before blocking Continue.
4. Advance only after success. Record completion explicitly.
5. Move focus to the next heading with `tabIndex={-1}`.
6. Let Back and permitted step navigation retain valid input. Revisited steps
   keep their previous completion state until the application changes it.
7. Show the finished result and a clear next action.

Compact progress includes a control to reveal every step and available
navigation. Do not replace the list with unnamed clickable segments.

## Text with optional actions

A text entry area is a composition of Form, FormField with Textarea and a row
of Buttons. Keep Enter as a newline; submit through an explicit button.
Optional attachment actions select files, while the application owns the list
and transfer. Recording, parsing and remote work remain application concerns.
Use an Alert or ValidationMessage for failures and preserve text for retry.

## Visual settings

The existing editorial hierarchy, corner settings and accent paper are opt-in.
Products may override `--font-heading` and `--font-body` at their root. Load
fonts in the application and include fallbacks; Kiso's default families remain
unchanged. Verify wrapping and focus after any font change.

## Verification

Exercise backward navigation, explicit selection, immediate actions, validation,
file rejection and retry. Check keyboard focus, light/dark themes, narrow
screens and zoom. A gallery demonstration with sample data cannot establish
backend behavior or screen-reader announcements.
