use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::{fill, over, put};
use crate::{Border, Theme};

/// The surface color of a [`Card`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum CardVariant {
    /// `card`.
    #[default]
    Plain,
    /// `popover`, for a popover or a menu. On a page it is hard to tell
    /// from `Plain`.
    Elevated,
}

/// The size of a [`Card`] or a [`Button`](crate::Button).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Size {
    Sm,
    #[default]
    Md,
}

/// Groups related content on one surface: a fill with half a row above and
/// below, so it has padding without the cost of two rows. The corners are
/// square.
///
/// The fill and the border come from the theme's [`Look`](crate::Look).
/// Draw the card, then draw its content in [`Card::inner`].
#[derive(Clone, Copy, Debug)]
pub struct Card<'a> {
    theme: &'a Theme,
    variant: CardVariant,
    size: Size,
    hover: bool,
}

impl<'a> Card<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, variant: CardVariant::Plain, size: Size::Md, hover: false }
    }

    #[must_use]
    pub fn variant(mut self, variant: CardVariant) -> Self {
        self.variant = variant;
        self
    }

    /// `Md` has two columns of padding and `Sm` has one.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// The pointer is over a card that is a link: `elevated-surface`.
    #[must_use]
    pub fn hover(mut self, hover: bool) -> Self {
        self.hover = hover;
        self
    }

    /// The area for content: inside the half rows and the padding.
    pub fn inner(&self, area: Rect) -> Rect {
        let pad = match self.size {
            Size::Sm => 1,
            Size::Md => 2,
        };
        Rect {
            x: area.x.saturating_add(pad),
            y: area.y.saturating_add(1),
            width: area.width.saturating_sub(pad * 2),
            height: area.height.saturating_sub(2),
        }
    }

    /// A rule across the card at row `y`, between the header, the content
    /// and the footer.
    pub fn rule(&self, buf: &mut Buffer, area: Rect, y: u16) {
        let inset = u16::from(self.theme.look().border == Border::Rail);
        let color = self.theme.color(self.theme.tokens().border);
        for x in area.left().saturating_add(inset)..area.right().saturating_sub(inset) {
            put(buf, x, y, "─", color);
        }
    }
}

impl Widget for Card<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let color = match (self.hover, self.variant) {
            (true, _) => r.elevated_surface,
            (false, CardVariant::Plain) => r.card,
            (false, CardVariant::Elevated) => r.popover,
        };
        let alpha = if t.is_truecolor() { t.look().fill.alpha() } else { 1.0 };
        let shown = area.intersection(buf.area);
        for at in shown.positions() {
            buf[at].set_symbol(" ");
        }
        // Less than three rows has no room for the half rows.
        if area.height < 3 {
            fill(t, buf, area, color, alpha);
            return;
        }
        let (top, bottom) = (area.top(), area.bottom() - 1);
        for x in shown.left()..shown.right() {
            for (y, symbol) in [(top, "▄"), (bottom, "▀")] {
                let fg = over(t, buf, x, y, color, alpha);
                put(buf, x, y, symbol, fg);
            }
        }
        fill(t, buf, Rect { y: top + 1, height: area.height - 2, ..area }, color, alpha);
        if t.look().border == Border::Rail && area.left() > 0 {
            // The rail is half a column, in the cell before the card. There the
            // cell holds only the rail and the backdrop, so the two half rows
            // close with a quadrant and leave no hole.
            let rail = t.color(r.primary);
            for y in top..=bottom {
                let symbol = if y == top { "▗" } else if y == bottom { "▝" } else { "▐" };
                put(buf, area.left() - 1, y, symbol, rail);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;
    use crate::Look;

    #[test]
    fn a_card_has_half_rows_and_a_fill() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 5));
        let area = Rect::new(1, 0, 10, 5);
        let card = Card::new(&theme);
        card.render(area, &mut buf);
        assert_eq!(buf[(1, 0)].symbol(), "▄");
        assert_eq!(buf[(10, 4)].symbol(), "▀");
        assert_ne!(buf[(1, 2)].bg, Color::Reset);
        assert_eq!(buf[(0, 2)].symbol(), " ");
        assert_eq!(card.inner(area), Rect::new(3, 1, 6, 3));
    }

    #[test]
    fn the_rail_sits_before_the_card() {
        let look = Look { border: Border::Rail, ..Look::DEFAULT };
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK).with_look(look);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 5));
        Card::new(&theme).render(Rect::new(1, 0, 10, 5), &mut buf);
        let rail: String = (0..5).map(|y| buf[(0, y)].symbol().to_owned()).collect();
        assert_eq!(rail, "▗▐▐▐▝");
    }

    #[test]
    fn a_card_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        let card = Card::new(&theme);
        card.render(Rect::new(2, 1, 10, 5), &mut buf);
        card.rule(&mut buf, Rect::new(2, 1, 10, 5), 4);
    }
}
