use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::widgets::Widget;

use crate::surface::{put, write};
use crate::{Theme, ACCENTS};

/// The columns one swatch takes, with the gap after it.
const PITCH: u16 = 3;

/// One row of accent swatches, two cells of each accent's `primary`. The
/// current accent has the focus bars of [`Switch`](crate::Switch) on both
/// sides. `←` `→` move it.
///
/// The app builds the selector each frame from its own index, calls
/// [`AccentSelector::key`] on a key press and reads
/// [`AccentSelector::selected`] back.
#[derive(Clone, Copy, Debug)]
pub struct AccentSelector<'a> {
    theme: &'a Theme,
    selected: usize,
    light: bool,
}

impl<'a> AccentSelector<'a> {
    /// A selector with the accent at `selected`, an index in [`ACCENTS`].
    pub fn new(theme: &'a Theme, selected: usize) -> Self {
        Self { theme, selected: selected.min(ACCENTS.len() - 1), light: false }
    }

    /// Shows the swatches of the light accents.
    #[must_use]
    pub fn light(mut self, light: bool) -> Self {
        self.light = light;
        self
    }

    /// The accent under the mark, an index in [`ACCENTS`].
    pub fn selected(&self) -> usize {
        self.selected
    }

    /// The columns the selector takes, with a free cell on each end for the
    /// mark.
    pub fn width() -> u16 {
        PITCH * ACCENTS.len() as u16 + 1
    }

    /// `←` and `→` (or `h` and `l`) move the mark. Returns true when it
    /// moved.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, code: KeyCode) -> bool {
        let before = self.selected;
        match code {
            KeyCode::Left | KeyCode::Char('h') => self.selected = self.selected.saturating_sub(1),
            KeyCode::Right | KeyCode::Char('l') => self.selected = (self.selected + 1).min(ACCENTS.len() - 1),
            _ => {}
        }
        self.selected != before
    }
}

impl Widget for AccentSelector<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let focus = t.color(t.tokens().focus);
        for (i, accent) in ACCENTS.iter().enumerate() {
            let x = area.x.saturating_add(1 + PITCH * i as u16);
            if x.saturating_add(2) > area.right() {
                break;
            }
            let swatch = Style::new().bg(t.color(accent.tokens(self.light).primary));
            write(buf, x, area.y, "  ", swatch);
            if i == self.selected {
                put(buf, x - 1, area.y, "▐", focus);
                put(buf, x + 2, area.y, "▌", focus);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;

    #[test]
    fn the_current_swatch_has_a_bar_on_each_side() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, AccentSelector::width(), 1));
        AccentSelector::new(&theme, 1).render(buf.area, &mut buf);
        assert_eq!((buf[(3, 0)].symbol(), buf[(6, 0)].symbol()), ("▐", "▌"));
        assert_ne!(buf[(4, 0)].bg, Color::Reset);
        assert_ne!(buf[(4, 0)].bg, buf[(1, 0)].bg);
        assert_eq!(buf[(5, 0)].symbol(), " ");
    }

    #[test]
    fn it_draws_inside_a_narrow_area() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 1));
        AccentSelector::new(&theme, 11).render(buf.area, &mut buf);
    }

    #[cfg(feature = "crossterm")]
    #[test]
    fn the_arrows_move_and_stop_at_the_ends() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut selector = AccentSelector::new(&theme, 0);
        assert!(!selector.key(KeyCode::Left));
        assert!(selector.key(KeyCode::Right));
        assert_eq!(selector.selected(), 1);
        let mut last = AccentSelector::new(&theme, 99);
        assert_eq!(last.selected(), ACCENTS.len() - 1);
        assert!(!last.key(KeyCode::Right));
    }
}
