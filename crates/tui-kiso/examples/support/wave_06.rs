//! The pages of the data visualization wave: Diagram, TimeRangeControl and
//! the dashboard that puts the data components on a grid of cards.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{
    Badge, BarGauge, Card, Chart, ChartLegend, Diagram, DiagramNode, Grid, Meter, Series, Size, Sparkline, Stat, Theme,
    TimeRangeControl, Tone,
};

use super::{caption, put, wave};

/// The windows of time the control offers.
pub const RANGES: [&str; 5] = ["15m", "1h", "6h", "24h", "7d"];

/// The path from a client to the databases.
fn topology(t: &Theme) -> Diagram<'_> {
    Diagram::new(t)
        .node(DiagramNode::new("app", "Client", 0, 0))
        .node(DiagramNode::new("pool", "Pooler", 1, 0).detail("pgbouncer"))
        .node(DiagramNode::new("pri", "Primary", 2, 0).detail("eu-west"))
        .node(DiagramNode::new("rep", "Replica", 2, 1).detail("eu-west"))
        .node(DiagramNode::new("arc", "Archive", 3, 1).detail("object store"))
        .edge("app", "pool")
        .edge("pool", "pri")
        .edge("pool", "rep")
        .edge("rep", "arc")
}

pub fn diagram_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "By layer and row. The selected node and its edges take the accent.");
    let diagram = topology(t).selected("pool");
    let (width, height) = diagram.size();
    diagram.render(Rect::new(area.x, area.y.saturating_add(2), width, height).intersection(area), buf);
    let y = 3 + height;
    caption(t, buf, area, y, "At 44 columns, a node that does not fit is left out, edges too.");
    let plain = topology(t);
    plain.render(Rect::new(area.x, area.y.saturating_add(y + 2), 44, height).intersection(area), buf);
}

pub fn time_range_page(t: &Theme, buf: &mut Buffer, area: Rect, chosen: usize) {
    caption(t, buf, area, 0, "Left and right move the choice. Press enter to focus the page.");
    let control = TimeRangeControl::new(t, RANGES, chosen);
    let at = |dy: u16, width: u16| Rect::new(area.x, area.y.saturating_add(dy), width, 1).intersection(area);
    control.clone().render(at(2, control.width()), buf);
    caption(t, buf, area, 4, "Every choice");
    for i in 0..RANGES.len() {
        let control = TimeRangeControl::new(t, RANGES, i);
        control.clone().render(at(5 + i as u16 * 2, control.width()), buf);
    }
    caption(t, buf, area, 16, "At 13 and 9 columns, the far presets drop; the choice stays");
    TimeRangeControl::new(t, RANGES, 2).render(at(17, 13), buf);
    TimeRangeControl::new(t, RANGES, 4).render(at(19, 9), buf);
    caption(t, buf, area, 21, "On a card");
    let card = Rect::new(area.x, area.y.saturating_add(22), 30, 3).intersection(area);
    if card.height == 3 {
        Card::new(t).size(Size::Sm).render(card, buf);
        TimeRangeControl::new(t, RANGES, chosen).render(Rect { x: card.x + 1, y: card.y + 1, width: 28, height: 1 }, buf);
    }
}

/// Labels under the plot for each window.
fn window(chosen: usize) -> [&'static str; 3] {
    [["18:45", "18:52", "19:00"], ["18:00", "18:30", "19:00"], ["13:00", "16:00", "19:00"], ["19:00", "07:00", "19:00"], ["Mon", "Thu", "Sun"]]
        [chosen.min(RANGES.len() - 1)]
}

/// Stats, a chart, meters and a gauge on the cards of a grid.
pub fn dashboard_page(t: &Theme, buf: &mut Buffer, area: Rect, chosen: usize) {
    let chosen = chosen.min(RANGES.len() - 1);
    let bottom = area.bottom().min(buf.area.bottom());
    let fits = |cell: Rect| cell.right() <= area.right() && cell.bottom() <= bottom;
    let mut grid = Grid::new(area);
    let (tracks, half) = (grid.tracks(), grid.tracks().div_ceil(2));
    let shift = chosen as f64 * 1.7;

    let head = grid.line(1);
    let control = TimeRangeControl::new(t, RANGES, chosen);
    let control_area = Rect::new(head.right().saturating_sub(control.width()), head.y, control.width(), 1);
    put(buf, head.intersection(area), 0, Line::from(Span::styled("Database overview", t.strong())));
    if head.width >= control.width() + 22 {
        if fits(control_area) {
            control.render(control_area, buf);
        }
    } else {
        let below = Rect { width: control.width(), ..grid.line(1) };
        if fits(below) {
            control.render(below, buf);
        }
    }
    grid.skip(1);

    let queries = Stat::new(t, "Queries/s", "1,284")
        .delta(Badge::new(t, Tone::Success, "+4.2%"))
        .trend(Sparkline::new(t, wave(40, 60.0, 20.0, shift)).primary(true))
        .note("vs the window before");
    let latency = Stat::new(t, "Latency p95", "38 ms")
        .delta(Badge::new(t, Tone::Danger, "+12%"))
        .trend(Sparkline::new(t, wave(40, 40.0, 14.0, 2.0 + shift)))
        .note("vs the window before");
    for stat in [queries, latency] {
        let cell = grid.cell(half, stat.height());
        if fits(cell) {
            stat.render(cell, buf);
        }
    }

    let cell = grid.cell(tracks, 10);
    if fits(cell) {
        let card = Card::new(t).size(Size::Sm);
        card.render(cell, buf);
        Chart::new(t, "CPU by machine (%)")
            .meta(format!("last {}", RANGES[chosen]))
            .series([
                Series::new("pg-main-1", wave(60, 55.0, 20.0, shift)),
                Series::new("pg-replica", wave(60, 30.0, 12.0, 2.0 + shift)),
            ])
            .times(window(chosen))
            .range(0.0, 100.0)
            .legend(ChartLegend::Inline)
            .indent(0)
            .format(|v| format!("{v:.0}"))
            .render(card.inner(cell), buf);
    }

    let cell = grid.cell(half, 6);
    if fits(cell) {
        let card = Card::new(t).size(Size::Sm);
        card.render(cell, buf);
        let inner = card.inner(cell);
        put(buf, inner, 0, Line::styled("Capacity (%)", t.muted()));
        let meters = [
            Meter::new(t, "Clients", 64.0).value_text("64"),
            Meter::new(t, "Memory", 78.0).value_text("78"),
            Meter::new(t, "Disk", 93.0).value_text("93"),
        ];
        for (i, meter) in meters.into_iter().enumerate() {
            let row = Rect { y: inner.y + 1 + i as u16, height: 1, ..inner };
            put(buf, row, 0, meter.thresholds(70.0, 90.0).indent(0).label_width(11).line(usize::from(inner.width)));
        }
    }

    let cell = grid.cell(half, 6);
    if fits(cell) {
        let card = Card::new(t).size(Size::Sm);
        card.render(cell, buf);
        let inner = card.inner(cell);
        let gauge = BarGauge::new(t, "Disk used (GiB)", 512.0)
            .row("main-1", 412.0)
            .row("main-2", 505.0)
            .row("replica", 96.0)
            .thresholds(400.0, 480.0)
            .indent(0)
            .format(|v| format!("{v:.0}"));
        for (i, line) in gauge.lines(usize::from(inner.width)).into_iter().enumerate().take(usize::from(inner.height)) {
            put(buf, Rect { y: inner.y + i as u16, height: 1, ..inner }, 0, line);
        }
    }
}
