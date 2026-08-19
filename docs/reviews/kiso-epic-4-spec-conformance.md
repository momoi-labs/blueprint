# Kiso epic #4 Spec conformance review

## Review boundary

- Spec: GitHub issue #4, Product Patterns + Data-heavy Interfaces.
- Conformance issue: GitHub issue #33.
- Fixed point: `2c36e79` (epic #3 component catalog complete).
- Integrated tip reviewed: `origin/main` at `5330e52`.
- Review range: `git diff 2c36e79...origin/main`.
- Preconditions: issues #29, #30, #31, and #32 were confirmed `CLOSED`
  with `gh` before the review began.
- Axis: Spec only.

## User-story accounting

| # | Classification | Evidence |
|---:|---|---|
| 1 | SATISFIED | The canonical rule composes Search, filters, Pagination, and EmptyState in `kiso/docs/patterns/list-detail.md:15-23`. |
| 2 | SATISFIED | Filter state and its composition with the list controls are specified in `kiso/docs/patterns/filtering.md:108-128`. |
| 3 | SATISFIED | Virtualization, sticky headers, and the pagination/virtualization choice are specified in `kiso/docs/patterns/large-data-tables.md:28-35,106-121`. |
| 4 | SATISFIED | The first-use empty state provides a clear create action in `kiso/docs/patterns/empty-states.md:34-38`. |
| 5 | SATISFIED | List-detail preserves selection and context and defines responsive navigation in `kiso/docs/patterns/list-detail.md:42-56,90-105`. |
| 6 | SATISFIED | Search defines a consistent focus shortcut and mandatory result highlighting in `kiso/docs/patterns/search.md:118-127,142-146`. |
| 7 | SATISFIED | Sorting defines the cycle, visual indicator, and `aria-sort` in `kiso/docs/patterns/sorting.md:20-39,47-54`. |
| 8 | SATISFIED | Loading lists and tables use Skeleton rows rather than a central Spinner in `kiso/docs/patterns/loading.md:9-15,28-34`. |
| 9 | SATISFIED | CRUD covers create, edit, delete, and their states in `kiso/docs/patterns/crud.md:3-15,41-66`. |
| 10 | SATISFIED | CRUD composes ValidationMessage and Alert failures using what/why/now in `kiso/docs/patterns/crud.md:21-29,76-82`. |
| 11 | SATISFIED | Destructive actions require confirmation, explain consequences, and handle failure in `kiso/docs/patterns/destructive-actions.md:36-55,94-113`. |
| 12 | SATISFIED | High-risk confirmations explain risk and require explicit acknowledgment in `kiso/docs/patterns/confirmations.md:36-47,129-138`. |
| 13 | SATISFIED | Permission denied is a distinct state with blocked/why/access guidance in `kiso/docs/patterns/permission-denied.md:26-43,71-84`. |
| 14 | SATISFIED | Numeric values and headers are right-aligned with tabular numbers in `kiso/docs/data-interfaces.md:14-22,38-40`. |
| 15 | SATISFIED | `0`, `NULL`, and unknown are rendered distinctly in `kiso/docs/data-interfaces.md:72-94`. |
| 16 | SATISFIED | Dangerous values preserve the raw value and add a danger marker/token and risk Tooltip in `kiso/docs/data-interfaces.md:120-144`. |
| 17 | SATISFIED | Copy is required for identifiers and SQL and copies the exact source value in `kiso/docs/data-interfaces.md:202-220`. |
| 18 | SATISFIED | Code and SQL use the mono/code role with a defined v1 syntax treatment in `kiso/docs/data-interfaces.md:146-165`. |
| 19 | SATISFIED | Truncation uses ellipsis, full-value reveal, and exact-value copy in `kiso/docs/data-interfaces.md:177-200`. |
| 20 | SATISFIED | Comparisons show before/after and distinguish added, removed, and changed values in `kiso/docs/data-interfaces.md:230-257`. |
| 21 | SATISFIED | Units are consistent per column/group and optional conversion is specified in `kiso/docs/data-interfaces.md:42-70`. |
| 22 | SATISFIED | Warnings for out-of-range or degraded values do not rely on color alone in `kiso/docs/data-interfaces.md:105-118`. |
| 23 | SATISFIED | The command palette is keyboard-first and has an accessible alternate trigger in `kiso/docs/patterns/command-palette.md:11-15,29-47,103-109`. |
| 24 | SATISFIED | Shortcut discoverability is mandatory and `?` opens the legend in `kiso/docs/patterns/keyboard-shortcuts.md:11-17,29-36,92-114`. |
| 25 | SATISFIED | Onboarding guides initial setup, explains why, and preserves progress/recovery in `kiso/docs/patterns/onboarding.md:30-45,49-57`. |
| 26 | SATISFIED | Friendly/Raw defaults to friendly while keeping raw values exact and copyable in `kiso/docs/patterns/developer-oriented-interfaces.md:35-47,118-150`. |
| 27 | SATISFIED | Responsive tables retain essential columns and disclose secondary data in `kiso/docs/data-interfaces.md:259-292` and `kiso/docs/patterns/large-data-tables.md:88-103`. |
| 28 | SATISFIED | The shell defines persistent Header, Sidebar, main content, and narrow behavior in `kiso/docs/patterns/application-shell.md:20-23,36-44`. |
| 29 | SATISFIED | Authentication covers sign-in, recovery, SSO, error, and success flow in `kiso/docs/patterns/login-authentication.md:32-59`. |
| 30 | SATISFIED | Dashboard specifies Cards/widgets, density, independent loading, and drill-down in `kiso/docs/patterns/dashboard.md:17-25,41-62`. |
| 31 | SATISFIED | Settings defines form layout, explicit/immediate save models, and feedback in `kiso/docs/patterns/settings.md:14-24,31-63`. |
| 32 | SATISFIED | Errors mandatorily follow what/why/now and provide a concrete action in `kiso/docs/patterns/errors.md:28-45,47-68`. |

Result: 32 `SATISFIED`, 0 deliberate deviations, and 0 deferred. Every
story is accounted for. The ADR inventory contains only `docs/adr/_template.md`,
so no deliberate deviation applies.

## Spec findings

### Missing or partial requirements

None among the 32 user stories. The absent `kiso/docs/patterns/README.md` is not
a finding in this review because issue #4 explicitly reserves that index for
the final implementation slice blocked by #33.

### Apparently implemented but incorrect

The pattern content satisfies the stories, but two coverage headers assert
false traceability:

- The spec assigns story #9 to CRUD and story #19 to truncation. However,
  `kiso/docs/patterns/search.md:7` claims coverage of `#6, #9, #19`; only #6
  belongs to Search.
- The spec assigns story #11 to destructive deletion. However,
  `kiso/docs/patterns/pagination.md:9` claims coverage of `#3, #11`; only #3
  belongs to Pagination.

These incorrect references do not change the 32/32 accounting because stories
#9, #11, and #19 are satisfied by their correct documents. They should be
corrected during epic #4's final consistency slice.

### Scope creep

The review range also changes 34 component documents,
`.github/workflows/token-checks.yml`, and
`scripts/check-component-token-refs.mjs`. Those changes exceed issue #4's two
deliverables (pattern documents and `data-interfaces.md`) and touch component
documentation, which the spec lists as out of scope. They appear to repair
token references in support of the new documents, but they remain work not
requested by epic #4.
