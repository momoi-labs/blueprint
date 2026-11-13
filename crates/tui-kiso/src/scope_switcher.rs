use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::select::matches;
use crate::text::cells;
use crate::{DropdownMenu, Select, Size, Theme};

/// The scopes the person can work in, such as projects, more than this
/// many get a filter field.
const FILTER_FROM: usize = 8;

/// The control in the scope slot of the [`Header`](crate::Header): the
/// current scope and a `▾` on the `Sm` input surface, with the focus bars of
/// the other fields while it has focus.
///
/// Enter opens a [`DropdownMenu`] of the scopes under it, the current one
/// marked `✓`. With more than eight scopes the menu has a filter field and
/// shows only the scopes that hold what the person typed. ↑↓ and enter pick
/// one; esc closes.
///
/// Pass [`ScopeSwitcher::label`] to [`Header::scope`](crate::Header::scope),
/// then render the switcher into
/// [`Header::scope_area`](crate::Header::scope_area). The app keeps the
/// open state, the selected row and the filter, and turns the selected row
/// into a scope with [`ScopeSwitcher::pick`].
#[derive(Clone, Debug)]
pub struct ScopeSwitcher<'a> {
    theme: &'a Theme,
    scopes: Vec<String>,
    current: usize,
    focused: bool,
    open: Option<usize>,
    query: &'a str,
}

impl<'a> ScopeSwitcher<'a> {
    /// The scopes and the index of the current one.
    pub fn new(theme: &'a Theme, scopes: impl IntoIterator<Item = impl Into<String>>, current: usize) -> Self {
        Self { theme, scopes: scopes.into_iter().map(Into::into).collect(), current, focused: false, open: None, query: "" }
    }

    #[must_use]
    pub fn focused(mut self, focused: bool) -> Self {
        self.focused = focused;
        self
    }

    /// Opens the menu with the row `selected` selected, counted in the
    /// scopes that show.
    #[must_use]
    pub fn open(mut self, selected: Option<usize>) -> Self {
        self.open = selected;
        self
    }

    /// What the person typed in the filter of a long list.
    #[must_use]
    pub fn query(mut self, query: &'a str) -> Self {
        self.query = query;
        self
    }

    /// The current scope and its `▾`, for the header.
    pub fn label(&self) -> String {
        format!("{} ▾", self.scopes.get(self.current).map_or("", String::as_str))
    }

    /// True when the menu has a filter field.
    pub fn filtered(&self) -> bool {
        self.scopes.len() > FILTER_FROM
    }

    /// The scopes the open menu shows, by index.
    pub fn shown(&self) -> Vec<usize> {
        if self.filtered() { matches(&self.scopes, self.query) } else { (0..self.scopes.len()).collect() }
    }

    /// The scope at `row` of the open menu.
    pub fn pick(&self, row: usize) -> Option<usize> {
        self.shown().get(row).copied()
    }
}

impl Widget for ScopeSwitcher<'_> {
    /// `area` is the label's cells, as [`Header::scope_area`](crate::Header::scope_area)
    /// gives them. The field takes one more cell on each side, and its focus
    /// bars one more.
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let label = self.label();
        let width = (cells(&label) as u16).saturating_add(2);
        let field = Rect::new(area.x.saturating_sub(1), area.y, width, 1);
        let scope = self.scopes.get(self.current).cloned().unwrap_or_default();
        Select::new(t, [scope], Some(0)).size(Size::Sm).focused(self.focused).render(field, buf);
        let Some(selected) = self.open else { return };
        // The menu's text lines up with the scope's.
        let anchor = Rect::new(field.x.saturating_sub(3), field.y, field.width, 1);
        let mut menu = DropdownMenu::new(t, "", anchor).empty("No scopes").selected(selected);
        if self.filtered() {
            menu = menu.filter(self.query);
        }
        for i in self.shown() {
            menu = menu.check(&self.scopes[i], i == self.current);
        }
        let screen = buf.area;
        menu.render(screen, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn the_field_shows_the_scope_and_the_menu_checks_it() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 8));
        let switcher = ScopeSwitcher::new(&theme, ["acme", "laya"], 1).focused(true).open(Some(0));
        assert_eq!(switcher.label(), "laya ▾");
        switcher.render(Rect::new(4, 0, 6, 1), &mut buf);
        assert_eq!(row(&buf, 0), "  ▐ laya ▾ ▌");
        assert_eq!(row(&buf, 2), "    acme");
        assert_eq!(buf[(3, 2)].bg, theme.color(theme.tokens().primary));
        assert!(row(&buf, 3).starts_with("    laya") && row(&buf, 3).ends_with('✓'), "{}", row(&buf, 3));
    }

    #[test]
    fn a_long_list_filters() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let scopes: Vec<String> = (0..12).map(|i| format!("project-{i}")).collect();
        let switcher = ScopeSwitcher::new(&theme, scopes.clone(), 0).query("1");
        assert!(switcher.filtered());
        assert_eq!(switcher.shown(), vec![1, 10, 11]);
        assert_eq!(switcher.pick(1), Some(10));
        assert!(!ScopeSwitcher::new(&theme, ["a", "b"], 0).query("zz").filtered());
        for size in 0..6 {
            let tiny = Rect::new(0, 0, size * 2, size);
            ScopeSwitcher::new(&theme, scopes.clone(), 40).open(Some(9)).render(Rect::new(1, 0, 6, 1), &mut Buffer::empty(tiny));
        }
    }
}
