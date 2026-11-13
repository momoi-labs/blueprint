use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::Theme;

/// The product mark: an optional glyph and the product name, in text.
///
/// Plain, it is bold `primary` text. Filled, it is bold `primary-foreground`
/// on a `primary` fill with one cell of padding each side: the form the
/// [`Header`](crate::Header) uses for the product and version.
#[derive(Clone, Copy, Debug)]
pub struct BrandMark<'a> {
    theme: &'a Theme,
    name: &'a str,
    glyph: Option<&'a str>,
    filled: bool,
}

impl<'a> BrandMark<'a> {
    pub fn new(theme: &'a Theme, name: &'a str) -> Self {
        Self { theme, name, glyph: None, filled: false }
    }

    /// A glyph before the name, such as `◆`.
    #[must_use]
    pub fn glyph(mut self, glyph: &'a str) -> Self {
        self.glyph = Some(glyph);
        self
    }

    /// The name on the accent fill.
    #[must_use]
    pub fn filled(mut self, filled: bool) -> Self {
        self.filled = filled;
        self
    }

    /// The columns the mark takes.
    pub fn width(&self) -> u16 {
        let text = cells(self.name) + self.glyph.map_or(0, |glyph| cells(glyph) + 1);
        (text + if self.filled { 2 } else { 0 }).min(usize::from(u16::MAX)) as u16
    }

    fn text(&self) -> String {
        let text = self.glyph.map_or_else(|| self.name.to_owned(), |glyph| format!("{glyph} {}", self.name));
        if self.filled {
            format!(" {text} ")
        } else {
            text
        }
    }
}

impl<'a> From<BrandMark<'a>> for Line<'a> {
    fn from(mark: BrandMark<'a>) -> Self {
        let t = mark.theme;
        let style = if mark.filled { t.brand() } else { t.fg(t.tokens().primary).add_modifier(Modifier::BOLD) };
        Line::from(Span::styled(mark.text(), style))
    }
}

impl Widget for BrandMark<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Line::from(self).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    #[test]
    fn plain_is_accent_text_with_no_fill() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        let mark = BrandMark::new(&theme, "kiso").glyph("◆");
        mark.render(Rect::new(0, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf).trim_end(), "◆ kiso");
        assert_eq!(mark.width(), 6);
        assert_eq!(buf[(0, 0)].bg, Color::Reset);
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().primary));
    }

    #[test]
    fn filled_pads_and_paints_the_name_on_primary() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        let mark = BrandMark::new(&theme, "kiso").filled(true);
        mark.render(Rect::new(0, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf).trim_end(), " kiso");
        assert_eq!(mark.width(), 6);
        assert_eq!(buf[(5, 0)].bg, theme.color(theme.tokens().primary));
        assert_eq!(buf[(6, 0)].bg, Color::Reset);
    }
}
