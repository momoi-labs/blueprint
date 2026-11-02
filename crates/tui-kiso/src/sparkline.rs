use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::Theme;

/// The eight heights of a cell, lowest first.
const LEVELS: [char; 8] = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/// The shape of one series in one row, such as a trend in a table cell or
/// under a figure: one block per sample, from `▁` to `█`.
///
/// The number next to it carries the value; the drawing carries the shape.
/// A missing or nonfinite sample is a blank cell, never zero. With fewer
/// than two measurements it draws nothing. Neutral uses `border-strong`;
/// [`primary`](Self::primary) uses `primary`, for the one series a view is
/// about. Converts into a [`Line`].
#[derive(Clone, Debug)]
pub struct Sparkline<'a> {
    theme: &'a Theme,
    values: Vec<Option<f64>>,
    range: Option<(f64, f64)>,
    primary: bool,
}

impl<'a> Sparkline<'a> {
    /// A sparkline of evenly spaced samples. Pass numbers, or `Option`s for
    /// samples that were not collected.
    pub fn new<V: Into<Option<f64>>>(theme: &'a Theme, values: impl IntoIterator<Item = V>) -> Self {
        Self { theme, values: values.into_iter().map(Into::into).collect(), range: None, primary: false }
    }

    /// The `primary` tone. At most one sparkline among its siblings takes it.
    #[must_use]
    pub fn primary(mut self, primary: bool) -> Self {
        self.primary = primary;
        self
    }

    /// A shared scale, so the rows of a table compare. Without it the line
    /// fills its height from its own lowest to its highest sample.
    #[must_use]
    pub fn range(mut self, min: f64, max: f64) -> Self {
        self.range = Some((min, max));
        self
    }

    /// The sparkline at most `width` cells wide. With more samples than
    /// cells, each cell shows the mean of the samples it covers.
    pub fn line(&self, width: usize) -> Line<'static> {
        let samples: Vec<Option<f64>> = self.values.iter().map(|v| v.filter(|v| v.is_finite())).collect();
        if samples.iter().flatten().count() < 2 || width == 0 {
            return Line::default();
        }
        let cells = buckets(&samples, width);
        let known = samples.iter().flatten().copied();
        let extent = || known.fold((f64::MAX, f64::MIN), |(lo, hi), v| (lo.min(v), hi.max(v)));
        let (lo, hi) = crate::meter::bounds(self.range).unwrap_or_else(extent);
        let text: String = cells
            .iter()
            .map(|cell| match cell {
                None => ' ',
                // A flat series draws a line through the middle.
                Some(_) if hi - lo <= f64::EPSILON => LEVELS[3],
                Some(v) => LEVELS[((v.clamp(lo, hi) - lo) / (hi - lo) * 7.0).round() as usize],
            })
            .collect();
        let r = self.theme.tokens();
        let color = if self.primary { r.primary } else { r.border_strong };
        Line::from(Span::styled(text, self.theme.fg(color)))
    }
}

/// `samples` in at most `width` cells: the mean of the known samples each
/// cell covers, or None when it covers none.
fn buckets(samples: &[Option<f64>], width: usize) -> Vec<Option<f64>> {
    if samples.len() <= width {
        return samples.to_vec();
    }
    (0..width)
        .map(|i| {
            let part = &samples[i * samples.len() / width..(i + 1) * samples.len() / width];
            let known: Vec<f64> = part.iter().flatten().copied().collect();
            (!known.is_empty()).then(|| known.iter().sum::<f64>() / known.len() as f64)
        })
        .collect()
}

impl<'a> From<Sparkline<'_>> for Line<'a> {
    fn from(sparkline: Sparkline<'_>) -> Self {
        sparkline.line(sparkline.values.len())
    }
}

impl Widget for Sparkline<'_> {
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
    fn samples_become_heights_and_gaps_stay_blank() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line: Line = Sparkline::new(&theme, [Some(0.0), Some(7.0), None, Some(3.5)]).into();
        assert_eq!(line.to_string(), "▁█ ▅");
    }

    #[test]
    fn fewer_than_two_measurements_draw_nothing() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Sparkline::new(&theme, [Some(1.0), None, Some(f64::NAN)]).line(10).width(), 0);
    }

    #[test]
    fn a_flat_series_draws_through_the_middle() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Sparkline::new(&theme, [2.0, 2.0, 2.0]).line(10).to_string(), "▄▄▄");
    }

    #[test]
    fn a_shared_range_clips_and_more_samples_than_cells_average() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Sparkline::new(&theme, [0.0, 200.0]).range(0.0, 100.0).line(5).to_string(), "▁█");
        assert_eq!(Sparkline::new(&theme, [0.0, 0.0, 7.0, 7.0]).line(2).to_string(), "▁█");
    }
}
