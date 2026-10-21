use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Cell, Widget};

use kiso_core::StatusTone;

use crate::Theme;

/// The state of one record: a mark and a label, both in the tone's color.
///
/// `success` uses `success-on-dark`, `danger` uses `danger-on-dark` and
/// `neutral` uses `muted-foreground`. The label always names the state, so
/// color never carries it alone. Converts into a [`Line`] or a table
/// [`Cell`]. Props and marks come from [`kiso_core::StatusBadge`].
#[derive(Clone, Debug)]
pub struct StatusBadge<'a> {
    theme: &'a Theme,
    spec: kiso_core::StatusBadge,
}

impl<'a> StatusBadge<'a> {
    /// Builds the widget from the shared spec.
    pub fn from_spec(theme: &'a Theme, spec: kiso_core::StatusBadge) -> Self {
        Self { theme, spec }
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

    fn style(&self) -> Style {
        match self.spec.tone {
            StatusTone::Success => self.theme.success(),
            StatusTone::Danger => self.theme.danger(),
            StatusTone::Neutral => self.theme.muted(),
        }
    }
}

impl<'a> From<StatusBadge<'a>> for Line<'a> {
    fn from(badge: StatusBadge<'a>) -> Self {
        let style = badge.style();
        let mark = badge.spec.mark();
        Line::from(vec![Span::styled(mark, style), Span::raw(" "), Span::styled(badge.spec.label, style)])
    }
}

impl<'a> From<StatusBadge<'a>> for Cell<'a> {
    fn from(badge: StatusBadge<'a>) -> Self {
        Cell::from(Line::from(badge))
    }
}

impl Widget for StatusBadge<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Line::from(self).render(area, buf);
    }
}
