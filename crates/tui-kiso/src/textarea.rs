use std::ops::Range;

use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use unicode_segmentation::UnicodeSegmentation;

use crate::input::{draw, field_builders, frame, Common, Paint};
use crate::page::thumb;
use crate::text::cells;
use crate::{wrap, Scroll, Size, Theme};

/// Several lines of text the person types: the [`Input`](crate::Input)
/// surface, three rows of text tall by default. Lines wrap at word ends,
/// the view follows the cursor, and when the text is longer than the view
/// the right padding becomes the scrollbar a [`Page`](crate::Page) draws.
///
/// It draws from the top left of its area, as wide as the area. Edit the
/// value with [`Field::key`](crate::Field::key) on a [`Field::area`](crate::Field::area):
/// enter starts a new line and ↑↓ move between lines.
#[derive(Clone, Copy, Debug)]
pub struct Textarea<'a> {
    common: Common<'a>,
    lines: u16,
    scroll: Option<&'a Scroll>,
}

impl<'a> Textarea<'a> {
    pub fn new(theme: &'a Theme, value: &'a str) -> Self {
        Self { common: Common::new(theme, value), lines: 3, scroll: None }
    }

    field_builders!();

    /// The rows of text the view shows, as `rows` on the web. Three by
    /// default.
    #[must_use]
    pub fn rows(mut self, rows: u16) -> Self {
        self.lines = rows.max(1);
        self
    }

    /// Keeps where the view is between draws, so it moves only when the
    /// cursor leaves it. Without it, the cursor stays on the last row once
    /// the text is longer than the view.
    #[must_use]
    pub fn scroll(mut self, scroll: &'a Scroll) -> Self {
        self.scroll = Some(scroll);
        self
    }

    fn text_rows(&self) -> u16 {
        self.lines
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        let c = &self.common;
        let paint = Paint::new(c.theme, c.flags, behind);
        let inner = usize::from(width.saturating_sub(2)).max(1);
        let view = usize::from(self.lines);
        let (mut body, offset, total) = if c.value.is_empty() {
            let mut rows: Vec<Vec<Span<'static>>> =
                wrap(c.placeholder, inner).into_iter().take(view).map(|line| vec![Span::styled(line, paint.faint)]).collect();
            if let Some(caret) = paint.cursor {
                let first = rows.first().map(|row| row[0].content.to_string()).unwrap_or_default();
                rows.splice(..rows.len().min(1), [crate::input::placeholder(&first, Some(caret), inner, paint.faint)]);
            }
            (rows, 0, 0)
        } else {
            let graphemes: Vec<&str> = c.value.graphemes(true).collect();
            let mut rows = wrap_rows(&graphemes, inner);
            let at = paint.cursor.map(|_| locate(&graphemes, &mut rows, c.caret(), inner));
            let total = rows.len();
            let offset = match (self.scroll, at) {
                (Some(scroll), Some((row, _))) => scroll.keep(row, total, view),
                (Some(scroll), None) => scroll.keep(scroll.offset(), total, view),
                (None, Some((row, _))) => (row + 1).saturating_sub(view),
                (None, None) => 0,
            };
            let body = rows
                .iter()
                .enumerate()
                .skip(offset)
                .take(view)
                .map(|(i, range)| {
                    let text = |r: Range<usize>| Span::styled(graphemes[r].concat(), paint.text);
                    match (at, paint.cursor) {
                        (Some((row, at)), Some(caret)) if row == i => {
                            let under = graphemes.get(at).copied().filter(|_| at < range.end).unwrap_or(" ");
                            let after = if at < range.end { at + 1 } else { at };
                            vec![text(range.start..at), Span::styled(under.to_owned(), caret), text(after..range.end)]
                        }
                        _ => vec![text(range.clone())],
                    }
                })
                .collect();
            (body, offset, total)
        };
        body.resize_with(view, Vec::new);
        let mut lines = frame(&paint, c.size, width, body);
        if total > view {
            let top = usize::from(c.size != Size::Sm);
            let thumb = thumb(view, offset, total);
            let r = c.theme.tokens();
            for dy in 0..view {
                let color = if thumb.contains(&dy) { r.primary } else { r.border_strong };
                let spans = &mut lines[top + dy].spans;
                let pad = spans.len() - 2;
                spans[pad] = Span::styled("│", Style::new().bg(paint.bg).fg(c.theme.color(color)));
            }
        }
        lines
    }
}

