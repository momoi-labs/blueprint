use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::widgets::Widget;

use crate::surface::{cap, write};
use crate::text::cells;
use crate::Theme;

/// The page numbers that show when there are too many: the first, the
/// last, and the ones around the current page.
const SLOTS: usize = 7;

/// One thing on the row.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Item {
    Previous,
    Next,
    /// A page, from 0.
    Page(usize),
    /// Pages left out.
    Gap,
}

/// The pages of a longer list, on one row: `‹ 1 2 3 4 … 9 ›`, with the
/// current page on the `primary` fill. A row narrower than the numbers
/// gets `‹ 3 of 9 ›`. An arrow at the first or the last page is
/// `disabled`. An optional summary, such as "1 to 20 of 173", goes at the
/// left in `muted-foreground` when there is room, and the pages go to the
/// right.
///
/// `←` `→` (or `h` `l`) move a page with [`Pagination::key`]. The app
/// loads the page and keeps the index.
#[derive(Clone, Copy, Debug)]
pub struct Pagination<'a> {
    theme: &'a Theme,
    page: usize,
    pages: usize,
    summary: Option<(usize, usize, usize)>,
}

impl<'a> Pagination<'a> {
    /// `pages` pages, on the page at index `page`, from 0.
    pub fn new(theme: &'a Theme, page: usize, pages: usize) -> Self {
        let pages = pages.max(1);
        Self { theme, page: page.min(pages - 1), pages, summary: None }
    }

    /// The records on this page, from `first` to `last` (from 1), of
    /// `total`: "1 to 20 of 173".
    #[must_use]
    pub fn summary(mut self, first: usize, last: usize, total: usize) -> Self {
        self.summary = Some((first, last, total));
        self
    }

    /// The index of the current page, from 0.
    pub fn current(&self) -> usize {
        self.page
    }

    /// `←` and `→` (or `h` and `l`) move a page. Returns true when it
    /// moved.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, code: KeyCode) -> bool {
        let before = self.page;
        match code {
            KeyCode::Left | KeyCode::Char('h') => self.page = self.page.saturating_sub(1),
            KeyCode::Right | KeyCode::Char('l') => self.page = (self.page + 1).min(self.pages - 1),
            _ => {}
        }
        self.page != before
    }

    /// The pages that show: all of them up to seven, else the first, the
    /// last and the ones around the current page, with gaps.
    fn items(&self) -> Vec<Item> {
        let (page, last) = (self.page, self.pages - 1);
        let pages: Vec<Item> = if self.pages <= SLOTS {
            (0..self.pages).map(Item::Page).collect()
        } else if page < 4 {
            (0..5).map(Item::Page).chain([Item::Gap, Item::Page(last)]).collect()
        } else if page > last - 4 {
            [Item::Page(0), Item::Gap].into_iter().chain((last - 4..=last).map(Item::Page)).collect()
        } else {
            [Item::Page(0), Item::Gap, Item::Page(page - 1), Item::Page(page), Item::Page(page + 1), Item::Gap, Item::Page(last)].into()
        };
        [Item::Previous].into_iter().chain(pages).chain([Item::Next]).collect()
    }

    fn text(item: Item) -> String {
        match item {
            Item::Previous => "‹".into(),
            Item::Next => "›".into(),
            Item::Page(page) => (page + 1).to_string(),
            Item::Gap => "…".into(),
        }
    }

    /// The columns of the numbered form: two between items.
    fn full_width(&self) -> u16 {
        let items = self.items();
        let text: usize = items.iter().map(|item| cells(&Self::text(*item))).sum();
        (text + 2 * (items.len() - 1)) as u16
    }

    fn compact(&self) -> String {
        format!("{} of {}", self.page + 1, self.pages)
    }

    /// The columns of the short form: `‹ 3 of 9 ›`.
    fn compact_width(&self) -> u16 {
        cells(&self.compact()) as u16 + 4
    }

    /// The columns the row takes in `width`.
    pub fn width(&self, width: u16) -> u16 {
        let pages = if self.full_width() <= width { self.full_width() } else { self.compact_width() };
        match self.summary_text() {
            Some(summary) if cells(&summary) as u16 + 3 + pages <= width => cells(&summary) as u16 + 3 + pages,
            _ => pages.min(width),
        }
    }

    fn summary_text(&self) -> Option<String> {
        self.summary.map(|(first, last, total)| format!("{first} to {last} of {total}"))
    }

    fn arrow(&self, item: Item) -> Style {
        let t = self.theme;
        let end = match item {
            Item::Previous => self.page == 0,
            _ => self.page + 1 == self.pages,
        };
        if end {
            t.disabled()
        } else {
            t.text()
        }
    }
}

