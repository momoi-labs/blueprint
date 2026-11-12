use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::{cap, put, under, write};
use crate::text::cells;
use crate::{blend, Theme, Tone};

/// Names a state or a class next to something else: the tone as text over
/// a tint of it, one cell wider than the label on each side.
///
/// The tint mixes with the fill under the badge, so draw the card or the
/// selection first. In 256 colors there is no tint: the fill is a gray that
/// keeps the text readable. It takes one row and [`Badge::width`] columns
/// from the top left of its area.
#[derive(Clone, Debug)]
pub struct Badge<'a> {
    theme: &'a Theme,
    tone: Tone,
    label: String,
    dot: bool,
    outline: bool,
}

impl<'a> Badge<'a> {
    pub fn new(theme: &'a Theme, tone: Tone, label: impl Into<String>) -> Self {
        Self { theme, tone, label: label.into(), dot: false, outline: false }
    }

    /// A `●` in the tone before the label.
    #[must_use]
    pub fn dot(mut self, dot: bool) -> Self {
        self.dot = dot;
        self
    }

    /// The outline look: `foreground` text between two thin edges, with no
    /// fill, no tone and no dot.
    #[must_use]
    pub fn outline(mut self, outline: bool) -> Self {
        self.outline = outline;
        self
    }

    fn text(&self) -> String {
        if self.dot && !self.outline {
            format!("● {}", self.label)
        } else {
            self.label.clone()
        }
    }

    /// The columns the badge takes.
    pub fn width(&self) -> u16 {
        cells(&self.text()) as u16 + 2
    }
}

impl Widget for Badge<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let (x, y) = (area.x, area.y);
        let label = self.text();
        if self.outline {
            let edge = t.color(t.tokens().border);
            put(buf, x, y, "▕", edge);
            let used = write(buf, x.saturating_add(1), y, &label, t.text());
            put(buf, x.saturating_add(1 + used), y, "▏", edge);
            return;
        }
        let text = self.tone.rgb(t);
        let by = if self.tone == Tone::Neutral { 0.14 } else { 0.2 };
        let style = t.fill(text, blend(&[under(t, buf, x, y), text], by));
        let end = style.bg.unwrap_or_default();
        cap(t, buf, x, y, true, end);
        let used = write(buf, x.saturating_add(1), y, &label, style);
        cap(t, buf, x.saturating_add(1 + used), y, false, end);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, width: u16) -> String {
        (0..width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    #[test]
    fn a_badge_is_two_cells_wider_than_its_label() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        let badge = Badge::new(&theme, Tone::Success, "live").dot(true);
        assert_eq!(badge.width(), 8);
        badge.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 10), " ● live   ");
        assert_eq!(buf[(0, 0)].bg, buf[(3, 0)].bg);
        assert_ne!(buf[(7, 0)].bg, buf[(8, 0)].bg);
    }

    #[test]
    fn the_outline_look_has_edges_and_no_fill() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 1));
        Badge::new(&theme, Tone::Neutral, "Beta").outline(true).render(buf.area, &mut buf);
        assert_eq!(row(&buf, 6), "▕Beta▏");
    }
}
