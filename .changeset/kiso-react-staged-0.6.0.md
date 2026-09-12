---
"@momoi-labs/kiso-react": patch
---

republish ApplicationShell topbar after npm staged 0.6.0

Trusted publishing staged @momoi-labs/kiso-react@0.6.0 with provenance but
the registry never finalized that version (E409 on retry). Ship 0.6.1 with the
same topbar layout so consumers can install from npm.
