use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Text;
use ratatui::widgets::{Paragraph, Widget};

use crate::overlay::Panel;
use crate::{Button, Grid, Scrim, Side, Theme};

/// A panel that slides over the page from one edge, for the details of a
/// record or a short form, while the page stays in place behind it.
///
/// It is the overlay surface the full height of the screen, 3 or 4 grid
/// tracks wide, against the right edge or the left one, over a [`Scrim`]:
/// a bold title, the body, then a footer with the key hints and the
/// [`Button`]s. Unlike the [`Sidebar`](crate::Sidebar), it is temporary: it
/// covers the page and esc closes it. A screen narrower than 3 tracks gives
/// it the whole width.
///
/// Render it into the whole screen. For content of your own, take the area
/// of the body from [`Drawer::draw`].
#[derive(Clone, Debug)]
pub struct Drawer<'a> {
    theme: &'a Theme,
    panel: Panel<'a>,
    body: Text<'a>,
    side: Side,
    tracks: u16,
}

impl<'a> Drawer<'a> {
    /// The columns between the edge of the surface and the content.
    const PAD: u16 = 2;

    /// A drawer with a title, 3 tracks wide on the right.
    pub fn new(theme: &'a Theme, title: impl Into<String>) -> Self {
        let panel = Panel { title: title.into(), ..Panel::default() };
        Self { theme, panel, body: Text::default(), side: Side::Right, tracks: 3 }
    }

    /// The content, one line per row.
    #[must_use]
    pub fn body(mut self, body: impl Into<Text<'a>>) -> Self {
        self.body = body.into();
        self
    }

    /// Key hints for the footer, as `(key, label)` pairs.
    #[must_use]
    pub fn hints(mut self, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        self.panel.hints = hints.into_iter().collect();
        self
    }

    /// The buttons of the footer, the primary one last.
    #[must_use]
    pub fn actions(mut self, buttons: impl IntoIterator<Item = Button<'a>>) -> Self {
        self.panel.buttons = buttons.into_iter().collect();
        self
    }

    /// The edge it slides from. Right by default.
    #[must_use]
    pub fn side(mut self, side: Side) -> Self {
        self.side = side;
        self
    }

    /// The width in grid tracks, 3 or 4. 3 by default.
    #[must_use]
    pub fn tracks(mut self, tracks: u16) -> Self {
        self.tracks = tracks.clamp(3, 4);
        self
    }

    /// The area the drawer takes on `screen`.
    pub fn area(&self, screen: Rect) -> Rect {
        let width = if screen.width < Grid::span(Grid::MIN) { screen.width } else { Grid::span(self.tracks).min(screen.width) };
        let x = match self.side {
            Side::Left => screen.x,
            Side::Right => screen.right() - width,
        };
        Rect { x, width, ..screen }
    }

    /// Dims the screen, draws the surface, the title, the footer and the
    /// body, and returns the area of the body.
    pub fn draw(self, screen: Rect, buf: &mut Buffer) -> Rect {
        let t = self.theme;
        let screen = screen.intersection(buf.area);
        Scrim::new(t).render(screen, buf);
        let area = self.area(screen);
        if area.is_empty() {
            return area;
        }
        let body = self.panel.draw(t, buf, area, Self::PAD);
        Paragraph::new(self.body).style(t.text()).render(body, buf);
        body
    }
}

impl Widget for Drawer<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        self.draw(screen, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_takes_the_full_height_at_an_edge() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 100, 30);
        assert_eq!(Drawer::new(&theme, "T").area(screen), Rect::new(57, 0, 43, 30));
        assert_eq!(Drawer::new(&theme, "T").tracks(4).side(Side::Left).area(screen), Rect::new(0, 0, 58, 30));
        assert_eq!(Drawer::new(&theme, "T").area(Rect::new(0, 0, 40, 10)), Rect::new(0, 0, 40, 10));
    }

    #[test]
    fn the_title_and_body_sit_inside_and_the_page_dims() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 12);
        let mut buf = Buffer::empty(screen);
        buf.set_string(0, 5, "page", theme.text());
        let body = Drawer::new(&theme, "pg-main-2").body("Running").hints([("esc", "close")]).draw(screen, &mut buf);
        assert_eq!((body.x, body.y), (39, 3));
        assert_eq!(buf[(39, 1)].symbol(), "p");
        assert_eq!(buf[(39, 3)].symbol(), "R");
        assert_ne!(buf[(0, 5)].fg, theme.text().fg.unwrap());
        for size in 0..5 {
            let tiny = Rect::new(0, 0, size * 3, size);
            Drawer::new(&theme, "T").body("x").actions([Button::new(&theme, "OK")]).draw(tiny, &mut Buffer::empty(tiny));
        }
    }
}
