use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::text::cells;
use crate::{Badge, Card, Skeleton, Theme};

/// One number, its label, and how it changed: the label in
/// `muted-foreground`, the value in bold under it, then a note.
///
/// It sits on a [`Card`] of size `Md`. For a dense tool, [`Stat::card`]
/// `(false)` draws the same rows with no surface. The delta is a
/// [`Badge`] after the label.
#[derive(Clone, Debug)]
pub struct Stat<'a> {
    theme: &'a Theme,
    label: &'a str,
    value: &'a str,
    delta: Option<Badge<'a>>,
    note: Option<&'a str>,
    card: bool,
    loading: bool,
    tick: Option<u32>,
}

impl<'a> Stat<'a> {
    pub fn new(theme: &'a Theme, label: &'a str, value: &'a str) -> Self {
        Self { theme, label, value, delta: None, note: None, card: true, loading: false, tick: None }
    }

    /// The numbers are on their way. The label stays, since it is known;
    /// [`Skeleton`] bars take the place of the value, and of the note when
    /// there is one. The delta is left out. The stat keeps its height, so
    /// the page does not jump when the numbers arrive.
    #[must_use]
    pub fn loading(mut self, loading: bool) -> Self {
        self.loading = loading;
        self
    }

    /// Pulses the loading bars as `tick` counts up. See [`Skeleton::tick`].
    #[must_use]
    pub fn tick(mut self, tick: u32) -> Self {
        self.tick = Some(tick);
        self
    }

    /// How the value changed, such as `+18.6%`. Its tone is a judgment,
    /// not the direction.
    #[must_use]
    pub fn delta(mut self, delta: Badge<'a>) -> Self {
        self.delta = Some(delta);
        self
    }

    /// One row under the value, such as `32 more than last month`.
    #[must_use]
    pub fn note(mut self, note: &'a str) -> Self {
        self.note = Some(note);
        self
    }

    /// `false` draws the rows with no card.
    #[must_use]
    pub fn card(mut self, card: bool) -> Self {
        self.card = card;
        self
    }

    /// The rows the stat takes.
    pub fn height(&self) -> u16 {
        2 + u16::from(self.note.is_some()) + if self.card { 2 } else { 0 }
    }
}

impl Widget for Stat<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let inner = if self.card {
            let card = Card::new(t);
            card.render(area, buf);
            card.inner(area)
        } else {
            area
        };
        let width = usize::from(inner.width);
        if self.loading {
            let (label, _) = crate::text::take_cells(self.label, width);
            write(buf, inner.x, inner.y, label, t.muted());
            // A value is a few cells, a note is most of the row.
            let bars = [(1, inner.width.min(8)), (2, (u32::from(inner.width) * 60 / 100) as u16)];
            for (dy, bar) in bars.into_iter().take(if self.note.is_some() { 2 } else { 1 }) {
                if dy < inner.height && bar > 0 {
                    let bar = Rect::new(inner.x, inner.y.saturating_add(dy), bar, 1);
                    Skeleton::new(t).pulse(self.tick).render(bar, buf);
                }
            }
            return;
        }
        let rows = [(Some(self.label), t.muted()), (Some(self.value), t.strong()), (self.note, t.muted())];
        for (y, (text, style)) in (inner.top()..inner.bottom()).zip(rows) {
            if let Some(text) = text {
                let (cut, _) = crate::text::take_cells(text, width);
                write(buf, inner.x, y, cut, style);
            }
        }
        if let Some(delta) = self.delta {
            let x = inner.x.saturating_add(cells(self.label) as u16 + 1);
            let width = delta.width();
            if inner.height > 0 && x.saturating_add(width) <= inner.right() {
                delta.render(Rect::new(x, inner.y, width, 1), buf);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Tone;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn a_stat_is_a_label_a_value_and_a_note_on_a_card() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let stat = Stat::new(&theme, "Tasks", "186").delta(Badge::new(&theme, Tone::Success, "+18%")).note("32 more");
        assert_eq!(stat.height(), 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 18, 5));
        stat.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "  Tasks  +18%     ");
        assert_eq!(row(&buf, 2), "  186             ");
        assert_eq!(row(&buf, 3), "  32 more         ");
    }

    #[test]
    fn a_loading_stat_keeps_the_label_and_the_height() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let stat = Stat::new(&theme, "Tasks", "").delta(Badge::new(&theme, Tone::Success, "+18%")).note("").loading(true);
        assert_eq!(stat.height(), 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 18, 5));
        stat.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "  Tasks           ");
        let bar = |y: u16| (0..18).filter(|x| buf[(*x, y)].bg != buf[(0, 2)].bg).count();
        // The bars are 8 cells for the value and 60% of 14 for the note.
        assert_eq!((bar(2), bar(3)), (8, 8));
        assert_ne!(buf[(2, 2)].bg, buf[(0, 2)].bg);
    }

    #[test]
    fn without_a_card_it_takes_two_rows() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let stat = Stat::new(&theme, "Projects", "24").card(false);
        assert_eq!(stat.height(), 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 2));
        stat.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "Projects");
        assert_eq!(row(&buf, 1), "24      ");
    }
}
