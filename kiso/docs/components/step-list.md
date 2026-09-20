# StepList

## Purpose

StepList shows the steps of a run a machine walks through, one row per step,
with a state, a label, and a timing. While the run goes it is the progress;
afterwards it is the account of what happened. The reader does not walk the
steps; the machine does, and the reader reads how it went.

It is not the [Pagination](pagination.md) step indicator. That one shows a
person's position in a flow they drive. StepList has a state per step, a
timing, and an output the reader may open.

## Anatomy

```
StepList (ordered list, labelled)
└── Step (repeated)
    ├── rail: connector and mark, with a text alternative
    ├── label
    ├── meta (mono, muted)
    └── detail (optional slot, below the row)
```

The rail is one vertical line through every mark. Each mark is a dot; the
connector above it takes the colour of the step's state, so the line fills as
the run advances and the list is itself the progress. Nothing else measures
completion: do not add a Progress track above a StepList.

Each row is a button when the list has `onSelect`; the product then shows the
selected step's output beside the list, usually in the second [Pane](split.md)
of a Split with a [LogView](log-view.md) filling it. On a narrow viewport,
where the Split cannot fit, pass the output as the selected step's `detail`
and it renders under the row.

## States

| State | Mark | Default meta |
| --- | --- | --- |
| pending | empty dot, muted row | none; the product passes "Not run" after a failure |
| running | dot ringed in `--color-success`, pulsing, bold label | "Running" |
| done | filled `--color-success` dot | none; the product passes the duration |
| skipped | hollow `--color-success` dot, muted label | "Not needed" |
| failed | filled `--color-danger` dot, bold label in `--color-danger` | none; the product passes the duration |

The running step is `aria-current="step"`. Five states, not a status badge's
tones: running is alive, so it is the success colour; neutral is what is not
happening; danger is what stopped the run.

The product owns which step is selected. Follow the running step by default,
keep a step the reader chose, and offer a way back to the current one.

## Accessibility

An `ol` with an accessible name, one `li` per step. Each mark carries its
state as text (`role="img"` with the state as its name), so colour is never
the only signal. Rows that select are native buttons with `aria-pressed`;
rows that do not are plain text. The connector is decorative and hidden.
Under reduced motion the running mark does not pulse.

### Keyboard

No custom keymap. Tab reaches each selectable row; Enter or Space selects it.

## Tokens and implementation

Rail and marks use `--color-border-strong`, `--color-success`,
`--color-success-surface`, and `--color-danger`. Labels use
`--type-size-label`; the running and failed labels use
`--type-weight-semibold`. Meta uses `--font-mono`, `--type-size-label`, and
`--color-muted-foreground`. Rows are spaced with `--spacing-sm`; the rail
column is `--spacing-xl` wide, room for the running mark's glow. Focus uses `--color-focus`. No Radix
primitive is involved.

## When to use

- A lifecycle action on a machine: create, update, or a bootstrap with a
  known list of stages.
- An image build or a collection whose phases are known before it starts.

## When NOT to use

- A flow the person walks through. Use Pagination's step indicator.
- A plan that is not known before it runs. Append rows as they happen, and
  pair the list with an indeterminate Progress rather than a [StepBar](step-bar.md).
- A single indeterminate wait. Use Spinner.
