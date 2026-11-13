use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Line;
use ratatui::widgets::Widget;

use crate::overlay::surface;
use crate::surface::write;
use crate::text::{cells, take_cells};
use crate::{FilterInput, Grid, KeyHints, Scrim, Search, Size, Theme};

/// The command palette: every command of the app, found by typing. Open
/// it with ctrl+p.
///
/// It dims the screen with a [`Scrim`] and sits in the top third on the
/// overlay surface: a filter field with a `›` on top, then the commands in
/// groups under muted captions, each with its key on the right in
/// `muted-foreground`, the selected one filled with `primary`. With no
/// command, a muted "No commands" row. The keys of the palette end it.
///
/// The app keeps the filter and the selection, and passes the commands
/// that apply and match.
#[derive(Clone, Debug)]
pub struct CommandPalette<'a> {
    theme: &'a Theme,
    title: &'a str,
    filter: &'a str,
    groups: Vec<(&'a str, Vec<(&'a str, &'a str)>)>,
    selected: usize,
    rows: u16,
}

/// The crate's first name for [`CommandPalette`].
pub type Palette<'a> = CommandPalette<'a>;

impl<'a> CommandPalette<'a> {
    /// Commands as `(name, key)` pairs, with no caption. The key may be
    /// empty.
    pub fn new(theme: &'a Theme, commands: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        let commands: Vec<_> = commands.into_iter().collect();
        let groups = if commands.is_empty() { Vec::new() } else { vec![("", commands)] };
        Self { theme, title: "Commands", filter: "", groups, selected: 0, rows: 16 }
    }

    /// A group of commands under a caption, after the ones before.
    #[must_use]
    pub fn group(mut self, caption: &'a str, commands: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        let commands: Vec<_> = commands.into_iter().collect();
        if !commands.is_empty() {
            self.groups.push((caption, commands));
        }
        self
    }

    /// What the filter shows while it is empty, as "Type a command".
    /// "Commands" by default.
    pub fn title(mut self, title: &'a str) -> Self {
        self.title = title;
        self
    }

    /// What the person typed.
    pub fn filter(mut self, filter: &'a str) -> Self {
        self.filter = filter;
        self
    }

    /// The selected command, counted across the groups.
    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }

    /// The rows of the list: the commands and the captions, with an empty
    /// row before each caption but the first.
    fn lines(&self) -> Vec<Row<'a>> {
        let mut rows = Vec::new();
        let mut index = 0;
        for (caption, commands) in &self.groups {
            if !caption.is_empty() {
                if !rows.is_empty() {
                    rows.push(Row::Gap);
                }
                rows.push(Row::Caption(caption));
            }
            for (name, key) in commands {
                rows.push(Row::Command(name, key, index));
                index += 1;
            }
        }
        rows
    }

    /// The area the palette takes on `screen`: 4 tracks wide, near the
    /// top.
    pub fn area(&self, screen: Rect) -> Rect {
        let width = Grid::span(4).min(screen.width.saturating_sub(4));
        let list = (self.lines().len().max(1) as u16).min(self.rows);
        // Half rows, the filter and a gap, the list, a gap and the keys.
        let height = (list + 6).min(screen.height.saturating_sub(2));
        let free = screen.height.saturating_sub(height);
        let y = screen.y + (free / 2).min(screen.height / 6);
        let x = screen.x + screen.width.saturating_sub(width) / 2;
        Rect::new(x, y, width, height).intersection(screen)
    }
}

#[derive(Clone, Copy, Debug)]
enum Row<'a> {
    Caption(&'a str),
    Gap,
    Command(&'a str, &'a str, usize),
}

impl Widget for CommandPalette<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let screen = screen.intersection(buf.area);
        Scrim::new(t).render(screen, buf);
        let area = self.area(screen);
        if area.height < 4 || area.width < 8 {
            return;
        }
        surface(t, buf, area);
        let (x, right) = (area.x + 2, area.right() - 2);
        let room = usize::from(right - x);
        let search = Search { query: self.filter.to_owned(), typing: true };
        FilterInput::new(t, &search).glyph("›").placeholder(self.title).size(Size::Sm).render(Rect::new(x, area.y + 1, right - x, 1), buf);

        let keys = [("↑/↓", "choose"), ("enter", "run"), ("esc", "close")];
        let hints = area.bottom() - 2;
        if hints > area.y + 2 {
            buf.set_line(x, hints, &Line::from(KeyHints::new(t, keys).spans(room)), room as u16);
        }
        let top = area.y + 3;
        let rows = usize::from(hints.saturating_sub(1).saturating_sub(top));
        let lines = self.lines();
        if lines.is_empty() {
            if rows > 0 {
                write(buf, x, top, take_cells("No commands", room).0, t.muted());
            }
            return;
        }
        let total = lines.iter().filter(|row| matches!(row, Row::Command(..))).count();
        let selected = self.selected.min(total.saturating_sub(1));
        let at = lines.iter().position(|row| matches!(row, Row::Command(_, _, i) if *i == selected)).unwrap_or(0);
        // The selected command stays in view, with its caption when there is
        // room for it.
        let start = at.saturating_sub(rows.saturating_sub(1));
        for (dy, row) in lines.iter().skip(start).take(rows).enumerate() {
            let y = top + dy as u16;
            match *row {
                Row::Gap => {}
                Row::Caption(caption) => _ = write(buf, x, y, take_cells(caption, room).0, t.muted()),
                Row::Command(name, key, i) => {
                    // The key keeps its room on the right; the name takes the rest.
                    let (key, key_width) = take_cells(key, room / 2);
                    let name_room = room.saturating_sub(key_width + 1);
                    let name = match cells(name) > name_room {
                        true if name_room > 0 => format!("{}…", take_cells(name, name_room - 1).0),
                        true => String::new(),
                        false => name.to_owned(),
                    };
                    write(buf, x, y, &name, t.text());
                    write(buf, right.saturating_sub(key_width as u16), y, key, t.muted());
                    if i == selected {
                        t.select_fill(buf, Rect::new(area.x, y, area.width, 1));
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn groups_keys_and_the_selection() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let mut buf = Buffer::empty(screen);
        let palette = CommandPalette::new(&theme, [])
            .group("Go to", [("Machines", "1"), ("Logs", "2")])
            .group("Machine", [("Restart", "r")])
            .selected(2);
        let area = palette.area(screen);
        assert_eq!((area.x, area.width, area.height), (11, 58, 12));
        palette.render(screen, &mut buf);
        assert!(row(&buf, area.y + 1).contains("› Commands"), "{}", row(&buf, area.y + 1));
        assert_eq!(row(&buf, area.y + 3).trim(), "Go to");
        assert!(row(&buf, area.y + 4).trim().starts_with("Machines") && row(&buf, area.y + 4).ends_with('1'));
        assert_eq!(row(&buf, area.y + 6), "");
        assert_eq!(buf[(area.x, area.y + 8)].bg, theme.color(theme.tokens().primary));
        assert!(row(&buf, area.y + 10).contains("esc close"));
    }

    #[test]
    fn no_command_shows_an_empty_row_and_any_size_draws() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let mut buf = Buffer::empty(screen);
        let palette = Palette::new(&theme, []).filter("zz");
        let area = palette.area(screen);
        palette.render(screen, &mut buf);
        assert_eq!(row(&buf, area.y + 3).trim(), "No commands");
        for (w, h) in [(0, 0), (3, 3), (12, 6), (30, 8)] {
            let screen = Rect::new(0, 0, w, h);
            Palette::new(&theme, [("Quit", "q")]).selected(4).render(screen, &mut Buffer::empty(screen));
        }
    }
}
