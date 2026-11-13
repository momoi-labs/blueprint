use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::{Badge, Theme, Tone};

/// Which side of the screen the [`Sidebar`] takes.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Side {
    /// As on Kiso's web consoles.
    #[default]
    Left,
    /// As in Crush.
    Right,
}

/// One row of the sidebar: a label, and on the right a count badge, a key,
/// or both. A mark before the label, such as a status dot, is optional.
#[derive(Clone, Debug)]
pub struct SideItem<'a> {
    label: String,
    key: Option<&'a str>,
    mark: Option<Span<'a>>,
    badge: Option<String>,
    disabled: bool,
}

/// The columns before a label: room for the selection bar.
const INDENT: usize = 2;

impl<'a> SideItem<'a> {
    pub fn new(label: impl Into<String>) -> Self {
        Self { label: label.into(), key: None, mark: None, badge: None, disabled: false }
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

    /// A count or short word at the right edge, as a neutral
    /// [`Badge`](crate::Badge). With a key, the badge goes before it.
    #[must_use]
    pub fn badge(mut self, badge: impl Into<String>) -> Self {
        self.badge = Some(badge.into());
        self
    }

    /// An item that cannot be chosen: its label is `disabled`.
    /// [`Sidebar::step`] skips it.
    #[must_use]
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// The cells of the badge, with its edges, and of the key, and the one
    /// between them.
    fn right(&self) -> usize {
        let badge = self.badge.as_deref().map_or(0, |badge| cells(badge) + 2);
        let key = self.key.map_or(0, cells);
        badge + key + usize::from(badge > 0 && key > 0)
    }

    fn width(&self) -> usize {
        let mark = self.mark.as_ref().map_or(0, |mark| mark.width() + 1);
        let right = self.right();
        INDENT + mark + cells(&self.label) + if right > 0 { right + 2 } else { 0 }
    }
}

/// The navigation, as in Crush's sidebar: a few lines on top, such as the
/// brand and the host, then groups of items under a section rule. It is as
/// wide as its longest line, from 20 to 32 columns, so the page keeps the
/// rest.
///
/// This is also the web's Navigation: the list of [`SideItem`]s is the
/// navigation, and there is no second type for it.
///
/// The current item is bold `foreground` on the `selected` fill across the
/// whole width, with a `primary` `▌` in the first column, as the selected
/// row of a [`Table`](crate::Table). While the sidebar has no focus the bar
/// is `subtle-foreground`. Other items are `muted-foreground`; a disabled
/// one is `disabled`. When the lines are taller than the area, they scroll
/// so the current item and the line after it stay on screen.
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

    /// A group of items under a caption and a section rule titled `title`.
    /// An empty title leaves a blank row and no rule.
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

