//! The overlay layer that every dialog, drawer, popover and menu shares: a
//! [`Scrim`] that dims the screen behind, and an opaque `popover` surface
//! with half a row above and below, as a [`Card`], that owns every cell it
//! covers.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Paragraph, Widget};

use crate::surface::{over, write};
use crate::text::{cells, take_cells};
use crate::{blend, Button, Card, CardVariant, FormActions, Grid, KeyHints, Look, PanelFill, Theme};

/// Dims the screen behind a dialog, so the dialog reads as the one thing
/// to act on. Each cell keeps its glyph. In truecolor its text and its fill
/// blend toward `background`; in 256 colors, where a blend would band, the
/// text turns `subtle-foreground` and the fill stays.
///
/// [`Modal`](crate::Modal), [`Drawer`](crate::Drawer),
/// [`CommandPalette`](crate::CommandPalette), [`Question`](crate::Question)
/// and the theme picker draw it themselves. Draw it once, over the whole
/// screen, before an overlay of your own; draw nothing between it and the
/// overlay.
#[derive(Clone, Copy, Debug)]
pub struct Scrim<'a> {
    theme: &'a Theme,
}

impl<'a> Scrim<'a> {
    /// How far each cell moves toward `background` in truecolor.
    pub const STRENGTH: f32 = 0.6;

    pub fn new(theme: &'a Theme) -> Self {
        Self { theme }
    }
}

impl Widget for Scrim<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let area = area.intersection(buf.area);
        if !t.is_truecolor() {
            let subtle = t.color(r.subtle_foreground);
            for at in area.positions() {
                buf[at].set_fg(subtle).modifier.remove(Modifier::BOLD);
            }
            return;
        }
        for at in area.positions() {
            let bg = buf[at].bg;
            // A cell with no fill shows the terminal's background, which is
            // already where the blend goes.
            if matches!(bg, Color::Rgb(..)) {
                let dimmed = over(t, buf, at.x, at.y, r.background, Self::STRENGTH);
                buf[at].set_bg(dimmed);
            }
            let fg = match buf[at].fg {
                Color::Rgb(red, green, blue) => [red, green, blue],
                _ => r.foreground,
            };
            let cell = &mut buf[at];
            cell.set_fg(t.color(blend(&[fg, r.background], Self::STRENGTH)));
            cell.modifier.remove(Modifier::BOLD);
        }
    }
}

/// The surface of an overlay over `area`: a `popover` card with a solid
/// fill, whatever the look's fill. Every cell of `area` loses what the page
/// drew in it, so no text, mark or style shows through; the half rows keep
/// only the color under them.
pub(crate) fn surface(theme: &Theme, buf: &mut Buffer, area: Rect) {
    for at in area.intersection(buf.area).positions() {
        let bg = buf[at].bg;
        buf[at].reset();
        buf[at].set_bg(bg);
    }
    let solid = theme.with_look(Look { fill: PanelFill::Solid, ..theme.look() });
    Card::new(&solid).variant(CardVariant::Elevated).render(area, buf);
}

/// Where an overlay `width` by `height` goes next to `anchor`: under it,
/// or above it when there is no room below, or on the side with more room,
/// cut to fit. It starts at the anchor's left edge and shifts left to stay
/// on screen.
pub(crate) fn place(screen: Rect, anchor: Rect, width: u16, height: u16) -> Rect {
    let width = width.min(screen.width);
    let below = screen.bottom().saturating_sub(anchor.bottom());
    let above = anchor.y.saturating_sub(screen.y);
    let (y, height) = if height <= below {
        (anchor.bottom(), height)
    } else if height <= above {
        (anchor.y - height, height)
    } else if below >= above {
        (anchor.bottom(), below)
    } else {
        (screen.y, above)
    };
    let x = anchor.x.min(screen.right().saturating_sub(width)).max(screen.x);
    Rect::new(x, y, width, height).intersection(screen)
}

/// The parts of a [`Modal`](crate::Modal) or a [`Drawer`](crate::Drawer):
/// a bold title, the body, and a footer with key hints on the left and the
/// buttons against the right edge.
#[derive(Clone, Debug, Default)]
pub(crate) struct Panel<'a> {
    pub title: String,
    pub hints: Vec<(&'a str, &'a str)>,
    pub buttons: Vec<Button<'a>>,
}

impl<'a> Panel<'a> {
    /// The rows of the footer at `width`, with the empty row above it.
    fn footer(&self, theme: &'a Theme, width: u16) -> u16 {
        if self.in_row(width) {
            4
        } else if !self.buttons.is_empty() {
            self.actions(theme).height(width).saturating_add(1)
        } else if !self.hints.is_empty() {
            2
        } else {
            0
        }
    }

