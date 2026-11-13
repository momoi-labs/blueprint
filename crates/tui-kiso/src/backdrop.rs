use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::widgets::Widget;

use crate::{blend, Theme};

/// What a [`Backdrop`] draws.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Canvas {
    /// A wash of `primary` from two corners. In 256 colors it draws
    /// nothing.
    #[default]
    Glow,
    /// The `background` alone: it draws nothing.
    Solid,
    /// `·`
    Dots,
    /// Lines of `│` and `─` that cross at `┼`.
    Grid,
    /// `+`
    Crosses,
    /// `╱`
    Stripes,
}

impl Canvas {
    /// Every canvas, in the order of the variants.
    pub const ALL: [Canvas; 6] =
        [Canvas::Glow, Canvas::Solid, Canvas::Dots, Canvas::Grid, Canvas::Crosses, Canvas::Stripes];

    /// The name in lowercase, for options and messages.
    pub fn name(self) -> &'static str {
        match self {
            Canvas::Glow => "glow",
            Canvas::Solid => "solid",
            Canvas::Dots => "dots",
            Canvas::Grid => "grid",
            Canvas::Crosses => "crosses",
            Canvas::Stripes => "stripes",
        }
    }
}

/// The background of a screen, under its cards: a wash of the accent or a
/// faint pattern. Draw it first, once for the screen. A glass
/// [`Card`](crate::Card) lets it show through.
#[derive(Clone, Copy, Debug)]
pub struct Backdrop<'a> {
    theme: &'a Theme,
    canvas: Canvas,
    strong: bool,
}

impl<'a> Backdrop<'a> {
    pub fn new(theme: &'a Theme, canvas: Canvas) -> Self {
        Self { theme, canvas, strong: false }
    }

    /// A stronger wash or pattern. The default is quiet.
    #[must_use]
    pub fn strong(mut self, strong: bool) -> Self {
        self.strong = strong;
        self
    }

    /// Takes the pattern out of `area`, so what is drawn there next is not
    /// read through dots or lines: each cell becomes a space in the
    /// default text color, and keeps its fill, so a glow stays.
    ///
    /// A [`Card`](crate::Card), an overlay and the rows of a
    /// [`Page`](crate::Page) do this for the cells they take, and for a
    /// mark of the pattern that touches them on the left or the right.
    /// For a row that spans the screen, such as a footer, pass the whole
    /// row and not only the columns of the text. Call it for a
    /// region of your own that sits on the backdrop with no card, such as
    /// a pane or a list, before you draw it.
    pub fn clear(area: Rect, buf: &mut Buffer) {
        for at in area.intersection(buf.area).positions() {
            buf[at].set_symbol(" ").set_fg(Color::Reset);
        }
    }

    /// Clears `area`, and the cell before and after each of its rows when
    /// that cell holds a mark of a pattern, so no dot touches the content.
    /// Other cells beside the area, such as a separator, stay.
    pub(crate) fn clear_with_edges(theme: &Theme, area: Rect, buf: &mut Buffer) {
        Self::clear(area, buf);
        let shown = area.intersection(buf.area);
        let before = shown.x.checked_sub(1).filter(|x| *x >= buf.area.x);
        let after = Some(shown.right()).filter(|x| *x < buf.area.right());
        let inks = [false, true].map(|strong| pattern_ink(theme, strong));
        for y in shown.top()..shown.bottom() {
            for x in [before, after].into_iter().flatten() {
                let cell = &mut buf[(x, y)];
                if matches!(cell.symbol(), "·" | "│" | "─" | "┼" | "+" | "╱") && inks.contains(&cell.fg) {
                    cell.set_symbol(" ").set_fg(Color::Reset);
                }
            }
        }
    }
}

/// The color of the marks of a pattern.
fn pattern_ink(theme: &Theme, strong: bool) -> Color {
    let r = theme.tokens();
    theme.color(blend(&[r.background, r.foreground], if strong { 0.3 } else { 0.13 }))
}

