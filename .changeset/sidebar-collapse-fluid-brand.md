---
"@momoi-labs/kiso": patch
---

Keep the sidebar header's block size on collapse when the brand has a fluid width, such as `<img style="width: 100%">`. The hidden `.sidebar-expanded-content` in the header now keeps its expanded inline size instead of `inline-size: 0`, so a brand sized by its container keeps its height and navigation icons stay in place.
