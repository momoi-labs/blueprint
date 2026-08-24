# Brand — Momoi Labs Product Identity

Kiso (基礎, "foundation") is Momoi Labs' design system for **products**. This
document defines what "Momoi" means visually in a product interface — the
personality that every screen inherits.

It is **not** the marketing brand. The marketing site (momoi-labs.dev) has its
own brand assets, logo usage, and experimental aesthetics. Kiso borrows the
*spirit* of the site, not its literal surface.

## Personality

Momoi's product identity is **practical, technical, open, calm, precise,
useful, curious, human, understated.**

| Trait | What it means in a product UI |
| --- | --- |
| **Practical** | Every element serves a purpose. Nothing is there just to look good. |
| **Technical** | Comfortable with dense data, monospace, and precise values. Speaks the developer's language. |
| **Open** | Transparent about what the system is doing. No hidden state, no mystery. |
| **Calm** | Low visual noise. Whitespace and hierarchy do the work, not color shouting. |
| **Precise** | Exact labels, exact values, exact states. "About 3" is not a Momoi number unless the data is genuinely approximate. |
| **Useful** | The interface helps you do something. Decoration that does not help is removed. |
| **Curious** | Invites exploration and experimentation, especially in small experimental products. |
| **Human** | Written by two people, not a committee. The voice acknowledges humans built and use this. |
| **Understated** | Confident enough not to show off. Lets the work speak. |

## What Momoi is not

- **Corporate.** No enterprise-flat, no stock-photo warmth, no "powered by"
  flourishes.
- **Marketing-heavy.** No hero gradients, no call-to-action urgency, no
  growth-hack copy in the product.
- **Flashy.** No gratuitous animation, no neon accents, no decorative
  glassmorphism. Motion serves feedback, not delight for its own sake.

## Relationship to the marketing site

The marketing site has a **terminal aesthetic**: dark background, monospace
accents, terminal-flavored copy ("~/ABOUT" navigation, "$ export THEME=light"
theme toggle, "Small, unfinished, useful.").

For products, the site is a **vibe reference, not a literal spec**:

- **Extract:** the directness, the structure, the comfort with technical
  language, the understated confidence.
- **Tone down:** the literal terminal flourish. Product UI does not prefix
  navigation with "~/" or frame actions as shell commands. Directness and
  structure are universal; terminal flourish is reserved for chrome and
  metadata only (see [voice-and-tone.md](./voice-and-tone.md)).

The site is more experimental than products need to be. Products are lived in;
the site is visited.

## Accessibility

Product UIs must meet **WCAG AA** contrast for all text. The marketing site's
violet accent (`#9184d9`) is acknowledged as insufficient for normal text
against the site's dark background (~3.8:1). This is acceptable for the
marketing site's experimental surface but **not** for products.

Kiso's token palette (a later epic) calibrates neutrals and accent to AA-safe
levels. The brand commitment — accessible contrast as a default, not an
afterthought — starts here.

## Palette direction (conceptual, not values)

Kiso's palette is dark-first, with a light alternate, mirroring the marketing
site's spirit:

- **Dark theme** is the reference surface: the one the palette is designed
  against. It is not the default *setting* — the default is to follow the
  operating system. See [ThemeSelector](components/theme-selector.md).
- **Light theme** ("slate") is a first-class alternate, not an afterthought.
- **Neutrals** carry the interface; one **accent** carries attention.
- **Inter** for interface text, **JetBrains Mono** for code and data values.

Exact token values land in the tokens epic. The brand direction: a calm,
high-contrast dark surface where one accent does focused work.

## When this document is the authority

Use this document when:

- Deciding whether a UI element "feels Momoi."
- Choosing between two visual directions and needing a tie-breaker grounded in
  personality.
- Onboarding a new product or screen to the Momoi product family.

For *design rules* (useful over decorative, clarity over cleverness, etc.), see
[principles.md](./principles.md). For *how copy sounds*, see
[voice-and-tone.md](./voice-and-tone.md).

---

*Small lab, not a 200-person design team. Keep this short. Grow it through real
product use.*
