use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::Span;
use ratatui::widgets::Widget;
use unicode_segmentation::UnicodeSegmentation;

use crate::input::{draw, frame, one_row, placeholder, Flags, Paint};
use crate::surface::under;
use crate::text::cells;
use crate::{Search, Size, Theme};

/// The field that filters a list as the person types: the field surface of
/// an [`Input`](crate::Input), a leading `/` in `primary`, the query or a
/// placeholder, and the count at the right, "3 of 12" while a query
/// filters. The state and the keys are a [`Search`]: its query, its
/// [`Search::key`] and its [`Search::hit`]. The field is focused, with a
/// cursor and the focus bars, while the search is typing.
///
/// It is not the web FilterInput's typed conditions and chips: a terminal
/// list filters on text, and [`Filters`](crate::Filters) narrow it by
/// facet.
#[derive(Clone, Copy, Debug)]
pub struct FilterInput<'a> {
    theme: &'a Theme,
    search: &'a Search,
    placeholder: &'a str,
    glyph: &'a str,
    count: Option<(usize, usize)>,
    size: Size,
}

impl<'a> FilterInput<'a> {
    pub fn new(theme: &'a Theme, search: &'a Search) -> Self {
        Self { theme, search, placeholder: "Filter", glyph: "/", count: None, size: Size::Md }
    }

    /// What shows while the query is empty. "Filter" by default.
    #[must_use]
    pub fn placeholder(mut self, placeholder: &'a str) -> Self {
        self.placeholder = placeholder;
        self
    }

    /// The mark before the query, one cell. `/` by default, the key that
    /// starts a search.
    #[must_use]
    pub fn glyph(mut self, glyph: &'a str) -> Self {
        self.glyph = glyph;
        self
    }

    /// The rows `shown` of `total`: "3 of 12" while a query filters, "12"
    /// without one.
    #[must_use]
    pub fn count(mut self, shown: usize, total: usize) -> Self {
        self.count = Some((shown, total));
        self
    }

    /// `Md`, the default, has half a row of fill above and below, as an
    /// [`Input`](crate::Input). `Sm` is one row.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// The rows the field takes.
    pub fn height(&self) -> u16 {
        match self.size {
            Size::Sm => 1,
            Size::Md | Size::Lg => 3,
        }
    }
}

impl Widget for FilterInput<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        if area.width < 4 || area.height == 0 {
            return;
        }
        let behind = under(t, buf, area.x, area.y.saturating_add(u16::from(self.size != Size::Sm)));
        let paint = Paint::new(t, Flags { focused: self.search.typing, ..Flags::default() }, behind);
        let inner = usize::from(area.width - 2);
        let glyph = Span::styled(format!("{} ", self.glyph), paint.text.fg(t.color(t.tokens().primary)).add_modifier(Modifier::BOLD));
        let count = self.count.map(|(shown, total)| self.search.count(shown, total)).unwrap_or_default();
        // The count goes when the field is too narrow for it and a few
        // letters of the query.
        let count = if cells(&count) + 1 + 6 + cells(&glyph.content) <= inner { count } else { String::new() };
        let room = inner.saturating_sub(cells(&glyph.content) + if count.is_empty() { 0 } else { cells(&count) + 1 });
        let query = &self.search.query;
        let mut row = vec![glyph];
        if query.is_empty() {
            row.extend(placeholder(self.placeholder, paint.cursor, room, paint.faint));
        } else {
            let graphemes: Vec<&str> = query.graphemes(true).collect();
            let caret = paint.cursor.map(|style| (graphemes.len(), style));
            row.extend(one_row(&graphemes, caret, room, paint.text, paint.faint));
        }
        if !count.is_empty() {
            let used: usize = row.iter().map(Span::width).sum();
            row.push(Span::styled(" ".repeat(inner.saturating_sub(used + cells(&count))), paint.text));
            row.push(Span::styled(count, paint.faint));
        }
        let lines = frame(&paint, self.size, area.width, vec![row]);
        draw(buf, area, &lines);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_count_sits_at_the_right() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let search = Search { query: "pg".into(), typing: false };
        let mut buf = Buffer::empty(Rect::new(0, 0, 24, 3));
        FilterInput::new(&theme, &search).count(3, 12).render(Rect::new(1, 0, 22, 3), &mut buf);
        assert_eq!(row(&buf, 1), "  / pg         3 of 12  ");
        assert_eq!(buf[(2, 1)].bg, theme.color(theme.tokens().input));
        assert_eq!(buf[(0, 1)].symbol(), " ", "no focus bars while not typing");
    }

    #[test]
    fn typing_shows_the_cursor_and_the_focus_bars() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let search = Search { query: String::new(), typing: true };
        let mut buf = Buffer::empty(Rect::new(0, 0, 24, 1));
        FilterInput::new(&theme, &search).size(Size::Sm).placeholder("Filter machines").count(12, 12).render(Rect::new(1, 0, 22, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▐ / Filter machines 12 ▌");
        assert_eq!(buf[(4, 0)].bg, theme.color(theme.tokens().primary), "the cursor is on the placeholder");
        for width in 0..12 {
            let mut buf = Buffer::empty(Rect::new(0, 0, width, 3));
            FilterInput::new(&theme, &search).count(3, 12).render(buf.area, &mut buf);
        }
    }
}
