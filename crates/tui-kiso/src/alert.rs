use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier};
use ratatui::widgets::Widget;

use crate::surface::{fill, put, write};
use crate::text::{take_cells, wrap};
use crate::theme::xterm_rgb;
use crate::{blend, Button, Card, Size, Theme, Tone};

/// The mark of a tone. Each tone has its own shape, so color never carries
/// the severity alone.
pub(crate) fn glyph(tone: Tone) -> &'static str {
    match tone {
        Tone::Neutral => "○",
        Tone::Info => "●",
        Tone::Success => "✓",
        Tone::Warning => "▲",
        Tone::Danger => "✕",
    }
}

/// How much of the tone mixes into the card.
const TINT: f32 = 0.12;

/// The RGB a color draws as, when it is not a terminal default.
fn rgb_of(color: Color) -> Option<Rgb> {
    match color {
        Color::Rgb(r, g, b) => Some([r, g, b]),
        Color::Indexed(i) if i >= 16 => Some(xterm_rgb(i)),
        _ => None,
    }
}

/// A message about a condition in this view: a [`Card`] with a tint of its
/// [`Tone`], the tone's glyph and the title in the tone's color, the text
/// in `foreground`, and an optional action.
///
/// The tone shows in the tint, the glyph and the title. The rail, when the
/// look has one, stays the accent. In 256 colors there is no tint: the card
/// keeps its own fill. Draw it in [`Alert::height`] rows. An alert has no
/// keys: focus goes to its action.
#[derive(Clone, Copy, Debug)]
pub struct Alert<'a> {
    theme: &'a Theme,
    tone: Tone,
    title: &'a str,
    text: Option<&'a str>,
    action: Option<Button<'a>>,
    loud: bool,
}

impl<'a> Alert<'a> {
    pub fn new(theme: &'a Theme, tone: Tone, title: &'a str) -> Self {
        Self { theme, tone, title, text: None, action: None, loud: false }
    }

    /// What happened, why, and what the person can do. It wraps.
    #[must_use]
    pub fn text(mut self, text: &'a str) -> Self {
        self.text = Some(text);
        self
    }

    /// The recovery, such as "Retry". It draws as size `Sm`, one row.
    #[must_use]
    pub fn action(mut self, action: Button<'a>) -> Self {
        self.action = Some(action.size(Size::Sm));
        self
    }

    #[must_use]
    pub fn loud(mut self) -> Self {
        self.loud = true;
        self
    }

    fn solid(&self) -> (Rgb, Rgb) {
        let r = self.theme.tokens();
        match self.tone {
            Tone::Danger => (r.danger_solid, r.danger_solid_foreground),
            Tone::Warning => (r.warning_solid, r.warning_solid_foreground),
            Tone::Success => (r.success_solid, r.success_solid_foreground),
            Tone::Info | Tone::Neutral => (r.info_solid, r.info_solid_foreground),
        }
    }

    fn tape_rows(&self) -> u16 {
        u16::from(self.loud)
    }

    fn card(&self) -> Card<'a> {
        Card::new(self.theme)
    }

    /// The columns for the text: inside the padding, after the glyph.
    fn text_width(&self, width: u16) -> usize {
        usize::from(self.card().inner(Rect::new(0, 0, width, 3)).width.saturating_sub(2))
    }

    /// The rows the alert takes at `width` columns.
    pub fn height(&self, width: u16) -> u16 {
        let body = self.text.map_or(0, |text| wrap(text, self.text_width(width)).len() as u16);
        2 + self.tape_rows() + 1 + body + if self.action.is_some() { 2 } else { 0 }
    }
}

