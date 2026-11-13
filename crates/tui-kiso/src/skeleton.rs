use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::fill;
use crate::Theme;

/// The strengths of `border` over the surface: low, rest and high.
const STRENGTHS: [f32; 3] = [0.5, 0.75, 1.0];

/// A placeholder for content that is on its way: a square block of `border`
/// at low strength, the size of the area it gets. (`muted` is the same color
/// as the page in the light theme, so it would not show.) Size it like the
/// content it stands in for, so the page does not jump when the content
/// arrives.
///
/// Without a tick it is static. With one, it pulses between three
/// strengths: raise `tick` about three times a second, and the app owns
/// time. In 256 colors a blend would band, so it is always static. It
/// draws no text and takes no keys.
#[derive(Clone, Copy, Debug)]
pub struct Skeleton<'a> {
    theme: &'a Theme,
    tick: Option<u32>,
}

impl<'a> Skeleton<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, tick: None }
    }

    /// Pulses the block as `tick` counts up.
    #[must_use]
    pub fn tick(mut self, tick: u32) -> Self {
        self.tick = Some(tick);
        self
    }

    /// A tick only when there is one, such as a field the caller holds.
    #[must_use]
    pub(crate) fn pulse(mut self, tick: Option<u32>) -> Self {
        self.tick = tick;
        self
    }

    fn strength(&self) -> f32 {
        match self.tick {
            // Low, rest, high, rest.
            Some(tick) => STRENGTHS[[0, 1, 2, 1][tick as usize % 4]],
            None => STRENGTHS[1],
        }
    }
}

impl Widget for Skeleton<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        // The block replaces what was there, so no text stays through it.
        for at in area.intersection(buf.area).positions() {
            buf[at].set_symbol(" ");
        }
        fill(self.theme, buf, area, self.theme.tokens().border, self.strength());
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;

    #[test]
    fn a_block_fills_its_area_and_nothing_else() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 3));
        Skeleton::new(&theme).render(Rect::new(1, 1, 4, 1), &mut buf);
        assert_ne!(buf[(1, 1)].bg, Color::Reset);
        assert_ne!(buf[(4, 1)].bg, Color::Reset);
        assert_eq!(buf[(5, 1)].bg, Color::Reset);
        assert_eq!(buf[(1, 0)].bg, Color::Reset);
    }

    #[test]
    fn a_tick_pulses_in_truecolor_and_not_in_256_colors() {
        let bg = |theme: &Theme, tick: Option<u32>| {
            let mut buf = Buffer::empty(Rect::new(0, 0, 2, 1));
            Skeleton::new(theme).pulse(tick).render(buf.area, &mut buf);
            buf[(0, 0)].bg
        };
        let truecolor = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_ne!(bg(&truecolor, Some(0)), bg(&truecolor, Some(2)));
        assert_eq!(bg(&truecolor, Some(1)), bg(&truecolor, None));
        let indexed = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        assert_eq!(bg(&indexed, Some(0)), bg(&indexed, Some(2)));
    }

    #[test]
    fn a_block_past_the_buffer_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        Skeleton::new(&theme).render(Rect::new(2, 1, 30, 9), &mut buf);
    }
}
