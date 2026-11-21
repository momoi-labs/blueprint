---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
"kiso-tokens": minor
---

Alert gets `appearance="loud"`: a solid status fill with hazard tape and a filled icon, for blocking incidents. Alert also gets `tape`, `animated`, `pulse`, `placement="overlay"` (rendered in a portal on `document.body`, one at a time, "+N" for the rest), `onDismiss` with a rendered Dismiss button, `AlertDetails`, a disclosure, and `AlertLabel`, `AlertMessage` and `AlertMeta` for a caps label, a mono message and a caps mono meta line. Toast gets `appearance="loud"`, and `notify` takes `{ appearance, pulse }` as a fourth argument; a loud error Toast stays until dismissed. New tokens: `danger-solid`, `warning-solid`, `info-solid`, `success-solid` with their `-foreground` pairs, and `tape`.
