use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::page::section_line;
use crate::text::{cells, fit};
use crate::Theme;

/// What a missing measurement reads.
pub(crate) const NOT_COLLECTED: &str = "Not collected";

/// A number as Kiso shows it by default: one decimal, none when it is whole.
pub(crate) fn number(value: f64) -> String {
    let text = format!("{value:.1}");
    let text = text.strip_suffix(".0").unwrap_or(&text);
    if text == "-0" { "0".to_owned() } else { text.to_owned() }
}

/// A scale from a product, in order, or None when it is not finite.
pub(crate) fn bounds(range: Option<(f64, f64)>) -> Option<(f64, f64)> {
    let (a, b) = range?;
    (a.is_finite() && b.is_finite()).then(|| (a.min(b), a.max(b)))
}

/// A measurement against a known limit, such as 64 connections of 100, on
/// one row two columns in: the label, a track, and the value at the right
/// edge.
///
/// The filled part of the track is a heavy `━` in `secondary-foreground`,
/// to the half cell, and the rest is `━` in `secondary`. The fill stops at
/// the bounds, but the value keeps the real number. A missing or
/// nonfinite value reads "Not collected" over a `╱` hatch in `hatch`.
#[derive(Clone, Debug)]
pub struct Meter<'a> {
    theme: &'a Theme,
    label: String,
    value: Option<f64>,
    range: (f64, f64),
    text: Option<String>,
    label_width: Option<usize>,
}

impl<'a> Meter<'a> {
    /// A meter from 0 to 100. Pass None for a value that was not collected.
    pub fn new(theme: &'a Theme, label: impl Into<String>, value: impl Into<Option<f64>>) -> Self {
        let value = value.into().filter(|v| v.is_finite());
        Self { theme, label: label.into(), value, range: (0.0, 100.0), text: None, label_width: None }
    }

    /// The bounds of the track. A bound that is not finite keeps the default.
    #[must_use]
    pub fn range(mut self, min: f64, max: f64) -> Self {
        self.range = bounds(Some((min, max))).unwrap_or(self.range);
        self
    }

    /// The value as text, with its unit or context, such as "64 of 100".
    /// By default it is the number.
    #[must_use]
    pub fn value_text(mut self, text: impl Into<String>) -> Self {
        self.text = Some(text.into());
        self
    }

    /// The width of the label column, so meters one under another line
    /// up. By default it is the label's own width. A third of the row at
    /// most.
    #[must_use]
    pub fn label_width(mut self, width: usize) -> Self {
        self.label_width = Some(width);
        self
    }

    fn shown(&self) -> String {
        match (&self.text, self.value) {
            (Some(text), _) => text.clone(),
            (None, Some(value)) => number(value),
            (None, None) => NOT_COLLECTED.to_owned(),
        }
    }

    /// The row `width` cells wide.
    pub fn line(&self, width: usize) -> Line<'static> {
        let shown = self.shown();
        let label = self.label_width.unwrap_or_else(|| cells(&self.label)).min(width / 3);
        row(self.theme, width, (&self.label, label), self.share(), (&shown, cells(&shown)))
    }

    /// How much of the track the value fills, from 0 to 1.
    fn share(&self) -> Option<f64> {
        let (lo, hi) = self.range;
        self.value.map(|v| if hi > lo { ((v - lo) / (hi - lo)).clamp(0.0, 1.0) } else { 0.0 })
    }
}

impl Widget for Meter<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &self.line(usize::from(area.width)), area.width);
    }
}

/// One meter row: two columns in, the label in a column, the track, and the
/// value aligned to the right edge. Below 4 cells of track, the track drops.
fn row(t: &Theme, width: usize, (label, label_width): (&str, usize), share: Option<f64>, (value, value_width): (&str, usize)) -> Line<'static> {
    let r = t.tokens();
    let value_style = if share.is_some() { t.text() } else { t.muted() };
    let value_cell = vec![Span::styled(format!("{value:>value_width$}"), value_style)];
    let track = width.saturating_sub(2 + label_width + 2 + 2 + value_width);
    let mut spans = vec![Span::raw("  ")];
    spans.extend(fit(vec![Span::styled(label.to_owned(), t.text())], label_width));
    spans.push(Span::raw("  "));
    if track >= 4 {
        match share {
            None => spans.push(Span::styled("╱".repeat(track), t.fg(r.hatch))),
            Some(share) => {
                let halves = (share * track as f64 * 2.0).round() as usize;
                let (full, half) = (halves / 2, halves % 2);
                spans.push(Span::styled("━".repeat(full), t.fg(r.secondary_foreground)));
                spans.push(Span::styled("╸".repeat(half), t.fg(r.secondary_foreground)));
                spans.push(Span::styled("━".repeat(track - full - half), t.fg(r.secondary)));
            }
        }
        spans.push(Span::raw("  "));
    } else {
        // The value still ends at the right edge.
        spans.push(Span::raw(" ".repeat(track + 2)));
    }
    spans.extend(value_cell);
    Line::from(crate::text::fit(spans, width))
}