impl Widget for Alert<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let card = self.card();
        card.render(area, buf);
        let tone = self.tone.rgb(t);
        let (wash, alpha, head, body) = if self.loud {
            let (bg, fg) = self.solid();
            (bg, 1.0, t.fg(fg), t.fg(fg))
        } else {
            (tone, TINT, t.fg(tone), t.text())
        };
        if (self.loud || t.is_truecolor()) && area.height >= 3 {
            // The half rows hold the card color in their foreground.
            let (top, bottom) = (area.top(), area.bottom() - 1);
            for x in area.left()..area.right() {
                for y in [top, bottom] {
                    if let Some(cell) = buf.cell_mut((x, y)) {
                        if let Some(rgb) = rgb_of(cell.fg) {
                            cell.fg = t.color(blend(&[rgb, wash], alpha));
                        }
                    }
                }
            }
            fill(t, buf, Rect { y: top + 1, height: area.height - 2, ..area }, wash, alpha);
        }
        if self.loud && area.height >= 3 {
            let tape = t.color(t.tokens().tape);
            for x in area.left()..area.right() {
                put(buf, x, area.top() + 1, "▚", tape);
            }
        }
        let shift = self.tape_rows().min(area.height);
        let inner = card.inner(Rect { y: area.y.saturating_add(shift), height: area.height - shift, ..area });
        if inner.is_empty() {
            return;
        }
        write(buf, inner.x, inner.y, glyph(self.tone), head);
        let (title, _) = take_cells(self.title, usize::from(inner.width.saturating_sub(2)));
        write(buf, inner.x.saturating_add(2), inner.y, title, head.add_modifier(Modifier::BOLD));
        let width = self.text_width(area.width);
        let mut y = inner.y.saturating_add(1);
        if let Some(text) = self.text {
            for line in wrap(text, width) {
                if y >= inner.bottom() {
                    return;
                }
                let (line, _) = take_cells(&line, width);
                write(buf, inner.x.saturating_add(2), y, line, body);
                y = y.saturating_add(1);
            }
        }
        if let Some(action) = self.action {
            let y = y.saturating_add(1);
            if y < inner.bottom() {
                action.render(Rect::new(inner.x.saturating_add(2), y, action.width(), 1), buf);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn an_alert_has_a_glyph_a_title_a_wrapped_text_and_an_action() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let button = Button::new(&theme, "Retry");
        let alert = Alert::new(&theme, Tone::Danger, "Replica down").text("The replica did not answer in time.").action(button);
        // Width 26: 22 inside the padding, 20 after the glyph.
        assert_eq!(alert.height(26), 2 + 1 + 2 + 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 26, 7));
        alert.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "  ✕ Replica down          ");
        assert_eq!(row(&buf, 2), "    The replica did not   ");
        assert_eq!(row(&buf, 3), "    answer in time.       ");
        assert_eq!(buf[(2, 1)].fg, theme.color(theme.tokens().danger_on_dark));
        assert_eq!(buf[(4, 2)].fg, theme.color(theme.tokens().foreground));
        assert!(row(&buf, 5).contains("Retry"));
    }

    #[test]
    fn the_tone_tints_the_card_in_truecolor_only() {
        let truecolor = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (mut plain, mut tinted) = (Buffer::empty(Rect::new(0, 0, 12, 3)), Buffer::empty(Rect::new(0, 0, 12, 3)));
        Card::new(&truecolor).render(plain.area, &mut plain);
        Alert::new(&truecolor, Tone::Danger, "x").render(tinted.area, &mut tinted);
        assert_ne!(plain[(5, 1)].bg, tinted[(5, 1)].bg);
        let indexed = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let (mut plain, mut tinted) = (Buffer::empty(Rect::new(0, 0, 12, 3)), Buffer::empty(Rect::new(0, 0, 12, 3)));
        Card::new(&indexed).render(plain.area, &mut plain);
        Alert::new(&indexed, Tone::Danger, "x").render(tinted.area, &mut tinted);
        assert_eq!(plain[(5, 1)].bg, tinted[(5, 1)].bg);
    }

    #[test]
    fn a_loud_alert_fills_the_card_with_the_solid_color_under_a_tape_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let r = theme.tokens();
        let alert = Alert::new(&theme, Tone::Danger, "Database error").text("connection refused").loud();
        assert_eq!(alert.height(30), 2 + 1 + 1 + 1);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 5));
        alert.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "▚".repeat(30));
        assert_eq!(buf[(5, 1)].fg, theme.color(r.tape));
        assert_eq!(buf[(5, 1)].bg, theme.color(r.danger_solid));
        assert_eq!(row(&buf, 2), "  ✕ Database error            ");
        assert_eq!(row(&buf, 3), "    connection refused        ");
        assert_eq!(buf[(2, 2)].fg, theme.color(r.danger_solid_foreground));
        assert_eq!(buf[(4, 3)].fg, theme.color(r.danger_solid_foreground));
        assert_eq!(buf[(20, 3)].bg, theme.color(r.danger_solid));
    }

    #[test]
    fn a_loud_warning_uses_the_triangle_on_the_yellow_fill_in_256_colors_too() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_LIGHT);
        let r = theme.tokens();
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 4));
        Alert::new(&theme, Tone::Warning, "Lag").loud().render(buf.area, &mut buf);
        assert_eq!(buf[(2, 2)].symbol(), "▲");
        assert_eq!(buf[(2, 2)].fg, theme.color(r.warning_solid_foreground));
        assert_eq!(buf[(10, 2)].bg, theme.color(r.warning_solid));
        assert_eq!(buf[(10, 1)].symbol(), "▚");
    }

    #[test]
    fn a_loud_alert_in_a_short_area_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for height in 0..4 {
            let mut buf = Buffer::empty(Rect::new(0, 0, 8, height));
            Alert::new(&theme, Tone::Danger, "x").text("y").loud().render(buf.area, &mut buf);
        }
    }

    #[test]
    fn each_tone_has_its_own_glyph() {
        let glyphs: Vec<_> = Tone::ALL.map(glyph).to_vec();
        for (i, one) in glyphs.iter().enumerate() {
            assert!(!glyphs[i + 1..].contains(one));
        }
    }

    #[test]
    fn an_alert_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 3));
        let button = Button::new(&theme, "Retry");
        Alert::new(&theme, Tone::Info, "A long title").text("some text that wraps").action(button).render(Rect::new(3, 1, 30, 8), &mut buf);
    }
}
