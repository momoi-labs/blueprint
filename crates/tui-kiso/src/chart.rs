use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::symbols::Marker;
use ratatui::text::{Line, Span};
use ratatui::widgets::canvas::{Canvas, Line as Segment, Points};
use ratatui::widgets::Widget;

use crate::meter::{bounds, number};
use crate::page::section_line;
use crate::text::{cells, fit};
use crate::Theme;

/// What an empty window reads.
const EMPTY: &str = "No collected samples in this window.";

/// One series of a [`Chart`]: a label, and a sample at each timestamp of
/// the chart, None where it was not collected.
#[derive(Clone, Debug, PartialEq)]
pub struct Series {
    label: String,
    values: Vec<Option<f64>>,
    slot: Option<usize>,
}

impl Series {
    /// A series of samples. Pass numbers, or `Option`s for samples that
    /// were not collected.
    pub fn new<V: Into<Option<f64>>>(label: impl Into<String>, values: impl IntoIterator<Item = V>) -> Self {
        let values = values.into_iter().map(|v| v.into().filter(|v| v.is_finite())).collect();
        Self { label: label.into(), values, slot: None }
    }

    /// The slot, from 1, that fixes its color and number across charts. By
    /// default the series takes its place in the chart.
    #[must_use]
    pub fn slot(mut self, slot: usize) -> Self {
        self.slot = Some(slot.max(1));
        self
    }

    fn known(&self) -> impl Iterator<Item = f64> + '_ {
        self.values.iter().flatten().copied()
    }

    /// Min, max, average and current: the sample at the last timestamp.
    fn summary(&self) -> [Option<f64>; 4] {
        let count = self.known().count();
        let min = self.known().reduce(f64::min);
        let max = self.known().reduce(f64::max);
        let avg = (count > 0).then(|| self.known().sum::<f64>() / count as f64);
        [min, max, avg, self.values.last().copied().flatten()]
    }
}

/// The legend under a [`Chart`], as on the web.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ChartLegend {
    /// A row per series with min, max, average and current.
    #[default]
    Table,
    /// The series and their current value on one row.
    Inline,
    /// No legend, when the page shows the values elsewhere.
    Hidden,
}

/// Several series of one unit across a window of time, drawn with braille
/// lines: a caption with the look's rule, the plot with its scale on the
/// left, the times under it and a [`ChartLegend`].
///
/// Series take `chart-1` to `chart-5` by slot; a sixth starts again at
/// `chart-1`, and its number still names it. The scale and times are
/// `subtle-foreground`; grid lines are a faint dotted `┈` in `border`, and
/// a legend mark is a short `▄▄` bar. Lines break
/// where a sample is missing, and a lone sample is a dot. Where two series
/// cross in one cell, the later one shows. When the area is short, the
/// plot keeps its rows: the legend turns inline, then drops, then the times
/// and the caption go. Rows start two columns in, as the rows of a page;
/// [`indent`](Self::indent) `(0)` sets them flush, for a chart inside a
/// [`Card`](crate::Card).
#[derive(Clone, Debug)]
pub struct Chart<'a> {
    theme: &'a Theme,
    label: String,
    meta: String,
    series: Vec<Series>,
    times: Vec<String>,
    range: Option<(f64, f64)>,
    legend: ChartLegend,
    format: fn(f64) -> String,
    indent: usize,
}

impl<'a> Chart<'a> {
    /// A chart named `label`, with its unit, such as "CPU (%)".
    pub fn new(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self {
            theme,
            label: label.into(),
            meta: String::new(),
            series: Vec::new(),
            times: Vec::new(),
            range: None,
            legend: ChartLegend::Table,
            format: number,
            indent: 2,
        }
    }

    /// The series, all on the same timestamps.
    #[must_use]
    pub fn series(mut self, series: impl IntoIterator<Item = Series>) -> Self {
        self.series.extend(series);
        self
    }

    /// Labels under the plot, spread from the first sample to the last,
    /// such as `["18:00", "18:30", "19:00"]`. A label that would touch the
    /// one before it is left out.
    #[must_use]
    pub fn times<S: Into<String>>(mut self, times: impl IntoIterator<Item = S>) -> Self {
        self.times = times.into_iter().map(Into::into).collect();
        self
    }

