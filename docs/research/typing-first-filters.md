# Filters built by typing

Use GitLab's segmented filter editing as the interaction reference, Cloudscape's
array values for multi-value filters, and a small explicit query grammar. Keep
parsing outside ChipInput. This is a design recommendation based on official
documentation and source, reviewed on 2026-09-28. The products were not tested
with assistive technology during this research.

## The closest existing interfaces

### GitLab Pajamas filtered search

This is the closest match to the requested experience. A query has separate
field, operator, and value segments, inline with the input caret. Clicking a
segment edits that part and opens its corresponding suggestions. Field and
operator text become editable. Changing a field can preserve values when the
fields share a data type. Escape closes suggestions; ArrowDown opens them again.
Completed queries leave the next field suggestions ready.
[Filter behavior](https://design.gitlab.com/components/filter/#behavior).

Its component API supports per-field operators, `multiSelect`, and
`multiSelectValues`. The page has an inconsistency: its Content section still
describes single-value filters, while the code reference supports multiple
selection. Use the API as evidence for that capability, rather than assuming
every GitLab screen supports it. The API's "grouping tokens" means suggestion
section headers, not Boolean expression groups. Accessibility guidance is still
marked TODO on this page.
[Filter code reference](https://design.gitlab.com/components/filter/#code-reference).

My recommendation is to borrow segment editing and contextual suggestions.
Do not copy its invalid-operator fallback, which can silently choose the first
operator. An invalid filter should remain editable with a clear error.

### AWS Cloudscape property filter

Cloudscape models a condition as `propertyKey`, `operator`, and `value`. Enum
tokens hold `string[]`; other tokens can hold strings or custom values. Its
current source supports custom operators such as `in`, a global `and`/`or`, and
optional token groups nested one level. Operators and input forms are configured
per property. These are useful data and validation patterns.
[Property filter API source](https://github.com/cloudscape-design/components/blob/main/src/property-filter/interfaces.ts).

The collection hooks documentation shows multi-select enum tokens for `=` and
`!=`, with matching against several allowed values. This is evidence for list
values without requiring users to repeat one condition per value.
[Multi-select tokens](https://cloudscape.design/get-started/dev-guides/collection-hooks/#using-multi-select-tokens).

Its API describes tokens beneath the input. Treat it as a model reference;
GitLab is the closer match for the requested inline layout.

### Sentry search

Sentry provides suggestions while typing `key:value` conditions. Its list syntax
`release:[12.0,13.0]` matches either value. Explicit `AND`, `OR`, and parentheses
are available in Explore, Dashboards, and Monitors, with `AND` before `OR`.
Those capabilities vary by screen; lists exclude some keys and wildcards.
[Search syntax](https://docs.sentry.io/concepts/search/).

Sentry's search redesign explicitly supports completing queries with keyboard
or mouse and suggests both keys and values. This supports the direction of
guided typing, but its announcement does not specify every navigation key.
[Search UI announcement](https://sentry.io/changelog/improved-search-ui/).

## Specifications cover different layers

There are established filter languages and accessibility patterns. None of
these references defines the complete segmented-chip interaction as a standard.

| Reference | What it defines | Relevance here |
| --- | --- | --- |
| [RFC 7644, section 3.4.2.2](https://www.rfc-editor.org/rfc/rfc7644.html#section-3.4.2.2) | SCIM filter grammar, comparisons, Boolean operators, grouping | A real IETF RFC, but domain-specific and without a built-in `in` comparison |
| [OData 4.01 filter operations](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_BuiltinFilterOperations) | API expressions including comparisons, `and`, `or`, `not`, and `in` | Useful semantics for list membership, not a UI recipe |
| [Google AIP-160](https://google.aip.dev/160) | API filtering guidance with formal grammar | Useful reference, but its `OR` precedes `AND` and filtering can be fuzzy; copying it would conflict with SQL-like expectations |
| [W3C APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | Editable input, suggestions, keyboard and ARIA behavior | Basis for the active input, not a complete multi-chip or Boolean editor |

APG describes Enter accepting a suggestion, Escape dismissing the popup, and
arrow navigation. It warns against intercepting standard text editing keys.
We still need to define focus transitions between chip segments, list values,
and the trailing input, then test those with keyboard and screen readers.

## Recommendation for Kiso

The existing [ChipInput contract](../../kiso/docs/components/chip-input.md) assigns
meaning and parsing to the product. Preserve that boundary and existing keyboard
behavior. Prototype a filter composition first; add only reusable segment
capabilities proven necessary, without replacing current exports or callbacks.

Use these rules for the next prototype:

1. Typing `status in [open,pending]` produces one chip with three editable
   segments: `status`, `in`, and `[open,pending]`.
2. Offer field, operator, and value suggestions as each becomes relevant.
   Typing a complete condition must work without opening a separate form.
3. Commit after an explicit confirmation or unambiguous delimiter. Preserve
   incomplete text, quoted spaces, and commas inside quoted list values.
4. Keep `AND` and `OR` visible between conditions. Use SQL-like precedence and
   parentheses for grouping; never imply that a flat list evaluates left to right.
5. Store validated conditions separately from the active text draft. Represent
   `in` values as arrays. Let the product translate conditions into its query API
   or parameterized SQL.

These are proposed product decisions, not requirements imposed by the references.
Validate the typing and editing flow before adding a larger query builder.
