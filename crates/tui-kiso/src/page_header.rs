use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Span;
use ratatui::widgets::Widget;

use crate::text::cut;
use crate::{Breadcrumb, Button, Size, Theme, Title};

/// The top of one page: an optional [`Breadcrumb`], the [`Title`] line, a
/// description in `muted-foreground`, and the page's actions.
///
/// It is not the app bar: that is [`Header`](crate::Header), once per
/// screen. The actions are [`Button`]s forced to `Size::Sm`, right-aligned
/// on the title row, two cells apart. When they would leave the title less
/// than 20 cells, they wrap to a row of their own below it. A blank row
/// ends the header, so the page starts at [`PageHeader::height`].
#[derive(Clone, Debug)]
pub struct PageHeader<'a> {
    theme: &'a Theme,
    title: String,
    description: Option<String>,
    breadcrumb: Vec<String>,
    actions: Vec<Button<'a>>,
}

/// The fewest cells the title row keeps beside the actions.
const TITLE_MIN: u16 = 20;

impl<'a> PageHeader<'a> {
    pub fn new(theme: &'a Theme, title: impl Into<String>) -> Self {
        Self { theme, title: title.into(), description: None, breadcrumb: Vec::new(), actions: Vec::new() }
    }

    /// One line of supporting text, cut with `…` when it does not fit.
    #[must_use]
    pub fn description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// The path to the page, shown above the title. The last part is the
    /// page itself, so it usually repeats the title.
    #[must_use]
    pub fn breadcrumb(mut self, parts: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.breadcrumb = parts.into_iter().map(Into::into).collect();
        self
    }

    /// An action of the page. The first one added is the leftmost.
    #[must_use]
    pub fn action(mut self, button: Button<'a>) -> Self {
        self.actions.push(button.size(Size::Sm));
        self
    }

    fn actions_width(&self) -> u16 {
        let total: u16 = self.actions.iter().map(Button::width).sum();
        total.saturating_add(2 * (self.actions.len() as u16).saturating_sub(1))
    }

    /// True when the actions share the title row at `width`.
    fn inline(&self, width: u16) -> bool {
        width >= self.actions_width().saturating_add(2 + TITLE_MIN)
    }

    /// The rows it takes at `width` columns, with the blank row at its end.
    pub fn height(&self, width: u16) -> u16 {
        let wrapped = !self.actions.is_empty() && !self.inline(width);
        u16::from(!self.breadcrumb.is_empty()) + 1 + u16::from(wrapped) + u16::from(self.description.is_some()) + 1
    }
}

impl Widget for PageHeader<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let t = self.theme;
        let width = area.width;
        let mut y = area.y;
        let next = |y: &mut u16| {
            let row = Rect::new(area.x, *y, width, 1).intersection(area);
            *y = y.saturating_add(1);
            row
        };
        if !self.breadcrumb.is_empty() {
            Breadcrumb::new(t, self.breadcrumb.clone()).render(next(&mut y), buf);
        }
        let actions = self.actions_width();
        let inline = !self.actions.is_empty() && self.inline(width);
        let title = next(&mut y);
        let title_width = if inline { width - actions - 2 } else { width };
        Title::new(t, self.title.clone()).render(Rect { width: title_width, ..title }, buf);
        let mut action_row = title;
        if !self.actions.is_empty() && !inline {
            action_row = next(&mut y);
        }
        let mut x = area.right().saturating_sub(actions).max(area.x);
        for button in &self.actions {
            let room = Rect::new(x, action_row.y, button.width(), 1).intersection(action_row);
            button.render(room, buf);
            x = x.saturating_add(button.width() + 2);
        }
        if let Some(description) = &self.description {
            let row = next(&mut y);
            if !row.is_empty() {
                let (spans, _) = cut(vec![Span::styled(description.clone(), t.muted())], usize::from(row.width));
                buf.set_line(row.x, row.y, &spans.into(), row.width);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ButtonVariant;

    fn rows(buf: &Buffer) -> Vec<String> {
        (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()).collect()
    }

    #[test]
    fn the_height_counts_each_row_and_the_blank_one() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(PageHeader::new(&theme, "Machines").height(80), 2);
        assert_eq!(PageHeader::new(&theme, "Machines").description("All of them").height(80), 3);
        let full = PageHeader::new(&theme, "Machines").description("All").breadcrumb(["Projects", "Machines"]);
        assert_eq!(full.height(80), 4);
    }

    #[test]
    fn the_actions_sit_at_the_right_of_the_title_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = PageHeader::new(&theme, "Machines")
            .description("Every machine in pg-main.")
            .action(Button::new(&theme, "Export"))
            .action(Button::new(&theme, "New").variant(ButtonVariant::Primary));
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 3));
        assert_eq!(header.height(50), 3);
        header.render(buf.area, &mut buf);
        let rows = rows(&buf);
        assert!(rows[0].starts_with("━━"), "{}", rows[0]);
        assert!(rows[0].ends_with("  Export      New  "), "{}", rows[0]);
        assert_eq!(rows[1].trim_end(), "Every machine in pg-main.");
    }

    #[test]
    fn narrow_actions_wrap_below_the_title() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = PageHeader::new(&theme, "Machines").action(Button::new(&theme, "Export")).action(Button::new(&theme, "New"));
        assert_eq!(header.height(30), 3);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 3));
        header.render(buf.area, &mut buf);
        let rows = rows(&buf);
        assert!(rows[0].contains("Machines") && !rows[0].contains("Export"), "{}", rows[0]);
        assert!(rows[1].contains("Export") && rows[1].contains("New"), "{}", rows[1]);
    }

    #[test]
    fn a_header_at_the_edge_of_the_buffer_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let header = PageHeader::new(&theme, "Machines").description("x".repeat(50)).breadcrumb(["A", "B"]).action(Button::new(&theme, "New"));
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 2));
        header.clone().render(Rect::new(4, 1, 40, 6), &mut buf);
        header.render(Rect::new(0, 0, 0, 0), &mut buf);
    }
}
