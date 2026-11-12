use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::{put, write};
use crate::Theme;

/// What the pointer and the keys do to a [`Switch`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SwitchState {
    #[default]
    Rest,
    Hover,
    Focus,
    Disabled,
}

/// One setting that is on or off, applied at once: a track of four cells
/// with a square thumb of two at one end, as on the web.
///
/// Off is a `border-strong` track, on is a `primary` track, and the thumb
/// is `primary-foreground`. Focus is a half-cell bar of the `focus` color
/// on each side, so keep one free cell there. It takes one row from the top
/// left of its area.
#[derive(Clone, Copy, Debug)]
pub struct Switch<'a> {
    theme: &'a Theme,
    on: bool,
    state: SwitchState,
    word: bool,
}

impl<'a> Switch<'a> {
    pub fn new(theme: &'a Theme, on: bool) -> Self {
        Self { theme, on, state: SwitchState::Rest, word: false }
    }

    #[must_use]
    pub fn state(mut self, state: SwitchState) -> Self {
        self.state = state;
        self
    }

    /// Writes `On` or `Off` after the track, for a switch that stands
    /// alone. Thumb position and color are weak signals in few colors.
    #[must_use]
    pub fn word(mut self, word: bool) -> Self {
        self.word = word;
        self
    }

    /// The columns the switch takes, without the focus bars.
    pub fn width(&self) -> u16 {
        match (self.word, self.on) {
            (false, _) => 4,
            (true, true) => 7,
            (true, false) => 8,
        }
    }
}

impl Widget for Switch<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let (x, y) = (area.x, area.y);
        let (track, thumb) = match (self.state, self.on) {
            (SwitchState::Disabled, _) => (r.disabled_surface, r.disabled),
            (SwitchState::Hover, true) => (r.primary_hover, r.primary_foreground),
            (_, true) => (r.primary, r.primary_foreground),
            (SwitchState::Hover, false) => (r.muted_foreground, r.primary_foreground),
            (_, false) => (r.border_strong, r.primary_foreground),
        };
        // Disabled is exempt from contrast, so the track keeps its own
        // color in 256 colors too.
        let style = if self.state == SwitchState::Disabled { t.fg(thumb).bg(t.color(track)) } else { t.fill(thumb, track) };
        write(buf, x, y, if self.on { " ▐█▌" } else { "▐█▌ " }, style);
        if self.state == SwitchState::Focus && x > 0 {
            let focus = t.color(r.focus);
            put(buf, x - 1, y, "▐", focus);
            put(buf, x.saturating_add(4), y, "▌", focus);
        }
        if self.word {
            let (word, style) = if self.on { ("On", t.text()) } else { ("Off", t.muted()) };
            write(buf, x.saturating_add(5), y, word, style);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_thumb_sits_at_one_end() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Switch::new(&theme, true).word(true).render(Rect::new(1, 0, 9, 1), &mut buf);
        assert_eq!(row(&buf), "  ▐█▌ On  ");
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 1));
        Switch::new(&theme, false).state(SwitchState::Focus).render(Rect::new(1, 0, 4, 1), &mut buf);
        assert_eq!(row(&buf), "▐▐█▌ ▌");
    }
}
