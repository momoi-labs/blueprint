//! Fills and ends: the shapes the web gets from CSS. Every write checks the
//! buffer, so a widget drawn past the edge loses cells and does not panic.

use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::{Position, Rect};
use ratatui::style::{Color, Style};

use crate::text::cells;
use crate::{blend, Theme};

/// The color behind a cell: its fill, or the screen's.
pub(crate) fn under(theme: &Theme, buf: &Buffer, x: u16, y: u16) -> Rgb {
    match buf.cell((x, y)).map(|cell| cell.bg) {
        Some(Color::Rgb(r, g, b)) => [r, g, b],
        _ => theme.tokens().background,
    }
}

/// `color` over a cell at `alpha`. In 256 colors a blend would band, so the
/// color stays whole.
pub(crate) fn over(theme: &Theme, buf: &Buffer, x: u16, y: u16, color: Rgb, alpha: f32) -> Color {
    if theme.is_truecolor() {
        theme.color(blend(&[under(theme, buf, x, y), color], alpha))
    } else {
        theme.color(color)
    }
}

/// Fills `area` with `color` at `alpha` over what is there.
pub(crate) fn fill(theme: &Theme, buf: &mut Buffer, area: Rect, color: Rgb, alpha: f32) {
    for at in area.intersection(buf.area).positions() {
        let bg = over(theme, buf, at.x, at.y, color, alpha);
        buf[at].set_bg(bg);
    }
}

/// A mark in one cell. It keeps the fill of the cell.
pub(crate) fn put(buf: &mut Buffer, x: u16, y: u16, symbol: &str, fg: Color) {
    if let Some(cell) = buf.cell_mut((x, y)) {
        cell.set_symbol(symbol).set_fg(fg);
    }
}

/// Text from a cell, cut at the edge of the buffer. Returns its width.
pub(crate) fn write(buf: &mut Buffer, x: u16, y: u16, text: &str, style: Style) -> u16 {
    if buf.area.contains(Position { x, y }) {
        buf.set_stringn(x, y, text, usize::from(buf.area.right() - x), style);
    }
    cells(text) as u16
}

/// The end of a pill: a whole cell of `color`. With `Look::round`, a Nerd
/// Font half circle.
pub(crate) fn cap(theme: &Theme, buf: &mut Buffer, x: u16, y: u16, left: bool, color: Color) {
    let Some(cell) = buf.cell_mut((x, y)) else { return };
    if theme.look().round {
        cell.set_symbol(if left { "\u{e0b6}" } else { "\u{e0b4}" }).set_fg(color);
    } else {
        cell.set_symbol(" ").set_bg(color);
    }
}