impl Widget for Backdrop<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let shown = area.intersection(buf.area);
        if self.canvas == Canvas::Glow {
            if !t.is_truecolor() || area.is_empty() {
                return;
            }
            // The wash ends after 40 rows, so a long page keeps one tone.
            let (w, h) = (f32::from(area.width), f32::from(area.height.min(40)));
            let most = if self.strong { 0.4 } else { 0.22 };
            for at in shown.positions() {
                let (x, y) = (f32::from(at.x - area.x), f32::from(at.y - area.y).min(h));
                let far = ((x / w * 0.65 + y / h * 0.35) - 0.5).abs() * 2.0;
                buf[at].set_bg(t.color(blend(&[r.background, r.primary], most * far)));
            }
            return;
        }
        let style = ratatui::style::Style::new().fg(pattern_ink(t, self.strong));
        for at in shown.positions() {
            let (x, y) = (at.x - area.x, at.y - area.y);
            let symbol = match self.canvas {
                Canvas::Dots if x % 4 == 0 && y % 2 == 0 => "·",
                Canvas::Grid => match (x % 8 == 0, y % 4 == 0) {
                    (true, true) => "┼",
                    (true, false) => "│",
                    (false, true) => "─",
                    _ => continue,
                },
                Canvas::Crosses if y % 3 == 0 && (x + y / 3 % 2 * 4) % 8 == 0 => "+",
                Canvas::Stripes if (x + y) % 4 == 0 => "╱",
                _ => continue,
            };
            buf[at].set_symbol(symbol).set_style(style);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_glow_needs_truecolor_and_dots_do_not() {
        let area = Rect::new(0, 0, 8, 4);
        let mut buf = Buffer::empty(area);
        Backdrop::new(&Theme::xterm_256(kiso_tokens::GOLD_DARK), Canvas::Glow).render(area, &mut buf);
        assert_eq!(buf[(0, 0)].bg, Color::Reset);
        Backdrop::new(&Theme::truecolor(kiso_tokens::GOLD_DARK), Canvas::Glow).render(area, &mut buf);
        assert_ne!(buf[(0, 0)].bg, Color::Reset);
        Backdrop::new(&Theme::xterm_256(kiso_tokens::GOLD_DARK), Canvas::Dots).render(area, &mut buf);
        assert_eq!(buf[(4, 2)].symbol(), "·");
    }

    #[test]
    fn clear_takes_the_pattern_and_keeps_the_glow() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let area = Rect::new(0, 0, 8, 4);
        let mut buf = Buffer::empty(area);
        Backdrop::new(&theme, Canvas::Glow).render(area, &mut buf);
        Backdrop::new(&theme, Canvas::Dots).render(area, &mut buf);
        let glow = buf[(4, 2)].bg;
        Backdrop::clear(Rect::new(0, 2, 8, 9), &mut buf);
        assert_eq!((buf[(4, 2)].symbol(), buf[(4, 2)].fg, buf[(4, 2)].bg), (" ", Color::Reset, glow));
        assert_eq!(buf[(4, 0)].symbol(), "·");
    }

    #[test]
    fn no_mark_of_the_pattern_touches_a_cleared_area() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 13, 3));
        Backdrop::new(&theme, Canvas::Dots).render(buf.area, &mut buf);
        // A separator beside the area is not a mark of the pattern.
        buf[(8, 2)].set_symbol("│").set_fg(Color::Red);
        Backdrop::clear_with_edges(&theme, Rect::new(1, 0, 3, 1), &mut buf);
        Backdrop::clear_with_edges(&theme, Rect::new(5, 2, 3, 1), &mut buf);
        let row = |y: u16| (0..13).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>();
        assert_eq!([row(0), row(2)], ["        ·   ·", "·       │   ·"]);
        Backdrop::clear_with_edges(&theme, Rect::new(0, 0, 13, 9), &mut buf);
    }
}
