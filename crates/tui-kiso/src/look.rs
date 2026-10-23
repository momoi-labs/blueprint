use ratatui::text::Span;

use crate::{blend, Theme};

/// A repeating pattern for the title line or a section rule. Ghostty draws
/// all of them itself, without the font, except `Dots`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Pattern {
    /// `░`
    Shade,
    /// `╱`
    Hatch,
    /// `╲`
    Backslash,
    /// `╱╲`
    Zigzag,
    /// `╳`
    Cross,
    /// `─`
    Thin,
    /// `━`
    Heavy,
    /// `═`
    Double,
    /// `╌`
    Dashed,
    /// `┄`
    Dashes,
    /// `┈`
    Dotted,
    /// `▁`
    Baseline,
    /// `⠒`
    Braille,
    /// `⣀`
    BrailleLow,
    /// `· `
    Dots,
}

impl Pattern {
    /// Every pattern, in the order `next` follows.
    pub const ALL: [Pattern; 15] = [
        Pattern::Shade,
        Pattern::Hatch,
        Pattern::Backslash,
        Pattern::Zigzag,
        Pattern::Cross,
        Pattern::Thin,
        Pattern::Heavy,
        Pattern::Double,
        Pattern::Dashed,
        Pattern::Dashes,
        Pattern::Dotted,
        Pattern::Baseline,
        Pattern::Braille,
        Pattern::BrailleLow,
        Pattern::Dots,
    ];

    /// The name in lowercase, such as `braille-low`, for options and
    /// messages.
    pub fn name(self) -> &'static str {
        match self {
            Pattern::Shade => "shade",
            Pattern::Hatch => "hatch",
            Pattern::Backslash => "backslash",
            Pattern::Zigzag => "zigzag",
            Pattern::Cross => "cross",
            Pattern::Thin => "thin",
            Pattern::Heavy => "heavy",
            Pattern::Double => "double",
            Pattern::Dashed => "dashed",
            Pattern::Dashes => "dashes",
            Pattern::Dotted => "dotted",
            Pattern::Baseline => "baseline",
            Pattern::Braille => "braille",
            Pattern::BrailleLow => "braille-low",
            Pattern::Dots => "dots",
        }
    }

    /// The pattern called `name`.
    pub fn from_name(name: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|p| p.name() == name)
    }

    /// The characters that repeat.
    pub fn glyphs(self) -> &'static str {
        match self {
            Pattern::Shade => "░",
            Pattern::Hatch => "╱",
            Pattern::Backslash => "╲",
            Pattern::Zigzag => "╱╲",
            Pattern::Cross => "╳",
            Pattern::Thin => "─",
            Pattern::Heavy => "━",
            Pattern::Double => "═",
            Pattern::Dashed => "╌",
            Pattern::Dashes => "┄",
            Pattern::Dotted => "┈",
            Pattern::Baseline => "▁",
            Pattern::Braille => "⠒",
            Pattern::BrailleLow => "⣀",
            Pattern::Dots => "· ",
        }
    }

    /// The pattern after this one, back to the first after the last.
    pub fn next(self) -> Self {
        let i = Self::ALL.iter().position(|p| *p == self).unwrap_or(0);
        Self::ALL[(i + 1) % Self::ALL.len()]
    }
}

/// The color of a stroke.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Ink {
    /// `primary`.
    Primary,
    /// `primary` to `chart-1` from left to right.
    Gradient,
    /// `border`, so the line stays in the background.
    Faint,
}

/// A pattern in a color.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Stroke {
    pub pattern: Pattern,
    pub ink: Ink,
}

impl Stroke {
    pub const fn new(pattern: Pattern, ink: Ink) -> Self {
        Self { pattern, ink }
    }

    /// `width` cells of the pattern.
    pub fn spans(self, theme: &Theme, width: usize) -> Vec<Span<'static>> {
        let glyphs: Vec<char> = self.pattern.glyphs().chars().collect();
        let text = |range: std::ops::Range<usize>| range.map(|i| glyphs[i % glyphs.len()]).collect::<String>();
        let r = theme.tokens();
        match self.ink {
            Ink::Primary => vec![Span::styled(text(0..width), theme.fg(r.primary))],
            Ink::Faint => vec![Span::styled(text(0..width), theme.fg(r.border))],
            Ink::Gradient => {
                let last = width.max(2) - 1;
                (0..width)
                    .map(|i| Span::styled(text(i..i + 1), theme.fg(blend(&theme.stops(), i as f32 / last as f32))))
                    .collect()
            }
        }
    }
}

/// How the title line and section rules are drawn. Each product picks its
/// own; [`Look::DEFAULT`] is a heavy `primary` title line and a faint thin
/// rule.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Look {
    /// Around the page title, in [`Title`](crate::Title) and
    /// [`Tabs`](crate::Tabs).
    pub title: Stroke,
    /// After section titles, in [`Page::section`](crate::Page::section)
    /// and the [`Sidebar`](crate::Sidebar).
    pub rule: Stroke,
}

impl Look {
    pub const DEFAULT: Look =
        Look { title: Stroke::new(Pattern::Heavy, Ink::Primary), rule: Stroke::new(Pattern::Thin, Ink::Faint) };
}

impl Default for Look {
    fn default() -> Self {
        Self::DEFAULT
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_round_trip() {
        for pattern in Pattern::ALL {
            assert_eq!(Pattern::from_name(pattern.name()), Some(pattern));
        }
        assert_eq!(Pattern::Dots.next(), Pattern::Shade);
    }

    #[test]
    fn a_two_glyph_pattern_repeats_to_the_width() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let spans = Stroke::new(Pattern::Zigzag, Ink::Faint).spans(&theme, 5);
        let text: String = spans.iter().map(|s| s.content.as_ref()).collect();
        assert_eq!(text, "╱╲╱╲╱");
    }
}