    /// A fixed scale, so charts side by side compare. Without it, the scale
    /// runs from the lowest sample to the highest.
    #[must_use]
    pub fn range(mut self, min: f64, max: f64) -> Self {
        self.range = bounds(Some((min, max)));
        self
    }

    /// The legend. [`ChartLegend::Table`] by default.
    #[must_use]
    pub fn legend(mut self, legend: ChartLegend) -> Self {
        self.legend = legend;
        self
    }

    /// How the scale and the legend show a number: the same unit and
    /// precision everywhere. One decimal by default.
    #[must_use]
    pub fn format(mut self, format: fn(f64) -> String) -> Self {
        self.format = format;
        self
    }

    /// Columns before the plot, the legend and the times. Two by default,
    /// as the rows of a page; use 0 inside a card, which has its own
    /// padding.
    #[must_use]
    pub fn indent(mut self, indent: usize) -> Self {
        self.indent = indent;
        self
    }

    /// Text at the end of the caption's rule, such as "last hour".
    #[must_use]
    pub fn meta(mut self, meta: impl Into<String>) -> Self {
        self.meta = meta.into();
        self
    }

    fn slot(&self, index: usize) -> usize {
        self.series[index].slot.unwrap_or(index + 1)
    }

    fn color(&self, index: usize) -> Style {
        let r = self.theme.tokens();
        let palette = [r.chart_1, r.chart_2, r.chart_3, r.chart_4, r.chart_5];
        self.theme.fg(palette[(self.slot(index) - 1) % palette.len()])
    }

