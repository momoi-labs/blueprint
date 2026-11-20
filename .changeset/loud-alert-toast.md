---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
"kiso-tokens": minor
---

Alert gets `appearance="loud"`: a solid status fill with hazard tape and a filled icon, for blocking incidents. Alert also gets `tape`, `animated`, `pulse`, `placement="overlay"` (one at a time, "+N" for the rest), `onDismiss` with a rendered Dismiss button, and `AlertDetails`, a disclosure. Toast gets `appearance="loud"`, and `notify` takes `{ appearance, pulse }` as a fourth argument; a loud error Toast stays until dismissed. New tokens: `danger-solid`, `warning-solid`, `info-solid`, `success-solid` with their `-foreground` pairs, and `tape`.