impl Widget for Textarea<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let lines = self.lines(area.width, self.common.behind(buf, area));
        draw(buf, area, &lines);
    }
}

/// The rows of `graphemes` wrapped at `width` cells, as ranges of
/// graphemes. A row breaks after the last space that fits, a word wider
/// than the row breaks where it must, and a line break starts a row.
fn wrap_rows(graphemes: &[&str], width: usize) -> Vec<Range<usize>> {
    let mut rows = Vec::new();
    let mut line = 0;
    loop {
        let end_of_line = graphemes[line..].iter().position(|g| *g == "\n").map_or(graphemes.len(), |i| line + i);
        let mut start = line;
        loop {
            let (mut end, mut used) = (start, 0);
            while end < end_of_line && used + cells(graphemes[end]) <= width {
                used += cells(graphemes[end]);
                end += 1;
            }
            if end == start && start < end_of_line {
                end += 1;
            }
            if end < end_of_line {
                if let Some(space) = (start + 1..=end).rev().find(|&i| graphemes[i - 1] == " ") {
                    end = space;
                }
            }
            rows.push(start..end);
            if end >= end_of_line {
                break;
            }
            start = end;
        }
        if end_of_line == graphemes.len() {
            return rows;
        }
        line = end_of_line + 1;
    }
}

/// The row of the cursor at grapheme `at`. At the end of a full row the
/// cursor needs a cell of its own, so it gets an empty row after it.
fn locate(graphemes: &[&str], rows: &mut Vec<Range<usize>>, at: usize, width: usize) -> (usize, usize) {
    let found = rows.iter().enumerate().position(|(i, range)| {
        let next = rows.get(i + 1).is_some_and(|next| next.start == at && range.end == at);
        range.start <= at && at <= range.end && !next
    });
    let row = found.unwrap_or(rows.len() - 1);
    let column = cells(&graphemes[rows[row].start..at.min(rows[row].end)].concat());
    if column >= width {
        rows.insert(row + 1, at..at);
        return (row + 1, at);
    }
    (row, at)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn lines_wrap_at_word_ends() {
        let graphemes: Vec<&str> = "one two three\nfour".graphemes(true).collect();
        let rows = wrap_rows(&graphemes, 8);
        let shown: Vec<String> = rows.into_iter().map(|r| graphemes[r].concat()).collect();
        assert_eq!(shown, ["one two ", "three", "four"]);
    }

    #[test]
    fn three_rows_and_half_rows_by_default() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let area = Textarea::new(&theme, "").placeholder("What changed");
        assert_eq!(area.height(), 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 16, 5));
        area.render(Rect::new(1, 0, 14, 5), &mut buf);
        assert_eq!(text(&buf, 0), " ▄▄▄▄▄▄▄▄▄▄▄▄▄▄ ");
        assert_eq!(text(&buf, 1), "  What changed  ");
        assert_eq!(text(&buf, 4), " ▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ");
    }

    #[test]
    fn the_view_follows_the_cursor_and_shows_a_scrollbar() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let value = "a\nb\nc\nd\ne";
        let scroll = Scroll::default();
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 3));
        Textarea::new(&theme, value).size(Size::Sm).focused(true).scroll(&scroll).render(Rect::new(1, 0, 6, 3), &mut buf);
        assert_eq!(scroll.offset(), 2);
        assert_eq!(text(&buf, 0), "▐ c   │▌");
        assert_eq!(buf[(6, 2)].fg, theme.color(theme.tokens().primary));
        // Moving up to the first line scrolls back.
        Textarea::new(&theme, value).size(Size::Sm).focused(true).cursor(0).scroll(&scroll).render(Rect::new(1, 0, 6, 3), &mut buf);
        assert_eq!(scroll.offset(), 0);
    }

    #[test]
    fn a_cursor_after_a_full_row_gets_its_own_row() {
        let graphemes: Vec<&str> = "abcd".graphemes(true).collect();
        let mut rows = wrap_rows(&graphemes, 4);
        assert_eq!(locate(&graphemes, &mut rows, 4, 4), (1, 4));
        assert_eq!(rows, [0..4, 4..4]);
    }

    #[test]
    fn a_textarea_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        Textarea::new(&theme, "中文字 and more\n\n").focused(true).render(Rect::new(1, 1, 30, 8), &mut buf);
        for width in 0..8 {
            Textarea::new(&theme, "中文字 a\nb").focused(true).cursor(2).lines(width, [0; 3]);
        }
    }
}