    /// A series' stroke sample, number and label.
    fn name(&self, index: usize) -> Vec<Span<'static>> {
        vec![
            Span::styled("▄▄ ", self.color(index)),
            Span::styled(format!("{} ", self.slot(index)), self.theme.subtle()),
            Span::styled(self.series[index].label.clone(), self.theme.text()),
        ]
    }

    fn value(&self, value: Option<f64>) -> String {
        value.map_or_else(|| "—".to_owned(), self.format)
    }

    /// The legend as a table, two columns in. A narrow area drops Min,
    /// then Max, then Avg; Current always stays.
    fn table(&self, width: usize) -> Vec<Line<'static>> {
        let t = self.theme;
        let heads = ["Min", "Max", "Avg", "Current"];
        let rows: Vec<[String; 4]> = self.series.iter().map(|s| s.summary().map(|v| self.value(v))).collect();
        let widths: Vec<usize> =
            (0..4).map(|c| rows.iter().map(|r| cells(&r[c])).chain([cells(heads[c])]).max().unwrap_or(0)).collect();
        let names: Vec<Vec<Span<'static>>> = (0..self.series.len()).map(|i| self.name(i)).collect();
        let name_width = names.iter().map(|n| n.iter().map(Span::width).sum()).chain([cells("Series")]).max().unwrap_or(0);
        let mut shown: Vec<usize> = vec![0, 1, 2, 3];
        let total = |shown: &[usize], name: usize| self.indent + name + shown.iter().map(|&c| widths[c] + 2).sum::<usize>();
        while shown.len() > 1 && total(&shown, name_width.min(12)) > width {
            shown.remove(0);
        }
        let name_width = width.saturating_sub(total(&shown, 0)).min(name_width);
        let line = |name: Vec<Span<'static>>, cells: Vec<Span<'static>>| {
            let mut spans = vec![Span::raw(" ".repeat(self.indent))];
            spans.extend(fit(name, name_width));
            spans.extend(cells);
            Line::from(fit(spans, width))
        };
        let head = shown.iter().map(|&c| Span::styled(format!("  {:>w$}", heads[c], w = widths[c]), t.subtle())).collect();
        let mut lines = vec![line(vec![Span::styled("Series", t.subtle())], head)];
        for (i, row) in rows.iter().enumerate() {
            let values = shown
                .iter()
                .map(|&c| {
                    let style = if row[c] == "—" { t.muted() } else { t.text() };
                    Span::styled(format!("  {:>w$}", row[c], w = widths[c]), style)
                })
                .collect();
            lines.push(line(names[i].clone(), values));
        }
        lines
    }

    /// The legend on one row: each series and its current value.
    fn inline(&self, width: usize) -> Line<'static> {
        let mut spans = vec![Span::raw(" ".repeat(self.indent))];
        for (i, series) in self.series.iter().enumerate() {
            if i > 0 {
                spans.push(Span::raw("   "));
            }
            spans.extend(self.name(i));
            let current = series.summary()[3];
            let style = if current.is_some() { self.theme.text() } else { self.theme.muted() };
            spans.push(Span::styled(format!(" {}", self.value(current)), style));
        }
        Line::from(fit(spans, width))
    }

    /// The scale: the lowest and highest value it shows.
    fn scale(&self) -> Option<(f64, f64)> {
        let (lo, hi) = self.range.or_else(|| {
            let mut known = self.series.iter().flat_map(Series::known).peekable();
            known.peek()?;
            Some(known.fold((f64::MAX, f64::MIN), |(lo, hi), v| (lo.min(v), hi.max(v))))
        })?;
        // A flat series still draws, across the middle.
        if hi - lo <= f64::EPSILON {
            let pad = if lo == 0.0 { 1.0 } else { lo.abs() / 10.0 };
            return Some((lo - pad, hi + pad));
        }
        Some((lo, hi))
    }

    /// Draws the plot and returns the column where its dots start, past the
    /// indent and the scale.
    fn plot(&self, area: Rect, buf: &mut Buffer) -> u16 {
        let t = self.theme;
        let r = t.tokens();
        let indent = u16::try_from(self.indent).unwrap_or(u16::MAX);
        let area = Rect { x: area.x.saturating_add(indent), width: area.width.saturating_sub(indent), ..area }.intersection(buf.area);
        if area.is_empty() {
            return area.x;
        }
        let rows = usize::from(area.height);
        let known = self.series.iter().any(|s| s.known().next().is_some());
        let (lo, hi) = self.scale().unwrap_or((0.0, 1.0));
        // A row shows the values from the middle of its dots, so the middle
        // row of an odd height reads exactly halfway.
        let at = |row: usize| hi - (4.0 * row as f64 + 1.5) / (4.0 * rows as f64 - 1.0) * (hi - lo);
        let mut ticks = vec![(0, hi)];
        if rows >= 5 {
            ticks.push(((rows - 1) / 2, at((rows - 1) / 2)));
        }
        if rows >= 2 {
            ticks.push((rows - 1, lo));
        }
        let labels: Vec<(usize, String)> = ticks.into_iter().map(|(row, v)| (row, (self.format)(v))).collect();
        let mut gutter = labels.iter().map(|(_, l)| cells(l)).max().unwrap_or(0) + 1;
        if gutter * 3 > usize::from(area.width) {
            gutter = 0;
        }
        let plot = Rect { x: area.x + gutter as u16, width: area.width - gutter as u16, ..area };
        for (row, label) in &labels {
            let y = area.y + *row as u16;
            if gutter > 0 {
                buf.set_string(area.x, y, format!("{label:>w$}", w = gutter - 1), t.subtle());
            }
            buf.set_string(plot.x, y, "┈".repeat(usize::from(plot.width)), t.fg(r.border));
        }
        if !known {
            let (text, used) = crate::text::take_cells(EMPTY, usize::from(plot.width));
            let y = plot.y + (plot.height - 1) / 2;
            let x = plot.x + (plot.width - used as u16) / 2;
            buf.set_string(x, y, text, t.muted());
            return plot.x;
        }
        let samples = self.series.iter().map(|s| s.values.len()).max().unwrap_or(0);
        // One sample sits in the middle.
        let x_bounds = if samples > 1 { [0.0, (samples - 1) as f64] } else { [-1.0, 1.0] };
        let canvas = Canvas::default().marker(Marker::Braille).x_bounds(x_bounds).y_bounds([lo, hi]).paint(|ctx| {
            for (i, series) in self.series.iter().enumerate() {
                if i > 0 {
                    ctx.layer();
                }
                let color = self.color(i).fg.unwrap_or_default();
                let v = &series.values;
                let mut lone = Vec::new();
                for (x, value) in v.iter().enumerate() {
                    let Some(y) = *value else { continue };
                    match v.get(x + 1).copied().flatten() {
                        Some(next) => ctx.draw(&Segment::new(x as f64, y, (x + 1) as f64, next, color)),
                        None if x == 0 || v[x - 1].is_none() => lone.push((x as f64, y)),
                        None => {}
                    }
                }
                ctx.draw(&Points { coords: &lone, color });
            }
        });
        // The canvas resets the background, and a backdrop under the plot
        // must stay.
        let under: Vec<_> = plot.intersection(buf.area).positions().map(|at| (at, buf[at].bg)).collect();
        canvas.render(plot, buf);
        for (at, bg) in under {
            buf[at].set_bg(bg);
        }
        plot.x
    }

    /// The times under the plot, in `area`, which starts where the plot
    /// does.
    fn times_line(&self, area: Rect, buf: &mut Buffer) {
        let n = self.times.len();
        let width = usize::from(area.width);
        let mut next_free = 0;
        for (i, label) in self.times.iter().enumerate() {
            let w = cells(label);
            let center = if n > 1 { i * width.saturating_sub(1) / (n - 1) } else { 0 };
            let start = match i {
                0 => 0,
                _ if i == n - 1 => width.saturating_sub(w),
                _ => center.saturating_sub(w / 2),
            };
            if start < next_free || start + w > width {
                continue;
            }
            // Keep room for the last label.
            let last = self.times.last().map_or(0, |l| cells(l));
            if i + 1 < n && start + w + 1 > width.saturating_sub(last) {
                continue;
            }
            buf.set_string(area.x + start as u16, area.y, label, self.theme.subtle());
            next_free = start + w + 1;
        }
    }
}