    /// True when the buttons fit in one row at `width`. [`FormActions`]
    /// stacks them under three tracks, the width of a narrow screen; on a
    /// surface that narrow they still go in a row when they fit.
    fn in_row(&self, width: u16) -> bool {
        let gaps = self.buttons.len().saturating_sub(1) * 2;
        let row = self.buttons.iter().map(|b| usize::from(b.width())).sum::<usize>() + gaps;
        !self.buttons.is_empty() && row + 2 <= usize::from(width)
    }

    fn actions(&self, theme: &'a Theme) -> FormActions<'a> {
        FormActions::new(theme, self.buttons.iter().cloned())
    }

    /// The rows around the body at `width`, the inner width: the half rows,
    /// the title and its empty row, and the footer.
    pub fn chrome(&self, theme: &'a Theme, width: u16) -> u16 {
        4 + self.footer(theme, width)
    }

    /// The columns the title, the hints and the buttons need.
    pub fn width(&self, theme: &'a Theme) -> usize {
        let hints: usize = KeyHints::new(theme, self.hints.iter().copied()).spans(usize::MAX).iter().map(Span::width).sum();
        let buttons: usize = self.buttons.iter().map(|b| usize::from(b.width()) + 2).sum();
        let footer = if hints > 0 && buttons > 0 { hints + 2 + buttons } else { hints.max(buttons) };
        (cells(&self.title) + 2).max(footer)
    }

    /// Draws the surface over `area` with `pad` columns at the sides, and
    /// returns the area of the body.
    pub fn draw(&self, theme: &'a Theme, buf: &mut Buffer, area: Rect, pad: u16) -> Rect {
        let t = theme;
        surface(t, buf, area);
        if area.height < 3 {
            return Rect::new(area.x, area.y, 0, 0);
        }
        let inner = Rect {
            x: area.x.saturating_add(pad),
            y: area.y + 1,
            width: area.width.saturating_sub(pad.saturating_mul(2)),
            height: area.height - 2,
        };
        let (title, _) = take_cells(&self.title, usize::from(inner.width));
        write(buf, inner.x, inner.y, title, t.strong());

        // The footer keeps its rows on a short screen; the body gives first.
        let footer = self.footer(t, inner.width).min(inner.height.saturating_sub(1));
        let bottom = inner.bottom().saturating_sub(footer.saturating_sub(1));
        if footer > 1 {
            let mut room = usize::from(inner.width);
            let mut hints_y = inner.bottom() - 1;
            if !self.buttons.is_empty() {
                let actions = self.actions(t);
                let stacked = !self.in_row(inner.width);
                let rows = if stacked { actions.height(inner.width) } else { 3 };
                let top = inner.bottom().saturating_sub(rows).max(bottom);
                let height = inner.bottom() - top;
                if stacked {
                    actions.render(Rect::new(inner.x, top, inner.width, height), buf);
                } else {
                    // A row three tracks wide that ends on the padding, so the
                    // last focus bar takes the cell after the content. Only
                    // the buttons draw, against its right edge.
                    let end = inner.right().saturating_add(1);
                    let width = Grid::span(Grid::MIN).max(inner.width + 1).min(end);
                    actions.render(Rect::new(end - width, top, width, height), buf);
                }
                // The hints share the middle row of a row of buttons.
                let used: usize = self.buttons.iter().map(|b| usize::from(b.width()) + 2).sum();
                room = if stacked { 0 } else { room.saturating_sub(used + 2) };
                hints_y = top.saturating_add(1);
            }
            if room > 0 && hints_y < inner.bottom() {
                let spans = KeyHints::new(t, self.hints.iter().copied()).spans(room);
                buf.set_line(inner.x, hints_y, &Line::from(spans), room as u16);
            }
        }
        let top = inner.y.saturating_add(2);
        let end = bottom.saturating_sub(u16::from(footer > 1));
        Rect::new(inner.x, top.min(end), inner.width, end.saturating_sub(top))
    }
}

/// Content that opens next to what it is about, such as the details of a
/// value or a short form. It sits on the overlay surface, under its
/// `anchor` or above it when there is no room below, and shifts left to stay
/// on screen. It does not dim the page: it is light, and esc or a move
/// away closes it.
///
/// Render it with the whole screen as its area, after the page. For content
/// of your own, take the inside from [`Popover::draw`].
#[derive(Clone, Debug)]
pub struct Popover<'a> {
    theme: &'a Theme,
    anchor: Rect,
    title: Option<String>,
    body: Text<'a>,
    width: Option<u16>,
    height: Option<u16>,
}

impl<'a> Popover<'a> {
    /// A popover for `anchor`, the thing it is about on screen.
    pub fn new(theme: &'a Theme, anchor: Rect) -> Self {
        Self { theme, anchor, title: None, body: Text::default(), width: None, height: None }
    }

    /// A bold title over the body.
    #[must_use]
    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// The content, one line per row.
    #[must_use]
    pub fn body(mut self, body: impl Into<Text<'a>>) -> Self {
        self.body = body.into();
        self
    }

    /// A fixed outer width. By default the popover fits its content.
    #[must_use]
    pub fn width(mut self, width: u16) -> Self {
        self.width = Some(width);
        self
    }

