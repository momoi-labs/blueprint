# Kiso React

React components that use Kiso's tokens and CSS, adapted from shadcn/ui with
Radix handling interactive behavior. Requires React 19 and React DOM 19.

```sh
npm install @momoi-labs/kiso-react
```

Import the stylesheet once, before application overrides:

```tsx
import '@momoi-labs/kiso-react/styles.css';
import { Button, FormField } from '@momoi-labs/kiso-react';

export function ApplicationForm() {
  return (
    <form>
      <FormField name="name" label="Name" hint="Choose a unique name." required />
      <Button type="submit" variant="primary">Save</Button>
    </form>
  );
}
```

`@momoi-labs/kiso` is a regular dependency. The stylesheet imports its tokens
and component layer; consumers do not need to import those again. React and
React DOM are peer dependencies supplied by the application. No Tailwind setup
is required. The Kiso base stylesheet includes global styles and Google Fonts.

## Available components

- Button and `buttonVariants`; Badge and `badgeVariants`.
- BrandMark and TerminalIcon, the momoi-labs terminal prompt glyph.
- Input, Label, Checkbox, and FormField.
- Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter.
- Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption.
- AlertDialog, Trigger, Portal, Overlay, Content, Header, Footer, Title,
  Description, Action, and Cancel (each prefixed with `AlertDialog`).
- ThemeSelector, a controlled selector. The application owns theme persistence
  and applies `data-theme="light"` or `data-theme="dark"` to the document root.
  Remove the attribute for system mode.

Button variants are `default`, `primary`, `destructive`, and `ghost`; sizes are
`xs`, `sm`, `md`, and `lg`. Badge variants are `neutral`, `info`, `success`,
`warning`, and `danger`. Native props and refs pass through to the underlying
control. FormField adds `label` and optional `hint` to Input's props.

Compose confirmations with AlertDialogTitle and AlertDialogDescription inside
AlertDialogContent, plus AlertDialogCancel and AlertDialogAction. For asynchronous
actions, control `open` and prevent the Action's default click behavior until the
operation succeeds. Application code owns pending, error, and retry states.

BrandMark takes a letter or a single SVG icon as `children`. It hides itself
from assistive technology; keep the product name beside it. SVG children get
the existing `icon icon-sm` classes. Custom icons must forward `className`.

```tsx
import { BrandMark, TerminalIcon } from '@momoi-labs/kiso-react';

<div className="brand">
  <BrandMark>S</BrandMark>
  <span>self-host</span>
</div>
<div className="brand">
  <BrandMark><TerminalIcon /></BrandMark>
  <span>self-host</span>
</div>
```

The gallery covers all 36 Kiso catalog entries. Entries labelled Composition
preview are examples, not additional exports from this package. CommandPalette
is a layout preview without complete command keyboard behavior.

## Development

From the repository root, run `npm ci`, then `npm run prototype`.
The console opens at <http://127.0.0.1:5173/#overview> and the component gallery at
<http://127.0.0.1:5173/#components>. All console data is simulated in memory.

`npm run check:react` builds the demo and tests packed npm artifacts in an
isolated consumer, including TypeScript, CSS bundling, and rendered semantics.

See [Publishing Kiso](../../docs/publishing.md) for releases. Adapted shadcn/ui
code retains its upstream MIT notice in `SHADCN-LICENSE`.
