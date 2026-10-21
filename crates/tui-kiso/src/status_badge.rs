use std::borrow::Cow;

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Cell, Widget};

use crate::Theme;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Tone {
    Success,
    Danger,
    Neutral,
}

/// The state of one record: a mark and a label, both in the tone's color.
///
/// `success` uses `success-on-dark`, `danger` uses `danger-on-dark` and
/// `neutral` uses `muted-foreground`. The label always names the state, so
/// color never carries it alone. Converts into a [`Line`] or a table
/// [`Cell`].
#[derive(Clone, Debug)]
pub struct StatusBadge<'a> {
    theme: &'a Theme,
    tone: Tone,
    label: Cow<'a, str>,
    pulse: bool,
}

impl<'a> StatusBadge<'a> {
    fn new(theme: &'a Theme, tone: Tone, label: impl Into<Cow<'a, str>>) -> Self {
        Self { theme, tone, label: label.into(), pulse: false }
    }

    /// Alive, or finished well.
    pub fn success(theme: &'a Theme, label: impl Into<Cow<'a, str>>) -> Self {
        Self::new(theme, Tone::Success, label)
    }

    /// Failed.
    pub fn danger(theme: &'a Theme, label: impl Into<Cow<'a, str>>) -> Self {
        Self::new(theme, Tone::Danger, label)
    }

    /// Not happening: pending, stopped, disabled.
    pub fn neutral(theme: &'a Theme, label: impl Into<Cow<'a, str>>) -> Self {
        Self::new(theme, Tone::Neutral, label)
    }

    /// Work is going, such as a build. The mark becomes ◐ and the label
    /// names the phase.
    pub fn pulse(mut self, pulse: bool) -> Self {
        self.pulse = pulse;
        self
    }

    fn style(&self) -> Style {
        match self.tone {
            Tone::Success => self.theme.success(),
            Tone::Danger => self.theme.danger(),
            Tone::Neutral => self.theme.muted(),
        }
    }
}

impl<'a> From<StatusBadge<'a>> for Line<'a> {
    fn from(badge: StatusBadge<'a>) -> Self {
        let mark = match (badge.pulse, badge.tone) {
            (true, _) => "◐",
            (false, Tone::Neutral) => "○",
            (false, _) => "●",
        };
        let style = badge.style();
        Line::from(vec![Span::styled(mark, style), Span::raw(" "), Span::styled(badge.label, style)])
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
