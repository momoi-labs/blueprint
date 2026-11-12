use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Span;
use ratatui::widgets::Widget;

use crate::{Theme, Tone};

/// A mark that carries a tone, in one cell. It has no label, so put text
/// that names the state beside it, or a legend.
///
/// `Neutral` is a ring, `○`, in `muted-foreground`. The other tones are
/// `●` in the tone's color. Converts into a [`Span`].
#[derive(Clone, Copy, Debug)]
pub struct Dot<'a> {
    theme: &'a Theme,
    tone: Tone,
    pulse: Option<u32>,
}

impl<'a> Dot<'a> {
    pub fn new(theme: &'a Theme, tone: Tone) -> Self {
        Self { theme, tone, pulse: None }
    }

    /// Work is going. The mark swaps between `●` and `◉` as `tick` counts
    /// up, so raise `tick` about twice a second. A neutral dot is filled
    /// while it pulses.
    #[must_use]
    pub fn pulse(mut self, tick: u32) -> Self {
        self.pulse = Some(tick);
        self
    }

    /// The glyph the dot draws.
    pub fn mark(&self) -> &'static str {
        match (self.pulse, self.tone) {
            (Some(tick), _) if tick % 2 == 1 => "◉",
            (Some(_), _) => "●",
            (None, Tone::Neutral) => "○",
            (None, _) => "●",
        }
    }
}

impl From<Dot<'_>> for Span<'static> {
    fn from(dot: Dot<'_>) -> Self {
        let style = match dot.tone {
            Tone::Neutral => dot.theme.muted(),
            tone => dot.theme.fg(tone.rgb(dot.theme)),
        };
        Span::styled(dot.mark(), style)
    }
}

impl Widget for Dot<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Span::from(self).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn neutral_is_a_ring_and_a_pulse_swaps_marks() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Dot::new(&theme, Tone::Neutral).mark(), "○");
        assert_eq!(Dot::new(&theme, Tone::Danger).mark(), "●");
        assert_eq!(Dot::new(&theme, Tone::Success).pulse(1).mark(), "◉");
        assert_eq!(Dot::new(&theme, Tone::Success).pulse(2).mark(), "●");
    }
}
