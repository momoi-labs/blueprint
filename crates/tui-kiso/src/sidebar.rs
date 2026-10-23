use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, fit};
use crate::Theme;

/// Which side of the screen the [`Sidebar`] takes.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Side {
    /// As on Kiso's web consoles.
    #[default]
    Left,
    /// As in Crush.
    Right,
}

/// One row of the sidebar: a label, and either its key on the right or a
/// mark before it, such as a status dot.
#[derive(Clone, Debug)]
pub struct SideItem<'a> {
    label: String,
    key: Option<&'a str>,
    mark: Option<Span<'a>>,
}

impl<'a> SideItem<'a> {
    pub fn new(label: impl Into<String>) -> Self {
        Self { label: label.into(), key: None, mark: None }
    }

    /// The key that opens it, in `subtle-foreground` at the right edge.
    pub fn key(mut self, key: &'a str) -> Self {
        self.key = Some(key);
        self
    }

    /// A mark before the label, such as a `●` in a status color.
    pub fn mark(mut self, mark: Span<'a>) -> Self {
        self.mark = Some(mark);
        self
    }

    fn width(&self) -> usize {
        let label = cells(&self.label);
        match (&self.key, &self.mark) {
            (Some(key), _) => label + 2 + cells(key),
            (None, Some(mark)) => label + 1 + mark.width(),
            (None, None) => label,
        }
    }
}

/// The navigation, as in Crush's sidebar: a few lines on top, such as the
/// brand and the host, then groups of items under a section rule. It is as
/// wide as its longest line, from 20 to 32 columns, so the page keeps the
/// rest.
///
/// The current item is bold `link`. While the sidebar has focus, it is
/// filled with `primary` instead.
#[derive(Clone, Debug)]
pub struct Sidebar<'a> {
    theme: &'a Theme,
    head: Vec<Line<'a>>,
    groups: Vec<(String, Vec<SideItem<'a>>)>,
    current: Option<usize>,
    focused: bool,
}

impl<'a> Sidebar<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, head: Vec::new(), groups: Vec::new(), current: None, focused: false }
    }

    /// The lines on top, such as the brand and what the screen is about.
    pub fn head(mut self, lines: impl IntoIterator<Item = Line<'a>>) -> Self {
        self.head = lines.into_iter().collect();
        self
    }

    /// A group of items under a section rule titled `title`.
    pub fn group(mut self, title: impl Into<String>, items: impl IntoIterator<Item = SideItem<'a>>) -> Self {
        self.groups.push((title.into(), items.into_iter().collect()));
        self
    }

    /// The current item, counted across the groups.
    pub fn current(mut self, item: Option<usize>) -> Self {
        self.current = item;
        self
    }

    /// True while the sidebar has focus.
    pub fn focused(mut self, focused: bool) -> Self {
        self.focused = focused;
        self
    }

    /// The width it needs: its longest line, from 20 to 32 columns.
    pub fn width(&self) -> u16 {
        let head = self.head.iter().map(Line::width).max().unwrap_or(0);
        let items = self.groups.iter().flat_map(|(_, items)| items).map(SideItem::width).max().unwrap_or(0);
        // A group title needs a space and at least one cell of its rule.
        let titles = self.groups.iter().map(|(title, _)| cells(title) + 2).max().unwrap_or(0);
        head.max(items).max(titles).clamp(20, 32) as u16
    }

    /// Splits `body`, the screen less two columns on each side and the
    /// footer, into the sidebar and the page, four columns apart. The page
    /// keeps two columns on its right for its scrollbar. When the page
    /// would get fewer than 60 columns, there is no sidebar.
    pub fn split(&self, body: Rect, side: Side) -> (Option<Rect>, Rect) {
        let width = self.width();
        // The page loses the sidebar, the gap, and its scrollbar columns on
        // the left side.
        let taken = match side {
            Side::Left => width + 6,
            Side::Right => width + 4,
        };
        if body.width < taken + 60 {
            return (None, Rect { width: body.width.saturating_sub(2), ..body });
        }
        match side {
            Side::Right => (Some(Rect { x: body.right() - width, width, ..body }), Rect { width: body.width - width - 4, ..body }),
            Side::Left => {
                (Some(Rect { width, ..body }), Rect { x: body.x + width + 4, width: body.width - width - 6, ..body })
            }
        }
    }
}