    /// A fixed outer height. By default the popover fits its content.
    #[must_use]
    pub fn height(mut self, height: u16) -> Self {
        self.height = Some(height);
        self
    }

    /// The area the popover takes on `screen`.
    pub fn area(&self, screen: Rect) -> Rect {
        let clamp = |n: usize| n.min(usize::from(u16::MAX)) as u16;
        let title = self.title.as_deref().map_or(0, cells);
        let width = self.width.unwrap_or_else(|| clamp(self.body.width().max(title).saturating_add(4)));
        let rows = self.body.height() + if self.title.is_some() { 2 } else { 0 };
        let height = self.height.unwrap_or_else(|| clamp(rows.saturating_add(2)));
        place(screen, self.anchor, width, height)
    }

    /// Draws the surface, the title and the body, and returns the area of
    /// the body.
    pub fn draw(self, screen: Rect, buf: &mut Buffer) -> Rect {
        let t = self.theme;
        let area = self.area(screen.intersection(buf.area));
        if area.is_empty() {
            return area;
        }
        surface(t, buf, area);
        let mut inner = Card::new(t).inner(area);
        if let Some(title) = &self.title {
            if inner.height > 0 {
                write(buf, inner.x, inner.y, take_cells(title, usize::from(inner.width)).0, t.strong());
            }
            let skip = inner.height.min(2);
            inner = Rect { y: inner.y + skip, height: inner.height - skip, ..inner };
        }
        Paragraph::new(self.body).style(t.text()).render(inner, buf);
        inner
    }
}

impl Widget for Popover<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        self.draw(screen, buf);
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Style;

    use super::*;

    #[test]
    fn the_scrim_keeps_the_glyphs_and_dims_the_colors() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 1));
        write(&mut buf, 0, 0, "ab", theme.fill(theme.tokens().primary_foreground, theme.tokens().primary));
        let before = buf.clone();
        Scrim::new(&theme).render(buf.area, &mut buf);
        assert_eq!(buf[(0, 0)].symbol(), "a");
        assert_ne!(buf[(0, 0)].bg, before[(0, 0)].bg);
        assert_ne!(buf[(0, 0)].fg, before[(0, 0)].fg);
        // A cell with no fill keeps the terminal's background.
        assert_eq!(buf[(3, 0)].bg, Color::Reset);

        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = before.clone();
        Scrim::new(&theme).render(buf.area, &mut buf);
        assert_eq!(buf[(0, 0)].fg, theme.subtle().fg.unwrap());
        assert_eq!(buf[(0, 0)].bg, before[(0, 0)].bg);
    }

    #[test]
    fn the_surface_owns_its_cells() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 4));
        buf.set_string(0, 1, "danger!!", Style::new().fg(Color::Red).add_modifier(Modifier::UNDERLINED));
        surface(&theme, &mut buf, Rect::new(1, 0, 6, 4));
        assert_eq!(buf[(0, 1)].symbol(), "d");
        assert_eq!(buf[(1, 0)].symbol(), "▄");
        assert_eq!(buf[(3, 1)].symbol(), " ");
        assert!(buf[(3, 1)].modifier.is_empty());
        assert_eq!(buf[(3, 1)].bg, theme.color(theme.tokens().popover));
    }

    #[test]
    fn a_popover_opens_below_flips_above_and_shifts_left() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 40, 12);
        let popover = |x, y| Popover::new(&theme, Rect::new(x, y, 6, 1)).body(vec![Line::raw("one"), Line::raw("two")]).width(20);
        assert_eq!(popover(2, 1).area(screen), Rect::new(2, 2, 20, 4));
        assert_eq!(popover(2, 10).area(screen), Rect::new(2, 6, 20, 4));
        assert_eq!(popover(35, 1).area(screen), Rect::new(20, 2, 20, 4));
        for size in 0..6 {
            let tiny = Rect::new(0, 0, size, size);
            popover(size, size).title("Title").render(tiny, &mut Buffer::empty(tiny));
        }
    }

    #[test]
    fn a_panel_keeps_its_footer_on_a_short_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let panel = Panel { title: "Delete".into(), hints: vec![("esc", "cancel")], buttons: vec![Button::new(&theme, "OK")] };
        for height in 0..12 {
            let area = Rect::new(0, 0, 50, height);
            let body = panel.draw(&theme, &mut Buffer::empty(area), area, 3);
            assert!(body.height <= height.saturating_sub(4), "{height}: {body:?}");
        }
        let area = Rect::new(0, 0, 50, 12);
        let mut buf = Buffer::empty(area);
        let body = panel.draw(&theme, &mut buf, area, 3);
        assert_eq!(body, Rect::new(3, 3, 44, 4));
        let row = |y: u16| (0..50).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>();
        assert!(row(1).contains("Delete"));
        assert!(row(9).contains("esc cancel") && row(9).contains("OK"), "{}", row(9));
    }
}
