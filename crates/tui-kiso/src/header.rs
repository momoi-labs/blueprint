use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::Theme;

/// The top row: product name and version, then where the person is.
///
/// The brand is bold `primary-foreground` on `primary`. The row is painted
/// on `background`.
#[derive(Clone, Debug)]
pub struct Header<'a> {
    theme: &'a Theme,
    product: &'a str,
    version: &'a str,
    breadcrumb: Vec<&'a str>,
}

impl<'a> Header<'a> {
    /// A header with the product name and version.
    pub fn new(theme: &'a Theme, product: &'a str, version: &'a str) -> Self {
        Self { theme, product, version, breadcrumb: Vec::new() }
    }

    /// The current view's title.
    pub fn title(self, title: &'a str) -> Self {
        self.breadcrumb([title])
    }

    /// The path to the current view. The last part is the current one.
    pub fn breadcrumb(mut self, parts: impl IntoIterator<Item = &'a str>) -> Self {
        self.breadcrumb = parts.into_iter().collect();
        self
    }
}

impl Widget for Header<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        buf.set_style(area, t.base());
        let brand = if self.version.is_empty() {
            format!(" {} ", self.product)
        } else {
            format!(" {} {} ", self.product, self.version)
        };
        let mut spans = vec![Span::styled(brand, t.brand()), Span::raw(" ")];
        let last = self.breadcrumb.len().saturating_sub(1);
        for (i, part) in self.breadcrumb.iter().enumerate() {
            if i == last {
                spans.push(Span::styled(*part, t.strong()));
            } else {
                spans.push(Span::styled(*part, t.muted()));
                spans.push(Span::styled(" / ", t.subtle()));
            }
        }
        Line::from(spans).render(area, buf);
    }
}
