use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::input::{draw, Flags};
use crate::text::{cells, take_cells};
use crate::Theme;

/// One choice out of a few that all show: a mark and a label per option,
/// one option per row, or in a row that wraps with
/// [`RadioGroup::horizontal`].
///
/// The chosen option has `◉` in `primary`, the others `○` in
/// `muted-foreground`. Focus is the `selected` fill behind the chosen
/// option, or the first one when none is chosen, from one cell before its
/// mark to one cell after its label, with the label in bold; invalid turns every mark `danger`.
/// ↑↓, or ←→ in a row, move and choose at once; the app owns the keys.
/// Keep one free cell before the area for the fill.
#[derive(Clone, Debug)]
pub struct RadioGroup<'a> {
    theme: &'a Theme,
    options: Vec<String>,
    chosen: Option<usize>,
    horizontal: bool,
    flags: Flags,
}

impl<'a> RadioGroup<'a> {
    pub fn new(theme: &'a Theme, options: impl IntoIterator<Item = impl Into<String>>, chosen: Option<usize>) -> Self {
        let options = options.into_iter().map(Into::into).collect();
        Self { theme, options, chosen, horizontal: false, flags: Flags::default() }
    }

    /// The options in a row, two cells apart, wrapping when they do not fit.
    #[must_use]
    pub fn horizontal(mut self, horizontal: bool) -> Self {
        self.horizontal = horizontal;
        self
    }

    #[must_use]
    pub fn focused(mut self, focused: bool) -> Self {
        self.flags.focused = focused;
        self
    }

    /// Every mark in `disabled`, the labels in `subtle-foreground`.
    #[must_use]
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.flags.disabled = disabled;
        self
    }

    #[must_use]
    pub fn invalid(mut self, invalid: bool) -> Self {
        self.flags.invalid = invalid;
        self
    }

    pub(crate) fn flags(mut self, flags: Flags) -> Self {
        self.flags = flags;
        self
    }

    /// The rows the group takes `width` columns wide.
    pub fn height(&self, width: u16) -> u16 {
        self.lines(width.saturating_add(1)).len() as u16
    }

    /// One option from the cell before its mark: space, mark, space,
    /// label, space.
    fn option(&self, i: usize, room: usize) -> Vec<Span<'static>> {
        let t = self.theme;
        let r = t.tokens();
        let Flags { focused, disabled, invalid, selection, .. } = self.flags;
        let current = self.chosen.filter(|c| *c < self.options.len()).unwrap_or(0) == i;
        let lit = current && focused && !disabled && !selection;
        let on = self.chosen == Some(i);
        let mark = match (disabled, invalid, on) {
            (true, ..) => t.fg(r.disabled),
            (false, true, _) => t.fg(r.danger),
            // `primary` can lose contrast on the `selected` fill.
            (false, false, _) if lit => t.text(),
            (false, false, true) => t.fg(r.primary),
            (false, false, false) => t.muted(),
        };
        let label = match (disabled, lit) {
            (true, _) => t.subtle(),
            (false, true) => t.strong(),
            (false, false) => t.text(),
        };
        let text = &self.options[i];
        let shown = match cells(text) > room {
            true if room > 0 => format!("{}…", take_cells(text, room - 1).0),
            _ => text.clone(),
        };
        let fill = if lit { t.selected() } else { Style::new() };
        vec![
            Span::styled(" ", fill),
            Span::styled(if on { "◉" } else { "○" }, mark.patch(fill)),
            Span::styled(" ", fill),
            Span::styled(shown, label.patch(fill)),
            Span::styled(" ", fill),
        ]
    }

    /// The rows `width` columns wide, from the cell before the area, as
    /// [`draw`] takes them.
    pub(crate) fn lines(&self, width: u16) -> Vec<Line<'static>> {
        let width = usize::from(width);
        let room = width.saturating_sub(4);
        if !self.horizontal {
            return (0..self.options.len()).map(|i| Line::from(self.option(i, room))).collect();
        }
        let mut lines: Vec<Vec<Span<'static>>> = vec![Vec::new()];
        let mut used = 0;
        for i in 0..self.options.len() {
            let item = self.option(i, room);
            let w: usize = item.iter().map(Span::width).sum();
            // The cell after a label is the gap, so the last one may hang.
            if used > 0 && used + w - 1 > width {
                lines.push(Vec::new());
                used = 0;
            }
            let line = lines.last_mut().expect("one line at least");
            line.extend(item);
            used += w;
        }
        lines.into_iter().filter(|l| !l.is_empty()).map(Line::from).collect()
    }
}

impl Widget for RadioGroup<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        draw(buf, area, &self.lines(area.width.saturating_add(1)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn one_option_per_row_with_focus_on_the_chosen_one() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let group = RadioGroup::new(&theme, ["Small", "Medium", "Large"], Some(1)).focused(true);
        assert_eq!(group.height(20), 3);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 3));
        group.render(Rect::new(1, 0, 11, 3), &mut buf);
        assert_eq!(row(&buf, 0), " ○ Small");
        assert_eq!(row(&buf, 1), " ◉ Medium");
        assert_eq!(buf[(1, 1)].fg, theme.color(theme.tokens().foreground));
        for x in 0..10 {
            assert_eq!(buf[(x, 1)].bg, theme.selected_color(), "the fill covers cell {x}");
        }
        assert_ne!(buf[(10, 1)].bg, theme.selected_color());
        assert_ne!(buf[(1, 0)].bg, theme.selected_color());
    }

    #[test]
    fn a_row_wraps_when_the_options_do_not_fit() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let group = RadioGroup::new(&theme, ["Small", "Medium", "Large"], None).horizontal(true).invalid(true);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 2));
        group.render(Rect::new(1, 0, 19, 2), &mut buf);
        assert_eq!(row(&buf, 0), " ○ Small  ○ Medium");
        assert_eq!(row(&buf, 1), " ○ Large");
        assert_eq!(buf[(1, 0)].fg, theme.color(theme.tokens().danger));
    }

    #[test]
    fn a_group_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        for width in 0..8 {
            let group = RadioGroup::new(&theme, ["中文字", "b"], Some(7)).horizontal(width % 2 == 0).focused(true);
            group.render(Rect::new(width, 1, width, 5), &mut buf);
        }
        RadioGroup::new(&theme, Vec::<String>::new(), None).render(Rect::new(0, 0, 4, 2), &mut buf);
    }
}
