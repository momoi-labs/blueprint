# @momoi-labs/kiso-check

## 0.1.0

### Minor Changes

- 65c1196: Add `kiso-check`, a CLI that checks a product built on Kiso against the
  console page standard. Static mode reads the sources and reports the kiso
  versions, the shell and page components each screen uses, product CSS that
  Kiso already ships, nested `.page` elements, header descriptions, buttons in
  empty states and a disabled header action. Live mode measures the running app
  with Playwright: title and first block positions, the layout box, page
  margins and the brand bar. A cases file can change the route with a hash
  after load.
