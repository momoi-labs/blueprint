use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, take_cells};
use crate::Theme;

/// A window of time chosen from a few presets, such as "15m", "1h", "24h":
/// a segmented control on one row.
///
/// The options sit together on a recessed `secondary` track. The chosen one
/// is raised on the accent: bold `primary-foreground` on a `primary` fill,
/// as a button, while the others are `muted-foreground` on the track. Bold
/// and the fill are the two signals, so the choice still reads in a few
/// colors. A `card` fill would sink on a dark theme, where `secondary` is
/// the lighter of the two. There is no custom range,
/// pause or calendar. Move the choice with [`TimeRangeControl::moved`],
/// bound to Left and Right; it stops at the ends.
///
/// When the options do not fit, the ones farthest from the chosen one drop.
/// The chosen one always shows, cut with `…` if it alone is too wide.
///
/// ```
/// use tui_kiso::{Theme, TimeRangeControl};
///
/// let theme = Theme::new(kiso_tokens::GOLD_DARK);
/// let control = TimeRangeControl::new(&theme, ["15m", "1h", "24h"], 1);
/// assert_eq!(control.line(20).to_string(), " 15m  1h  24h ");
/// assert_eq!(control.moved(1), 2);
/// assert_eq!(control.moved(-5), 0);
/// ```
#[derive(Clone, Debug)]
pub struct TimeRangeControl<'a> {
    theme: &'a Theme,
    options: Vec<String>,
    chosen: usize,
}

impl<'a> TimeRangeControl<'a> {
    /// The options in order and the index of the chosen one. An index past
    /// the end is the last option.
    pub fn new(theme: &'a Theme, options: impl IntoIterator<Item = impl Into<String>>, chosen: usize) -> Self {
        let options: Vec<String> = options.into_iter().map(Into::into).collect();
        let chosen = chosen.min(options.len().saturating_sub(1));
        Self { theme, options, chosen }
    }

    /// The index after moving `by` options, such as -1 for Left. It stops
    /// at the first and the last.
    pub fn moved(&self, by: isize) -> usize {
        self.chosen.saturating_add_signed(by).min(self.options.len().saturating_sub(1))
    }

    /// The columns the whole control takes: each option with a cell of
    /// padding on both sides.
    pub fn width(&self) -> u16 {
        let total: usize = self.options.iter().map(|o| cells(o) + 2).sum();
        u16::try_from(total).unwrap_or(u16::MAX)
    }

    /// The row `width` cells wide at most.
    pub fn line(&self, width: usize) -> Line<'static> {
        let t = self.theme;
        let r = t.tokens();
        let cost = |i: usize| cells(&self.options[i]) + 2;
        let mut shown: Vec<usize> = (0..self.options.len()).collect();
        while shown.iter().map(|&i| cost(i)).sum::<usize>() > width && shown.len() > 1 {
            let far = shown.iter().copied().max_by_key(|&i| (i.abs_diff(self.chosen), i)).unwrap_or(0);
            shown.retain(|&i| i != far);
        }
        let track = t.fill(r.muted_foreground, r.secondary);
        let raised = t.fill(r.primary_foreground, r.primary).add_modifier(Modifier::BOLD);
        let spans = shown
            .into_iter()
            .map(|i| {
                let style = if i == self.chosen { raised } else { track };
                let label = &self.options[i];
                // A lone option wider than the row keeps its place, cut.
                let text = if cost(i) > width {
                    let (cut, used) = take_cells(label, width.saturating_sub(3));
                    let pad = " ".repeat(width.saturating_sub(used + 1).min(1));
                    format!(" {cut}{}{pad}", if used < cells(label) { "…" } else { "" })
                } else {
                    format!(" {label} ")
                };
                Span::styled(text, style)
            })
            .collect::<Vec<_>>();
        Line::from(spans)
    }
}

impl Widget for TimeRangeControl<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() || self.options.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &self.line(usize::from(area.width)), area.width);
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;
    use crate::ACCENTS;

    fn control(theme: &Theme, chosen: usize) -> TimeRangeControl<'_> {
        TimeRangeControl::new(theme, ["15m", "1h", "6h", "24h", "7d"], chosen)
    }

    #[test]
    fn the_options_sit_on_one_track_and_the_chosen_one_is_raised() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = control(&theme, 1).line(40);
        assert_eq!(line.to_string(), " 15m  1h  6h  24h  7d ");
        let r = theme.tokens();
        assert_eq!(line.spans[1].style.bg, Some(theme.color(r.primary)));
        assert!(line.spans[1].style.add_modifier.contains(Modifier::BOLD));
        assert_eq!(line.spans[0].style.bg, Some(theme.color(r.secondary)));
        assert_eq!(line.spans[2].style.bg, Some(theme.color(r.secondary)));
        assert_eq!(control(&theme, 1).width(), 22);
    }

    #[test]
    fn the_choice_moves_and_stops_at_the_ends() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(control(&theme, 0).moved(-1), 0);
        assert_eq!(control(&theme, 0).moved(1), 1);
        assert_eq!(control(&theme, 4).moved(1), 4);
        assert_eq!(control(&theme, 99).moved(-1), 3);
        assert_eq!(TimeRangeControl::new(&theme, Vec::<String>::new(), 0).moved(1), 0);
    }

    #[test]
    fn a_narrow_row_drops_the_far_options_and_keeps_the_chosen_one() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(control(&theme, 2).line(13).to_string(), " 1h  6h  24h ");
        assert_eq!(control(&theme, 0).line(10).to_string(), " 15m  1h ");
        assert_eq!(control(&theme, 4).line(9).to_string(), " 24h  7d ");
        assert_eq!(control(&theme, 4).line(4).to_string(), " 7d ");
        // One option wider than the row is cut.
        let wide = TimeRangeControl::new(&theme, ["Last 30 days"], 0).line(8);
        assert!(wide.width() <= 8, "{wide}");
        assert!(wide.to_string().contains('…'), "{wide}");
    }

    #[test]
    fn it_draws_only_inside_its_area() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 2));
        control(&theme, 1).render(Rect::new(2, 1, 8, 1), &mut buf);
        assert_eq!(buf[(1, 1)].bg, Color::Reset);
        assert_eq!(buf[(10, 1)].bg, Color::Reset);
        assert_eq!(buf[(2, 0)].bg, Color::Reset);
        assert_ne!(buf[(2, 1)].bg, Color::Reset);
        // Edges and empty areas do not panic.
        for (w, h) in [(1, 1), (3, 1), (9, 2)] {
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            control(&theme, 2).render(buf.area, &mut buf);
        }
        let mut edge = Buffer::empty(Rect::new(65530, 0, 5, 1));
        control(&theme, 2).render(edge.area, &mut edge);
        control(&theme, 2).render(Rect::new(0, 0, 0, 0), &mut buf);
    }

    #[test]
    fn the_raised_segment_stays_apart_from_the_track_and_the_page() {
        for accent in ACCENTS {
            for light in [false, true] {
                for theme in [Theme::truecolor(accent.tokens(light)), Theme::xterm_256(accent.tokens(light))] {
                    let line = control(&theme, 1).line(40);
                    let (raised, track) = (line.spans[1].style.bg, line.spans[0].style.bg);
                    assert_ne!(raised, track, "{} light={light}", accent.name);
                    assert_ne!(raised, Some(theme.color(theme.tokens().background)), "{} light={light}", accent.name);
                    assert_ne!(track, Some(theme.color(theme.tokens().background)), "{} light={light}", accent.name);
                }
            }
        }
    }
}
