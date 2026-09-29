# Kiso catalog audit, 2026-09-29

The audit accounts for all **60 catalog contracts and 212 public runtime exports**.
It found eight distinct defects, tracked in #128 through #135. Coverage is complete
as an inventory of executed results and explicit gaps. This is **not full release
validation**. The remaining environment, state-combination and mapping checks are
tracked in [#136](https://github.com/momoi-labs/blueprint/issues/136).

Part of [#126](https://github.com/momoi-labs/blueprint/issues/126), delivered in
[PR #125](https://github.com/momoi-labs/blueprint/pull/125). No component fixes or
new component regression tests belong to this PR. Each confirmed issue has a
minimal reproduction, expected/actual results, source references and acceptance
assertions. Temporary fixtures, screenshots and raw logs stay outside commits.

## Revision and environment

- Initial pilot/audit revision: `67e763ea3902d77cad1f3e30dd99c22b56f54155`.
- Final tested code: `b5c874ae2191fffe9696ad28f3d0d08f3196bfbd`, PR #125 rebased
  on `97498115d3bdd210dcfadc089932f6564c374e4f` from merged
  [#127](https://github.com/momoi-labs/blueprint/pull/127). Report/skill-only
  commits after that revision do not change the tested package sources.
- Built versions: `@momoi-labs/kiso-react@0.8.1`, `@momoi-labs/kiso@0.12.1`.
  These are the versions on this branch, not the proposed release PR versions.
- macOS 26.6.2 (25G83), Darwin 25.6 arm64; Node 26.8.2, npm 11.19.1;
  Playwright 1.62.1; Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5.
- Main browser cases: Chromium at 320/390/1280 x 844, Firefox/WebKit at
  390/1280 x 844, light and dark. Supplemental cases use all three engines
  at 320/1280. Touch capability emulated below 500px; desktop uses fine pointer.
- Package CSS loaded before mount. External Google font requests blocked for
  deterministic runs, so fallback fonts apply. Browser scripts mostly use reduced
  motion; explicit animation checks use that preference. Zoom probes use CSS
  `zoom: 2`, not browser UI zoom or text-only zoom.
- Local React/Vite fixtures import the built public entry point and distributed
  stylesheet. Gallery examples also load their required gallery CSS. The separate
  package check installs npm tarballs into an isolated consumer, type-checks,
  renders and bundles CSS there.
- Actual self-host Dependencies source at
  `4845b50d5b6ae9029f5abed36d74d45499621a84` was mounted with a mocked tools API
  and callbacks. The component and dependency parser were unchanged. Repository
  ListScreen, DetailScreen and CreateScreen examples provided local form/scroll/
  retry compositions. No backend deployment or persistence was exercised.

## Release findings

Do not approve an unrestricted accessible release while the behavior and standards
failures below remain. #129 can submit a form from an empty chip field; #128 breaks
the contracted keyboard selector. #130, #133 and #134 fail explicit accessibility
requirements. #131/#132 break narrow or long-content layouts. This is an audit
recommendation, not a change to the repository's release workflow.

| Kind | Issue | Confirmed result after rebase | Impact |
| --- | --- | --- | --- |
| Behavior | [#128](https://github.com/momoi-labs/blueprint/issues/128) | ThemeSelector ArrowRight leaves System selected; three tab stops instead of one. Pointer control works. | Contracted exclusive keyboard selection unavailable. |
| Behavior | [#129](https://github.com/momoi-labs/blueprint/issues/129) | ChipInput empty Enter submits once; Escape leaves suggestions expanded. Ordinary selection works. | Unexpected form submission and failed dismissal. Distinct from #124. |
| Standards | [#130](https://github.com/momoi-labs/blueprint/issues/130) | Short ChipValue and ChipOptionAdd are about 23.6x44px; hit tests miss at +/-21px. ChipRemove passes. | Small coarse-pointer targets. |
| Layout | [#131](https://github.com/momoi-labs/blueprint/issues/131) | Actual structured Dependencies composition widens 320px document to 352px; gallery to 375px. 390/1280 controls fit. | Horizontal scrolling in ordinary narrow forms. |
| Layout | [#132](https://github.com/momoi-labs/blueprint/issues/132) | 200-character BarGauge labels widen document to 1664/1666px; Meter/Progress to 1680/1681px. All short-label controls fit. | Shared label layout cannot contain long data. |
| Standards | [#133](https://github.com/momoi-labs/blueprint/issues/133) | Light normal subtle text measures 3.476:1 on card and 3.271:1 on page; placeholders use the same 14px color. | Below 4.5:1 for normal text. Separate from fixed selected text in #124. |
| Standards | [#134](https://github.com/momoi-labs/blueprint/issues/134) | LogViewTime rgb(95,91,87) over rgb(19,18,23) measures 2.770:1 in both themes. | Timestamps are hard to read. Log body/level controls pass. |
| Consumer example | [#135](https://github.com/momoi-labs/blueprint/issues/135) | Gallery Search query Website returns zero of two matching projects; guide finds Brand guide. Real ListScreen lowercases both sides and passes. | Misleading gallery example, not a Search package defect. |

## Existing findings after merge

[#124](https://github.com/momoi-labs/blueprint/issues/124) was owned by parallel
work. Its cases stayed pending before #127 merged. This audit did not recreate
its reproductions, implementation fixes or regression tests. After merge, the
maintained tests were reused against the rebased package build.

| Existing finding | Final result and limit |
| --- | --- |
| #124 Shift+Tab accidental selection | Chromium and Firefox maintained tests pass, including disabled/empty lists and ordinary Tab/Enter controls. WebKit's backward destination assertion remains pending platform-policy verification. |
| #124 IME shortcut guards | Maintained five-target probes pass in Chromium, Firefox and WebKit, including native isComposing, composition-ref and legacy 229 signals plus ordinary Enter controls. Synthetic events only; native IME remains #136. |
| #124 edit/removal focus | Chromium/Firefox pass controlled version/option/add/remove paths. WebKit passes removal and executes Enter/Escape/confirm restoration before each blur-to-Continue assertion fails on native button click-focus policy. Do not label the full WebKit suite passed. |
| #124 long Select | Maintained Chromium CDP touch gestures reach and select first and last of 22 entries at 320/390, both themes. Scroll range, popup bounds, disabled skipping and focus restoration pass. Physical touch remains #136. |
| #124 Pagination and Splitter targets | Maintained 44px edge hit/tap/drag checks, full/compact pagination and neighboring-control checks pass in Chromium. Fine-pointer density retained. |
| #124 selected chip secondary contrast | Maintained measured contrast passes, light 12.38:1 and dark 7.96:1, in all three engines. |
| #122, closed by #123 | Full maintained Chromium FilterInput script passes prefix/group preservation, malformed drafts, completion paths and repeated DOM announcements. Firefox/WebKit portable subset passes these cases plus the four narrow/theme matrices. Neither issue is reported as open. |

The unchanged chip suite is **12/12 Chromium, 12/12 Firefox, 8/12 WebKit**.
WebKit's four failures are the backward button destination and three blur-to-button
expectations. A plain HTML button/input control also skipped buttons on Shift+Tab
and left BODY focused after clicking the button. The full WebKit result remains
failed with that qualification, pending the Safari/full-keyboard-access check in
#136. No duplicate implementation issue was filed.

The unchanged FilterInput script stops in Firefox at its compositionstart + fill
assertion. A native input event trace shows Firefox fill emits its own composition
start/update/end before input; the synthetic composition has already ended.
WebKit reaches the later Tab-to-Search assertion and skips that native button.
A scratch copy of the maintained script excluded only those two assertions and
removed Firefox's unsupported `isMobile` option. All remaining checks passed in
both engines. Those exclusions are not counted as passes. Chromium ran the
original complete script unchanged.

## Pilot and workflow changes

The four pilots ran before the catalog expansion and again after rebase. They
produced 36 case/environment observations: 34 passes and two narrow-layout failures
from the composed ChipInput (#131), not 36 component-level pass claims.

| Pilot | Observable checks | Workflow correction demonstrated |
| --- | --- | --- |
| Select | Disabled option skipped; End highlights without callback; Escape restores trigger; touch selects once; parent changes Gamma back to Alpha. | Popup visibility precedes focus settlement. Wait for actual focus/value, and reset a failed overlay before the next case. |
| ChipInput | Enabled active descendant survives list replacement; Enter calls the new option once; enclosing form does not submit on that selection. | An ordinary successful selection misses empty Enter and Escape. Add those independent assertions and record caller workarounds separately. |
| Meter / Progress | Zero versus missing, clamped 125 value/100% fill, original value text and indeterminate progress. | Numeric boundaries alone miss long row labels. Add layout data boundaries (#132). |
| Card | Caller heading/name, static root absent from tab order, busy rerender, interactive child focus and next-link Tab. | Separate caller-supplied semantics from built-in behavior. Record unresolved size/variant mapping instead of inventing an API. |

The full run added an inventory helper, explicit pending/N/A/gap states and
native browser baselines to the skill. It also exposed harness
problems: late Vite CSS caused a false initial LogView scroll failure in Firefox;
preloading distributed CSS made all 12 targeted engine/width/theme controls pass.
A fixture edit during a run caused one navigation-context failure. Its independent
rerun passed. Filter serialization assertions were corrected to the documented
spacing, then passed all 12 supplemental environments. WebKit sticky-footer
geometry differed by 0.40625px; inspection and a documented 1 CSS px tolerance
confirmed the field remained usable. The corrected screen case passed four runs.
Raw failed attempts remain in local evidence and are not implementation tickets.

## Common matrix and applicability

The inventory below inherits these common checks. A pass means the named assertion
passed, not that every possible state or composition of the export passed.

| Matrix category | Executed evidence | Remaining scope / N/A rule |
| --- | --- | --- |
| Package API | 60 catalog entries match 60 contracts; 212 built exports individually mapped below; isolated tarball install, public TypeScript and CSS checks pass. Variant helpers retain a caller class; public filter helpers have independent boundary assertions. | Exhaustive helper option combinations are not covered. Internal hooks and type-only names are not runtime inventory entries. |
| States | Named variants/transitions in the per-component and scenario tables, plus 360 gallery DOM/layout observations. | Rendering is not state validation. Optional anatomy/state combinations without an assertion remain unverified in #136, including Card size/elevated mapping. Static content has no intrinsic loading/disabled interaction; child states belong to their own contracts. |
| Layout | Every catalog example at 320/390/1280 in both themes; document bounds, runtime errors, duplicate IDs and dangling descriptions measured. Six integrated families also use CSS zoom:2. | Native/text-only zoom, intended fonts, virtual keyboard and exhaustive long-label combinations remain #136. Passing one composition does not prove all caller layouts. |
| Semantics | Named assertions below; catalog sweep found no duplicate IDs, dangling describedby references or page errors. | DOM role/name/state checks do not establish screen-reader output. VoiceOver/NVDA remains #136. |
| Focus | Interactive families have keyboard/focus assertions below; static Card tests its children. | Static text/decorations/layout wrappers have no root keymap or tab stop to validate. WebKit native-button policy cases remain pending; exhaustive focus-ring contrast remains #136. |
| Pointer | Coarse hit/edge taps on Checkbox/Switch/icon controls; merged Select/Pagination/Splitter touch checks; controlled selections in pilots and metric/time controls. | Static wrappers/text/decorations have no pointer action. Physical devices and all untested interaction edges remain #136; Chip segment failures are #130. |
| Color | 6,068 direct visible normal-text samples across 60 gallery examples in both themes; selected FilterInput/ChipInput maintained checks; explicit placeholder color inspection. | Gradient/SVG/preformatted/disabled samples excluded from the general text scan. Hover/focus/error/all-accent combinations and non-text thresholds remain #136. The '+' icon is not a 4.5:1 text failure; do not count it as one. |
| Lifecycle | Controlled rerenders, repeated opens/selection, log appends/clear, toast burst/pause/resume/unmount and repeated filter messages. | Static wrappers have no own subscriptions/callback cleanup. Long-running memory/update-rate stress and arbitrary nested overlays were not tested. No performance budget was specified. |

Profiles in the inventory identify which own interaction categories apply.
**Static** means root keyboard/pointer/callback behavior is N/A because the part
only presents content. **Layout** adds composition/scroll ownership, with controls
tested separately. **Control**, **Text**, **Overlay**, and **Scroll** require their
named focus/pointer/lifecycle paths. **Metric** adds value/range/exact-data checks;
keyboard/pointer is N/A for a passive Meter/Progress/BarGauge/Sparkline and applies
to Chart/ChartLegend inspection. Mixed profiles distinguish interactive children
or optional controlled behavior. All profiles inherit the material gaps above.

## Complete inventory

Each row links its contract. All 212 names appear exactly once in the runtime
column. The catalog and contract file sets are equal; no unlisted contract or
unmapped runtime export remains. AlertDialog shares the modal-dialog contract,
TerminalIcon belongs with BrandMark, Progress with Meter, ChartSeriesLabel with
ChartLegend, and filter-expression helpers with FilterInput. FormActions and
StepBar have their own contracts despite sharing source modules.

`useToast` is the sole public runtime hook. `useChipInput`, `useCommandPalette`
and `useIsomorphicLayoutEffect` are internal and are not package exports.
Type-only exports stay covered by the package declaration/type checks, not by
invented runtime fixtures. HelperText, IconButton and DataTable are documented
compositions, as explained in their rows.

| Contract / profile | Public runtime exports | Executed assertions, result and issue |
| --- | --- | --- |
| [accent-selector](../../kiso/docs/components/accent-selector.md) / Control | `AccentSelector`, `accents` | Pointer/tap selects Teal; preview reflects selection and stays decorative. Five exported accents match expected values. `display.appearance-pointer-control`; persistence checks in gallery tests. |
| [alert](../../kiso/docs/components/alert.md) / Static | `Alert`, `AlertContent`, `AlertDescription`, `AlertTitle`, `alertVariants` | Four tones assert one error alert and three status roles; labelled title/description IDs resolve. `display.semantics-and-states`. |
| [app-shell](../../kiso/docs/components/app-shell.md) / Layout | `AppShell`, `AppShellMain`, `ApplicationShell` | One main and page heading in topbar and sidebar compositions; current navigation works. `layout.landmarks-tables`, `structure.sidebar-and-navigation`, all three screen cases. |
| [badge](../../kiso/docs/components/badge.md) / Static | `Badge`, `badgeVariants` | Five variants remain non-interactive spans with text, not live regions. `display.decorative-parts-native-semantics`; variant helper retains caller class. |
| [bar-gauge](../../kiso/docs/components/bar-gauge.md) / Metric | `BarGauge` | Null versus zero, invalid maximum rejection and empty rows pass. Long row labels fail document bounds, [#132](https://github.com/momoi-labs/blueprint/issues/132). `metrics.zero-missing-negative-clamp`, boundaries. |
| [brand-mark](../../kiso/docs/components/brand-mark.md) / Static | `BrandMark`, `TerminalIcon` | BrandMark and nested TerminalIcon are decorative, absent from the tab order. `display.semantics-and-states`, `display.decorative-parts-native-semantics`. |
| [breadcrumb](../../kiso/docs/components/breadcrumb.md) / Layout | `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbList`, `BreadcrumbPage`, `BreadcrumbSeparator` | Navigation has the Breadcrumb name; current page has aria-current=page; ordered anatomy remains in the shell. `layout.landmarks-tables`. |
| [button](../../kiso/docs/components/button.md) / Control | `Button`, `buttonVariants` | Default button does not submit; explicit submit fires once; disabled button stays disabled. Icon target is 44x44 on coarse pointer. `form.native-submit-and-disabled`, `touch.controls-hit-and-tap`. |
| [card](../../kiso/docs/components/card.md) / Static | `Card`, `CardAction`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle` | Pilot verifies caller-supplied heading/label, child focus, busy rerender and Skeleton replacement. All optional parts mounted. Default size only; sm/lg/elevated mapping unresolved in [#136](https://github.com/momoi-labs/blueprint/issues/136). |
| [chart-legend](../../kiso/docs/components/chart-legend.md) / Metric/control | `ChartLegend`, `ChartSeriesLabel` | Independent CPU/Memory summaries distinguish zero from missing. Pressed series highlight toggles through keyboard/tap; parent replacement and table/sidebar/inline layouts pass. `metrics.summary-exact-values`, `metrics.highlight-and-layouts`. |
| [chart](../../kiso/docs/components/chart.md) / Metric/control | `Chart` | Exact-value table matches timestamps and nulls; keyboard inspection names both series; stacked gaps form separate paths with finite coordinates; invalid ranges/data reject. `metrics.*`, boundaries. No high-rate performance claim. |
| [checkbox](../../kiso/docs/components/checkbox.md) / Control | `Checkbox` | Space updates controlled state; indeterminate maps to mixed; coarse edge taps change it once. `form.checkbox-switch-control`, `touch.controls-hit-and-tap`. |
| [chip-input](../../kiso/docs/components/chip-input.md) / Text/control | `Chip`, `ChipInput`, `ChipInputBox`, `ChipInputEmpty`, `ChipInputField`, `ChipInputList`, `ChipInputOption`, `ChipName`, `ChipOption`, `ChipOptionAdd`, `ChipRemove`, `ChipScope`, `ChipValue` | Pilot verifies enabled active descendant after list replacement; 30-item list has scroll range and last item selects once; Backspace callback and actual Dependencies parent pass. Empty Enter/Escape fail [#129](https://github.com/momoi-labs/blueprint/issues/129); segment targets fail [#130](https://github.com/momoi-labs/blueprint/issues/130); 320px structured content fails [#131](https://github.com/momoi-labs/blueprint/issues/131). Merged [#124](https://github.com/momoi-labs/blueprint/issues/124) rerun separately below. |
| [command-palette](../../kiso/docs/components/command-palette.md) / Overlay/text | `CommandPalette`, `CommandPaletteEmpty`, `CommandPaletteGroup`, `CommandPaletteInput`, `CommandPaletteItem`, `CommandPaletteList` | Disabled item skipped, active ID resolves, arrow does not execute, Enter executes once, empty result cannot execute, Escape closes. `overlay.commands-replacement-empty-escape`; merged IME guards pass for all three engines. Native IME and announcements remain [#136](https://github.com/momoi-labs/blueprint/issues/136). |
| [dashboard-grid](../../kiso/docs/components/dashboard-grid.md) / Layout | `DashboardGrid`, `DashboardPanel` | Panel spans 3/4/6/8/12 become equal-width rows on narrow screens; span 12 exceeds twice span 3 on desktop; grid adds no tab stops. `metrics.grid-responsive`. |
| [disclosure](../../kiso/docs/components/disclosure.md) / Control | `Disclosure` | Native summary toggles with Enter and Space while retaining focus. `display.steps-disclosure`; no invented disclosure keymap. |
| [dot](../../kiso/docs/components/dot.md) / Static | `Dot`, `dotVariants` | Decorative dots have aria-hidden and no tab stop; reduced motion removes long animation. `display.semantics-and-states`, `display.reduced-motion`. |
| [drawer](../../kiso/docs/components/drawer.md) / Overlay | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerTitle`, `DrawerTrigger` | Two open/cancel cycles keep focus inside, cancel never invokes action, Escape returns focus to trigger. Header/body/footer and close participate. `overlay.Drawer`. |
| [dropdown-menu](../../kiso/docs/components/dropdown-menu.md) / Overlay | `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuTrigger` | Home/End skip disabled item; navigating does not invoke callbacks; Enter selects Remove once and restores trigger focus. Group/label/shortcut/separator included. `overlay.menu-keys-disabled`. |
| [empty-state](../../kiso/docs/components/empty-state.md) / Static/control | `EmptyState`, `EmptyStateActions`, `EmptyStateDescription`, `EmptyStateIcon`, `EmptyStateTitle`, `emptyStateVariants` | No-results title/icon/body/actions composition; decorative icon and Retry callback asserted. Table empty-state and list no-match/recovery compositions pass. `display.semantics-and-states`, `screen.list-filter-create-retry-cancel`. |
| [filter-input](../../kiso/docs/components/filter-input.md) / Text/control | `FilterInput`, `filterOperators`, `formatFilterScalar`, `formatFilterValue`, `getFilterSuggestions`, `parseFilterExpression`, `serializeFilterExpression`, `serializeFilterNode` | Controlled parent replacement preserves malformed draft and confirmed value, marks invalid and never submits. Full maintained Chromium regressions and portable Firefox/WebKit subset pass; helpers round-trip and preserve prefix. [#122](https://github.com/momoi-labs/blueprint/issues/122) remains closed. Native IME/AT gaps in [#136](https://github.com/momoi-labs/blueprint/issues/136). |
| [form-actions](../../kiso/docs/components/form-actions.md) / Layout/control | `FormActions` | Saving state exposes status; long Detail/Create screens keep actions reachable and retain data through failed create/retry. `form.native-submit-and-disabled`, `screen.*`; WebKit geometry uses 1px tolerance. |
| [form-field](../../kiso/docs/components/form-field.md) / Text/layout | `FormField` | Merged descriptions, stable unique ID, required error relationship, ref and caller text survive parent error/value updates. Label click focuses input. `form.ids-rerender-ref`. |
| [form](../../kiso/docs/components/form.md) / Layout/control | `Form` | Cancel does not submit; Save submits once with current text. Textarea Enter stays multiline. Long screen keyboard submission succeeds. `form.native-submit-and-disabled`, `screen.*`. |
| [header](../../kiso/docs/components/header.md) / Layout | `Header` | Topbar in ApplicationShell and Detail/Create/List compositions; main landmark and page heading remain reachable. `layout.landmarks-tables`, `structure.sidebar-and-navigation`. |
| [helper-text](../../kiso/docs/components/helper-text.md) / Static | No dedicated export; composition below. | Contract-only composition: FormField hint / small.field-hint. Hint ID remains in aria-describedby when error is added, then survives error removal. `form.ids-rerender-ref`. No standalone export expected. |
| [icon-button](../../kiso/docs/components/icon-button.md) / Control | No dedicated export; composition below. | Documented Button + btn-icon + accessible name composition. Named Add control measures 44x44 on coarse pointer; no extra runtime export. `touch.controls-hit-and-tap`. |
| [input](../../kiso/docs/components/input.md) / Text | `Input` | External value/error changes retain the field identity and focus; native form submit, disabled and label association pass. Placeholder contrast fails [#133](https://github.com/momoi-labs/blueprint/issues/133). `form.*`; native IME gap. |
| [kv](../../kiso/docs/components/kv.md) / Static | `KV`, `KVKey`, `KVValue` | DL/DT/DD tags match key/value semantics; content sits inside a bounded shell. `layout.landmarks-tables`. |
| [label](../../kiso/docs/components/label.md) / Static | `Label` | htmlFor resolves to Input; clicking the label focuses its field; IDs remain stable across errors. `form.ids-rerender-ref`. |
| [lifecycle](../../kiso/docs/components/lifecycle.md) / Control | `Lifecycle` | Status/Actions groups named; disabled Resume cannot activate; Pause/Publish/Delete remain focused and center-hit reachable. `structure.lifecycle`; maintained lifecycle script also checks edge activation and keyboard order. |
| [link](../../kiso/docs/components/link.md) / Control | `Link`, `linkVariants` | Space does not navigate, Enter changes the destination hash; focus survives unrelated form update. `form.search-edit-and-link`; variant helper retains caller class. |
| [log-view](../../kiso/docs/components/log-view.md) / Scroll/control | `LogView`, `LogViewLevel`, `LogViewLine`, `LogViewTime`, `logViewLevelVariants` | Initial/append follow, history pause preserving scrollTop=10, resume via ref and clear-to-zero pass with CSS preloaded. `scroll.log-follow-pause-resume-clear`. Timestamp contrast fails [#134](https://github.com/momoi-labs/blueprint/issues/134); late CSS is a separate unverified condition. |
| [meter](../../kiso/docs/components/meter.md) / Metric | `Meter`, `Progress` | Meter and Progress zero, negative/over-max clamping, missing/indeterminate semantics and invalid ranges pass. Pilot checks 125 text with 100% fill. Shared long-label layout fails [#132](https://github.com/momoi-labs/blueprint/issues/132). |
| [modal-dialog](../../kiso/docs/components/modal-dialog.md) / Overlay | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`, `Dialog`, `DialogBody`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` | Dialog and AlertDialog families each open/cancel twice, trap focus, restore trigger on Escape/cancel. Prevented AlertDialog action remains open without destructive callback. `overlay.Dialog`, `overlay.AlertDialog`. |
| [navigation](../../kiso/docs/components/navigation.md) / Control/layout | `Navigation`, `NavigationGroup`, `NavigationItem`, `NavigationLink`, `NavigationList` | Active link has aria-current; Enter on Two changes hash; narrow sidebar links visible. Group caption normal-light contrast fails [#133](https://github.com/momoi-labs/blueprint/issues/133). `structure.sidebar-and-navigation`. |
| [page-header](../../kiso/docs/components/page-header.md) / Layout/control | `PageHeader`, `PageHeaderDescription`, `PageHeaderTitle` | Exactly one level-one page heading, description and named New action; callback once. Long Detail screen changes heading after Save. `layout.landmarks-tables`, `screen.detail-sticky-actions-and-tabs`. |
| [pagination](../../kiso/docs/components/pagination.md) / Control | `Pagination`, `PaginationEllipsis`, `PaginationNext`, `PaginationPage`, `PaginationPrevious` | Previous disabled at first page; Next moves controlled current-page state; ellipsis hidden from AT. `scroll.tabs-controlled-panel-and-pagination`. [#124](https://github.com/momoi-labs/blueprint/issues/124) full/compact coarse targets and narrow bounds pass maintained checks after merge. |
| [popover](../../kiso/docs/components/popover.md) / Overlay | `Popover`, `PopoverAnchor`, `PopoverClose`, `PopoverContent`, `PopoverTrigger` | Open/cancel/Escape repeated with labelled content, anchor and close; trigger regains focus and no cancel callback. `overlay.Popover`. Focus trap N/A to this nonmodal composition. |
| [search](../../kiso/docs/components/search.md) / Text | `Search` | Search input value/focus survives parent change. Real ListScreen finds Website and clears no-results. Gallery Demo Search fails capitalized match [#135](https://github.com/momoi-labs/blueprint/issues/135), a consumer bug. `form.search-edit-and-link`, `screen.list-filter-create-retry-cancel`. |
| [select](../../kiso/docs/components/select.md) / Overlay/control | `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectTrigger`, `SelectValue` | Pilot keyboard skips disabled Beta without selecting, Escape restores focus, tap selects Gamma once, parent replaces it with Alpha. After [#127](https://github.com/momoi-labs/blueprint/issues/127), maintained long-list first/last touch scrolling passes at 320/390 in both themes. |
| [separator](../../kiso/docs/components/separator.md) / Static | `Separator` | Decorative default adds no separator role; nondecorative vertical separator exposes orientation. `display.semantics-and-states`, `display.decorative-parts-native-semantics`. |
| [sidebar](../../kiso/docs/components/sidebar.md) / Layout | `Sidebar`, `SidebarBody`, `SidebarFooter`, `SidebarHeader` | ASIDE anatomy contains header/body/footer once; narrow height stays within 40% of viewport and links remain reachable. `structure.sidebar-and-navigation`. Group-caption contrast fails [#133](https://github.com/momoi-labs/blueprint/issues/133). |
| [skeleton](../../kiso/docs/components/skeleton.md) / Static | `Skeleton`, `skeletonVariants` | Default/circle hidden from AT with no tab stops; Card busy composition retains interactive child focus. `display.decorative-parts-native-semantics`, pilot. Other appearance variants remain bounded by gallery observations. |
| [sparkline](../../kiso/docs/components/sparkline.md) / Metric | `Sparkline` | Accessible image label; fewer than two finite samples omits plot; normal/null data does not produce invalid coordinates. `metrics.zero-missing-negative-clamp`, `metrics.sparkline-stat-and-touch-highlight`. |
| [spinner](../../kiso/docs/components/spinner.md) / Static | `Spinner`, `spinnerVariants` | Named Loading results status has no tabindex; reduced-motion duration below 0.01s. `display.decorative-parts-native-semantics`, `display.reduced-motion`. |
| [split](../../kiso/docs/components/split.md) / Scroll/control | `Pane`, `Split`, `Splitter` | Home/End enforce 25/75 bounds; ArrowLeft changes 75 to 73, mouse drag changes size. `scroll.split-keyboard-bounds-and-mouse`. Merged [#124](https://github.com/momoi-labs/blueprint/issues/124) edge-touch drag and neighboring-control tests pass. |
| [stat](../../kiso/docs/components/stat.md) / Static/metric | `Stat`, `StatDelta`, `StatFoot`, `StatHeader`, `StatLabel`, `StatValue`, `statDeltaVariants` | Zero renders as 0; parent null becomes Not collected; label, delta and foot remain associated visually. `metrics.sparkline-stat-and-touch-highlight`; helper output checked. |
| [status-badge](../../kiso/docs/components/status-badge.md) / Static | `StatusBadge` | Running text remains with decorative pulse; motion reduction asserted. `display.semantics-and-states`, `display.reduced-motion`; gallery variants have no runtime/ID errors. |
| [step-bar](../../kiso/docs/components/step-bar.md) / Metric | `StepBar` | Failed at step 5 of 5, done/skipped to all 2 done, empty to not started; progress clamped for finite values and omitted for NaN. `display.steps-disclosure`, boundaries. |
| [step-list](../../kiso/docs/components/step-list.md) / Control/static | `StepList` | Five list items; Space on running Build changes selected/pressed state once; read-only list also mounted. `display.steps-disclosure`. Caption contrast in gallery composition fails [#133](https://github.com/momoi-labs/blueprint/issues/133). |
| [switch](../../kiso/docs/components/switch.md) / Control | `Switch` | Space updates shared controlled state and aria-checked; coarse edge tap changes once. `form.checkbox-switch-control`, `touch.controls-hit-and-tap`. |
| [table](../../kiso/docs/components/table.md) / Layout | `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow` | Caption names table, header cells use scope=col, footer has expected cells; parent zero creates empty-state row. `layout.landmarks-tables`. DataTable is a Table/Search/Checkbox/Pagination/Skeleton/EmptyState composition, not a missing export. |
| [tabs](../../kiso/docs/components/tabs.md) / Control | `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` | Arrow skips disabled tab; Home returns to Details; force-mounted input retains edited draft. `scroll.tabs-controlled-panel-and-pagination`; real Detail screen preserves saved value through Settings/Activity. |
| [textarea](../../kiso/docs/components/textarea.md) / Text | `Textarea` | Enter produces hello newline world without submitting; synthetic composition and Japanese value retain focus. `form.multiline-and-composition-probe`; placeholder contrast [#133](https://github.com/momoi-labs/blueprint/issues/133); native IME remains unverified. |
| [theme-selector](../../kiso/docs/components/theme-selector.md) / Control | `ThemeSelector` | Pointer selection works but ArrowRight neither selects nor moves focus; all three buttons remain tab stops, [#128](https://github.com/momoi-labs/blueprint/issues/128). `display.theme-keyboard-contract`. Gallery persistence/default/storage-failure tests pass separately. |
| [time-range-control](../../kiso/docs/components/time-range-control.md) / Overlay/control | `TimeRangeControl` | Invalid reversed range announces error without callback; Escape cancels and restores trigger; reopen resets draft; exact millisecond UTC apply and five-minute preset pass. `time.*`; invalid bounds/presets reject. |
| [toast](../../kiso/docs/components/toast.md) / Overlay/control | `Toast`, `ToastAction`, `ToastClose`, `ToastContent`, `ToastDescription`, `ToastProvider`, `ToastTitle`, `ToastViewport`, `Toasts`, `toastVariants`, `useToast` | useToast burst creates two notices without stealing focus; dismiss removes one; timeout removes remaining. Action fires once, focus/hover pause, resume expires, provider unmount removes notices without page errors. `toast.*`; real AT timing gap remains. |
| [tooltip](../../kiso/docs/components/tooltip.md) / Overlay | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | Focus opens named description; aria-describedby resolves to actual tooltip; Escape hides it and retains trigger focus. `overlay.tooltip-focus-escape`. Hardware hover and AT checks remain [#136](https://github.com/momoi-labs/blueprint/issues/136). |
| [validation-message](../../kiso/docs/components/validation-message.md) / Static | `ValidationMessage` | Error creates described invalid state without replacing input or dropping hint ID; removal clears error relationship. `form.ids-rerender-ref`, real failed-create/retry screen. |

## Executed browser case ledger

The independent post-merge ledger has **53 scenario groups, 734 environment
observations: 656 passed, 66 failed, 12 N/A**. The 66 failures are repeated
observations of six scenario groups owned by #128 through #132. Contrast findings
and the gallery Search finding are separate measurements, not included in this
count. No assertion-count inflation from individual DOM queries is used.

Environment sets: **A** = Chromium 320/390/1280 and Firefox/WebKit 390/1280,
both themes (14 observations). **B** = all three engines 320/1280, both themes
(12). Steps/disclosure uses A plus Firefox/WebKit 320 (18). Failures from
superseded harness attempts are described above; their corrected reruns determine
this final ledger. N/A means a coarse-pointer-only probe in a fine-pointer context.

| Scenario | Expected observable outcome and actual finding | Environment | Pass / fail / N/A |
| --- | --- | --- | --- |
| `chips.empty-enter-no-submit` | Empty Enter in enclosing form must leave submission count at zero. Actual count is 1 (#129). | A | 0 / 14 / 0 |
| `chips.escape-dismisses` | Escape must remove visible suggestions and aria-expanded; it leaves both open (#129). | A | 0 / 14 / 0 |
| `chips.list-scroll-and-backspace` | 30 options exceed viewport; ArrowUp reaches item 29, Enter calls its callback once, empty Backspace requests one removal and keeps focus. | A | 14 / 0 / 0 |
| `chips.segment-targets` | Both horizontal edges 21px from center must hit the 44px target. Short value/add targets are about 23.6px wide (#130); remove control passes. | A | 0 / 8 / 6 |
| `consumer.dependencies-add-parent-update-disabled` | Actual Dependencies adds rust once without submit, handles caller Escape, and renders disabled external node@22 replacement. | A | 14 / 0 / 0 |
| `consumer.dependencies-narrow-bounds` | Structured npm:t3 dependency must fit document. At 320px document=352px; 390/1280 controls fit (#131). | A | 12 / 2 / 0 |
| `display.appearance-pointer-control` | Theme Dark and accent Teal pointer/tap selection update their selected state and decorative preview. | A | 14 / 0 / 0 |
| `display.decorative-parts-native-semantics` | Badges remain text spans; decorative pieces add no focus stops; separator orientation and named loading status agree. | B | 12 / 0 / 0 |
| `display.reduced-motion` | Dot/step/spinner animation durations under reduced motion are below 0.01s. | A | 14 / 0 / 0 |
| `display.semantics-and-states` | Four alert tones expose one alert plus three statuses; spinner adds one status; decorative parts hidden; empty-state Retry fires once. | A | 14 / 0 / 0 |
| `display.steps-disclosure` | Step selection and failed/done/empty labels match data; native summary toggles with Enter/Space and retains focus. | A + Firefox/WebKit 320 | 18 / 0 / 0 |
| `display.theme-keyboard-contract` | ArrowRight should select Light and leave one group tab stop. Actual stays System with three tab stops (#128). | A | 0 / 14 / 0 |
| `filter.controlled-parent-and-malformed-draft` | Valid conditions confirm; malformed draft survives external confirmed-value replacement and Enter without submit; invalid state exposed. | B | 12 / 0 / 0 |
| `form.checkbox-switch-control` | Space updates controlled checked state and mixed maps to aria-checked=mixed. | A | 14 / 0 / 0 |
| `form.ids-rerender-ref` | Stable IDs/ref, label focus, merged hint/error descriptions and retained typed text through error and external value replacement. | A | 14 / 0 / 0 |
| `form.multiline-and-composition-probe` | Textarea newline does not submit; synthetic composition/Japanese value retains input focus. | A | 14 / 0 / 0 |
| `form.native-submit-and-disabled` | Cancel submits zero times; Save submits initial value exactly once; disabled fields/buttons and saving status match state. | A | 14 / 0 / 0 |
| `form.search-edit-and-link` | Search retains edited value/focus after rerender; Link Space does not navigate and Enter does. | A | 14 / 0 / 0 |
| `layout.display-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `layout.forms-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `layout.landmarks-tables` | One main/h1, current breadcrumb, DL/DT/DD, table caption/scoped headers/footer; zero rows produces EmptyState; New callback once. | A | 14 / 0 / 0 |
| `layout.layout-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `layout.metrics-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `layout.overlays-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `layout.scroll-bounds-zoom` | At native scale document fits viewport; CSS zoom:2 still permits scrolling/focusing the first five visible controls. This is layout magnification, not text-only zoom. | A | 14 / 0 / 0 |
| `metrics.constant-nonfinite-gap-stack` | Stacked null gap yields two subpaths; no NaN/Infinity coordinates; nonfinite series summarize as Not collected. | A | 14 / 0 / 0 |
| `metrics.grid-responsive` | Narrow spans collapse to equal widths, desktop span 12 is over twice span 3; grid adds no tab stops. | A | 14 / 0 / 0 |
| `metrics.highlight-and-layouts` | Keyboard highlight toggles selected series; controlled missing highlight clears; split lanes and compact/inline layout attributes agree. | A | 14 / 0 / 0 |
| `metrics.keyboard-inspection` | Keyboard chart inspection names CPU and Memory and reports the missing point. | A | 14 / 0 / 0 |
| `metrics.long-label-layout` | Unbroken 200-character gauge label must not widen page; actual width 1664px (Chromium/WebKit) or 1666px (Firefox), #132. | A | 0 / 14 / 0 |
| `metrics.sparkline-stat-and-touch-highlight` | Sparkline named; Stat zero remains zero and null becomes Not collected; legend pointer/tap toggles on then off. | B | 12 / 0 / 0 |
| `metrics.summary-exact-values` | CPU [-3,3,null] => min -3, max 3, average 0, last Not collected; Memory [0,null,6] => 0,6,3,6. Exact-value table has three timestamps, including 1970-01-01T00:00:01.000Z; SVG paths finite. | A | 14 / 0 / 0 |
| `metrics.zero-missing-negative-clamp` | Meter clamps 125/-10 to 100/0 but preserves original value text; null omits meter/marks progress indeterminate; zero remains measured. | A | 14 / 0 / 0 |
| `overlay.AlertDialog` | Open/cancel twice; Escape and cancel restore trigger; no cancellation action. Modal focus containment asserted; prevented action keeps dialog open. | A | 14 / 0 / 0 |
| `overlay.Dialog` | Open/cancel twice; Escape and cancel restore trigger; no cancellation action. Modal focus containment asserted; content and accessible name present. | A | 14 / 0 / 0 |
| `overlay.Drawer` | Open/cancel twice; Escape and cancel restore trigger; no cancellation action. Modal focus containment asserted; content and accessible name present. | A | 14 / 0 / 0 |
| `overlay.Popover` | Open/cancel twice; Escape and cancel restore trigger; no cancellation action. Nonmodal, no trap required; content and accessible name present. | A | 14 / 0 / 0 |
| `overlay.commands-replacement-empty-escape` | Initial active descendant is enabled Inspect; ArrowDown does not execute, Enter selects Open once, empty cannot run, Escape closes. | A | 14 / 0 / 0 |
| `overlay.menu-keys-disabled` | Home/End skip disabled item; navigation invokes no callback; Enter selects Remove once and restores trigger. | A | 14 / 0 / 0 |
| `overlay.tooltip-focus-escape` | Focus opens tooltip with actual description ID; Escape hides it without moving focus. | A | 14 / 0 / 0 |
| `screen.create-long-form-keyboard-submit` | Last email field stays reachable, named required data submits once and document stays bounded. | A | 14 / 0 / 0 |
| `screen.detail-sticky-actions-and-tabs` | Repository field reachable above sticky footer within 1px geometry tolerance; Save updates heading; value survives Activity/Settings switch. | A | 14 / 0 / 0 |
| `screen.list-filter-create-retry-cancel` | Website search matches, no-match recovery clears filter; failed create preserves name, retry succeeds, cancel returns trigger focus. | A | 14 / 0 / 0 |
| `scroll.log-follow-pause-resume-clear` | CSS loaded before mount: follow starts at bottom, append follows, manual scroll=10 pauses and is retained, resume works, clear resets to zero. | A | 14 / 0 / 0 |
| `scroll.split-keyboard-bounds-and-mouse` | Home/End clamp at 25/75; left reduces to 73; mouse drag changes size within bounds. | A | 14 / 0 / 0 |
| `scroll.tabs-controlled-panel-and-pagination` | Tabs skip disabled option and preserve force-mounted draft; Pagination previous disabled and Next changes current page; ellipsis hidden. | A | 14 / 0 / 0 |
| `structure.lifecycle` | Named status/action groups; disabled Resume; all enabled action centers visible and hit-tested after focus/scroll. | B | 12 / 0 / 0 |
| `structure.sidebar-and-navigation` | One main, ASIDE/header/body/footer, current link state, Enter navigation and narrow sidebar <=40% viewport height. | B | 12 / 0 / 0 |
| `time.cancel-invalid-and-utc-apply` | Reversed range produces error/no callback; Escape restores trigger; reopen resets draft; valid UTC milliseconds sent once. | A | 14 / 0 / 0 |
| `time.presets` | Five-minute preset yields 10:55 within 10:00 to 11:00 bounds and trigger name updates. | A | 14 / 0 / 0 |
| `toast.action-pause-resume-and-unmount` | Focus and hover retain toast beyond 1s lifetime; Undo fires once; leaving resumes timeout; provider unmount clears notices without later page errors. | B | 12 / 0 / 0 |
| `toast.burst-dismiss-no-focus-steal` | Two identical notifications create two notices without focus theft; dismiss one, timeout the other. | A | 14 / 0 / 0 |
| `touch.controls-hit-and-tap` | Checkbox/Switch four corners hit at +/-21px, edge tap toggles once; named icon button >=44x44. | A | 8 / 0 / 6 |

## Maintained validation and boundary evidence

These checks ran against the final rebased code. They support the assertions they
contain; their success did not override the independent failures above.

| Command/check | Result |
| --- | --- |
| `npm run check` | Pass: regenerated token output unchanged, DTCG/token/palette/reference checks. |
| `npm run check:react` | Pass: builds, metric assertions, 470 package tests and isolated tarball install/render/types/CSS. |
| `npm run check:browser` | Pass: existing lifecycle/touch/FilterInput scripts plus 12 chip and 18 selection-control tests from #127. Chromium. |
| `npm run build:gallery` | Pass after rebase. |
| `node --test apps/kiso-gallery/tests/*.test.mjs` | 8/8 pass after rebase, including appearance persistence, system reset and unavailable storage. |
| Maintained chip suite via Firefox/WebKit engine adapters | Firefox 12/12; WebKit 8/12, four native-focus assumptions unresolved as described above. |
| Maintained FilterInput portable subset | Firefox/WebKit completion/regression and 320/390 light/dark touch/layout assertions pass; two explicit exclusions, not full-suite passes. |
| Independent server/pure boundary probes | 35/35 groups pass: null/zero/negative/nonfinite metric values, invalid maxima/ranges, Chart ordering/duplicate/stack constraints, helper output/round-trip/prefix preservation, StepBar bounds and invalid time presets. |
| Shared metric label paths | 54/54 long-label observations fail across Meter/Progress/BarGauge, three engines, three widths and both themes; all 54 short-label controls fit. Separate from the main browser ledger. |
| Catalog DOM/layout sweep | 360 observations; no page errors, duplicate IDs or dangling describedby references. ChipInput overflows at 320 in both themes (#131). Rendering alone does not count as behavior evidence. |
| Inventory helper | 60 catalog entries, 60 contracts, 212 runtime names; no missing/unmapped entries. |
| Skill/report checks | Skill structure validator, relative-reference and prose checks, full inventory membership check, `git diff --check` and `npm run check:changeset` pass. |

The custom fixtures used deterministic fixed inputs, not randomized data.
For chart summary calculations, missing samples are omitted from min/max/average
but the final missing sample remains Not collected. The independently expected
CPU summary for `[-3,3,null]` is `[-3,3,0,Not collected]`; Memory `[0,null,6]`
is `[0,6,3,6]`. These expectations were compared with the rendered summary and
exact-value table, rather than copied from the implementation's calculation.

## Evidence and reproduction

The issue bodies provide durable minimal reproductions and assertions. This
report retains the revision, environment, measured results, complete export map
and case ledger. Re-run maintained checks with the commands above. Refresh the
inventory after a build with:

```sh
node .agents/skills/validate-kiso-component/scripts/inventory.mjs
```

Local scratch evidence is in ignored `artifacts/catalog-audit/`; maintained-check
logs use `/tmp/blueprint-audit-postmerge-*.log`. These paths are a handoff aid, not
publicly available CI artifacts. The temporary Vite fixtures, browser runners,
screenshots and raw result files are deliberately uncommitted under repository
rules. The following SHA-256 digests identify the final local evidence files;
the report and linked issues contain the reviewable conclusions without them.

| Local evidence file | SHA-256 |
| --- | --- |
| `inventory-postmerge.json` | `6fdf8933ddf2de742e206536ebc9614aa2b1fe857ca37d2a2445a0e108704dba` |
| `final-scenarios.json` | `2a47f25c0e0c57b03dc46f020367e45216cde242906fa4259f0afc57577ab05e` |
| `pilot-results.json` | `521dd03ce8b77f8c069bacf4f7799c160c88c327b81a5aca2d5b037a41ab7e01` |
| `catalog-results.json` | `f66cb85a244c97919f2a647d7f619a52461e88cbf07a7795ba69bd55c00e4cb4` |
| `boundary-results.json` | `4437f5c1b68da6b13ee5c59bc7c46a97e1c665957bf2e8c4667e660d8ca87d85` |
| `contrast-results.json` | `d765aa36cf4b01297587c7d57a93c53bd9279d85f741375217b36694d0ab4f60` |
| `gallery-actions.json` | `31cd39692fa02591d5fa4c73b619cf5195c40cd6dfdfa8ea16f96a909109e744` |
| `webkit-native-focus.json` | `0c44444f940c47a3e33a4bd0286ab6bda43d3707e5bb466559530cbae658802a` |
| `native-fill-composition.json` | `af894c51558f312694543017a47295921f541d4a1bbc44abea07bea10033ba3c` |

Additional local evidence: `shared-metric-labels.json`, SHA-256
`26b2e9a7958bdbdea16eb10b36ac20e271d1964ca08d935b869c55c52a3372c8`.

## Remaining gaps

[#136](https://github.com/momoi-labs/blueprint/issues/136) owns native IME, actual
screen readers, physical touch/virtual keyboard, intended fonts and true browser/
text zoom, the remaining contrast/state combinations, Card mapping clarification,
cross-browser harness assumptions and real self-host/backend integration. These
remain untested or pending verification. No closed issue or successful render is
used to mark them passed. The audit inventory is complete; the release-validation
work is not.

## Fix validation follow-up, 2026-09-29

The following evidence names the tested fix revisions and preserves the
historical audit results. Each branch started from
`ff5b2dbbd41eb87e0996a38752a308439d22196b` unless its PR lists a dependent base.
The user subsequently authorized merging the reviewed fixes. Integration
results are recorded below. Release PR #115 remains unmerged.

Environment: macOS 26.6.2 arm64, Node 26.8.2, Playwright 1.62.1,
Chromium 151.0.7922.34, Firefox 153.0, and WebKit 26.5. Package versions remained
`@momoi-labs/kiso-react@0.8.1` and `@momoi-labs/kiso@0.12.1`. Browser checks used
fallback fonts. Touch was emulated; CSS magnification is recorded separately
from native browser and text-only zoom.

| Issue and PR | Tested revision | Before | Fix evidence |
| --- | --- | --- | --- |
| #129, [#138](https://github.com/momoi-labs/blueprint/pull/138) | `72b75f823b0b492c9853d5952638ea006d94cc9e` | Empty Enter submitted the form; Escape retained suggestions in both themes. | Maintained ChipInput suite 18/18 in Chromium and Firefox, including the original 12 regressions. New issue cases 6/6 in WebKit across two runs. Empty Enter, Escape, retained draft/focus, cleared active descendant, reopening and caller free-text handlers pass. Review caught and fixed scrolling the last option before the hidden list rendered; an independent probe confirms visibility after reopening. Chromium also covers 320px and 1280px. |
| #128, [#139](https://github.com/momoi-labs/blueprint/pull/139) | `2fd82d80b025312d1b6052ee438aaa0b7bb49817` | ArrowRight kept System selected and all three buttons were tab stops in 12 engine/theme/width combinations. | New suite 8/8 per engine. Radio semantics, all four arrows, wrapping, Tab/Shift+Tab, callback counts, controlled replacement, form isolation, focus styling and coarse targets pass. The actual Appearance page passes persistence and reset in 12 combinations. |
| #130, [#140](https://github.com/momoi-labs/blueprint/pull/140) | `7f9cae5467add76a3a0989b02b88eb2cdfd2712b` | Short editable segments measured 23.61px wide at 320/390px in both themes. | Maintained suite 23/23 in Chromium and Firefox; WebKit issue subset 11/11. Value, option, add and editor targets meet 44px minimums under coarse pointers, with edge hit tests and taps. Fine-pointer sizing stays compact. Linux Chromium rounded a fractional edge tap into its neighbor; the corrected harness retains fractional DOM probes and taps whole pixels inside each edge. Final Linux CI passes. |
| #131, [#143](https://github.com/momoi-labs/blueprint/pull/143) | `2ceb5683ae537af9742fc5c635b8cbcd17e2db7b` (Chromium); `86789a4d65a5e786738f92de6c7b4f6e07b0864a` (Firefox/WebKit) | With #130 applied, the supplied dependency widened a 320px coarse document to 396px; long values reached 785px. | ChipInput suite 33/33 in Chromium; Firefox 31 passed with two Chromium-only gesture cases skipped; WebKit issue subset 19/19. Narrow columns, long values, editing/removal, and separate chip wrapping pass in both themes and pointer modes. CDP touch gestures reach both ends, followed by an unassisted removal tap. The audited Dependencies consumer snapshot `4845b50` passes 18 engine/theme/width combinations with mocked API effects. |
| #132, [#141](https://github.com/momoi-labs/blueprint/pull/141) | `aec572bb962cffbae5090880389b633ebc6956ef` | All 39 long-label cases failed per engine; all 36 short-label controls passed. | Suite 75/75 per engine for Meter, Progress and BarGauge. Covers 320/390/1280px, both themes, CSS 100%/200% magnification, standalone and dashboard cards, zero/missing/negative/over-limit values, containment and label/value separation. |
| #133, [#146](https://github.com/momoi-labs/blueprint/pull/146) | `37905ea8245269cb41dee9eaa4aed812add62a99` | Light text minimum 3.271:1; dark popover group labels 3.766:1. | Eight cases pass per engine across both themes, covering small labels, placeholders, chip syntax and empty options in normal/hover states, legacy chart axes and separate 3:1 icon controls. Light minimum is now 6.019:1; dark popover minimum is 4.986:1. Actual Sidebar, Split and StepBar consumers pass 36 engine/theme/width combinations. Approved contract descriptions changed; token values and aliases did not. |
| #134, [#147](https://github.com/momoi-labs/blueprint/pull/147) | `96892c9b3c149394d18a29c2b04fde8720307552` | Timestamp contrast 2.770:1 in both themes; all four baseline cases fail. | Four cases pass per engine at 320/1280px in both themes. Timestamps reach 5.097:1; main/info/warn/error colors remain unchanged. Actual LogView and DetailScreen Activity consumers pass 24 engine/theme/width combinations, checking 7 and 60 timestamps respectively. |
| #135, [#137](https://github.com/momoi-labs/blueprint/pull/137) | `0c52f180208d5fb02f3976cb5bd018563cc6e424` | All four Chromium theme/width cases returned no matches for Website. | Actual production gallery test passes 4/4 per engine at 390/1280px in both themes. Website/website/WEBSITE, guide, unknown query, empty feedback and clear/focus assertions pass. Full gallery suite 12/12 in Chromium. |
| #136 FilterInput harness, [#142](https://github.com/momoi-labs/blueprint/pull/142) | `d889f50b0cc58c4b8ee0be2f4448e0514db52164` | The unchanged script passed Chromium, failed Firefox's synthetic-composition assertion, and failed WebKit's Tab-to-Search assumption. | The full script passes each engine's desktop cases and all four 320/390px light/dark touch matrices. It fills before opening synthetic composition, asserts no commit on Space during composition, and keeps the post-composition commit check. A native input/button/input probe determines the exact expected Tab destination. No cases are duplicated or excluded. |

After user review, PRs #137, #138, #139, #140, #141, #142 and #143 were
merged using rebase-and-merge. The resulting main revision is
`7cc19f1c070f4bd424f12a8f2c48102c613e35df`. Its Git tree matches the tested
integration revision `2f1766b43217f776e7ea5bd5c854c4c53d5b7a45` from #141.
The only rebase conflict was the browser command list; both ThemeSelector and
metric-label checks were retained. The integrated branch passed the complete
Chromium browser gate, 470 React tests, gallery 12/12, token/package/type/CSS
checks, isolated tarball installation and the deploy dry run. Metric checks
passed 75/75 in each engine again, and Linux CI passed before merge.

The ChipInput PRs used one implementation owner and a dependent review stack:
#138, then #140, then #143. GitHub merged that stack in dependency order.

#143's Linux gesture diagnosis compared ChipInput with a plain HTML scroller.
CDP `synthesizeScrollGesture` left both at zero scroll, while
`dispatchTouchEvent` moved the plain control to 244px of its 245px range.
The maintained test now dispatches touch start/move/end events, as the existing
Splitter tests do. This correction changes the Chromium gesture harness only. The Firefox/WebKit
results and screenshots remain tied to the preceding layout revision.

Each component fix PR links uploaded before/after screenshots and the required
patch changeset. #135 changes only the consumer example and its test, so its
changeset check correctly reports no published source changes. Screenshots and
temporary probes remain outside commits.

#142 changes only the browser harness. It requires no changeset or component
screenshots. Firefox uses `hasTouch` without unsupported `isMobile`; these
runs establish touch-viewport behavior, not physical mobile-device behavior.
The baseline failure logs remain available and the original audit remains
unchanged above.

The package fixes passed token validation, package build, TypeScript, CSS
bundling, isolated tarball installation, the applicable maintained browser
checks and the changeset gate. #122 and #124 regression assertions remain in
place. PR descriptions contain the commands and any narrower browser subsets;
a subset pass is not a full suite pass.

PRs #146 and #147 remain open for review. The user approved their #133 and
#134 contract corrections on 2026-09-29 under
`kiso/AGENTS.md`. They reuse existing tokens: `muted-foreground` for small text
and placeholders, and `neutral-500` for timestamps on the fixed dark log
surface. Token values and aliases remain unchanged. The original proposal
evidence remains linked from each issue. The table records the contrast
revisions tested before integration; their PR descriptions track later rebases.

### Remaining verification

The unavailable environments in #136 remain pending: native IME, actual
screen-reader announcements, physical touch and software keyboards, intended
fonts with native/text zoom, exhaustive states and accents, Card mapping, and
real self-host/backend integration. The earlier WebKit ChipInput button-focus
limitations remain pending actual Safari full-keyboard-access verification.
The merged fixes do not close these gaps or authorize the release.
