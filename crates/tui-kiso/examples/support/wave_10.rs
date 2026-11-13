//! The pages of the rest: the accent selector and the brand mark. The theme
//! picker draws itself, so its page is in `gallery.rs`.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{AccentSelector, BrandMark, Header, Theme, ACCENTS};

use super::{caption, inside, put};

pub fn accent_selector_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Focus bars mark the current accent. Left and right move it.");
    let width = AccentSelector::width();
    let rows = [(0, "First", false), (5, "Fifth", false), (ACCENTS.len() - 1, "Last", false), (2, "Light swatches", true)];
    for (i, (selected, label, light)) in rows.into_iter().enumerate() {
        let dy = 2 + i as u16 * 3;
        put(buf, area, dy, Line::styled(label, t.muted()));
        if let Some(rect) = inside(area, 0, dy + 1, width, 1) {
            AccentSelector::new(t, selected).light(light).render(rect, buf);
        }
    }
    let name = ACCENTS[5].name;
    put(buf, area, 15, Line::from(vec![Span::styled("Current: ", t.muted()), Span::styled(name, t.strong())]));
}

pub fn brand_mark_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Text only: plain accent text, or the name on the accent fill.");
    let marks = [
        ("Plain", BrandMark::new(t, "tui-kiso")),
        ("Plain with a glyph", BrandMark::new(t, "tui-kiso").glyph("◆")),
        ("Filled", BrandMark::new(t, "tui-kiso").filled(true)),
        ("Filled with a glyph", BrandMark::new(t, "tui-kiso").glyph("◆").filled(true)),
    ];
    for (i, (label, mark)) in marks.into_iter().enumerate() {
        let dy = 2 + i as u16 * 2;
        put(buf, area, dy, Line::styled(label, t.muted()));
        if let Some(rect) = inside(area, 24, dy, mark.width(), 1) {
            mark.render(rect, buf);
        }
    }
    put(buf, area, 11, Line::styled("The Header uses the filled form", t.muted()));
    if let Some(rect) = inside(area, 0, 12, area.width.min(60), 1) {
        Header::new(t, "tui-kiso", "0.1.0").title("Machines").render(rect, buf);
    }
}
