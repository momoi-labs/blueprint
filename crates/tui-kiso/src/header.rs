use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::{BrandMark, Breadcrumb, Theme};

/// The app bar: one row at the top of the screen, once per screen. It says
/// which product this is and where the person works. A page has its own
/// [`PageHeader`](crate::PageHeader).
///
/// The brand is bold `primary-foreground` on `primary`. The scope, such as
/// the project the person works in, follows in `foreground`, then the path
/// to the current view as a [`Breadcrumb`]. The right side is spans of the
/// app's own, such as a user or a status; it keeps its place at the right
/// edge. The rest of the row stays unpainted, as the page. When the row runs
/// out of width, the right side drops first, then the breadcrumb collapses;
/// the brand stays.
#[derive(Clone, Debug)]
pub struct Header<'a> {
    theme: &'a Theme,
    product: &'a str,
    version: &'a str,
    scope: Option<&'a str>,
    breadcrumb: Vec<&'a str>,
    right: Vec<Span<'a>>,
}

impl<'a> Header<'a> {
    /// A header with the product name and version.
    pub fn new(theme: &'a Theme, product: &'a str, version: &'a str) -> Self {
        Self { theme, product, version, scope: None, breadcrumb: Vec::new(), right: Vec::new() }
    }

    /// Where the person works, such as a project or an environment.
    #[must_use]
    pub fn scope(mut self, scope: &'a str) -> Self {
        self.scope = Some(scope);
        self
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

    /// Spans at the right edge, such as the user or a status.
    #[must_use]
    pub fn right(mut self, spans: impl IntoIterator<Item = Span<'a>>) -> Self {
        self.right = spans.into_iter().collect();
        self
    }
}

impl Widget for Header<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let t = self.theme;
        let width = usize::from(area.width);
        let brand = if self.version.is_empty() {
            format!(" {} ", self.product)
        } else {
            format!(" {} {} ", self.product, self.version)
        };
        let right_width: usize = self.right.iter().map(Span::width).sum();
        // The right side needs the brand, the scope, a gap, and itself. The
        // path collapses to fit what is left; it does not push the right side
        // out, and the right side does not cut the scope.
        let kept = cells(&brand) + self.scope.map_or(0, |scope| 2 + cells(scope));
        let right = right_width > 0 && kept + 2 + right_width <= width;
        let room = if right { width - right_width - 2 } else { width };

        let mut spans = Line::from(BrandMark::new(t, brand.trim()).filled(true)).spans;
        if let Some(scope) = self.scope {
            spans.extend([Span::raw("  "), Span::styled(scope.to_owned(), t.text())]);
        }
        if !self.breadcrumb.is_empty() {
            spans.push(Span::raw(" "));
            if self.scope.is_some() {
                spans.extend([Span::styled("│", t.subtle()), Span::raw(" ")]);
            }
            let used: usize = spans.iter().map(Span::width).sum();
            spans.extend(Breadcrumb::new(t, self.breadcrumb.iter().copied()).spans(room.saturating_sub(used)));
        }
        let (left, _) = cut(spans, room);
        buf.set_line(area.x, area.y, &Line::from(left), area.width);
        if right {
            let x = area.right() - right_width as u16;
            buf.set_line(x, area.y, &Line::from(self.right), right_width as u16);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_brand_scope_and_path_lead_and_the_right_side_ends_the_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = Header::new(&theme, "pg-probe", "0.4.0")
            .scope("acme")
            .breadcrumb(["Projects", "Machines"])
            .right([Span::raw("alex")]);
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 1));
        header.render(buf.area, &mut buf);
        assert_eq!(row(&buf), " pg-probe 0.4.0   acme │ Projects › Machines  alex");
    }

    #[test]
    fn the_right_side_drops_before_the_scope_is_cut() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = Header::new(&theme, "pg-probe", "0.4.0").scope("pg-main").right([Span::raw("seba  online")]);
        let mut buf = Buffer::empty(Rect::new(0, 0, 36, 1));
        header.render(buf.area, &mut buf);
        assert!(row(&buf).starts_with(" pg-probe 0.4.0   pg-main"), "{}", row(&buf));
        assert!(!row(&buf).contains("seba"), "{}", row(&buf));
    }

    #[test]
    fn a_narrow_row_drops_the_right_side_then_collapses_the_path() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = Header::new(&theme, "pg-probe", "0.4.0").breadcrumb(["Projects", "pg-main", "Machines"]).right([Span::raw("alex")]);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 1));
        header.clone().render(buf.area, &mut buf);
        assert!(row(&buf).starts_with(" pg-probe 0.4.0  … › Machines"), "{}", row(&buf));
        assert!(row(&buf).ends_with("alex"), "{}", row(&buf));
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
        header.render(buf.area, &mut buf);
        assert!(row(&buf).starts_with(" pg-probe 0.4.0 "), "{}", row(&buf));
        assert!(!row(&buf).contains("alex"), "{}", row(&buf));
    }

    #[test]
    fn a_header_in_an_empty_area_draws_nothing() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Header::new(&theme, "pg-probe", "").render(Rect::new(0, 0, 10, 0), &mut buf);
        assert_eq!(row(&buf), " ".repeat(10));
    }
}
