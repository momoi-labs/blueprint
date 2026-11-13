use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::page::section_line;
use crate::text::{cells, fit};
use crate::{Theme, Tone};

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

/// The fill of a track: the accent, or the color of the tone. The accent is
/// `link`, not `primary`: `primary` is a light fill on some light themes and
/// loses its contrast as a mark, while `link` keeps it on every accent.
fn fill_rgb(theme: &Theme, tone: Tone) -> Rgb {
    match tone {
        Tone::Neutral => theme.tokens().link,
        tone => tone.rgb(theme),
    }
}

/// The tone a value takes: `base`, `Warning` from the first limit and
/// `Danger` from the second.
fn tone_of(base: Tone, value: Option<f64>, limits: Option<(f64, f64)>) -> Tone {
    match (value, limits) {
        (Some(v), Some((_, danger))) if v >= danger => Tone::Danger,
        (Some(v), Some((warn, _))) if v >= warn => Tone::Warning,
        _ => base,
    }
}

/// Two limits, in order, or None when one is not finite.
fn limits(warn: f64, danger: f64) -> Option<(f64, f64)> {
    bounds(Some((warn, danger)))
}

/// A measurement against a known limit, such as 64 connections of 100, on
/// one row: the label, a track, and the value at the right edge.
///
/// The track is a recessed run of `secondary`. The fill is the accent, or
/// the color of a [`Tone`], with square ends and a half cell of precision
/// (`▌`). The fill stops at the bounds, but the value keeps the real
/// number. A missing or nonfinite value reads "Not collected" over a `╱`
/// hatch in `hatch`.
///
/// It draws no card. Draw it in [`Card::inner`](crate::Card::inner) with
/// [`indent`](Self::indent) `(0)`, or on the page with the default two
/// columns.
#[derive(Clone, Debug)]
pub struct Meter<'a> {
    theme: &'a Theme,
    label: String,
    value: Option<f64>,
    range: (f64, f64),
    text: Option<String>,
    label_width: Option<usize>,
    tone: Tone,
    limits: Option<(f64, f64)>,
    indent: usize,
}

impl<'a> Meter<'a> {
    /// A meter from 0 to 100. Pass None for a value that was not collected.
    pub fn new(theme: &'a Theme, label: impl Into<String>, value: impl Into<Option<f64>>) -> Self {
        let value = value.into().filter(|v| v.is_finite());
        Self {
            theme,
            label: label.into(),
            value,
            range: (0.0, 100.0),
            text: None,
            label_width: None,
            tone: Tone::Neutral,
            limits: None,
            indent: 2,
        }
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

    /// The color of the fill. `Neutral` is the accent, the default.
    #[must_use]
    pub fn tone(mut self, tone: Tone) -> Self {
        self.tone = tone;
        self
    }

    /// The tone changes with the value, in the units of the range: from
    /// `warn` the fill is `Warning`, from `danger` it is `Danger`. Color is
    /// a weak signal, so say the state in the value text or in a
    /// [`Badge`](crate::Badge) too.
    #[must_use]
    pub fn thresholds(mut self, warn: f64, danger: f64) -> Self {
        self.limits = limits(warn, danger);
        self
    }

    /// The columns before the label: two on a page, as its rows, and none
    /// inside a [`Card`](crate::Card).
    #[must_use]
    pub fn indent(mut self, indent: usize) -> Self {
        self.indent = indent;
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
        let tone = tone_of(self.tone, self.value, self.limits);
        row(self.theme, (self.indent, width), (&self.label, label), self.share(), tone, (&shown, cells(&shown)))
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

/// The track of `width` cells: the fill to the half cell, then the rest.
/// The colors are whole, so the track reads the same on a card and on the
/// page.
fn track(t: &Theme, width: usize, share: f64, tone: Tone) -> Vec<Span<'static>> {
    let r = t.tokens();
    let rest = Style::new().bg(t.color(r.secondary));
    let fill = Style::new().bg(t.color(fill_rgb(t, tone)));
    let mut halves = (share * width as f64 * 2.0).round() as usize;
    // A value above zero never reads as an empty track.
    if share > 0.0 {
        halves = halves.max(1);
    }
    let (full, half) = (halves / 2, halves % 2);
    let mut spans = vec![Span::styled(" ".repeat(full), fill)];
    if half == 1 {
        spans.push(Span::styled("▌", t.fg(fill_rgb(t, tone)).bg(t.color(r.secondary))));
    }
    spans.push(Span::styled(" ".repeat(width - full - half), rest));
    spans
}

/// One meter row: the label in a column, the track, and the value aligned
/// to the right edge. Below 4 cells of track, the track drops.
fn row(
    t: &Theme,
    (indent, width): (usize, usize),
    (label, label_width): (&str, usize),
    share: Option<f64>,
    tone: Tone,
    (value, value_width): (&str, usize),
) -> Line<'static> {
    let r = t.tokens();
    let value_style = if share.is_some() { t.text() } else { t.muted() };
    let value_cell = vec![Span::styled(format!("{value:>value_width$}"), value_style)];
    let room = width.saturating_sub(indent + label_width + 2 + 2 + value_width);
    let mut spans = vec![Span::raw(" ".repeat(indent))];
    spans.extend(fit(vec![Span::styled(label.to_owned(), t.text())], label_width));
    spans.push(Span::raw("  "));
    if room >= 4 {
        match share {
            None => spans.push(Span::styled("╱".repeat(room), t.fg(r.hatch))),
            Some(share) => spans.extend(track(t, room, share, tone)),
        }
        spans.push(Span::raw("  "));
    } else {
        // The value still ends at the right edge.
        spans.push(Span::raw(" ".repeat(room + 2)));
    }
    spans.extend(value_cell);
    Line::from(crate::text::fit(spans, width))
}

/// Labelled measurements compared on one scale, from 0 to a shared
/// maximum: a caption with the look's rule, then one [`Meter`] row each,
/// with the labels in one column and the values aligned right.
///
/// Rows keep the order they are given. An empty group reads
/// "No measurements." It draws no card: draw it in
/// [`Card::inner`](crate::Card::inner) with [`indent`](Self::indent) `(0)`.
#[derive(Clone, Debug)]
pub struct BarGauge<'a> {
    theme: &'a Theme,
    label: String,
    rows: Vec<(String, Option<f64>)>,
    max: f64,
    format: fn(f64) -> String,
    limits: Option<(f64, f64)>,
    indent: usize,
}

