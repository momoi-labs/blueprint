use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::Theme;

/// Where the person is: a label in bold `foreground` in the middle of the
/// look's title line, across the width. By default the line is a heavy
/// `━` in `primary`.
#[derive(Clone, Debug)]
pub struct Title<'a> {
    theme: &'a Theme,
    label: String,
}

impl<'a> Title<'a> {
    pub fn new(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self { theme, label: label.into() }
    }

    /// The title `width` cells wide, to put in a line of your own.
    pub fn spans(&self, width: usize) -> Vec<Span<'static>> {
        let label = format!(" {} ", self.label);
        let room = width.saturating_sub(cells(&label));
        let left = room / 2;
        let line = glyphs(self.theme.look().title.spans(self.theme, width));
        let mut spans: Vec<Span<'static>> = line[..left.min(line.len())].to_vec();
        spans.push(Span::styled(label, self.theme.strong()));
        spans.extend(line[(width - (room - left)).min(line.len())..].iter().cloned());
        spans
    }
}

impl Widget for Title<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &Line::from(self.spans(usize::from(area.width))), area.width);
    }
}

/// One span per character, so a stroke can be cut anywhere.
fn glyphs(spans: Vec<Span<'static>>) -> Vec<Span<'static>> {
    spans
        .into_iter()
        .flat_map(|span| span.content.chars().map(move |ch| Span::styled(ch.to_string(), span.style)).collect::<Vec<_>>())
        .collect()
}

/// The views of a screen on one row. The current one is a [`Title`] that
/// takes the free width; the others stay short, with their number in
/// `subtle-foreground` as their key.
#[derive(Clone, Debug)]
pub struct Tabs<'a> {
    theme: &'a Theme,
    labels: Vec<String>,
    current: usize,
}

impl<'a> Tabs<'a> {
    /// Views by label, such as "Waiting 3", and the current one.
    pub fn new(theme: &'a Theme, labels: impl IntoIterator<Item = impl Into<String>>, current: usize) -> Self {
        Self { theme, labels: labels.into_iter().map(Into::into).collect(), current }
    }

    /// The row `width` cells wide. When the views do not fit, the ones
    /// farthest from the current one drop; the current one always shows.
    pub fn line(&self, width: usize) -> Line<'static> {
        let t = self.theme;
        let short = |i: usize, label: &str| {
            vec![Span::styled(format!(" {} ", i + 1), t.subtle()), Span::styled(format!("{label} "), t.muted())]
        };
        let cost = |i: usize| short(i, &self.labels[i]).iter().map(Span::width).sum::<usize>() + 1;
        // The current view keeps its label and a few cells of line.
        let current = self.labels.get(self.current).map_or(0, |label| cells(label) + 8);
        let mut shown: Vec<usize> = (0..self.labels.len()).filter(|i| *i != self.current).collect();
        while shown.iter().map(|&i| cost(i)).sum::<usize>() + current + 1 > width && !shown.is_empty() {
            let far = shown.iter().copied().max_by_key(|&i| i.abs_diff(self.current)).unwrap_or(0);
            shown.retain(|&i| i != far);
        }
        let others: usize = shown.iter().map(|&i| cost(i)).sum();
        let mut spans = Vec::new();
        for (i, label) in self.labels.iter().enumerate() {
            if i != self.current && !shown.contains(&i) {
                continue;
            }
            if i == self.current {
                spans.extend(Title::new(t, label.clone()).spans(width.saturating_sub(others + 1)));
            } else {
                spans.extend(short(i, label));
            }
            spans.push(Span::raw(" "));
        }
        Line::from(spans)
    }
}

impl Widget for Tabs<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &self.line(usize::from(area.width)), area.width);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_label_sits_in_the_middle() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = Line::from(Title::new(&theme, "Logs").spans(16));
        assert_eq!(line.to_string(), "━━━━━ Logs ━━━━━");
    }

    #[test]
    fn an_empty_area_draws_nothing() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Title::new(&theme, "Logs").render(Rect::new(0, 0, 10, 0), &mut buf);
        Tabs::new(&theme, ["A"], 0).render(Rect::new(0, 1, 10, 1), &mut buf);
        assert_eq!(buf[(0, 0)].symbol(), " ");
    }

    #[test]
    fn the_current_tab_always_shows() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let labels = ["Overview", "Applications", "Databases", "Routes", "Certificates", "Settings", "Selected"];
        let line = Tabs::new(&theme, labels, 6).line(80);
        assert!(line.to_string().contains(" Selected "), "{line}");
        assert!(line.width() <= 80);
    }

    #[test]
    fn the_current_tab_takes_the_free_width() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = Tabs::new(&theme, ["Running 4", "Waiting 1"], 0).line(40);
        assert_eq!(line.to_string(), "━━━━━━━ Running 4 ━━━━━━━  2 Waiting 1  ");
    }
}
