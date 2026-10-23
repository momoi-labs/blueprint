use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Rect};
use ratatui::style::Modifier;
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Block, BorderType, Clear, Padding, Paragraph, Widget};

use crate::text::cells;
use crate::{KeyHints, Theme};

/// A dialog over a page, for help, questions, pickers and short forms.
///
/// The one framed element on screen: a rounded `primary` frame on
/// `background`, with the title in the top border and the dialog's own key
/// hints in the bottom one. Two columns of padding at the sides, none above
/// or below. It clears the cells beneath it; no shadow, no dimmed page.
///
/// Render it into the screen: it centers itself, fits its content and
/// shrinks to the screen. For content of your own, take the inside from
/// [`Modal::draw`].
#[derive(Clone, Debug)]
pub struct Modal<'a> {
    theme: &'a Theme,
    title: String,
    body: Text<'a>,
    hints: Vec<(&'a str, &'a str)>,
    width: Option<u16>,
    height: Option<u16>,
}

impl<'a> Modal<'a> {
    /// A modal with a title.
    pub fn new(theme: &'a Theme, title: impl Into<String>) -> Self {
        Self { theme, title: title.into(), body: Text::default(), hints: Vec::new(), width: None, height: None }
    }

    /// The content, one line per row.
    pub fn body(mut self, body: impl Into<Text<'a>>) -> Self {
        self.body = body.into();
        self
    }

    /// Key hints for the bottom border, as `(key, label)` pairs.
    pub fn hints(mut self, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        self.hints = hints.into_iter().collect();
        self
    }

    /// A fixed outer width. By default the modal fits its content.
    pub fn width(mut self, width: u16) -> Self {
        self.width = Some(width);
        self
    }

    /// A fixed outer height. By default the modal fits its content.
    pub fn height(mut self, height: u16) -> Self {
        self.height = Some(height);
        self
    }

    /// The area the modal takes on `screen`.
    pub fn area(&self, screen: Rect) -> Rect {
        let hints = KeyHints::new(self.theme, self.hints.iter().copied()).spans(usize::MAX);
        let hints = hints.iter().map(Span::width).sum::<usize>();
        // Sizes are worked out in usize and clamped, so a huge body cannot
        // overflow a u16.
        let clamp = |n: usize| n.min(usize::from(u16::MAX)) as u16;
        let width = self.width.unwrap_or_else(|| {
            let content = self.body.width().max(cells(&self.title) + 2).max(hints);
            clamp(content.saturating_add(6))
        });
        let height = self.height.unwrap_or_else(|| clamp(self.body.height().saturating_add(2)));
        screen.centered(Constraint::Length(width.min(screen.width)), Constraint::Length(height.min(screen.height)))
    }

    /// Draws the frame and the body, and returns the inside: the area
    /// within the border and the side padding.
    pub fn draw(self, screen: Rect, buf: &mut Buffer) -> Rect {
        let t = self.theme;
        let area = self.area(screen).intersection(buf.area);
        if area.is_empty() {
            return area;
        }
        Clear.render(area, buf);
        let edge = t.fg(t.tokens().primary);
        let top =
            Line::from(vec![Span::styled("─", edge), Span::styled(format!(" {} ", self.title), edge.add_modifier(Modifier::BOLD))]);
        let mut block = Block::bordered()
            .border_type(BorderType::Rounded)
            .border_style(edge)
            .style(t.base())
            .title(top)
            .padding(Padding::horizontal(2));
        if !self.hints.is_empty() {
            let room = usize::from(area.width).saturating_sub(4);
            let mut bottom = vec![Span::styled("─", edge), Span::raw(" ")];
            bottom.extend(KeyHints::new(t, self.hints).spans(room));
            bottom.push(Span::raw(" "));
            block = block.title_bottom(Line::from(bottom));
        }
        let inner = block.inner(area);
        block.render(area, buf);
        Paragraph::new(self.body).render(inner, buf);
        inner
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

    #[test]
    fn the_title_and_keys_sit_in_the_border() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 40, 7);
        let mut buf = Buffer::empty(screen);
        let inner = Modal::new(&theme, "Help").body("q  Quit").hints([("any key", "close")]).draw(screen, &mut buf);
        let row = |y: u16| (0..screen.width).map(|x| buf[(x, y)].symbol()).collect::<String>();
        assert!(row(2).contains("╭─ Help ─"), "{}", row(2));
        assert!(row(4).contains("╰─ any key close ─"), "{}", row(4));
        assert_eq!(inner.height, 1);
        assert_eq!(buf[(inner.x, inner.y)].symbol(), "q");
    }
}
