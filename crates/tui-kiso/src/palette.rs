use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{tail_cells, take_cells};
use crate::{Modal, Theme};

/// The command palette, as in Crush: a filter, the commands with their
/// keys, and the selected one on a `primary` fill. Open it with ctrl+p.
///
/// The app keeps the filter and the selection, and passes the commands
/// that apply and match.
#[derive(Clone, Debug)]
pub struct Palette<'a> {
    theme: &'a Theme,
    title: &'a str,
    filter: &'a str,
    commands: Vec<(&'a str, &'a str)>,
    selected: usize,
    rows: u16,
}

impl<'a> Palette<'a> {
    /// Commands as `(name, key)` pairs. The key may be empty.
    pub fn new(theme: &'a Theme, commands: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        Self { theme, title: "Commands", filter: "", commands: commands.into_iter().collect(), selected: 0, rows: 12 }
    }

    /// The title. "Commands" by default.
    pub fn title(mut self, title: &'a str) -> Self {
        self.title = title;
        self
    }

    /// What the person typed.
    pub fn filter(mut self, filter: &'a str) -> Self {
        self.filter = filter;
        self
    }

    /// The selected command, by index in the list passed.
    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }
}

impl Widget for Palette<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let keys = [("↑/↓", "choose"), ("enter", "confirm"), ("esc", "cancel")];
        let area = Modal::new(t, self.title).width(64).height(self.rows + 4).hints(keys).draw(screen, buf);
        if area.height < 4 || area.width < 4 {
            return;
        }
        let cursor = t.fill(r.primary_foreground, r.primary);
        let mut input = vec![Span::styled("> ", t.fg(r.primary).add_modifier(Modifier::BOLD))];
        if self.filter.is_empty() {
            input.extend([Span::styled("T", cursor), Span::styled("ype to filter", t.muted())]);
        } else {
            // A long filter shows its end, next to the cursor.
            let (shown, _) = tail_cells(self.filter, usize::from(area.width).saturating_sub(3));
            input.extend([Span::raw(shown), Span::styled(" ", cursor)]);
        }
        buf.set_line(area.x, area.y, &Line::from(input), area.width);

        let rows = usize::from(self.rows).min(usize::from(area.height.saturating_sub(2)));
        let start = self.selected.saturating_sub(rows.saturating_sub(1));
        for (i, (name, key)) in self.commands.iter().enumerate().skip(start).take(rows) {
            let y = area.y + 2 + (i - start) as u16;
            // The key keeps its room on the right; the name takes the rest.
            let (key, key_width) = take_cells(key, usize::from(area.width) / 2);
            let room = usize::from(area.width).saturating_sub(key_width + 2);
            buf.set_stringn(area.x, y, name, room, t.text());
            buf.set_stringn(area.right().saturating_sub(key_width as u16 + 1), y, key, key_width, t.muted());
            if i == self.selected {
                t.select_fill(buf, Rect::new(area.x.saturating_sub(1), y, area.width + 2, 1));
            }
        }
        if self.commands.is_empty() {
            buf.set_stringn(area.x, area.y + 2, "No command matches.", usize::from(area.width), t.muted());
        }
    }
}