impl<'a> BarGauge<'a> {
    /// A group named `label`, with its unit, such as "Disk used (GiB)",
    /// on a scale from 0 to `max`. A `max` that is not positive and finite
    /// draws every track empty.
    pub fn new(theme: &'a Theme, label: impl Into<String>, max: f64) -> Self {
        Self { theme, label: label.into(), rows: Vec::new(), max, format: number, limits: None, indent: 2 }
    }

    /// The fill of a row changes with its value, in the same units as the
    /// rows: from `warn` it is `Warning`, from `danger` it is `Danger`.
    /// Color is a weak signal, so say the state in the label or the value
    /// too.
    #[must_use]
    pub fn thresholds(mut self, warn: f64, danger: f64) -> Self {
        self.limits = limits(warn, danger);
        self
    }

    /// The columns before the label of a row: two on a page, none inside
    /// a [`Card`](crate::Card). The caption stays at the edge.
    #[must_use]
    pub fn indent(mut self, indent: usize) -> Self {
        self.indent = indent;
        self
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
            lines.push(Line::from(fit(vec![Span::raw(" ".repeat(self.indent)), Span::styled("No measurements.", t.muted())], width)));
            return lines;
        }
        let shown: Vec<String> = self.rows.iter().map(|(_, v)| v.map_or_else(|| NOT_COLLECTED.to_owned(), self.format)).collect();
        let value_width = shown.iter().map(|s| cells(s)).max().unwrap_or(0);
        let label_width = self.rows.iter().map(|(l, _)| cells(l)).max().unwrap_or(0).min(width / 3);
        let valid = self.max.is_finite() && self.max > 0.0;
        for ((label, value), shown) in self.rows.iter().zip(&shown) {
            let share = value.map(|v| if valid { (v / self.max).clamp(0.0, 1.0) } else { 0.0 });
            let tone = tone_of(Tone::Neutral, *value, self.limits);
            lines.push(row(t, (self.indent, width), (label, label_width), share, tone, (shown, value_width)));
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
    use ratatui::style::Color;

    use super::*;
    use crate::ACCENTS;

    fn theme() -> Theme {
        Theme::truecolor(kiso_tokens::GOLD_DARK)
    }

    /// The background of each cell of the track, as a letter: F for the
    /// fill, T for the track, H for a half cell.
    fn marks(line: &Line, theme: &Theme) -> String {
        let r = theme.tokens();
        let (fill, rest) = (theme.color(r.link), theme.color(r.secondary));
        let mut out = String::new();
        for span in &line.spans {
            for ch in span.content.chars() {
                match (ch, span.style.bg) {
                    ('▌', _) => out.push('H'),
                    (' ', Some(bg)) if bg == fill => out.push('F'),
                    (' ', Some(bg)) if bg == rest => out.push('T'),
                    _ => {}
                }
            }
        }
        out
    }

    #[test]
    fn the_track_fills_to_the_half_cell() {
        let theme = theme();
        // 2 + 5 + 2 + track 10 + 2 + 2 = 23.
        let line = Meter::new(&theme, "Conns", 25.0).line(23);
        assert_eq!(line.to_string(), "  Conns    ◌       ".replace('◌', "▌") + "  25");
        assert_eq!(marks(&line, &theme), "FFHTTTTTTT");
    }

    #[test]
    fn an_over_limit_value_keeps_its_number() {
        let theme = theme();
        let line = Meter::new(&theme, "Conns", 120.0).line(24);
        assert!(line.to_string().ends_with("  120"), "{line}");
        assert_eq!(marks(&line, &theme), "FFFFFFFFFF");
    }

    #[test]
    fn a_missing_value_reads_not_collected_over_a_hatch() {
        let theme = theme();
        let line = Meter::new(&theme, "Disk", None).line(30);
        assert_eq!(line.to_string(), "  Disk  ╱╱╱╱╱╱╱  Not collected");
    }

    #[test]
    fn a_narrow_row_drops_the_track() {
        let theme = theme();
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(12).to_string(), "  Con…    64");
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(14).to_string(), "  Con…      64");
        assert_eq!(Meter::new(&theme, "Connections", 64.0).line(0).width(), 0);
    }

    #[test]
    fn a_small_value_never_reads_as_empty_and_zero_does() {
        let theme = theme();
        assert_eq!(marks(&Meter::new(&theme, "A", 0.4).line(20), &theme).chars().filter(|c| *c == 'H').count(), 1);
        assert!(!marks(&Meter::new(&theme, "A", 0.0).line(20), &theme).contains(['F', 'H']));
    }

    #[test]
    fn the_indent_is_the_columns_before_the_label() {
        let theme = theme();
        assert!(Meter::new(&theme, "Conns", 50.0).line(30).to_string().starts_with("  Conns"));
        assert!(Meter::new(&theme, "Conns", 50.0).indent(0).line(30).to_string().starts_with("Conns"));
    }

    #[test]
    fn thresholds_change_the_tone_of_the_fill() {
        let theme = theme();
        let fill = |value: f64| {
            let line = Meter::new(&theme, "A", value).thresholds(70.0, 90.0).line(30);
            line.spans.iter().find(|s| s.content.starts_with(' ') && s.style.bg.is_some_and(|bg| bg != theme.color(theme.tokens().secondary))).and_then(|s| s.style.bg)
        };
        let r = theme.tokens();
        assert_eq!(fill(50.0), Some(theme.color(r.link)));
        assert_eq!(fill(70.0), Some(theme.color(r.warning_on_dark)));
        assert_eq!(fill(95.0), Some(theme.color(r.danger_on_dark)));
        let tone = Meter::new(&theme, "A", 10.0).tone(Tone::Success).line(30);
        assert!(tone.spans.iter().any(|s| s.style.bg == Some(theme.color(r.success_on_dark))));
    }

    #[test]
    fn the_track_stays_apart_from_the_fills_it_sits_on_in_every_theme() {
        for accent in ACCENTS {
            for light in [false, true] {
                for theme in [Theme::truecolor(accent.tokens(light)), Theme::xterm_256(accent.tokens(light))] {
                    let r = theme.tokens();
                    let track = theme.color(r.secondary);
                    for other in [r.card, r.background, r.link] {
                        assert_ne!(track, theme.color(other), "{} light={light}", accent.name);
                    }
                    assert_ne!(theme.color(r.link), theme.color(r.card), "{} light={light}", accent.name);
                    assert_ne!(Color::Reset, track);
                }
            }
        }
    }

    #[test]
    fn bar_gauge_rows_share_their_columns() {
        let theme = theme();
        let gauge = BarGauge::new(&theme, "Disk (GiB)", 100.0).row("pg-main-1", 50.0).row("db", None);
        let lines: Vec<String> = gauge.lines(40).iter().map(ToString::to_string).collect();
        assert!(lines[1].ends_with("  50"), "{}", lines[1]);
        assert!(lines[2].ends_with("  Not collected"), "{}", lines[2]);
        assert_eq!(lines[1].chars().count(), 40);
        assert_eq!(lines[2].chars().count(), 40);
        assert_eq!(BarGauge::new(&theme, "Disk", 1.0).lines(30)[1].to_string().trim(), "No measurements.");
    }

    #[test]
    fn a_bar_gauge_row_can_take_a_tone_from_its_value() {
        let theme = theme();
        let lines = BarGauge::new(&theme, "Disk", 100.0).thresholds(70.0, 90.0).row("a", 50.0).row("b", 95.0).indent(0).lines(30);
        assert!(lines[1].to_string().starts_with('a'));
        let danger = theme.color(theme.tokens().danger_on_dark);
        assert!(lines[2].spans.iter().any(|s| s.style.bg == Some(danger)));
        assert!(!lines[1].spans.iter().any(|s| s.style.bg == Some(danger)));
    }
}