impl Widget for Sidebar<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let width = usize::from(area.width);
        let mut lines: Vec<(Line, Option<usize>)> = self.head.into_iter().map(|line| (line, None)).collect();
        let mut index = 0;
        for (title, items) in self.groups {
            let mut rule = vec![Span::styled(format!("{title} "), t.muted())];
            rule.extend(t.look().rule.spans(t, width.saturating_sub(cells(&title) + 1)));
            lines.extend([(Line::default(), None), (Line::from(rule), None), (Line::default(), None)]);
            for item in items {
                let style = if self.current == Some(index) && !self.focused {
                    t.link().add_modifier(Modifier::BOLD)
                } else {
                    t.muted()
                };
                let line = match (item.key, item.mark) {
                    (Some(key), _) => {
                        // A long label ends in `…` two cells before the key,
                        // so the key stays at the right edge.
                        let room = width.saturating_sub(cells(key) + 2);
                        let mut spans = fit(vec![Span::styled(item.label, style)], room);
                        spans.extend([Span::raw("  "), Span::styled(key, t.subtle())]);
                        Line::from(spans)
                    }
                    (None, Some(mark)) => Line::from(vec![mark, Span::raw(" "), Span::styled(item.label, style)]),
                    (None, None) => Line::styled(item.label, style),
                };
                lines.push((line, Some(index)));
                index += 1;
            }
        }
        // When the screen is short, the lines scroll so the current item
        // stays on screen.
        let at = lines.iter().position(|(_, item)| item.is_some() && *item == self.current).unwrap_or(0);
        let skip = (at + 1).saturating_sub(usize::from(area.height));
        for (dy, (line, item)) in lines.iter().skip(skip).enumerate() {
            let y = area.y + dy as u16;
            if y >= area.bottom() {
                break;
            }
            buf.set_line(area.x, y, line, area.width);
            if self.focused && item.is_some() && *item == self.current {
                t.select_fill(buf, Rect::new(area.x.saturating_sub(1), y, area.width + 2, 1));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fits_its_longest_line() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = Sidebar::new(&theme).group("Pages", [SideItem::new("Custom images").key("7")]);
        assert_eq!(side.width(), 20, "never below 20");
        let side = side.head([Line::raw("  ● Healthy · up 12 days")]);
        assert_eq!(side.width(), 24);
    }

    #[test]
    fn a_long_group_title_widens_it() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = Sidebar::new(&theme).group("Deployment environments", [SideItem::new("Production")]);
        assert_eq!(side.width(), 25);
    }

    #[test]
    fn a_long_label_keeps_its_key() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = Sidebar::new(&theme).group("Pages", [SideItem::new("x".repeat(40)).key("12")]);
        let area = Rect::new(0, 0, side.width(), 4);
        let mut buf = Buffer::empty(area);
        side.render(area, &mut buf);
        let row: String = (0..area.width).map(|x| buf[(x, 3)].symbol()).collect();
        assert!(row.ends_with("x…  12"), "{row}");
    }

    #[test]
    fn a_short_screen_scrolls_to_the_current_item() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let items = (0..20).map(|i| SideItem::new(format!("Item {i}")));
        let side = Sidebar::new(&theme).group("Items", items).current(Some(19)).focused(true);
        let area = Rect::new(1, 0, 20, 8);
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 8));
        side.render(area, &mut buf);
        let last: String = (1..21).map(|x| buf[(x, 7)].symbol()).collect();
        assert!(last.starts_with("Item 19"), "{last}");
    }

    #[test]
    fn a_narrow_screen_has_no_sidebar() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = Sidebar::new(&theme);
        let (none, page) = side.split(Rect::new(2, 0, 76, 23), Side::Left);
        assert_eq!(none, None);
        assert_eq!(page.width, 74);
        let (some, page) = side.split(Rect::new(2, 0, 126, 39), Side::Left);
        assert_eq!(some, Some(Rect::new(2, 0, 20, 39)));
        assert_eq!((page.x, page.width), (26, 100));
    }
}
