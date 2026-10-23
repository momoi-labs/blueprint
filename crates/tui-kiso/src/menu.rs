use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, BorderType, Clear, Padding, Widget};

use crate::text::{cells, take_cells};
use crate::Theme;

/// The actions of one row, the terminal form of the web's `⋯` menu: a small
/// rounded `primary` frame right under the row, or above it when there is
/// no room below. Each action has its key on the right in
/// `muted-foreground`. The selected action is filled with `primary`; a
/// destructive one is in `danger-on-dark`, and selected it takes the
/// `danger` fill, as a focused destructive button does.
///
/// Open it with `a`. ↑↓ and enter, or an action's key, run one; esc closes.
/// Anchor it with [`Page::item_area`](crate::Page::item_area).
#[derive(Clone, Debug)]
pub struct Menu<'a> {
    theme: &'a Theme,
    title: String,
    actions: Vec<(&'a str, &'a str, bool)>,
    selected: usize,
    anchor: Rect,
}

impl<'a> Menu<'a> {
    /// A menu titled with what it acts on, such as the row's name, under
    /// `anchor`, the row on screen.
    pub fn new(theme: &'a Theme, title: impl Into<String>, anchor: Rect) -> Self {
        Self { theme, title: title.into(), actions: Vec::new(), selected: 0, anchor }
    }

    /// An action and its key.
    #[must_use]
    pub fn action(mut self, label: &'a str, key: &'a str) -> Self {
        self.actions.push((label, key, false));
        self
    }

    /// An action that destroys something, such as Remove.
    #[must_use]
    pub fn danger(mut self, label: &'a str, key: &'a str) -> Self {
        self.actions.push((label, key, true));
        self
    }

    /// The selected action.
    #[must_use]
    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }

    /// The area the menu takes on `screen`: two columns in from the
    /// anchor, below it or above it, and inside the screen.
    pub fn area(&self, screen: Rect) -> Rect {
        let widest = self.actions.iter().map(|(label, key, _)| cells(label) + 3 + cells(key)).max().unwrap_or(0);
        let width = widest.max(cells(&self.title) + 4).saturating_add(4).min(usize::from(screen.width)) as u16;
        let height = (self.actions.len() + 2).min(usize::from(screen.height)) as u16;
        let x = self.anchor.x.saturating_add(2).min(screen.right().saturating_sub(width)).max(screen.x);
        let below = self.anchor.bottom();
        let y = if below.saturating_add(height) <= screen.bottom() {
            below
        } else if self.anchor.y.saturating_sub(height) >= screen.y && self.anchor.y >= height {
            self.anchor.y - height
        } else {
            screen.bottom().saturating_sub(height).max(screen.y)
        };
        Rect::new(x, y, width, height).intersection(screen)
    }
}

impl Widget for Menu<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let area = self.area(screen).intersection(buf.area);
        if area.is_empty() {
            return;
        }
        Clear.render(area, buf);
        let edge = t.fg(r.primary);
        let title = Line::from(vec![Span::styled("─", edge), Span::styled(format!(" {} ", self.title), edge.add_modifier(Modifier::BOLD))]);
        let block = Block::bordered()
            .border_type(BorderType::Rounded)
            .border_style(edge)
            .style(t.base())
            .title(title)
            .padding(Padding::horizontal(1));
        let inner = block.inner(area);
        block.render(area, buf);
        // When the screen cuts the menu, the actions shown keep the
        // selected one in view.
        let rows = usize::from(inner.height);
        let start = self.selected.saturating_sub(rows.saturating_sub(1));
        for (i, (label, key, danger)) in self.actions.iter().enumerate().skip(start) {
            let Some(y) = inner.y.checked_add((i - start) as u16).filter(|y| *y < inner.bottom()) else { break };
            let (key, key_width) = take_cells(key, usize::from(inner.width) / 2);
            let room = usize::from(inner.width).saturating_sub(key_width + 1);
            let style = if *danger { t.danger() } else { t.text() };
            buf.set_stringn(inner.x, y, label, room, style);
            buf.set_stringn(inner.right().saturating_sub(key_width as u16), y, key, key_width, t.muted());
            if i == self.selected {
                // The row from border to border, as in the palette.
                let row = Rect::new(area.x.saturating_add(1), y, area.width.saturating_sub(2), 1);
                if *danger {
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

    #[test]
    fn it_opens_below_the_row_or_above_it() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let below = menu(&theme, Rect::new(30, 5, 50, 1)).area(screen);
        assert_eq!((below.x, below.y, below.height), (32, 6, 5));
        let above = menu(&theme, Rect::new(30, 21, 50, 1)).area(screen);
        assert_eq!(above.y, 16);
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
        for size in 0..6 {
            let tiny = Rect::new(0, 0, size, size);
            menu(&theme, Rect::new(0, 0, 1, 1)).render(tiny, &mut Buffer::empty(tiny));
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
    fn a_selected_destructive_action_takes_the_danger_fill() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let mut buf = Buffer::empty(screen);
        let menu = menu(&theme, Rect::new(30, 5, 50, 1)).selected(2);
        let area = menu.area(screen);
        menu.render(screen, &mut buf);
        let cell = &buf[(area.x + 2, area.y + 3)];
        assert_eq!(cell.symbol(), "R");
        assert_eq!(cell.bg, theme.color(theme.tokens().danger));
    }
}
