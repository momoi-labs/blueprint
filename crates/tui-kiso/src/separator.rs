use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Line;
use ratatui::widgets::Widget;

use crate::page::section_line;
use crate::surface::put;
use crate::Theme;

/// A rule between content. It is the one concept of rules: a horizontal
/// separator draws the theme's [`Look::rule`](crate::Look::rule) across
/// the width, as [`Page::section`](crate::Page::section) does after a title;
/// a vertical one draws `│` in `border` down the height.
///
/// A horizontal separator can carry a label at its start, in
/// `muted-foreground`. A vertical one takes the column of its area and no
/// label. Both are static, and take no keys.
#[derive(Clone, Copy, Debug)]
pub struct Separator<'a> {
    theme: &'a Theme,
    vertical: bool,
    label: Option<&'a str>,
}

impl<'a> Separator<'a> {
    /// A rule across one row.
    pub fn horizontal(theme: &'a Theme) -> Self {
        Self { theme, vertical: false, label: None }
    }

    /// A line down one column.
    pub fn vertical(theme: &'a Theme) -> Self {
        Self { theme, vertical: true, label: None }
    }

    /// A title before the rule. A vertical separator ignores it.
    #[must_use]
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = Some(label);
        self
    }
}

impl Widget for Separator<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        if self.vertical {
            let color = t.color(t.tokens().border);
            for y in area.top()..area.bottom().min(buf.area.bottom()) {
                put(buf, area.x, y, "│", color);
            }
            return;
        }
        let line = match self.label {
            Some(label) => section_line(t, usize::from(area.width), label, ""),
            None => Line::from(t.look().rule.spans(t, usize::from(area.width))),
        };
        if area.intersection(buf.area).height > 0 {
            line.render(Rect { height: 1, ..area }, buf);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Ink, Look, Pattern, Stroke};

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn a_horizontal_rule_follows_the_look_and_can_have_a_label() {
        let look = Look { rule: Stroke::new(Pattern::Dashed, Ink::Faint), ..Look::DEFAULT };
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK).with_look(look);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 2));
        Separator::horizontal(&theme).render(Rect::new(0, 0, 12, 1), &mut buf);
        Separator::horizontal(&theme).label("or").render(Rect::new(0, 1, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "╌╌╌╌╌╌╌╌╌╌╌╌");
        assert_eq!(row(&buf, 1), "or ╌╌╌╌╌╌╌╌╌");
        assert_eq!(buf[(5, 0)].fg, theme.color(theme.tokens().border));
    }

    #[test]
    fn a_vertical_rule_is_a_column_of_bars() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 3, 4));
        Separator::vertical(&theme).render(Rect::new(1, 1, 1, 9), &mut buf);
        let column: String = (0..4).map(|y| buf[(1, y)].symbol().to_owned()).collect();
        assert_eq!(column, " │││");
    }

    #[test]
    fn a_separator_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        Separator::horizontal(&theme).label("Section").render(Rect::new(2, 5, 30, 1), &mut buf);
        Separator::horizontal(&theme).render(Rect::new(2, 1, 30, 1), &mut buf);
        Separator::vertical(&theme).render(Rect::new(9, 0, 1, 1), &mut buf);
    }
}
