use std::cell::Cell;
use std::ops::Range;

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::Theme;

/// Where a page is scrolled to. Drawing updates it with the page and view
/// heights, so keys can scroll by what is on screen. It changes through a
/// shared reference, so a draw that only has `&self` can keep it.
#[derive(Clone, Debug, Default)]
pub struct Scroll {
    offset: Cell<usize>,
    follow: Cell<bool>,
    length: Cell<usize>,
    view: Cell<usize>,
}

impl Scroll {
    /// Back to the top, following the selection.
    pub fn top(&self) {
        self.offset.set(0);
        self.follow.set(true);
    }

    /// Scrolls on the next draw so the selected item is on screen.
    pub fn follow(&self) {
        self.follow.set(true);
    }

    /// Scrolls by `delta` rows, within the page.
    pub fn by(&self, delta: isize) {
        let max = self.length.get().saturating_sub(self.view.get());
        self.offset.set(self.offset.get().saturating_add_signed(delta).min(max));
        self.follow.set(false);
    }

    /// Half the rows on screen, at least one: what page up and down move.
    pub fn half(&self) -> isize {
        (self.view.get() / 2).max(1) as isize
    }

    /// The first row on screen.
    pub fn offset(&self) -> usize {
        self.offset.get()
    }
}

/// How the selected item of a page is drawn.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Mark {
    /// `primary-foreground` on `primary`, as in Crush's lists. For rows of
    /// plain text.
    Fill,
    /// The `selected` background and a `primary` `▌` in the first column.
    /// The row keeps its colors, for tables with states and figures.
    Bar,
    /// The `selected` background only, for a list without focus.
    Dim,
}

/// A page as rows of text, built for a width and drawn from a scroll
/// offset, so a page longer than the screen scrolls. Some rows form
/// items, the things a person can select.
///
/// No frames around parts of a page: a section is a title and a rule, and
/// only code blocks, buttons and the selection get a fill.
#[derive(Clone, Debug, Default)]
pub struct Page {
    /// Each row, and true for a row of a code block.
    rows: Vec<(Line<'static>, bool)>,
    items: Vec<Range<usize>>,
}

impl Page {
    pub fn line(&mut self, line: impl Into<Line<'static>>) {
        self.rows.push((line.into(), false));
    }

    pub fn blank(&mut self) {
        self.line(Line::default());
    }

    /// A row of a code block, filled with `card` from the third column.
    /// Keep a blank row above and below the block: they become half a row
    /// of fill each.
    pub fn code(&mut self, line: impl Into<Line<'static>>) {
        self.rows.push((line.into(), true));
    }

    /// Rows that are selected together, such as a record and its detail.
    pub fn item(&mut self, lines: impl IntoIterator<Item = Line<'static>>) {
        let start = self.rows.len();
        for line in lines {
            self.line(line);
        }
        self.items.push(start..self.rows.len());
    }

    /// A section: its title in `muted-foreground`, the look's rule to the
    /// edge and an optional count, then a blank row.
    pub fn section(&mut self, theme: &Theme, width: usize, title: &str, count: Option<usize>) {
        self.section_meta(theme, width, title, &count.map(|c| c.to_string()).unwrap_or_default());
    }

    /// `section` with any text at the end of the rule, such as "3 of 5".
    pub fn section_meta(&mut self, theme: &Theme, width: usize, title: &str, meta: &str) {
        let meta = if meta.is_empty() { String::new() } else { format!(" {meta}") };
        let rule = width.saturating_sub(cells(title) + cells(&meta) + 1);
        let mut spans = vec![Span::styled(format!("{title} "), theme.muted())];
        spans.extend(theme.look().rule.spans(theme, rule));
        spans.push(Span::styled(meta, theme.muted()));
        self.line(Line::from(spans));
        self.blank();
    }

    /// The number of rows.
    pub fn len(&self) -> usize {
        self.rows.len()
    }

    pub fn is_empty(&self) -> bool {
        self.rows.is_empty()
    }

    /// The number of items.
    pub fn items(&self) -> usize {
        self.items.len()
    }

