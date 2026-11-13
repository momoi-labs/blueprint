use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use unicode_segmentation::UnicodeSegmentation;

use crate::input::{draw, frame, one_row, placeholder, Flags, Paint};
use crate::select::choice_builders;
use crate::surface::under;
use crate::text::{cells, take_cells};
use crate::{blend, Size, Theme, Tone};

/// Several short values typed one by one, such as tags or hosts: each
/// value is a chip, a square pill in the style of a neutral
/// [`Badge`](crate::Badge), inside the [`Input`](crate::Input) fill, then
/// the text being typed and its cursor. Chips wrap to more rows.
///
/// Enter or a comma makes the text a chip. ← at the start of the text
/// moves onto the last chip, which takes the `primary` fill; ←→ move
/// between chips and backspace removes the chosen one. In a
/// [`Form`](crate::Form), [`Field::chips`](crate::Field::chips) does this.
#[derive(Clone, Debug)]
pub struct ChipInput<'a> {
    theme: &'a Theme,
    chips: Vec<String>,
    text: &'a str,
    cursor: Option<usize>,
    chip: Option<usize>,
    placeholder: &'a str,
    size: Size,
    flags: Flags,
}

impl<'a> ChipInput<'a> {
    pub fn new(theme: &'a Theme, chips: impl IntoIterator<Item = impl Into<String>>, text: &'a str) -> Self {
        let chips = chips.into_iter().map(Into::into).collect();
        Self { theme, chips, text, cursor: None, chip: None, placeholder: "", size: Size::Md, flags: Flags::default() }
    }

    choice_builders!();

    /// The cursor in the text, as a count of graphemes. At the end unless
    /// set.
    #[must_use]
    pub fn cursor(mut self, cursor: usize) -> Self {
        self.cursor = Some(cursor);
        self
    }

    /// The chip the keys act on, in place of the text cursor.
    #[must_use]
    pub fn chip(mut self, chip: Option<usize>) -> Self {
        self.chip = chip;
        self
    }

    /// The rows the field takes `width` columns wide.
    pub fn height(&self, width: u16) -> u16 {
        let half = if self.size == Size::Md { 2 } else { 0 };
        (self.body(usize::from(width.saturating_sub(2)), &Paint::new(self.theme, self.flags, [0; 3])).len() as u16).saturating_add(half)
    }

