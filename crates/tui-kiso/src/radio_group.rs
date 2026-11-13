use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::input::{draw, Flags, Paint};
use crate::text::{cells, take_cells};
use crate::Theme;

/// One choice out of a few that all show: a mark and a label per option,
/// one option per row, or in a row that wraps with
/// [`RadioGroup::horizontal`].
///
/// The chosen option has `◉` in `primary`, the others `○` in
/// `muted-foreground`. Focus is a half-cell bar of `focus` on each side of
/// the chosen mark, or of the first one when none is chosen; invalid turns
/// those bars `danger` and keeps them on. ↑↓, or ←→ in a row, move and
/// choose at once; the app owns the keys. Keep one free cell before the
/// area for the bar.
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

    /// One option from the cell of its bar: bar, mark, bar, label.
    fn option(&self, i: usize, room: usize) -> Vec<Span<'static>> {
        let t = self.theme;
        let r = t.tokens();
        let paint = Paint::new(t, self.flags, r.background);
        let current = self.chosen.filter(|c| *c < self.options.len()).unwrap_or(0) == i;
        let bar = |symbol: &'static str| match paint.bars.filter(|_| current) {
            Some(color) => Span::styled(symbol, Style::new().fg(color)),
            None => Span::raw(" "),
        };
        let on = self.chosen == Some(i);
        let mark = match (self.flags.disabled, on) {
            (true, _) => t.fg(r.disabled),
            (false, true) => t.fg(r.primary),
            (false, false) => t.muted(),
        };
        let label = if self.flags.disabled { t.subtle() } else { t.text() };
        let text = &self.options[i];
        let shown = match cells(text) > room {
            true if room > 0 => format!("{}…", take_cells(text, room - 1).0),
            _ => text.clone(),
        };
        vec![bar("▐"), Span::styled(if on { "◉" } else { "○" }, mark), bar("▌"), Span::styled(shown, label)]
    }

    /// The rows `width` columns wide, from the cell of the first bar, as
    /// [`draw`] takes them.
    pub(crate) fn lines(&self, width: u16) -> Vec<Line<'static>> {
        let width = usize::from(width);
        let room = width.saturating_sub(3);
        if !self.horizontal {
            return (0..self.options.len()).map(|i| Line::from(self.option(i, room))).collect();
        }
        let mut lines: Vec<Vec<Span<'static>>> = vec![Vec::new()];
        let mut used = 0;
        for i in 0..self.options.len() {
            let item = self.option(i, room);
            let w: usize = item.iter().map(Span::width).sum();
            if used > 0 && used + 1 + w > width {
                lines.push(Vec::new());
                used = 0;
            }
            let line = lines.last_mut().expect("one line at least");
            if used > 0 {
                line.push(Span::raw(" "));
                used += 1;
            }
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
        assert_eq!(row(&buf, 1), "▐◉▌Medium");
        assert_eq!(buf[(1, 1)].fg, theme.color(theme.tokens().primary));
    }

    #[test]
    fn a_row_wraps_when_the_options_do_not_fit() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let group = RadioGroup::new(&theme, ["Small", "Medium", "Large"], None).horizontal(true).invalid(true);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 2));
        group.render(Rect::new(1, 0, 19, 2), &mut buf);
        assert_eq!(row(&buf, 0), "▐○▌Small  ○ Medium");
        assert_eq!(row(&buf, 1), " ○ Large");
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().danger));
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