/// Labelled measurements compared on one scale, from 0 to a shared
/// maximum: a caption with the look's rule, then one [`Meter`] row each,
/// with the labels in one column and the values aligned right.
///
/// Rows keep the order they are given. An empty group reads
/// "No measurements."
#[derive(Clone, Debug)]
pub struct BarGauge<'a> {
    theme: &'a Theme,
    label: String,
    rows: Vec<(String, Option<f64>)>,
    max: f64,
    format: fn(f64) -> String,
}

impl<'a> BarGauge<'a> {
    /// A group named `label`, with its unit, such as "Disk used (GiB)",
    /// on a scale from 0 to `max`. A `max` that is not positive and finite
    /// draws every track empty.
    pub fn new(theme: &'a Theme, label: impl Into<String>, max: f64) -> Self {
        Self { theme, label: label.into(), rows: Vec::new(), max, format: number }
    }

    /// A row. Pass None for a value that was not collected.
    #[must_use]
    pub fn row(mut self, label: impl Into<String>, value: impl Into<Option<f64>>) -> Self {
        self.rows.push((label.into(), value.into().filter(|v| v.is_finite())));
        self
    }

    /// How each known value reads: the same unit and precision for every
    /// row. One decimal by default.
    #[must_use]
    pub fn format(mut self, format: fn(f64) -> String) -> Self {
        self.format = format;
        self
    }

    /// The rows the group takes: the caption and one per row, or one for
    /// the empty message.
    pub fn height(&self) -> u16 {
        u16::try_from(1 + self.rows.len().max(1)).unwrap_or(u16::MAX)
    }

    /// The caption and the rows, `width` cells wide.
    pub fn lines(&self, width: usize) -> Vec<Line<'static>> {
        let t = self.theme;
        let mut lines = vec![section_line(t, width, &self.label, "")];
        if self.rows.is_empty() {
            lines.push(Line::from(fit(vec![Span::raw("  "), Span::styled("No measurements.", t.muted())], width)));
            return lines;
        }
        let shown: Vec<String> = self.rows.iter().map(|(_, v)| v.map_or_else(|| NOT_COLLECTED.to_owned(), self.format)).collect();
        let value_width = shown.iter().map(|s| cells(s)).max().unwrap_or(0);
        let label_width = self.rows.iter().map(|(l, _)| cells(l)).max().unwrap_or(0).min(width / 3);
        let valid = self.max.is_finite() && self.max > 0.0;
        for ((label, value), shown) in self.rows.iter().zip(&shown) {
            let share = value.map(|v| if valid { (v / self.max).clamp(0.0, 1.0) } else { 0.0 });
            lines.push(row(t, width, (label, label_width), share, (shown, value_width)));
        }
        lines
    }
}

impl Widget for BarGauge<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        for (dy, line) in self.lines(usize::from(area.width)).iter().take(usize::from(area.height)).enumerate() {
            buf.set_line(area.x, area.y + dy as u16, line, area.width);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_track_fills_to_the_half_cell() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        // 2 + 5 + 2 + track 10 + 2 + 2 = 23.
        let line = Meter::new(&theme, "Conns", 25.0).line(23);
        assert_eq!(line.to_string(), "  Conns  ━━╸━━━━━━━  25");
    }

    #[test]
    fn an_over_limit_value_keeps_its_number() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = Meter::new(&theme, "Conns", 120.0).line(24);
        assert_eq!(line.to_string(), "  Conns  ━━━━━━━━━━  120");
        assert_eq!(line.spans[4].content, "━━━━━━━━━━", "all filled");
    }

    #[test]
    fn a_missing_value_reads_not_collected_over_a_hatch() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = Meter::new(&theme, "Disk", None).line(30);
        assert_eq!(line.to_string(), "  Disk  ╱╱╱╱╱╱╱  Not collected");
    }

    #[test]
    fn a_narrow_row_drops_the_track() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(12).to_string(), "  Con…    64");
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(14).to_string(), "  Con…      64");
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(0).width(), 0);
    }

    #[test]
    fn bar_gauge_rows_share_their_columns() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let gauge = BarGauge::new(&theme, "Disk (GiB)", 100.0).row("pg-main-1", 50.0).row("db", None);
        let lines: Vec<String> = gauge.lines(40).iter().map(ToString::to_string).collect();
        assert!(lines[1].ends_with("  50"), "{}", lines[1]);
        assert!(lines[2].ends_with("  Not collected"), "{}", lines[2]);
        // The tracks start and end in the same columns.
        assert_eq!(lines[1].find('━'), lines[2].find('╱'));
        assert_eq!(lines[1].chars().count(), 40);
        assert_eq!(lines[2].chars().count(), 40);
        assert_eq!(BarGauge::new(&theme, "Disk", 1.0).lines(30)[1].to_string().trim(), "No measurements.");
    }
}
