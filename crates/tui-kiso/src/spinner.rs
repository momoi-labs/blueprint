use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::{braille, Theme};

/// Work is going and the result is not known: a braille dot in `primary`
/// that turns on every tick, then an optional label in `muted-foreground`.
///
/// Raise `tick` about every 80 ms. It has one size and no keys. Say what is
/// going in the label when the spinner is the main thing on screen. Use
/// [`Skeleton`](crate::Skeleton) when the layout of the result is known.
/// Converts into a [`Line`].
#[derive(Clone, Copy, Debug)]
pub struct Spinner<'a> {
    theme: &'a Theme,
    tick: u32,
    label: Option<&'a str>,
}

impl<'a> Spinner<'a> {
    pub fn new(theme: &'a Theme, tick: u32) -> Self {
        Self { theme, tick, label: None }
    }

    /// What is going, such as "Loading queries".
    #[must_use]
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = Some(label);
        self
    }

    /// The columns the spinner takes.
    pub fn width(&self) -> u16 {
        1 + self.label.map_or(0, |label| 1 + cells(label) as u16)
    }
}

impl From<Spinner<'_>> for Line<'static> {
    fn from(spinner: Spinner<'_>) -> Self {
        let t = spinner.theme;
        let mut spans = vec![Span::styled(braille(spinner.tick), t.fg(t.tokens().primary))];
        if let Some(label) = spinner.label {
            spans.push(Span::styled(format!(" {label}"), t.muted()));
        }
        Line::from(spans)
    }
}

impl Widget for Spinner<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Line::from(self).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_dot_turns_and_the_label_follows() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let spinner = Spinner::new(&theme, 1).label("Loading");
        assert_eq!(spinner.width(), 9);
        assert_eq!(Line::from(spinner).to_string(), "⠙ Loading");
        assert_eq!(Line::from(Spinner::new(&theme, 11)).to_string(), "⠙");
    }

    #[test]
    fn a_spinner_in_a_small_area_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 1));
        Spinner::new(&theme, 0).label("Loading queries").render(Rect::new(2, 0, 20, 1), &mut buf);
    }
}