    /// Where `item` shows when the page was last drawn in `view` with
    /// `scroll`: the rows of it on screen, or None when it is scrolled out.
    /// Call it after drawing, to anchor a [`Menu`](crate::Menu) to the
    /// selected row.
    pub fn item_area(&self, item: usize, view: Rect, scroll: &Scroll) -> Option<Rect> {
        let range = self.items.get(item)?;
        let offset = scroll.offset();
        let start = range.start.max(offset);
        let end = range.end.min(offset + usize::from(view.height));
        (start < end).then(|| Rect::new(view.x, view.y + (start - offset) as u16, view.width, (end - start) as u16))
    }

    /// The page as a widget, scrolled by `scroll`.
    pub fn view<'a>(&'a self, theme: &'a Theme, scroll: &'a Scroll) -> PageView<'a> {
        PageView { page: self, theme, scroll, selected: None, mark: Mark::Bar, border: None }
    }
}

/// A [`Page`] on screen: the rows that fit from the scroll offset, the
/// selected item, and a scrollbar one column right of the area when the
/// page is longer than it.
#[derive(Clone, Debug)]
pub struct PageView<'a> {
    page: &'a Page,
    theme: &'a Theme,
    scroll: &'a Scroll,
    selected: Option<usize>,
    mark: Mark,
    border: Option<u16>,
}

impl PageView<'_> {
    /// The selected item, by index among the items.
    pub fn selected(mut self, item: Option<usize>) -> Self {
        self.selected = item;
        self
    }

    /// How the selected item is drawn. [`Mark::Bar`] by default.
    pub fn mark(mut self, mark: Mark) -> Self {
        self.mark = mark;
        self
    }

    /// Inside a frame: the scrollbar becomes a heavier `┃` on the frame's
    /// right border, at column `x`, so it does not read as a second border.
    pub fn on_border(mut self, x: u16) -> Self {
        self.border = Some(x);
        self
    }
}

impl Widget for PageView<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let (t, rows, scroll) = (self.theme, &self.page.rows, self.scroll);
        let r = t.tokens();
        let area = area.intersection(buf.area);
        let height = usize::from(area.height);
        let mut offset = scroll.offset.get();
        if scroll.follow.get() {
            if let Some((index, range)) = self.selected.and_then(|i| self.page.items.get(i).map(|range| (i, range))) {
                if range.start < offset {
                    offset = range.start;
                } else if range.end > offset + height {
                    offset = range.end.saturating_sub(height);
                }
                // The first item shows the rows above it too, when they fit.
                if index == 0 && range.end <= height {
                    offset = 0;
                }
            }
            scroll.follow.set(false);
        }
        offset = offset.min(rows.len().saturating_sub(height));
        scroll.offset.set(offset);
        scroll.length.set(rows.len());
        scroll.view.set(height);
        if area.is_empty() {
            return;
        }

        let card = t.color(r.card);
        let inset = |n: u16| Rect { x: area.x.saturating_add(n), width: area.width.saturating_sub(n), ..area };
        for (dy, (line, code)) in rows.iter().skip(offset).take(height).enumerate() {
            let y = area.y + dy as u16;
            if *code {
                buf.set_style(Rect { y, height: 1, ..inset(2) }, ratatui::style::Style::new().bg(card));
                let text = inset(4);
                buf.set_line(text.x, y, line, text.width.saturating_sub(2));
                continue;
            }
            buf.set_line(area.x, y, line, area.width);
            // Half a row of padding above and below a code block.
            let next = rows.get(offset + dy + 1).is_some_and(|row| row.1);
            let prev = (offset + dy).checked_sub(1).is_some_and(|p| rows[p].1);
            if line.width() == 0 && (next || prev) {
                let symbol = if next { "▄" } else { "▀" };
                for x in inset(2).left()..area.right() {
                    buf[(x, y)].set_symbol(symbol).set_fg(card);
                }
            }
        }
        if let Some(range) = self.selected.and_then(|i| self.page.items.get(i)) {
            for i in range.clone().filter(|i| (offset..offset + height).contains(i)) {
                let row = Rect::new(area.x, area.y + (i - offset) as u16, area.width, 1);
                match self.mark {
                    Mark::Fill => t.select_fill(buf, row),
                    Mark::Dim => t.select(buf, row),
                    Mark::Bar => {
                        // The bar goes on first, so the selection checks its
                        // contrast as a mark, as it does for the row.
                        buf[(row.x, row.y)].set_symbol("▌").set_fg(t.color(r.primary));
                        t.select(buf, row);
                    }
                }
            }
        }
        if rows.len() > height {
            match self.border {
                None => {
                    if let Some(x) = area.right().checked_add(1) {
                        scrollbar(buf, t, Rect::new(x, area.y, 1, area.height), offset, rows.len());
                    }
                }
                Some(x) => {
                    for dy in thumb(height, offset, rows.len()) {
                        if let Some(cell) = buf.cell_mut((x, area.y.saturating_add(dy as u16))) {
                            cell.set_symbol("┃").set_fg(t.color(r.primary));
                        }
                    }
                }
            }
        }
    }
}

