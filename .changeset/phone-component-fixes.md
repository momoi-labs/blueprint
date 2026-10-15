---
"@momoi-labs/kiso": patch
"@momoi-labs/kiso-react": patch
---

Fix components that broke on phone screens. Fields use 16px text on touch
screens, so iOS no longer zooms the page when one takes focus. A long chip
keeps its remove button in reach, chip suggestions scroll into view, and
editing a chip value no longer hides its first letter. A toast fits a 320px
screen. Tab labels keep their width, the strip scrolls inside itself, and a
disabled tab looks disabled. A breadcrumb wraps and its links take touch
height. Page actions go under the title below 560px. Table numbers keep their
unit on one line. A side drawer keeps fields under their labels. A
controlled command palette returns focus to the control that opened it. On
touch, a pane header scrolls the page and a grip moves the pane. Placeholders
stay muted over patterned backgrounds. Accent pills and DetailSelect
illustrations fit touch screens.
