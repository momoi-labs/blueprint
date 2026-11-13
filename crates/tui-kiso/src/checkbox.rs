use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::input::{draw, Flags, Paint};
use crate::text::{cells, take_cells};
use crate::Theme;

/// One choice a form submits, on or off: a square box of two cells in the
/// Switch family, then its label.
///
/// Unchecked is the `input` fill. Checked is the `primary` fill with `✓`
/// in `primary-foreground`; indeterminate has `−` in its place. Focus is a
/// half-cell bar of `focus` on each side of the box, and an invalid box
/// has the bars in `danger`, with or without focus. It takes one row: the
/// box at the left of its area, so keep one free cell before it, and the
/// label one cell after the box.
#[derive(Clone, Copy, Debug)]
pub struct Checkbox<'a> {
    theme: &'a Theme,
    label: &'a str,
    checked: bool,
    indeterminate: bool,
    strong: bool,
    flags: Flags,
}

impl<'a> Checkbox<'a> {
    pub fn new(theme: &'a Theme, label: &'a str, checked: bool) -> Self {
        Self { theme, label, checked, indeterminate: false, strong: false, flags: Flags::default() }
    }

    /// Some of the choices under it are on: a `−` in the box. It wins over
    /// checked.
    #[must_use]
    pub fn indeterminate(mut self, indeterminate: bool) -> Self {
        self.indeterminate = indeterminate;
        self
    }

    /// The keys go to the box: a half-cell bar of `focus` on each side.
    #[must_use]
    pub fn focused(mut self, focused: bool) -> Self {
        self.flags.focused = focused;
        self
    }

    /// The `disabled-surface` fill, and the label in `subtle-foreground`.
    #[must_use]
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.flags.disabled = disabled;
        self
    }

    /// The choice is wrong: the bars turn `danger` and stay on.
    #[must_use]
    pub fn invalid(mut self, invalid: bool) -> Self {
        self.flags.invalid = invalid;
        self
    }

    pub(crate) fn flags(mut self, flags: Flags) -> Self {
        self.flags = flags;
        self
    }

    /// The label in bold, as the focused row of a form.
    pub(crate) fn strong(mut self, strong: bool) -> Self {
        self.strong = strong;
        self
    }

    /// The columns the box and its label take, without the focus bars.
    pub fn width(&self) -> u16 {
        let label = cells(self.label);
        if label == 0 { 2 } else { (label as u16).saturating_add(3) }
    }

    /// The box as two cells.
    pub(crate) fn mark(&self) -> [Span<'static>; 2] {
        let t = self.theme;
        let r = t.tokens();
        let glyph = match (self.indeterminate, self.checked) {
            (true, _) => "−",
            (false, true) => "✓",
            (false, false) => " ",
        };
        let style = match (self.flags.disabled, glyph != " ") {
            // Disabled is exempt from contrast, so the fill keeps its own
            // color in 256 colors too.
            (true, _) => t.fg(r.disabled).bg(t.color(r.disabled_surface)),
            (false, true) => t.fill(r.primary_foreground, r.primary).add_modifier(Modifier::BOLD),
            (false, false) => t.fill(r.foreground, r.input),
        };
        [Span::styled(glyph, style), Span::styled(" ", style)]
    }

    /// The row `width` columns wide, from the cell of the bar before the
    /// box, as [`draw`] takes it.
    pub(crate) fn line(&self, width: u16) -> Line<'static> {
        let t = self.theme;
        let paint = Paint::new(t, self.flags, t.tokens().background);
        let bar = |symbol: &'static str| match paint.bars {
            Some(color) => Span::styled(symbol, Style::new().fg(color)),
            None => Span::raw(" "),
        };
        let mut spans = vec![bar("▐")];
        spans.extend(self.mark());
        spans.push(bar("▌"));
        let room = usize::from(width).saturating_sub(3);
        if !self.label.is_empty() && room > 0 {
            let style = match (self.flags.disabled, self.strong) {
                (true, _) => t.subtle(),
                (false, true) => t.strong(),
                (false, false) => t.text(),
            };
            spans.push(Span::styled(take_cells(self.label, room).0.to_owned(), style));
        }
        Line::from(spans)
    }
}

impl Widget for Checkbox<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height > 0 {
            draw(buf, area, &[self.line(area.width.saturating_add(1))]);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_box_takes_two_cells_and_focus_goes_outside() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let r = theme.tokens();
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        let checkbox = Checkbox::new(&theme, "Backups", true).focused(true);
        assert_eq!(checkbox.width(), 10);
        checkbox.render(Rect::new(1, 0, 11, 1), &mut buf);
        assert_eq!(row(&buf), "▐✓ ▌Backups ");
        assert_eq!(buf[(2, 0)].bg, theme.color(r.primary));
        assert_eq!(buf[(0, 0)].fg, theme.color(r.focus));
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 1));
        Checkbox::new(&theme, "", false).render(Rect::new(1, 0, 5, 1), &mut buf);
        assert_eq!((row(&buf).as_str(), buf[(1, 0)].bg), ("      ", theme.color(r.input)));
    }

    #[test]
    fn states_set_the_mark_and_the_bars() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let r = theme.tokens();
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 1));
        Checkbox::new(&theme, "All", true).indeterminate(true).invalid(true).render(Rect::new(1, 0, 7, 1), &mut buf);
        assert_eq!(row(&buf), "▐− ▌All ");
        assert_eq!(buf[(0, 0)].fg, theme.color(r.danger));
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 1));
        Checkbox::new(&theme, "All", true).disabled(true).focused(true).render(Rect::new(1, 0, 7, 1), &mut buf);
        assert_eq!(buf[(0, 0)].symbol(), " ", "no focus bar when disabled");
        assert_eq!(buf[(1, 0)].bg, theme.color(r.disabled_surface));
    }

    #[test]
    fn a_checkbox_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 1));
        for x in 0..6 {
            Checkbox::new(&theme, "中文字", true).focused(true).render(Rect::new(x, 0, 20, 1), &mut buf);
            Checkbox::new(&theme, "x", false).render(Rect::new(x, 3, 0, 0), &mut buf);
        }
    }
}
