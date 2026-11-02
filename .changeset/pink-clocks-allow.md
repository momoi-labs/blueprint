---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add independent None, Hard and Soft panel shadows. Direction follows each
panel's local border, while borders, marks and status colors stay independent.
Pixel, Manga and Brush casts follow their silhouettes without filtering
content or darkening translucent interiors. React panels include the paint
layer; native frames can use the exported PanelShadow component.

Add Diagram shadowStyle overrides on lanes, nodes and node groups. Omitted
or auto settings retain legacy elevation. Keep surface-owned legacy casts
in contact with antialiased borders in both themes.
