use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, first_grapheme};
use crate::Theme;

/// How a button looks.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Press {
    /// `foreground` on `muted`.
    #[default]
    Plain,
    /// The focused button: bold `primary-foreground` on `primary`.
    Focused,
    /// The focused button of a destructive action: bold on `danger`.
    Danger,
    /// A button that does nothing yet, such as Remove before the name is
    /// typed: `subtle-foreground` on `card`, no hotkey.
    Off,
}

/// Solid buttons in a row, right-aligned, one column apart. Each has two
/// columns of padding and half a row of fill above and below, so it looks
/// two rows tall around one row of text. The first letter, its hotkey, is
/// underlined.
///
/// It takes three rows. As rows of a [`Page`](crate::Page), from
/// [`Buttons::lines`], the buttons scroll with the page.
#[derive(Clone, Debug)]
pub struct Buttons<'a> {
    theme: &'a Theme,
    list: Vec<(&'a str, Press)>,
}

impl<'a> Buttons<'a> {
    pub fn new(theme: &'a Theme, list: impl IntoIterator<Item = (&'a str, Press)>) -> Self {
        Self { theme, list: list.into_iter().collect() }
    }

    /// The width of the row of buttons.
    pub fn width(&self) -> usize {
        self.list.iter().map(|(label, _)| cells(label) + 4).sum::<usize>() + self.list.len().saturating_sub(1)
    }

    /// The three rows, right-aligned in `width`.
    pub fn lines(&self, width: usize) -> [Line<'static>; 3] {
        let r = self.theme.tokens();
        let lead = || Span::raw(" ".repeat(width.saturating_sub(self.width())));
        let mut rows = [vec![lead()], vec![lead()], vec![lead()]];
        for (i, (label, press)) in self.list.iter().enumerate() {
            if i > 0 {
                for row in &mut rows {
                    row.push(Span::raw(" "));
                }
            }
            let (fill, text) = match press {
                Press::Focused => (r.primary, r.primary_foreground),
                Press::Danger => (r.danger, r.danger_foreground),
                Press::Plain => (r.muted, r.foreground),
                Press::Off => (r.card, r.subtle_foreground),
            };
            let mut style = self.theme.fill(text, fill);
            // The half rows above and below take the fill the text sits on.
            let fill = style.bg.unwrap_or_default();
            if matches!(press, Press::Focused | Press::Danger) {
                style = style.add_modifier(Modifier::BOLD);
            }
            let hotkey = if *press == Press::Off { style } else { style.add_modifier(Modifier::UNDERLINED) };
            let (first, rest) = first_grapheme(label);
            let n = cells(label) + 4;
            rows[0].push(Span::styled("▄".repeat(n), Style::new().fg(fill)));
            rows[1].extend([
                Span::styled("  ", style),
                Span::styled(first.to_owned(), hotkey),
                Span::styled(format!("{rest}  "), style),
            ]);
            rows[2].push(Span::styled("▀".repeat(n), Style::new().fg(fill)));
        }
        rows.map(Line::from)
    }
}

impl Widget for Buttons<'_> {
    /// Draws the three rows from the top of `area`, against its right edge.
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        for (dy, line) in self.lines(usize::from(area.width)).iter().enumerate().take(usize::from(area.height)) {
            buf.set_line(area.x, area.y + dy as u16, line, area.width);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn buttons_sit_on_the_right() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let buttons = Buttons::new(&theme, [("Cancel", Press::Plain), ("Remove", Press::Danger)]);
        let [top, middle, bottom] = buttons.lines(24);
        assert_eq!(middle.to_string(), "     Cancel     Remove  ");
        assert_eq!(top.to_string(), "   ▄▄▄▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄▄▄");
        assert_eq!(bottom.to_string(), "   ▀▀▀▀▀▀▀▀▀▀ ▀▀▀▀▀▀▀▀▀▀");
    }
}