    /// A chip as spans: a fill one cell wider than the label on each side.
    fn pill(&self, paint: &Paint, label: &str, chosen: bool, room: usize) -> Vec<Span<'static>> {
        let t = self.theme;
        let r = t.tokens();
        let style = if self.flags.disabled {
            paint.faint
        } else if chosen {
            t.fill(r.primary_foreground, r.primary).add_modifier(Modifier::BOLD)
        } else {
            let text = Tone::Neutral.rgb(t);
            t.fill(text, blend(&[r.input, text], 0.14))
        };
        let label = match cells(label) + 2 > room {
            true => format!("{}…", take_cells(label, room.saturating_sub(3)).0),
            false => label.to_owned(),
        };
        let (left, right) = match (t.look().round, style.bg) {
            (true, Some(bg)) => {
                let end = Style::new().fg(bg).bg(paint.bg);
                (Span::styled("\u{e0b6}", end), Span::styled("\u{e0b4}", end))
            }
            _ => (Span::styled(" ", style), Span::styled(" ", style)),
        };
        vec![left, Span::styled(label, style), right]
    }

    /// The rows inside the padding, `inner` cells wide.
    fn body(&self, inner: usize, paint: &Paint) -> Vec<Vec<Span<'static>>> {
        let inner = inner.max(1);
        let mut rows: Vec<Vec<Span<'static>>> = vec![Vec::new()];
        let mut used = 0;
        let sep = paint.text;
        let place = |rows: &mut Vec<Vec<Span<'static>>>, used: &mut usize, spans: Vec<Span<'static>>, w: usize| {
            if *used > 0 && *used + 1 + w > inner {
                rows.push(Vec::new());
                *used = 0;
            }
            let row = rows.last_mut().expect("one row at least");
            if *used > 0 {
                row.push(Span::styled(" ", sep));
                *used += 1;
            }
            row.extend(spans);
            *used += w;
        };
        for (i, chip) in self.chips.iter().enumerate() {
            let pill = self.pill(paint, chip, self.chip == Some(i), inner);
            let w = pill.iter().map(Span::width).sum();
            place(&mut rows, &mut used, pill, w);
        }
        let caret = paint.cursor.filter(|_| self.chip.is_none());
        let graphemes: Vec<&str> = self.text.graphemes(true).collect();
        if self.chips.is_empty() && self.text.is_empty() {
            place(&mut rows, &mut used, placeholder(self.placeholder, caret, inner, paint.faint), 0);
        } else if caret.is_some() || !self.text.is_empty() {
            // The text keeps room for itself and the cursor, or a row.
            let wanted = (cells(self.text) + 1).max(4).min(inner);
            let at = self.cursor.unwrap_or(graphemes.len()).min(graphemes.len());
            let left = inner.saturating_sub(used + usize::from(used > 0));
            let room = if left >= wanted { left } else { inner };
            let spans = one_row(&graphemes, caret.map(|style| (at, style)), room, paint.text, paint.faint);
            let w = spans.iter().map(Span::width).sum::<usize>().max(1);
            place(&mut rows, &mut used, spans, if left >= wanted { w.min(left) } else { inner });
        }
        rows
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        let paint = Paint::new(self.theme, self.flags, behind);
        let body = self.body(usize::from(width.saturating_sub(2)), &paint);
        frame(&paint, self.size, width, body)
    }
}

impl Widget for ChipInput<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let behind = under(self.theme, buf, area.x, area.y.saturating_add(u16::from(self.size == Size::Md)));
        draw(buf, area, &self.lines(area.width, behind));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn chips_come_first_then_the_text() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let chips = ChipInput::new(&theme, ["web", "db"], "ca").focused(true).size(Size::Sm);
        assert_eq!(chips.height(20), 1);
        let mut buf = Buffer::empty(Rect::new(0, 0, 22, 1));
        chips.render(Rect::new(1, 0, 20, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▐  web   db  ca      ▌");
        let r = theme.tokens();
        assert_ne!(buf[(3, 0)].bg, theme.color(r.input), "a chip has its own fill");
        assert_eq!(buf[(15, 0)].bg, theme.color(r.primary), "the cursor sits after the text");
    }

    #[test]
    fn chips_wrap_and_the_chosen_one_is_filled() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let chips = ChipInput::new(&theme, ["alpha", "beta", "gamma"], "").chip(Some(2)).focused(true);
        assert_eq!(chips.height(16), 4);
        let mut buf = Buffer::empty(Rect::new(0, 0, 18, 4));
        chips.render(Rect::new(1, 0, 16, 4), &mut buf);
        assert_eq!(row(&buf, 1), "▐  alpha   beta  ▌");
        assert_eq!(row(&buf, 2), "▐  gamma         ▌");
        assert_eq!(buf[(4, 2)].bg, theme.color(theme.tokens().primary));
        assert!(buf.content.iter().filter(|c| c.bg == theme.color(theme.tokens().primary)).count() == 7, "no text cursor");
    }

    #[test]
    fn a_chip_input_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        for width in 0..12 {
            let chips = ChipInput::new(&theme, ["中文字中文字", "b"], "xyz").cursor(9).focused(true).invalid(true);
            chips.clone().render(Rect::new(1, 0, width, 9), &mut buf);
            let lines = chips.lines(width, [0; 3]);
            assert!(lines.iter().all(|line| line.width() == usize::from(width.max(2)) + 2), "{width}");
        }
    }
}