impl Widget for Pagination<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let full = self.full_width() <= area.width;
        let pages = if full { self.full_width() } else { self.compact_width() };
        let y = area.y;
        let mut x = area.x;
        if let Some(summary) = self.summary_text().filter(|s| cells(s) as u16 + 3 + pages <= area.width) {
            write(buf, x, y, &summary, t.muted());
            x = area.right() - pages;
        }
        let cut = |x: u16, text: &str, style: Style, buf: &mut Buffer| {
            if x < area.right() {
                let room = usize::from(area.right() - x);
                buf.set_stringn(x, y, text, room, style);
            }
            x.saturating_add(cells(text) as u16)
        };
        if !full {
            let x = cut(x, "‹ ", self.arrow(Item::Previous), buf);
            let x = cut(x, &(self.page + 1).to_string(), t.strong(), buf);
            let x = cut(x, &format!(" of {}", self.pages), t.muted(), buf);
            cut(x, " ›", self.arrow(Item::Next), buf);
            return;
        }
        let current = t.fill(r.primary_foreground, r.primary);
        for (i, item) in self.items().into_iter().enumerate() {
            if i > 0 {
                x = x.saturating_add(2);
            }
            let text = Self::text(item);
            let style = match item {
                Item::Previous | Item::Next => self.arrow(item),
                Item::Gap => t.subtle(),
                Item::Page(page) if page == self.page => {
                    // The fill reaches one column out on each side.
                    let color = current.bg.unwrap_or_default();
                    let after = x.saturating_add(cells(&text) as u16);
                    if x > area.x && after < area.right() {
                        cap(t, buf, x - 1, y, true, color);
                        cap(t, buf, after, y, false, color);
                    }
                    current.add_modifier(Modifier::BOLD)
                }
                Item::Page(_) => t.text(),
            };
            x = cut(x, &text, style, buf);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    fn draw(pagination: Pagination, width: u16) -> Buffer {
        let mut buf = Buffer::empty(Rect::new(0, 0, width, 1));
        pagination.render(buf.area, &mut buf);
        buf
    }

    #[test]
    fn many_pages_keep_the_ends_and_the_ones_around() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(row(&draw(Pagination::new(&theme, 2, 9), 26)), "‹  1  2  3  4  5  …  9  › ");
        assert_eq!(row(&draw(Pagination::new(&theme, 4, 9), 25)), "‹  1  …  4  5  6  …  9  ›");
        assert_eq!(row(&draw(Pagination::new(&theme, 8, 9), 25)), "‹  1  …  5  6  7  8  9  ›");
        let buf = draw(Pagination::new(&theme, 2, 9), 26);
        let fill = theme.color(theme.tokens().primary);
        assert!((8..=10).all(|x| buf[(x, 0)].bg == fill), "the current page is filled");
        assert_ne!(buf[(7, 0)].bg, fill);
    }

    #[test]
    fn a_narrow_row_says_which_page_of_how_many() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(row(&draw(Pagination::new(&theme, 2, 9), 20)).trim_end(), "‹ 3 of 9 ›");
        let first = draw(Pagination::new(&theme, 0, 9), 20);
        assert_eq!(first[(0, 0)].fg, theme.color(theme.tokens().disabled));
    }

    #[test]
    fn the_summary_goes_left_when_there_is_room() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let pagination = Pagination::new(&theme, 0, 3).summary(1, 20, 53);
        let text = row(&draw(pagination, 40));
        assert!(text.starts_with("1 to 20 of 53") && text.ends_with("‹  1  2  3  ›"), "{text}");
        assert!(!row(&draw(pagination, 16)).contains("53"));
        for width in 0..30 {
            draw(Pagination::new(&theme, 5, 120).summary(101, 120, 2400), width);
        }
    }

    #[cfg(feature = "crossterm")]
    #[test]
    fn arrows_move_and_stop_at_the_ends() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut pagination = Pagination::new(&theme, 0, 3);
        assert!(!pagination.key(KeyCode::Left));
        assert!(pagination.key(KeyCode::Char('l')));
        assert!(pagination.key(KeyCode::Right));
        assert!(!pagination.key(KeyCode::Right));
        assert_eq!(pagination.current(), 2);
    }
}
