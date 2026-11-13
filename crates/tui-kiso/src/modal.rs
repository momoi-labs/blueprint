use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Rect};
use ratatui::text::Text;
use ratatui::widgets::{Paragraph, Widget};

use crate::overlay::Panel;
use crate::{Button, Grid, Scrim, Size, Theme};

/// A dialog over a page, for help, questions, pickers and short forms. The
/// web's Dialog is the same component.
///
/// It dims the screen with a [`Scrim`], then sits in the middle on the
/// overlay surface: an opaque `popover` fill with half a row above and
/// below, square corners and no line. A bold title on top, the body, then a
/// footer with the key hints on the left and the [`Button`]s against the
/// right edge, the primary one last. Three columns of padding at the sides.
///
/// Its width is whole grid tracks: `Sm` is 3, `Md` 4 and `Lg` 6. Without a
/// size it takes the fewest of those that hold its content. It keeps two
/// columns from each side of the screen, and a row from the top and the
/// bottom while its content fits. On a short screen it gives up those two
/// rows first, so a body of 18 rows fits in 24 with a title and key hints.
/// Esc closes it: say so in the hints.
///
/// Render it into the whole screen. For content of your own, take the area
/// of the body from [`Modal::draw`].
#[derive(Clone, Debug)]
pub struct Modal<'a> {
    theme: &'a Theme,
    panel: Panel<'a>,
    body: Text<'a>,
    size: Option<Size>,
    width: Option<u16>,
    height: Option<u16>,
}

impl<'a> Modal<'a> {
    /// The columns between the edge of the surface and the content.
    const PAD: u16 = 3;

    /// A modal with a title.
    pub fn new(theme: &'a Theme, title: impl Into<String>) -> Self {
        let panel = Panel { title: title.into(), ..Panel::default() };
        Self { theme, panel, body: Text::default(), size: None, width: None, height: None }
    }

    /// The content, one line per row.
    pub fn body(mut self, body: impl Into<Text<'a>>) -> Self {
        self.body = body.into();
        self
    }

    /// Key hints for the footer, as `(key, label)` pairs.
    pub fn hints(mut self, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        self.panel.hints = hints.into_iter().collect();
        self
    }

    /// The buttons of the footer, the primary one last. Give the one with
    /// focus [`ButtonState::Focus`](crate::ButtonState::Focus).
    #[must_use]
    pub fn actions(mut self, buttons: impl IntoIterator<Item = Button<'a>>) -> Self {
        self.panel.buttons = buttons.into_iter().collect();
        self
    }