impl Widget for Chart<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let width = usize::from(area.width);
        let height = usize::from(area.height);
        let mut legend = match self.legend {
            ChartLegend::Table => self.table(width),
            ChartLegend::Inline => vec![self.inline(width)],
            ChartLegend::Hidden => Vec::new(),
        };
        let (mut caption, mut times) = (true, !self.times.is_empty());
        // The plot comes first. The table legend needs five rows of plot
        // beside it and the inline one four; below that it drops, and below
        // three rows the times and then the caption go.
        let need = |caption: bool, times: bool, legend: &[Line], plot: usize| {
            usize::from(caption) + usize::from(times) + if legend.is_empty() { 0 } else { legend.len() + 1 } + plot
        };
        if legend.len() > 1 && need(caption, times, &legend, 5) > height {
            legend = vec![self.inline(width)];
        }
        if need(caption, times, &legend, 4) > height {
            legend.clear();
        }
        if need(caption, times, &legend, 3) > height {
            times = false;
        }
        if need(caption, times, &legend, 3) > height {
            caption = false;
        }
        let legend_rows = if legend.is_empty() { 0 } else { legend.len() + 1 };
        let plot_rows = height.saturating_sub(usize::from(caption) + usize::from(times) + legend_rows);
        let mut y = area.y;
        if caption {
            buf.set_line(area.x, y, &section_line(self.theme, width, &self.label, &self.meta), area.width);
            y += 1;
        }
        let start = self.plot(Rect { y, height: plot_rows as u16, ..area }, buf).max(area.x);
        y += plot_rows as u16;
        if times {
            self.times_line(Rect { x: start, y, width: area.right().saturating_sub(start), height: 1 }, buf);
            y += 1;
        }
        if !legend.is_empty() {
            y += 1;
            for line in &legend {
                buf.set_line(area.x, y, line, area.width);
                y += 1;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol()).collect::<String>()
    }

    fn chart(theme: &Theme) -> Chart<'_> {
        Chart::new(theme, "CPU (%)")
            .series([
                Series::new("Primary", [10.0, 40.0, 30.0, 50.0]),
                Series::new("Replica", [Some(5.0), None, Some(20.0), Some(25.0)]),
            ])
            .times(["18:00", "19:00"])
    }

    #[test]
    fn the_chart_has_a_caption_a_scale_times_and_a_legend() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 11));
        chart(&theme).render(buf.area, &mut buf);
        // Caption, five rows of plot with a middle tick, times, a blank row,
        // then the legend.
        assert!(text(&buf, 0).starts_with("CPU (%) ───"), "{}", text(&buf, 0));
        assert!(text(&buf, 1).starts_with("    50 ┈"), "{}", text(&buf, 1));
        assert!(text(&buf, 3).starts_with("  27.5 "), "{}", text(&buf, 3));
        assert!(text(&buf, 5).starts_with("     5 "), "{}", text(&buf, 5));
        assert!(text(&buf, 6).starts_with("       18:00") && text(&buf, 6).trim_end().ends_with("19:00"), "{}", text(&buf, 6));
        assert!(text(&buf, 8).contains("Series") && text(&buf, 8).contains("Current"), "{}", text(&buf, 8));
        assert!(text(&buf, 9).starts_with("  ▄▄ 1 Primary"), "{}", text(&buf, 9));
        assert!(text(&buf, 9).trim_end().ends_with("50"), "{}", text(&buf, 9));
        // Braille dots in the plot, in the series colors.
        let braille = |c: &ratatui::buffer::Cell| c.symbol().chars().next().is_some_and(|ch| ('\u{2801}'..='\u{28ff}').contains(&ch));
        let colors: Vec<_> = buf.content().iter().filter(|c| braille(c)).map(|c| c.fg).collect();
        assert!(colors.contains(&theme.color(theme.tokens().chart_1)));
        assert!(colors.contains(&theme.color(theme.tokens().chart_2)));
    }

    #[test]
    fn the_indent_moves_the_legend_and_the_plot() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 11));
        chart(&theme).indent(0).render(buf.area, &mut buf);
        assert!(text(&buf, 1).starts_with("  50 ┈"), "{}", text(&buf, 1));
        assert!(text(&buf, 9).starts_with("▄▄ 1 Primary"), "{}", text(&buf, 9));
        // The scale is the subtle tone, the grid the border.
        let r = theme.tokens();
        assert_eq!(buf[(0, 1)].fg, theme.color(r.subtle_foreground));
        assert_eq!(buf[(10, 1)].fg, theme.color(r.border));
    }

    #[test]
    fn five_series_stay_distinct_in_256_colors() {
        for accent in crate::ACCENTS {
            for light in [false, true] {
                let theme = Theme::xterm_256(accent.tokens(light));
                let series: Vec<_> = (0..5).map(|i| Series::new(format!("s{i}"), [1.0, 2.0])).collect();
                let chart = Chart::new(&theme, "x").series(series);
                let colors: Vec<_> = (0..5).map(|i| chart.color(i).fg).collect();
                for (i, a) in colors.iter().enumerate() {
                    for b in &colors[i + 1..] {
                        assert_ne!(a, b, "{colors:?}");
                    }
                }
            }
        }
    }

    #[test]
    fn missing_statistics_read_a_dash_and_an_empty_window_says_so() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 60, 10));
        Chart::new(&theme, "Memory").series([Series::new("Used", [None::<f64>, None])]).render(buf.area, &mut buf);
        let all: String = (0..10).map(|y| text(&buf, y)).collect();
        assert!(all.contains(EMPTY), "{all}");
        assert!(text(&buf, 9).contains("—"), "{}", text(&buf, 9));
    }

    #[test]
    fn a_short_area_keeps_the_plot() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 6));
        chart(&theme).render(buf.area, &mut buf);
        // No room for a legend: caption, four plot rows, times.
        assert!(text(&buf, 5).contains("18:00"), "{}", text(&buf, 5));
        assert!(!(0..6).any(|y| text(&buf, y).contains("Primary")));
    }

    #[test]
    fn tiny_and_edge_areas_draw_without_panicking() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        for (w, h) in [(1, 1), (2, 1), (3, 2), (5, 3), (10, 4), (12, 20)] {
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            chart(&theme).render(buf.area, &mut buf);
            Chart::new(&theme, "x").series([Series::new("one", [3.0])]).render(buf.area, &mut buf);
            Chart::new(&theme, "x").render(buf.area, &mut buf);
        }
        let mut edge = Buffer::empty(Rect::new(65530, 0, 5, 5));
        chart(&theme).render(edge.area, &mut edge);
    }
}
