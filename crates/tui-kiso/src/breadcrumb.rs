use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::Theme;

const SEPARATOR: &str = " › ";

/// Where the person is in a hierarchy, on one row: `Projects › pg-main ›
/// Machines`.
///
/// The ancestors are `muted-foreground`, the current page is bold
/// `foreground`, and the `›` between them is `subtle-foreground`. When the
/// path does not fit, the middle collapses to `…` and the first and last
/// parts stay: `Projects › … › Machines`. When even that is too wide, the
/// first part drops, and last of all the current part is cut with `…`.
#[derive(Clone, Debug)]
pub struct Breadcrumb<'a> {
    theme: &'a Theme,
    parts: Vec<String>,
}

impl<'a> Breadcrumb<'a> {
    /// A path of parts, the current one last.
    pub fn new(theme: &'a Theme, parts: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self { theme, parts: parts.into_iter().map(Into::into).collect() }
    }

    /// The cells the whole path takes.
    pub fn width(&self) -> usize {
        let text: usize = self.parts.iter().map(|part| cells(part)).sum();
        text + cells(SEPARATOR) * self.parts.len().saturating_sub(1)
    }

    /// The path in `width` cells. `None` in a choice is the `…` of the
    /// collapsed middle.
    pub fn spans(&self, width: usize) -> Vec<Span<'static>> {
        let n = self.parts.len();
        if n == 0 {
            return Vec::new();
        }
        let part = |p: Option<usize>| p.map_or(1, |i| cells(&self.parts[i]));
        let total = |choice: &[Option<usize>]| {
            choice.iter().map(|p| part(*p)).sum::<usize>() + cells(SEPARATOR) * choice.len().saturating_sub(1)
        };
        // From the most to the least of the path.
        let mut choices: Vec<Vec<Option<usize>>> = vec![(0..n).map(Some).collect()];
        for tail in (1..n.saturating_sub(1)).rev() {
            choices.push([Some(0), None].into_iter().chain((n - tail..n).map(Some)).collect());
        }
        if n >= 2 {
            choices.push(vec![None, Some(n - 1)]);
        }
        choices.push(vec![Some(n - 1)]);
        let choice = choices.iter().find(|choice| total(choice) <= width).unwrap_or(&choices[choices.len() - 1]);
        let t = self.theme;
        let mut spans = Vec::new();
        for (at, p) in choice.iter().enumerate() {
            if at > 0 {
                spans.push(Span::styled(SEPARATOR, t.subtle()));
            }
            spans.push(match p {
                None => Span::styled("…", t.muted()),
                Some(i) if *i == n - 1 => Span::styled(self.parts[*i].clone(), t.strong()),
                Some(i) => Span::styled(self.parts[*i].clone(), t.muted()),
            });
        }
        cut(spans, width).0
    }
}

impl Widget for Breadcrumb<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &Line::from(self.spans(usize::from(area.width))), area.width);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::style::Modifier;

    fn text(spans: Vec<Span<'static>>) -> String {
        Line::from(spans).to_string()
    }

    #[test]
    fn a_path_that_fits_shows_whole() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let crumb = Breadcrumb::new(&theme, ["Projects", "pg-main", "Machines"]);
        assert_eq!(crumb.width(), 29);
        assert_eq!(text(crumb.spans(29)), "Projects › pg-main › Machines");
    }

    #[test]
    fn the_middle_collapses_and_the_ends_stay() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let crumb = Breadcrumb::new(&theme, ["Projects", "pg-main", "Replicas", "Machines"]);
        assert_eq!(text(crumb.spans(40)), "Projects › pg-main › Replicas › Machines");
        assert_eq!(text(crumb.spans(34)), "Projects › … › Replicas › Machines");
        assert_eq!(text(crumb.spans(33)), "Projects › … › Machines");
        assert_eq!(text(crumb.spans(22)), "… › Machines");
        assert_eq!(text(crumb.spans(11)), "Machines");
    }

    #[test]
    fn the_current_part_is_cut_last() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let crumb = Breadcrumb::new(&theme, ["Projects", "Machines"]);
        assert_eq!(text(crumb.spans(6)), "Machi…");
        assert_eq!(text(crumb.spans(0)), "");
    }

    #[test]
    fn the_last_part_is_bold_and_the_others_are_muted() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let spans = Breadcrumb::new(&theme, ["Projects", "Machines"]).spans(40);
        assert_eq!(spans[0].style, theme.muted());
        assert_eq!(spans[1].style, theme.subtle());
        assert!(spans[2].style.add_modifier.contains(Modifier::BOLD));
    }

    #[test]
    fn an_empty_area_draws_nothing() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Breadcrumb::new(&theme, ["A"]).render(Rect::new(0, 0, 10, 0), &mut buf);
        Breadcrumb::new(&theme, Vec::<String>::new()).render(buf.area, &mut buf);
        assert_eq!(buf[(0, 0)].symbol(), " ");
    }
}
