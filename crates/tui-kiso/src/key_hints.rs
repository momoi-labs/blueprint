use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::Theme;

/// Footer key hints, in priority order, as in Crush's help bar:
/// `key label • key label`.
///
/// Each key is in `foreground` and its label in `muted-foreground`, with a
/// `•` in `border` between hints. The current view's label is bold
/// `foreground`. Put `?` help and the close or quit hint last: those two
/// always stay. When the width runs out, the hints before them drop from
/// the right, and a hint is never cut in the middle. If help and quit
/// together are too wide, quit stays alone; if that is too wide too, only
/// its key shows.
#[derive(Clone, Debug)]
pub struct KeyHints<'a> {
    theme: &'a Theme,
    hints: Vec<(&'a str, &'a str)>,
    current: Option<usize>,
    prefix: Vec<Span<'a>>,
}

const SEPARATOR: &str = " • ";

impl<'a> KeyHints<'a> {
    /// Hints as `(key, label)` pairs, most important first.
    pub fn new(theme: &'a Theme, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        Self { theme, hints: hints.into_iter().collect(), current: None, prefix: Vec::new() }
    }

    /// Marks the hint at `index` as the current view.
    pub fn current(mut self, index: usize) -> Self {
        self.current = Some(index);
        self
    }

    /// Spans before the hints, such as a search prompt. They always stay.
    pub fn prefix(mut self, spans: impl IntoIterator<Item = Span<'a>>) -> Self {
        self.prefix = spans.into_iter().collect();
        self
    }

    /// The cells of the hints at `indices`, with the separators between.
    fn cost(&self, indices: impl IntoIterator<Item = usize>) -> usize {
        let cost = |(key, label): (&str, &str)| cells(key) + 1 + cells(label);
        let sep = cells(SEPARATOR);
        indices.into_iter().map(|i| cost(self.hints[i]) + sep).sum::<usize>().saturating_sub(sep)
    }

    /// The indices that fit in `width` columns. The hints before help and
    /// quit drop from the right, so the most important stay longest. When
    /// help and quit alone are too wide, help drops and quit stays. A hint
    /// is whole or gone.
    fn visible(&self, width: usize) -> Vec<usize> {
        let n = self.hints.len();
        let mut keep: Vec<usize> = (0..n).collect();
        let mut droppable = n.saturating_sub(2);
        while !keep.is_empty() && self.cost(keep.iter().copied()) > width {
            if droppable > 0 {
                droppable -= 1;
                keep.remove(droppable);
            } else {
                keep.remove(0);
            }
        }
        keep
    }

    /// The hints that fit in `width` columns after the prefix, as spans for
    /// a line of your own, such as a frame's bottom border. The last two
    /// hints keep their room: a long prefix is cut before they drop.
    pub fn spans(&self, width: usize) -> Vec<Span<'a>> {
        let t = self.theme;
        let n = self.hints.len();
        let kept = self.cost(n.saturating_sub(2)..n);
        let (mut spans, used) = cut(self.prefix.clone(), width.saturating_sub(kept));
        let room = width.saturating_sub(used);
        for (n, i) in self.visible(room).into_iter().enumerate() {
            let (key, label) = self.hints[i];
            if n > 0 {
                spans.push(Span::styled(SEPARATOR, t.fg(t.tokens().border)));
            }
            let style = if self.current == Some(i) { t.strong() } else { t.muted() };
            spans.push(Span::styled(key, t.text()));
            spans.push(Span::styled(format!(" {label}"), style));
        }
        // Not even the last hint fits: its key alone, which is still whole.
        if n > 0 && room > 0 && self.visible(room).is_empty() && cells(self.hints[n - 1].0) <= room {
            spans.push(Span::styled(self.hints[n - 1].0, t.text()));
        }
        spans
    }
}

impl Widget for KeyHints<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Line::from(self.spans(usize::from(area.width))).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_long_prefix_is_cut_before_help_and_quit_drop() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let prefix = [Span::raw("x".repeat(72))];
        let line = Line::from(KeyHints::new(&theme, [("?", "help"), ("q", "quit")]).prefix(prefix).spans(80));
        assert!(line.to_string().ends_with("? help • q quit"), "{line}");
        assert_eq!(line.width(), 80);
    }

    #[test]
    fn a_hint_is_never_cut_in_the_middle() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let hints = [("↑↓", "move"), ("enter", "open"), ("?", "help"), ("q", "quit")];
        let at = |width| Line::from(KeyHints::new(&theme, hints).spans(width)).to_string();
        assert_eq!(at(15), "? help • q quit");
        // Help and quit are 15 cells; under that, quit stays alone.
        assert_eq!(at(14), "q quit");
        assert_eq!(at(6), "q quit");
        assert_eq!(at(5), "q");
        assert_eq!(at(1), "q");
        assert_eq!(at(0), "");
    }

    #[test]
    fn the_lowest_priority_hints_drop_first() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let hints = [("↑↓", "move"), ("enter", "open"), ("/", "search"), ("s", "sort"), ("?", "help"), ("q", "quit")];
        let at = |width| Line::from(KeyHints::new(&theme, hints).spans(width)).to_string();
        assert_eq!(at(60), "↑↓ move • enter open • / search • s sort • ? help • q quit");
        assert_eq!(at(40), "↑↓ move • enter open • ? help • q quit");
        assert_eq!(at(22), "? help • q quit");
    }

    #[test]
    fn keeps_help_and_quit_when_truncating() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let hints = [("↑↓", "move"), ("enter", "open"), ("/", "search"), ("?", "help"), ("q", "quit")];
        let line = Line::from(KeyHints::new(&theme, hints).spans(30));
        assert_eq!(line.to_string(), "↑↓ move • ? help • q quit");
    }
}
