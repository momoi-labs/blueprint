use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::widgets::Widget;

use crate::overlay::{place, surface};
use crate::surface::{put, write};
use crate::text::{cells, take_cells};
use crate::{FilterInput, Search, Size, Theme};

/// How an action of a [`DropdownMenu`] looks.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Kind {
    Plain,
    Danger,
    Disabled,
    /// A choice, with `✓` when it is the current one.
    Check(bool),
}

#[derive(Clone, Debug)]
enum Item<'a> {
    Action { label: &'a str, key: &'a str, kind: Kind },
    Separator,
}

/// The actions of one thing, such as a row, on the overlay surface: the
/// web's `⋯` menu. It opens under its anchor, two columns in, or above it
/// when there is no room below, and shifts left to stay on screen. It does
/// not dim the page.
///
/// Each action has its key on the right in `muted-foreground`. The
/// selected action is filled with `primary`; a destructive one is in
/// `danger-on-dark`, and selected it takes the `danger` fill, as a focused
/// destructive button does. A disabled action is `disabled`. A separator is
/// a `border` rule between groups. A title, when there is one, is a muted
/// caption on top, and a [`DropdownMenu::filter`] puts a filter field
/// under it.
///
/// ↑↓ and enter, or an action's key, run one; esc closes. Anchor it with
/// [`Page::item_area`](crate::Page::item_area).
#[derive(Clone, Debug)]
pub struct DropdownMenu<'a> {
    theme: &'a Theme,
    title: String,
    items: Vec<Item<'a>>,
    selected: usize,
    anchor: Rect,
    filter: Option<&'a str>,
    empty: &'a str,
}

/// The crate's first name for [`DropdownMenu`].
pub type Menu<'a> = DropdownMenu<'a>;

impl<'a> DropdownMenu<'a> {
    /// A menu titled with what it acts on, such as the row's name, under
    /// `anchor`, the row on screen. An empty title shows no caption.
    pub fn new(theme: &'a Theme, title: impl Into<String>, anchor: Rect) -> Self {
        Self { theme, title: title.into(), items: Vec::new(), selected: 0, anchor, filter: None, empty: "No actions" }
    }

    fn push(mut self, label: &'a str, key: &'a str, kind: Kind) -> Self {
        self.items.push(Item::Action { label, key, kind });
        self
    }

    /// An action and its key.
    #[must_use]
    pub fn action(self, label: &'a str, key: &'a str) -> Self {
        self.push(label, key, Kind::Plain)
    }

    /// An action that destroys something, such as Remove.
    #[must_use]
    pub fn danger(self, label: &'a str, key: &'a str) -> Self {
        self.push(label, key, Kind::Danger)
    }

    /// An action that does not apply now. It keeps its place.
    #[must_use]
    pub fn disabled(self, label: &'a str, key: &'a str) -> Self {
        self.push(label, key, Kind::Disabled)
    }

    /// A choice, marked `✓` when `on`, such as the current scope.
    #[must_use]
    pub fn check(self, label: &'a str, on: bool) -> Self {
        self.push(label, "", Kind::Check(on))
    }

    /// A rule between two groups of actions.
    #[must_use]
    pub fn separator(mut self) -> Self {
        self.items.push(Item::Separator);
        self
    }

    /// The selected action, counted without the separators.
    #[must_use]
    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }

    /// A filter field on top with what the person typed. The app passes
    /// only the actions that match.
    #[must_use]
    pub fn filter(mut self, query: &'a str) -> Self {
        self.filter = Some(query);
        self
    }

    /// The muted row of a menu with no actions, such as when nothing
    /// matches the filter. "No actions" by default.
    #[must_use]
    pub fn empty(mut self, text: &'a str) -> Self {
        self.empty = text;
        self
    }

    /// The rows above the actions: the caption and the filter.
    fn head(&self) -> u16 {
        u16::from(!self.title.is_empty()) + if self.filter.is_some() { 2 } else { 0 }
    }

    /// The area the menu takes on `screen`: two columns in from the
    /// anchor, below it or above it, and inside the screen.
    pub fn area(&self, screen: Rect) -> Rect {
        let widest = self
            .items
            .iter()
            .map(|item| match item {
                Item::Action { label, key, kind: Kind::Check(_) } => cells(label) + 3 + cells(key).max(1),
                Item::Action { label, key, .. } => cells(label) + 3 + cells(key),
                Item::Separator => 0,
            })
            .max()
            .unwrap_or(0)
            .max(cells(&self.title))
            .max(cells(self.empty))
            .max(if self.filter.is_some() { 20 } else { 0 });
        let width = widest.saturating_add(4).min(usize::from(u16::MAX)) as u16;
        let rows = self.items.len().max(1).min(usize::from(u16::MAX)) as u16;
        let height = rows.saturating_add(self.head()).saturating_add(2);
        let anchor = Rect { x: self.anchor.x.saturating_add(2), ..self.anchor };
        place(screen, anchor, width, height)
    }
}

