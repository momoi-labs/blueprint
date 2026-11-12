use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Cell, Widget};

use kiso_core::StatusTone;

use crate::text::cells;
use crate::{Badge, Theme, Tone};

/// The state of one record: a mark and a label, both in the tone's color.
///
/// `success` uses `success-on-dark`, `danger` uses `danger-on-dark` and
/// `neutral` uses `muted-foreground`. The label always names the state, so
/// color never carries it alone. Converts into a [`Line`] or a table
/// [`Cell`]. Props and marks come from [`kiso_core::StatusBadge`].
///
/// [`StatusBadge::pill`] draws it as a [`Badge`], for a header, a card or
/// a detail page. Only the widget draws the pill: a line or a cell cannot
/// know the fill under it, so they stay plain, as a table wants.
#[derive(Clone, Debug)]
pub struct StatusBadge<'a> {
    theme: &'a Theme,
    spec: kiso_core::StatusBadge,
    pill: bool,
}

impl<'a> StatusBadge<'a> {
    /// Builds the widget from the shared spec.
    pub fn from_spec(theme: &'a Theme, spec: kiso_core::StatusBadge) -> Self {
        Self { theme, spec, pill: false }
    }

    fn new(theme: &'a Theme, tone: StatusTone, label: impl Into<String>) -> Self {
        Self::from_spec(theme, kiso_core::StatusBadge::new(tone, label))
    }

    /// Alive, or finished well.
    pub fn success(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self::new(theme, StatusTone::Success, label)
    }

    /// Failed.
    pub fn danger(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self::new(theme, StatusTone::Danger, label)
    }

    /// Not happening: pending, stopped, disabled.
    pub fn neutral(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self::new(theme, StatusTone::Neutral, label)
    }

    /// Work is going, such as a build. The mark becomes ◐ and the label
    /// names the phase.
    pub fn pulse(mut self, pulse: bool) -> Self {
        self.spec = self.spec.pulse(pulse);
        self
    }

    /// Draws the widget as a [`Badge`]: the mark and the label on a tint
    /// of the tone.
    #[must_use]
    pub fn pill(mut self, pill: bool) -> Self {
        self.pill = pill;
        self
    }

    /// The columns the widget takes.
    pub fn width(&self) -> u16 {
        cells(&self.spec.label) as u16 + if self.pill { 4 } else { 2 }
    }

    fn style(&self) -> Style {
        match self.spec.tone {
            StatusTone::Success => self.theme.success(),
            StatusTone::Danger => self.theme.danger(),
            StatusTone::Neutral => self.theme.muted(),
        }
    }
}

// The spans own their text, so the line can outlive the theme it was
// styled with.
impl<'a> From<StatusBadge<'_>> for Line<'a> {
    fn from(badge: StatusBadge<'_>) -> Self {
        let style = badge.style();
        let mark = badge.spec.mark();
        Line::from(vec![Span::styled(mark, style), Span::raw(" "), Span::styled(badge.spec.label, style)])
    }
}

impl<'a> From<StatusBadge<'_>> for Cell<'a> {
    fn from(badge: StatusBadge<'_>) -> Self {
        Cell::from(Line::from(badge))
    }
}

impl Widget for StatusBadge<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if self.pill {
            let tone = match self.spec.tone {
                StatusTone::Success => Tone::Success,
                StatusTone::Danger => Tone::Danger,
                StatusTone::Neutral => Tone::Neutral,
            };
            Badge::new(self.theme, tone, self.spec.to_text()).render(area, buf);
            return;
        }
        Line::from(self).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_pill_is_the_mark_and_the_label_on_a_fill() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        let badge = StatusBadge::neutral(&theme, "Stopped").pill(true);
        assert_eq!(badge.width(), 11);
        badge.render(buf.area, &mut buf);
        let row: String = (0..12).map(|x| buf[(x, 0)].symbol().to_owned()).collect();
        assert_eq!(row, " ○ Stopped  ");
        assert_ne!(buf[(10, 0)].bg, buf[(11, 0)].bg);
    }
}
