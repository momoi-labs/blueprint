//! Kiso's semantic colors, resolved to sRGB for every accent and mode.
//!
//! The web loads Kiso as CSS custom properties. A terminal or native UI
//! cannot, so this crate ships the same values as plain bytes. `tokens.rs`
//! is generated from `tokens/tokens.json` by `npm run build` in the blueprint
//! repository.
//!
//! ```
//! let theme = kiso_tokens::GOLD_DARK;
//! assert_eq!(theme.link, [0xff, 0xd4, 0x5c]);
//! ```
#![no_std]

/// An sRGB color as `[red, green, blue]`.
pub type Rgb = [u8; 3];

include!("tokens.rs");

#[cfg(test)]
mod tests {
    use super::*;

    // An accent overrides the roles that follow its hue and keeps the rest.
    #[test]
    fn accent_overrides_only_its_roles() {
        assert_eq!(GOLD_DARK.background, DARK.background);
        assert_eq!(GOLD_DARK.primary, [0xf2, 0xc4, 0x38]);
        assert_eq!(GOLD_DARK.selected, [0x38, 0x2e, 0x17]);
        assert_ne!(GOLD_DARK.primary, DARK.primary);
    }

    // link points at color.accent.base, so it must follow the accent too.
    #[test]
    fn link_follows_the_accent() {
        assert_eq!(GOLD_DARK.link, [0xff, 0xd4, 0x5c]);
        assert_ne!(GOLD_DARK.link, DARK.link);
    }
}
