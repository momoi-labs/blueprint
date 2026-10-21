use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::Theme;

/// Footer key hints, in priority order.
///
/// Each key is in `link` and its label in `muted-foreground`. The current
/// view's label is bold `foreground`. Put `?` help and the close or quit
/// hint last: those two always stay. When the width runs out, the hints
/// before them drop from the right.
#[derive(Clone, Debug)]
pub struct KeyHints<'a> {
    theme: &'a Theme,
    hints: Vec<(&'a str, &'a str)>,
    current: Option<usize>,
}

impl<'a> KeyHints<'a> {
    /// Hints as `(key, label)` pairs, most important first.
    pub fn new(theme: &'a Theme, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        Self { theme, hints: hints.into_iter().collect(), current: None }
    }

    /// Marks the hint at `index` as the current view.
    pub fn current(mut self, index: usize) -> Self {
        self.current = Some(index);
        self
    }

    /// The indices that fit in `width` columns.
    fn visible(&self, width: usize) -> Vec<usize> {
        // A leading space, then "key label" per hint, two spaces apart.
        let cost = |&(key, label): &(&str, &str)| key.chars().count() + label.chars().count() + 3;
        let mut keep: Vec<usize> = (0..self.hints.len()).collect();
        let mut total = (self.hints.iter().map(cost).sum::<usize>() + 1).saturating_sub(2);
        let mut droppable = self.hints.len().saturating_sub(2);
        while total > width && droppable > 0 {
            droppable -= 1;
            total -= cost(&self.hints[droppable]);
            keep.remove(droppable);
        }
        keep
    }
}

impl Widget for KeyHints<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        buf.set_style(area, t.base());
        let mut spans = vec![Span::raw(" ")];
        for (n, i) in self.visible(usize::from(area.width)).into_iter().enumerate() {
            let (key, label) = self.hints[i];
            if n > 0 {
                spans.push(Span::raw("  "));
            }
            let style = if self.current == Some(i) { t.strong() } else { t.muted() };
            spans.push(Span::styled(key, t.link()));
            spans.push(Span::styled(format!(" {label}"), style));
        }
        Line::from(spans).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_help_and_quit_when_truncating() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let hints = [("↑↓", "move"), ("enter", "open"), ("/", "filter"), ("?", "help"), ("q", "quit")];
        let area = Rect::new(0, 0, 30, 1);
        let mut buf = Buffer::empty(area);
        KeyHints::new(&theme, hints).render(area, &mut buf);
        let row: String = (0..area.width).map(|x| buf[(x, 0)].symbol()).collect();
        assert_eq!(row.trim_end(), " ↑↓ move  ? help  q quit");
    }
}