impl Widget for DropdownMenu<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let area = self.area(screen.intersection(buf.area));
        if area.height < 3 || area.width < 5 {
            return;
        }
        surface(t, buf, area);
        let (x, right) = (area.x + 2, area.right() - 2);
        let room = usize::from(right - x);
        let mut y = area.y + 1;
        let bottom = area.bottom() - 1;
        if !self.title.is_empty() {
            write(buf, x, y, take_cells(&self.title, room).0, t.muted());
            y += 1;
        }
        if let Some(query) = self.filter {
            let search = Search { query: query.to_owned(), typing: true };
            if y < bottom {
                FilterInput::new(t, &search).placeholder("Filter").size(Size::Sm).render(Rect::new(x, y, right - x, 1), buf);
            }
            y = y.saturating_add(2);
        }
        if self.items.is_empty() {
            if y < bottom {
                write(buf, x, y, take_cells(self.empty, room).0, t.muted());
            }
            return;
        }
        // When the screen cuts the menu, the rows shown keep the selected
        // action in view.
        let rows = usize::from(bottom.saturating_sub(y));
        let actions: Vec<usize> = (0..self.items.len()).filter(|i| matches!(self.items[*i], Item::Action { .. })).collect();
        let at = actions.get(self.selected).or(actions.last()).copied().unwrap_or(0);
        let start = at.saturating_sub(rows.saturating_sub(1));
        for (i, item) in self.items.iter().enumerate().skip(start).take(rows) {
            let row_y = y + (i - start) as u16;
            let Item::Action { label, key, kind } = item else {
                for column in x..right {
                    put(buf, column, row_y, "─", t.color(r.border));
                }
                continue;
            };
            let (key, key_style) = match kind {
                Kind::Check(true) => ("✓", t.fg(r.primary)),
                Kind::Check(false) => ("", t.muted()),
                Kind::Disabled => (*key, t.disabled()),
                _ => (*key, t.muted()),
            };
            let (key, key_width) = take_cells(key, room / 2);
            let label_room = room.saturating_sub(key_width + 1);
            let label = match cells(label) > label_room {
                true if label_room > 0 => format!("{}…", take_cells(label, label_room - 1).0),
                true => String::new(),
                false => (*label).to_owned(),
            };
            let style = match kind {
                Kind::Danger => t.danger(),
                Kind::Disabled => t.disabled(),
                _ => t.text(),
            };
            write(buf, x, row_y, &label, style);
            write(buf, right.saturating_sub(key_width as u16), row_y, key, key_style);
            if i == at {
                let row = Rect::new(area.x, row_y, area.width, 1);
                if *kind == Kind::Danger {
                    buf.set_style(row, t.fill(r.danger_foreground, r.danger).add_modifier(Modifier::BOLD));
                } else {
                    t.select_fill(buf, row);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn menu(theme: &Theme, anchor: Rect) -> Menu<'_> {
        Menu::new(theme, "laya.momoi.internal/", anchor).action("Open app", "enter").action("Copy URL", "c").danger("Remove route", "x")
    }

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn it_opens_below_the_row_or_above_it() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let below = menu(&theme, Rect::new(30, 5, 50, 1)).area(screen);
        assert_eq!((below.x, below.y, below.height), (32, 6, 6));
        let above = menu(&theme, Rect::new(30, 21, 50, 1)).area(screen);
        assert_eq!(above.y, 15);
    }

    #[test]
    fn it_stays_on_screen_at_every_edge() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 40, 6);
        for (x, y) in [(0, 0), (39, 0), (0, 5), (39, 5), (20, 3)] {
            let area = menu(&theme, Rect::new(x, y, 1, 1)).area(screen);
            assert_eq!(area.intersection(screen), area, "{area:?} from {x},{y}");
            let mut buf = Buffer::empty(screen);
            menu(&theme, Rect::new(x, y, 1, 1)).selected(2).render(screen, &mut buf);
        }
        for size in 0..8 {
            let tiny = Rect::new(0, 0, size, size);
            menu(&theme, Rect::new(0, 0, 1, 1)).filter("x").separator().render(tiny, &mut Buffer::empty(tiny));
        }
    }

    #[test]
    fn a_cut_menu_keeps_the_selected_action() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let labels: Vec<String> = (0..25).map(|i| format!("Action {i}")).collect();
        let mut menu = Menu::new(&theme, "row", Rect::new(0, 0, 80, 1));
        for label in &labels {
            menu = menu.action(label, "");
        }
        let screen = Rect::new(0, 0, 80, 24);
        let mut buf = Buffer::empty(screen);
        menu.selected(24).render(screen, &mut buf);
        let text: String = buf.content.iter().map(|c| c.symbol()).collect();
        assert!(text.contains("Action 24"), "the selected action is cut off");
    }

    #[test]
    fn rows_have_keys_separators_and_marks() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 40, 12);
        let mut buf = Buffer::empty(screen);
        let menu = DropdownMenu::new(&theme, "", Rect::new(0, 0, 10, 1))
            .action("Open", "enter")
            .separator()
            .check("acme", true)
            .disabled("Move", "m")
            .danger("Delete", "x")
            .selected(3);
        let area = menu.area(screen);
        menu.render(screen, &mut buf);
        assert_eq!(area, Rect::new(2, 1, 16, 7));
        assert_eq!(row(&buf, 2), "    Open   enter");
        assert_eq!(row(&buf, 3), format!("    {}", "─".repeat(12)));
        assert_eq!(row(&buf, 4), "    acme       ✓");
        assert_eq!(buf[(4, 5)].fg, theme.disabled().fg.unwrap());
        // The selected destructive action takes the danger fill.
        assert_eq!(buf[(4, 6)].bg, theme.color(theme.tokens().danger));
        assert_eq!(buf[(4, 2)].bg, theme.color(theme.tokens().popover));
    }
}
