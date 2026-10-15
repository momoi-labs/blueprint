---
"@momoi-labs/kiso": patch
---

Lifecycle status badges keep all four borders on phones. At 720px and below the status cluster dropped its joined frame but kept the frame's clip and Pixel contour, which cut the corners of the last badge and broke its right border. The cluster now carries no clip there, and each wrapped badge takes the corner treatment and tone border of a standalone badge. At 721px and wider the joined cluster looks as before.