    /// The width in grid tracks: `Sm` 3, `Md` 4, `Lg` 6.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = Some(size);
        self
    }

    /// A fixed outer width, in place of a size.
    pub fn width(mut self, width: u16) -> Self {
        self.width = Some(width);
        self
    }

    /// A fixed outer height. By default the modal fits its content.
    pub fn height(mut self, height: u16) -> Self {
        self.height = Some(height);
        self
    }

    /// The tracks of a size.
    fn tracks(size: Size) -> u16 {
        match size {
            Size::Sm => 3,
            Size::Md => 4,
            Size::Lg => 6,
        }
    }

    /// The area the modal takes on `screen`.
    pub fn area(&self, screen: Rect) -> Rect {
        // Sizes are worked out in usize and clamped, so a huge body cannot
        // overflow a u16.
        let clamp = |n: usize| n.min(usize::from(u16::MAX)) as u16;
        let pad = usize::from(Self::PAD) * 2;
        let width = self.width.unwrap_or_else(|| match self.size {
            Some(size) => Grid::span(Self::tracks(size)),
            None => {
                let content = clamp(self.body.width().max(self.panel.width(self.theme)).saturating_add(pad));
                [Size::Sm, Size::Md, Size::Lg].map(|size| Grid::span(Self::tracks(size))).into_iter().find(|w| *w >= content).unwrap_or(content)
            }
        });
        let width = width.min(screen.width.saturating_sub(4));
        let inner = width.saturating_sub(Self::PAD * 2);
        let height = self.height.unwrap_or_else(|| clamp(self.body.height()).saturating_add(self.panel.chrome(self.theme, inner)));
        // The margin gives before the body does.
        let height = height.min(screen.height);
        screen.centered(Constraint::Length(width), Constraint::Length(height))
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

impl Widget for Modal<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        self.draw(screen, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ButtonState, ButtonVariant};

    #[test]
    fn a_tall_body_takes_the_margin_of_a_short_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 80, 24);
        let body = |rows: usize| Text::from(vec![ratatui::text::Line::raw("x"); rows]);
        let modal = |rows| Modal::new(&theme, "Help").body(body(rows)).hints([("esc", "close")]);
        // 16 rows of body keep a row of the page above and below.
        assert_eq!((modal(16).area(screen).y, modal(16).area(screen).height), (1, 22));
        // 18 rows take the whole height, and all of them show.
        assert_eq!(modal(18).area(screen).height, 24);
        assert_eq!(modal(18).draw(screen, &mut Buffer::empty(screen)).height, 18);
        assert_eq!(modal(40).draw(screen, &mut Buffer::empty(screen)).height, 18);
    }

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_title_body_and_keys_sit_on_the_surface() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 60, 12);
        let mut buf = Buffer::empty(screen);
        let modal = Modal::new(&theme, "Help").body("q  Quit").hints([("esc", "close")]);
        let area = modal.area(screen);
        assert_eq!((area.width, area.height), (Grid::span(3), 7));
        let body = modal.draw(screen, &mut buf);
        assert_eq!(row(&buf, area.y), format!("{:9}{}{:8}", "", "▄".repeat(43), ""));
        assert!(row(&buf, area.y + 1).contains("Help"));
        assert_eq!((body.y, body.height), (area.y + 3, 1));
        assert_eq!(buf[(body.x, body.y)].symbol(), "q");
        assert!(row(&buf, area.y + 5).contains("esc close"));
        assert_eq!(buf[(body.x, body.y)].bg, theme.color(theme.tokens().popover));
    }

    #[test]
    fn sizes_take_whole_tracks_and_keep_a_margin() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 120, 40);
        let width = |size| Modal::new(&theme, "T").size(size).area(screen).width;
        assert_eq!([Size::Sm, Size::Md, Size::Lg].map(width), [43, 58, 88]);
        let small = Rect::new(0, 0, 60, 10);
        let area = Modal::new(&theme, "T").size(Size::Lg).height(40).area(small);
        // Too tall for the screen: the side margin stays, the rows go.
        assert_eq!((area.x, area.width, area.y, area.height), (2, 56, 0, 10));
    }

    #[test]
    fn the_buttons_sit_against_the_right_edge() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 60, 14);
        let mut buf = Buffer::empty(screen);
        let buttons = [Button::new(&theme, "Cancel"), Button::new(&theme, "Save").variant(ButtonVariant::Primary).state(ButtonState::Focus)];
        let modal = Modal::new(&theme, "Rename").body("Name").size(Size::Sm).actions(buttons).hints([("esc", "cancel")]);
        let area = modal.area(screen);
        modal.draw(screen, &mut buf);
        let middle = row(&buf, area.bottom() - 3);
        assert!(middle.contains("esc cancel") && middle.trim_end().ends_with("Save  ▌"), "{middle}");
    }

    #[test]
    fn any_screen_size_draws_without_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        for (w, h) in [(0, 0), (1, 1), (5, 3), (20, 5), (80, 24)] {
            let screen = Rect::new(0, 0, w, h);
            let modal = Modal::new(&theme, "A long title for a small screen").body("x").actions([Button::new(&theme, "OK")]);
            modal.draw(screen, &mut Buffer::empty(screen));
        }
    }
}
