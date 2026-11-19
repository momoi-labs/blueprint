# @momoi-labs/kiso-check

Checks a product built on Kiso against the console page standard. The
standard is `skills/kiso-page/references/console-pages.md` in the blueprint
repository. The check ids match `skills/kiso-audit/references/checks.md`.

It has two modes. Static mode reads the sources. Live mode measures the
running app in Chromium.

## Install

```sh
npx @momoi-labs/kiso-check <dir>
```

Or add it to the project:

```sh
npm install --save-dev @momoi-labs/kiso-check
```

It needs Node 24 or later. Live mode also needs `playwright` and its
Chromium. The package does not install them. Without them, live mode prints a
message and exits 2.

```sh
npm install --save-dev playwright
npx playwright install chromium
```

kiso-check loads playwright from `KISO_PLAYWRIGHT_FROM`, then from the
current folder, then from its own install.

## Static mode

```sh
npx @momoi-labs/kiso-check web/src
npx @momoi-labs/kiso-check web/src --json
```

It reads `.tsx`, `.jsx`, `.ts`, `.js` and `.css` files under the folder. It
skips `node_modules`, `dist`, `build`, `coverage`, `generated`, hidden
folders, `.d.ts` files, and test, spec, story and generated files.

A screen file renders `PageHeader`, `ListPage`, `FormPage`, `DetailPage` or
`ConsoleShell`. A shell file renders `ConsoleShell` or `ApplicationShell`.

| Id | Finding |
| --- | --- |
| P1 | `@momoi-labs/kiso` 1.10.0 or older, or `@momoi-labs/kiso-react` 0.32.0 or older. Read from the nearest `package-lock.json`, else from `node_modules`. A workspace link is not checked. |
| P2 | A local `ConsoleShell`, a `ConsoleShell` imported from another package, or a shell built from `ApplicationShell`. |
| P3 | Product CSS on what Kiso ships: `.sidebar-header`, `.topbar`, `.app-shell`, `.app-shell-phone-brand`, `[data-width]`, `.detail-tabs`, `.card-content > .empty`, `--app-shell-brand-inset`, an inset `--color-primary` stripe, nav icon padding, `.page-header` height, `.form-page` radius. |
| S1 | A local `ListPage`, `FormPage` or `DetailPage`, or one imported from another package. |
| S2 | `className="page"` or `<Page>` outside the shell files, when the project has a shell. |
| S3 | `PageHeaderDescription`. |
| S4 | A `Button` in an `EmptyState`, an `action` prop on `EmptyState`, or `EmptyStateActions` with content. |
| S5 | A `disabled` Button in the `PageHeader` `actions`, or `disabled` in an `action={{ ... }}` prop. |

The output lists each screen and shell file with what it renders and imports,
and each finding as `id file:line message`. The kind of a screen (list,
detail, form, other) is not guessed. The `kiso-audit` skill does that.

Static mode reads code with patterns, not a full parser. Read the lines
before you act on a finding.

## Live mode

```sh
npx @momoi-labs/kiso-check --cases cases.txt --base http://127.0.0.1:5173/
npx @momoi-labs/kiso-check --url http://127.0.0.1:5173/clusters --url form:left=http://127.0.0.1:5173/clusters/new
```

It runs four measurements. Pick some with `--only jump,layouts`.

| Measurement | Pass |
| --- | --- |
| `jump` | One `.page`. Title top and first block top equal on every page, per width. 1280 px by default. |
| `layouts` | The header and blocks sit in the box for the case's kind and layout: header top and height, first block top, start and end edges, at most 880 px (720 px for a form). 1280 and 390 px, light and dark. |
| `margins` | The page meets the sidebar and the viewport edge. Blocks keep the page padding. At 699 px or less every block has the padding on both sides. No sideways scroll. |
| `brand` | The header band, sidebar bar, stripe, symbol, lockup and nav icons at 1280 px expanded and collapsed and at 390 px. Then title and first block top on two pages, one with a header action and one without. |

A screen that has no `.page` after 30 seconds fails its case.

`jump` and `margins` measure each distinct url once. They ignore the action
column. `layouts` measures each case and runs its action.

Brand takes its two urls in this order:

1. `--brand` and `--brand-other`;
2. the first list case and the first form case without an action;
3. the first and second `--url`.

A `--url` is a page url or `<kind>:<layout>=<url>`. With a plain url,
`layouts` guesses the kind from the page: `.form-page` or a `form` child of
`.page` is a form, `.detail-tabs` is a detail, anything else is a list. It
takes the layout from the first `data-width` under `.page`, else the kind's
default: `left` for a form, `full` for the others. The output marks these
cases as guessed.

Options:

| Option | Default | Use |
| --- | --- | --- |
| `--widths` | jump 1280, others 1280,390 | Viewport widths for jump, layouts and margins |
| `--themes` | light,dark | Themes for layouts |
| `--theme` | none | Theme for jump and margins |
| `--phone` | 699 | Widest width margins treats as a phone |
| `--shots <dir>` | none | Brand saves three screenshots there |
| `--table` | off | Layouts prints every measured box |
| `--verbose` | off | Margins prints every block |
| `--json` | off | Print one JSON object |

## Cases file

One case per line. Lines that start with `#` are comments.

```text
# kind layout url [action]
list full ?phone-frame#example/crud/list
form left ?phone-frame#example/crud/edit
detail full ?phone-frame#example/crud/detail/full/nodes
list left /clusters [data-switch-layout="left"]
list left ?phone-frame#example/crud/list/full #example/crud/list/left
```

- kind: `list`, `form` or `detail`.
- layout: `left`, `center`, `right` or `full`.
- url: relative urls resolve against `--base`.
- action, optional: a value that starts with `#` is set as `location.hash`
  after load, with no reload. Anything else is a selector to click.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | No findings, every measurement passes |
| 1 | A finding, or a failed measurement |
| 2 | Bad usage, a runtime error, or no playwright in live mode |

## Use in CI

Static mode needs only Node:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
- run: npx @momoi-labs/kiso-check web/src
```

Live mode needs the app running and Chromium installed:

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm run build && (npm run preview -- --host 127.0.0.1 --port 4173 &)
- run: for i in $(seq 30); do curl -sf http://127.0.0.1:4173/ && break; sleep 1; done
- run: npx @momoi-labs/kiso-check --cases kiso-cases.txt --base http://127.0.0.1:4173/
```
