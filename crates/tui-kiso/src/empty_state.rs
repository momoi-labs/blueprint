use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::text::{cells, take_cells, wrap};
use crate::{Button, Theme};

/// The widest the text gets, so a line stays short on a wide terminal.
const MEASURE: u16 = 44;

/// A region with nothing in it: a glyph, a bold title, a wrapped
/// description in `muted-foreground` and an optional [`Button`], all
/// centered in the area it gets, in the middle of its rows too.
///
/// Say what is empty in the title ("No machines yet") and what to do in
/// the text. It is not a status: errors are an [`Alert`](crate::Alert) and
/// loading is a [`Skeleton`](crate::Skeleton). It has no keys, and focus
/// goes to the action.
#[derive(Clone, Copy, Debug)]
pub struct EmptyState<'a> {
    theme: &'a Theme,
    title: &'a str,
    glyph: &'a str,
    text: Option<&'a str>,
    action: Option<Button<'a>>,
}

impl<'a> EmptyState<'a> {
    pub fn new(theme: &'a Theme, title: &'a str) -> Self {
        Self { theme, title, glyph: "○", text: None, action: None }
    }

    /// One cell of mark above the title. `○` by default.
    #[must_use]
    pub fn glyph(mut self, glyph: &'a str) -> Self {
        self.glyph = glyph;
        self
    }

    /// One or two short sentences: why, and what to do. It wraps.
    #[must_use]
    pub fn text(mut self, text: &'a str) -> Self {
        self.text = Some(text);
        self
    }

    /// The next step, such as "Create machine".
    #[must_use]
    pub fn action(mut self, action: Button<'a>) -> Self {
        self.action = Some(action);
        self
    }

    fn lines(&self, width: u16) -> Vec<String> {
        self.text.map_or_else(Vec::new, |text| wrap(text, usize::from(width.min(MEASURE))))
    }

    /// The rows the state takes at `width` columns.
    pub fn height(&self, width: u16) -> u16 {
        // The glyph, one blank row, the title and the text.
        let rows = 3 + self.lines(width).len() as u16;
        rows.saturating_add(self.action.map_or(0, |action| 1 + action.height()))
    }
}

impl Widget for EmptyState<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let center = |text: &str| area.x.saturating_add(area.width.saturating_sub(cells(text) as u16) / 2);
        let lines = self.lines(area.width);
        let mut y = area.y.saturating_add(area.height.saturating_sub(self.height(area.width)) / 2);
        let row = |buf: &mut Buffer, y: u16, text: &str, style| {
            if y < area.bottom() {
                let (text, _) = take_cells(text, usize::from(area.width));
                write(buf, center(text), y, text, style);
            }
        };
        row(buf, y, self.glyph, t.muted());
        y = y.saturating_add(2);
        row(buf, y, self.title, t.strong());
        for line in &lines {
            y = y.saturating_add(1);
            row(buf, y, line, t.muted());
        }
        y = y.saturating_add(1);
        if let Some(action) = self.action {
            y = y.saturating_add(1);
            // A button in focus needs a free cell on each side.
            let x = area.x.saturating_add(area.width.saturating_sub(action.width()) / 2);
            if y.saturating_add(action.height()) <= area.bottom() {
                action.render(Rect::new(x, y, action.width(), action.height()), buf);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Size;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_parts_are_centered_across_and_down() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let button = Button::new(&theme, "Create").size(Size::Sm);
        let empty = EmptyState::new(&theme, "No machines").text("Create one to get started.").action(button);
        // Glyph, blank, title, text, blank, button.
        assert_eq!(empty.height(30), 6);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 10));
        empty.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 2), format!("{:^30}", "○"));
        assert_eq!(row(&buf, 4), format!("{:^30}", "No machines"));
        assert_eq!(row(&buf, 5).trim(), "Create one to get started.");
        assert!(row(&buf, 5).starts_with("  "));
        assert!(row(&buf, 7).contains("Create"));
        assert_eq!(row(&buf, 0).trim(), "");
    }

    #[test]
    fn a_long_text_wraps_to_the_measure() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let text = "Machines you create show up here with their region, their size and their state, so you can find them again.";
        let empty = EmptyState::new(&theme, "Nothing").text(text);
        assert_eq!(empty.height(100), 3 + 3);
    }

    #[test]
    fn a_state_in_a_small_area_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 3));
        let button = Button::new(&theme, "Create");
        EmptyState::new(&theme, "No machines at all").text("Create one.").action(button).render(Rect::new(2, 1, 20, 12), &mut buf);
    }
}