    /// The item after (or before) `from`, counted across the groups, that
    /// is not disabled. `None` when there is no such item, so the caller
    /// keeps the current one. With no `from`, it starts at the first item
    /// (or the last).
    pub fn step(&self, from: Option<usize>, forward: bool) -> Option<usize> {
        let off: Vec<bool> = self.groups.iter().flat_map(|(_, items)| items).map(|item| item.disabled).collect();
        if forward {
            (from.map_or(0, |i| i.saturating_add(1))..off.len()).find(|&i| !off[i])
        } else {
            (0..from.unwrap_or(off.len()).min(off.len())).rev().find(|&i| !off[i])
        }
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

/// One line of the sidebar, and what it needs once the fill is down.
struct Row<'a> {
    line: Line<'a>,
    /// The item's index, for the lines that are items.
    item: Option<usize>,
    /// The badge, and the column it starts in.
    badge: Option<(String, u16)>,
}

impl Widget for Sidebar<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let t = self.theme;
        let width = usize::from(area.width);
        let plain = |line: Line<'static>| Row { line, item: None, badge: None };
        let mut rows: Vec<Row> = self.head.into_iter().map(|line| Row { line, item: None, badge: None }).collect();
        let mut index = 0;
        for (title, items) in self.groups {
            rows.push(plain(Line::default()));
            if !title.is_empty() {
                let mut rule = vec![Span::styled(format!("{title} "), t.muted())];
                rule.extend(t.look().rule.spans(t, width.saturating_sub(cells(&title) + 1)));
                rows.extend([plain(Line::from(rule)), plain(Line::default())]);
            }
            for item in items {
                let style = if item.disabled {
                    t.disabled()
                } else if self.current == Some(index) {
                    t.strong()
                } else {
                    t.muted()
                };
                let right = item.right();
                let gap = if right > 0 { 2 } else { 0 };
                let room = width.saturating_sub(INDENT + right + gap);
                let mut left = Vec::new();
                if let Some(mark) = item.mark {
                    left.extend([mark, Span::raw(" ")]);
                }
                left.push(Span::styled(item.label, style));
                let (mut spans, used) = cut(left, room);
                spans.insert(0, Span::raw(" ".repeat(INDENT)));
                spans.push(Span::raw(" ".repeat(room.saturating_sub(used) + gap)));
                // The badge is a widget, drawn over the fill; its place is
                // blank here.
                let badge_width = item.badge.as_deref().map_or(0, |badge| cells(badge) + 2);
                let badge = item.badge.map(|badge| (badge, width.saturating_sub(right) as u16));
                spans.push(Span::raw(" ".repeat(badge_width + usize::from(badge_width > 0 && item.key.is_some()))));
                if let Some(key) = item.key {
                    spans.push(Span::styled(key, t.subtle()));
                }
                rows.push(Row { line: Line::from(spans), item: Some(index), badge });
                index += 1;
            }
        }
        // When the area is short, the lines scroll so the current item and
        // the line after it stay on screen.
        let at = rows.iter().position(|row| row.item.is_some() && row.item == self.current).unwrap_or(0);
        let skip = (at + 2).min(rows.len()).saturating_sub(usize::from(area.height));
        let (accent, quiet) = (t.color(t.tokens().primary), t.color(t.tokens().subtle_foreground));
        for (dy, row) in rows.iter().skip(skip).enumerate() {
            let y = area.y.saturating_add(dy as u16);
            if y >= area.bottom() {
                break;
            }
            buf.set_line(area.x, y, &row.line, area.width);
            if row.item.is_some() && row.item == self.current {
                // The bar goes on first, so the selection checks its
                // contrast as a mark.
                buf[(area.x, y)].set_symbol("▌").set_fg(if self.focused { accent } else { quiet });
                t.select(buf, Rect::new(area.x, y, area.width, 1));
            }
            if let Some((badge, x)) = &row.badge {
                let badge = Badge::new(t, Tone::Neutral, badge.as_str());
                badge.render(Rect::new(area.x.saturating_add(*x), y, area.width.saturating_sub(*x), 1), buf);
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

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn a_short_screen_scrolls_to_the_current_item() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let items = (0..20).map(|i| SideItem::new(format!("Item {i}")));
        let side = Sidebar::new(&theme).group("Items", items).current(Some(19)).focused(true);
        let area = Rect::new(1, 0, 20, 8);
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 8));
        side.render(area, &mut buf);
        assert!(row(&buf, 7).starts_with(" ▌ Item 19"), "{}", row(&buf, 7));
    }

    #[test]
    fn the_line_after_the_current_item_stays_on_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let items = (0..20).map(|i| SideItem::new(format!("Item {i}")));
        let side = Sidebar::new(&theme).group("Items", items).current(Some(10)).focused(true);
        let area = Rect::new(0, 0, 20, 8);
        let mut buf = Buffer::empty(area);
        side.render(area, &mut buf);
        assert!(row(&buf, 6).starts_with("▌ Item 10"), "{}", row(&buf, 6));
        assert!(row(&buf, 7).starts_with("  Item 11"), "{}", row(&buf, 7));
    }

    #[test]
    fn the_current_item_is_a_fill_with_a_bar() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = |focused| Sidebar::new(&theme).group("", [SideItem::new("One"), SideItem::new("Two")]).current(Some(1)).focused(focused);
        let area = Rect::new(0, 0, 20, 4);
        let mut buf = Buffer::empty(area);
        side(true).render(area, &mut buf);
        // A blank row, then the items.
        assert_eq!(row(&buf, 2), format!("▌ Two{}", " ".repeat(15)));
        assert_eq!(buf[(0, 2)].fg, theme.color(theme.tokens().primary));
        assert!((0..20).all(|x| buf[(x, 2)].bg == theme.selected_color()));
        assert!((0..20).all(|x| buf[(x, 1)].bg != theme.selected_color()));
        let mut buf = Buffer::empty(area);
        side(false).render(area, &mut buf);
        assert_eq!(buf[(0, 2)].fg, theme.color(theme.tokens().subtle_foreground));
    }

    #[test]
    fn a_badge_sits_at_the_right_edge_before_the_key() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let items = [SideItem::new("Inbox").badge("12"), SideItem::new("Runs").badge("3").key("r")];
        let side = Sidebar::new(&theme).group("", items).current(Some(0)).focused(true);
        let area = Rect::new(0, 0, 24, 3);
        let mut buf = Buffer::empty(area);
        side.render(area, &mut buf);
        assert_eq!(row(&buf, 1), format!("▌ Inbox{} 12 ", " ".repeat(13)));
        assert_eq!(row(&buf, 2), format!("  Runs{} 3  r", " ".repeat(13)));
        // The badge is a tint over the selection.
        assert_eq!(buf[(19, 1)].bg, theme.selected_color());
        assert_ne!(buf[(20, 1)].bg, theme.selected_color());
        let mut narrow = Buffer::empty(Rect::new(0, 0, 14, 3));
        Sidebar::new(&theme).group("", [SideItem::new("A long label").badge("12")]).render(narrow.area, &mut narrow);
        assert!(row(&narrow, 1).ends_with("…   12 "), "{}", row(&narrow, 1));
    }

    #[test]
    fn a_disabled_item_is_skipped_by_step() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let items = [SideItem::new("A"), SideItem::new("B").disabled(true), SideItem::new("C"), SideItem::new("D").disabled(true)];
        let side = Sidebar::new(&theme).group("Pages", items);
        assert_eq!(side.step(None, true), Some(0));
        assert_eq!(side.step(Some(0), true), Some(2));
        assert_eq!(side.step(Some(2), true), None);
        assert_eq!(side.step(Some(2), false), Some(0));
        assert_eq!(side.step(Some(0), false), None);
        assert_eq!(side.step(None, false), Some(2));
        let area = Rect::new(0, 0, 20, 6);
        let mut buf = Buffer::empty(area);
        side.render(area, &mut buf);
        assert_eq!(buf[(2, 4)].fg, theme.color(theme.tokens().disabled));
    }

    #[test]
    fn a_sidebar_in_an_edge_area_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let side = Sidebar::new(&theme)
            .head([Line::raw("head")])
            .group("Pages", [SideItem::new("A long label").badge("128").key("1"), SideItem::new("B").mark(Span::raw("●"))])
            .current(Some(0))
            .focused(true);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 4));
        for area in [Rect::new(0, 0, 0, 0), Rect::new(9, 3, 30, 30), Rect::new(0, 0, 3, 40), Rect::new(11, 0, 1, 1)] {
            side.clone().render(area, &mut buf);
        }
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
