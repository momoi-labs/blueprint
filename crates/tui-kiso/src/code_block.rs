use std::ops::RangeInclusive;

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::surface::{put, write};
use crate::text::{cells, cut, split};
use crate::{Card, Size, Theme};

/// Code, a command or a config file on the surface of a [`Card`]: square,
/// with half a row of fill above and below, and the card's padding. The
/// code is in `foreground` with no syntax color: the crate has no
/// highlighter and adds no dependency for one.
///
/// Line numbers are optional, in `subtle-foreground`. A title or a
/// language, such as "yaml", goes at the top right in `muted-foreground`.
/// A long line is cut with `…`, or wraps with [`CodeBlock::wrap`].
/// [`CodeBlock::highlight`] marks a range of lines with the `selected`
/// fill and a `primary` `▌`. It has no keys: copying is the product's.
#[derive(Clone, Debug)]
pub struct CodeBlock<'a> {
    theme: &'a Theme,
    code: &'a str,
    title: Option<&'a str>,
    line_numbers: bool,
    wrap: bool,
    size: Size,
    highlight: Option<RangeInclusive<usize>>,
}

impl<'a> CodeBlock<'a> {
    pub fn new(theme: &'a Theme, code: &'a str) -> Self {
        Self { theme, code, title: None, line_numbers: false, wrap: false, size: Size::Md, highlight: None }
    }

    /// A title or the language, at the top right.
    #[must_use]
    pub fn title(mut self, title: &'a str) -> Self {
        self.title = Some(title);
        self
    }

    /// Numbers each line.
    #[must_use]
    pub fn line_numbers(mut self, on: bool) -> Self {
        self.line_numbers = on;
        self
    }

    /// Long lines wrap instead of being cut.
    #[must_use]
    pub fn wrap(mut self, wrap: bool) -> Self {
        self.wrap = wrap;
        self
    }

    /// The padding of a [`Card`] of this size: `Md` has two columns, `Sm`
    /// one.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// Marks the lines in `lines`, numbered from 1.
    #[must_use]
    pub fn highlight(mut self, lines: RangeInclusive<usize>) -> Self {
        self.highlight = Some(lines);
        self
    }

    fn lines(&self) -> Vec<String> {
        let lines: Vec<String> = self.code.lines().map(|line| line.replace('\t', "    ")).collect();
        if lines.is_empty() {
            vec![String::new()]
        } else {
            lines
        }
    }

    /// The columns of the line numbers and their gap.
    fn gutter(&self, lines: usize) -> u16 {
        if self.line_numbers {
            lines.to_string().len() as u16 + 2
        } else {
            0
        }
    }

    /// Each line of code, in rows of `width` cells.
    fn rows(&self, lines: &[String], width: u16) -> Vec<Vec<Vec<Span<'static>>>> {
        let room = usize::from(width.saturating_sub(self.gutter(lines.len())));
        let style = self.theme.text();
        lines
            .iter()
            .map(|line| {
                let spans = vec![Span::styled(line.clone(), style)];
                if self.wrap {
                    split(spans, room)
                } else {
                    vec![spans]
                }
            })
            .collect()
    }

    /// The rows the block takes at `width` columns.
    pub fn height(&self, width: u16) -> u16 {
        let card = Card::new(self.theme).size(self.size);
        let inner = card.inner(Rect::new(0, 0, width, 3));
        let rows: usize = self.rows(&self.lines(), inner.width).iter().map(Vec::len).sum();
        u16::try_from(rows).unwrap_or(u16::MAX).saturating_add(2)
    }
}

impl Widget for CodeBlock<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let card = Card::new(t).size(self.size);
        card.render(area, buf);
        let inner = card.inner(area).intersection(buf.area);
        if inner.is_empty() {
            return;
        }
        let lines = self.lines();
        let gutter = self.gutter(lines.len());
        let digits = usize::from(gutter.saturating_sub(2));
        let x = inner.x.saturating_add(gutter);
        let room = inner.width.saturating_sub(gutter);
        let title = self.title.filter(|title| cells(title) as u16 + 2 < room);
        let mut y = inner.y;
        for (n, rows) in self.rows(&lines, inner.width).into_iter().enumerate() {
            let marked = self.highlight.as_ref().is_some_and(|range| range.contains(&(n + 1)));
            for (i, row) in rows.into_iter().enumerate() {
                if y >= inner.bottom() {
                    return;
                }
                if self.line_numbers && i == 0 {
                    write(buf, inner.x, y, &format!("{:>digits$}", n + 1), t.subtle());
                }
                // The title keeps its columns on the first row.
                let width = match (y == inner.y, title) {
                    (true, Some(title)) => room - cells(title) as u16 - 2,
                    _ => room,
                };
                let (spans, _) = cut(row, usize::from(width));
                if x < inner.right() {
                    buf.set_line(x, y, &Line::from(spans), width);
                }
                if marked {
                    let full = Rect::new(area.x, y, area.width, 1);
                    put(buf, area.x, y, "▌", t.color(r.primary));
                    t.select(buf, full);
                }
                y += 1;
            }
        }
        if let Some(title) = title {
            write(buf, inner.right() - cells(title) as u16, inner.y, title, t.muted());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    const CODE: &str = "restart: unless-stopped\nmemory_limit: 1G\nimage: postgres:18";

    #[test]
    fn numbers_title_and_half_rows() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let block = CodeBlock::new(&theme, CODE).line_numbers(true).title("yaml");
        assert_eq!(block.height(40), 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 5));
        block.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "▄".repeat(40));
        assert_eq!(row(&buf, 1), "  1  restart: unless-stopped      yaml  ");
        assert_eq!(row(&buf, 3), "  3  image: postgres:18                 ");
        assert_eq!(buf[(2, 1)].fg, theme.color(theme.tokens().subtle_foreground));
        assert_eq!(row(&buf, 4), "▀".repeat(40));
    }

    #[test]
    fn long_lines_cut_or_wrap_and_a_range_is_marked() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 14, 5));
        CodeBlock::new(&theme, CODE).size(Size::Sm).highlight(2..=2).render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), " restart: un… ");
        assert_eq!(row(&buf, 2), "▌memory_limi… ");
        assert_eq!(buf[(5, 2)].bg, theme.selected_color());
        let wrapped = CodeBlock::new(&theme, CODE).size(Size::Sm).wrap(true);
        assert_eq!(wrapped.height(14), 2 + 2 + 2 + 2);
        for (w, h) in [(0, 0), (1, 1), (5, 2), (8, 3)] {
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            CodeBlock::new(&theme, CODE).line_numbers(true).title("yaml").render(buf.area, &mut buf);
        }
    }
}
