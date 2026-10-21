use ratatui::buffer::Buffer;
use ratatui::layout::{Alignment, Rect};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Block, Clear, Padding, Paragraph, Widget};

use crate::Theme;

/// A popup over a page, for help and confirmations.
///
/// It clears the cells beneath it, fills with `elevated-surface` and draws
/// a `border` frame. The title is bold `foreground`. Its own key hints sit
/// in the bottom frame. Render it into the page area: it centers itself and
/// shrinks to fit, down to 80 by 24.
#[derive(Clone, Debug)]
pub struct Modal<'a> {
    theme: &'a Theme,
    title: &'a str,
    body: Text<'a>,
    hints: Vec<(&'a str, &'a str)>,
    width: Option<u16>,
}

impl<'a> Modal<'a> {
    /// A modal with a title.
    pub fn new(theme: &'a Theme, title: &'a str) -> Self {
        Self { theme, title, body: Text::default(), hints: Vec::new(), width: None }
    }

    /// The content, one line per row.
    pub fn body(mut self, body: impl Into<Text<'a>>) -> Self {
        self.body = body.into();
        self
    }

    /// Key hints for the bottom frame, as `(key, label)` pairs.
    pub fn hints(mut self, hints: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        self.hints = hints.into_iter().collect();
        self
    }

    /// A fixed outer width. By default the modal fits its content.
    pub fn width(mut self, width: u16) -> Self {
        self.width = Some(width);
        self
    }

    fn hint_line(&self) -> Line<'a> {
        let mut spans = vec![Span::raw(" ")];
        for &(key, label) in &self.hints {
            spans.push(Span::styled(key, self.theme.link()));
            spans.push(Span::styled(format!(" {label} "), self.theme.muted()));
            spans.push(Span::raw(" "));
        }
        spans.pop();
        Line::from(spans).alignment(Alignment::Right)
    }

    /// The area the modal takes inside `page`.
    fn area(&self, page: Rect, hints: &Line) -> Rect {
        let content = self
            .body
            .width()
            .max(self.title.chars().count() + 2)
            .max(hints.width().saturating_sub(2));
        let width = self.width.unwrap_or(content as u16 + 4).min(page.width);
        let height = (self.body.height() as u16 + 2).min(page.height);
        Rect::new(
            page.x + (page.width - width) / 2,
            page.y + (page.height - height) / 2,
            width,
            height,
        )
    }
}

impl Widget for Modal<'_> {
    fn render(self, page: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let hints = self.hint_line();
        let area = self.area(page, &hints);
        let mut block = Block::bordered()
            .style(t.elevated())
            .border_style(t.border())
            .padding(Padding::horizontal(1))
            .title(Line::from(format!(" {} ", self.title)).style(t.strong()));
        if !self.hints.is_empty() {
            block = block.title_bottom(hints);
        }
        Clear.render(area, buf);
        Paragraph::new(self.body).block(block).render(area, buf);
    }
}