/// A scrollbar with no arrows: a faint `│` track and a `primary` thumb.
fn scrollbar(buf: &mut Buffer, t: &Theme, area: Rect, offset: usize, total: usize) {
    let r = t.tokens();
    let area = area.intersection(buf.area);
    let view = usize::from(area.height);
    if view == 0 || total <= view {
        return;
    }
    let thumb = thumb(view, offset, total);
    for dy in 0..view {
        let color = if thumb.contains(&dy) { r.primary } else { r.border };
        buf.set_string(area.x, area.y + dy as u16, "│", t.fg(color));
    }
}

/// The rows of a scrollbar `view` rows tall that show the visible part of
/// `total` rows from `offset`.
fn thumb(view: usize, offset: usize, total: usize) -> Range<usize> {
    if view == 0 || total <= view {
        return 0..0;
    }
    let size = (view * view / total).max(1);
    let top = offset * (view - size) / (total - view);
    top..top + size
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(items: usize) -> Page {
        let mut page = Page::default();
        for i in 0..items {
            page.item([Line::raw(format!("  item {i}"))]);
        }
        page
    }

    #[test]
    fn the_view_follows_the_selection() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (page, scroll) = (page(20), Scroll::default());
        let area = Rect::new(0, 0, 20, 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 5));
        scroll.follow();
        page.view(&theme, &scroll).selected(Some(12)).render(area, &mut buf);
        assert_eq!(scroll.offset(), 8);
        assert_eq!(buf[(0, 4)].symbol(), "▌");
        assert_eq!(buf[(21, 0)].symbol(), "│", "scrollbar one column right");
    }

    #[test]
    fn the_first_item_stays_on_screen_below_a_long_intro() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (mut page, scroll) = (Page::default(), Scroll::default());
        for _ in 0..6 {
            page.line(Line::raw("intro"));
        }
        page.item([Line::raw("  item")]);
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 3));
        scroll.follow();
        page.view(&theme, &scroll).selected(Some(0)).render(Rect::new(0, 0, 20, 3), &mut buf);
        assert_eq!(scroll.offset(), 4);
        assert_eq!(buf[(0, 2)].symbol(), "▌");
    }

    #[test]
    fn empty_and_edge_areas_draw_without_panicking() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (page, scroll) = (page(3), Scroll::default());
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        page.view(&theme, &scroll).selected(Some(0)).render(Rect::new(0, 0, 0, 1), &mut buf);
        let mut edge = Buffer::empty(Rect::new(65534, 0, 1, 1));
        page.view(&theme, &scroll).selected(Some(0)).render(Rect::new(65534, 0, 1, 1), &mut edge);
    }

    #[test]
    fn item_area_follows_the_scroll() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (page, scroll) = (page(20), Scroll::default());
        let view = Rect::new(2, 3, 20, 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 10));
        scroll.follow();
        page.view(&theme, &scroll).selected(Some(12)).render(view, &mut buf);
        assert_eq!(page.item_area(12, view, &scroll), Some(Rect::new(2, 7, 20, 1)));
        assert_eq!(page.item_area(0, view, &scroll), None);
        assert_eq!(page.item_area(99, view, &scroll), None);
    }

    #[test]
    fn scrolling_stops_at_the_end() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (page, scroll) = (page(10), Scroll::default());
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 4));
        page.view(&theme, &scroll).render(Rect::new(0, 0, 20, 4), &mut buf);
        scroll.by(100);
        assert_eq!(scroll.offset(), 6);
    }
}
