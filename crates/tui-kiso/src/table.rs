use ratatui::buffer::Buffer;
use ratatui::layout::{Alignment, Constraint, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Cell, HighlightSpacing, Row, StatefulWidget, TableState, Widget};

use crate::Theme;

/// A table of records, one line per row, two columns in.
///
/// The column titles are in `subtle-foreground`, with no fill. Numeric
/// columns align right, titles included. The selected row of a
/// [`TableState`] gets a `primary` `▌` in the first column and the
/// `selected` background, so cells keep their colors. A cell below its
/// minimum contrast on `selected` takes `foreground`, and a status word in
/// a state color that loses it turns bold. For a list on a
/// [`Page`](crate::Page), use [`Columns`](crate::Columns) instead.
#[derive(Clone, Debug)]
pub struct Table<'a> {
    theme: &'a Theme,
    header: Vec<Line<'a>>,
    rows: Vec<Vec<Line<'a>>>,
    widths: Vec<Constraint>,
    numeric: Vec<usize>,
}

impl<'a> Table<'a> {
    /// A table from rows of cells and one width per column.
    pub fn new<R, C>(
        theme: &'a Theme,
        rows: impl IntoIterator<Item = R>,
        widths: impl IntoIterator<Item = Constraint>,
    ) -> Self
    where
        R: IntoIterator<Item = C>,
        C: Into<Line<'a>>,
    {
        Self {
            theme,
            header: Vec::new(),
            rows: rows.into_iter().map(|row| row.into_iter().map(Into::into).collect()).collect(),
            widths: widths.into_iter().collect(),
            numeric: Vec::new(),
        }
    }

    /// The column titles.
    pub fn header<C: Into<Line<'a>>>(mut self, titles: impl IntoIterator<Item = C>) -> Self {
        self.header = titles.into_iter().map(Into::into).collect();
        self
    }

    /// Columns that hold numbers, by index. They align right.
    pub fn numeric(mut self, columns: impl IntoIterator<Item = usize>) -> Self {
        self.numeric = columns.into_iter().collect();
        self
    }

    fn row(&self, cells: Vec<Line<'a>>) -> Row<'a> {
        Row::new(cells.into_iter().enumerate().map(|(i, line)| {
            Cell::from(if self.numeric.contains(&i) { line.alignment(Alignment::Right) } else { line })
        }))
    }
}

impl StatefulWidget for Table<'_> {
    type State = TableState;

    fn render(mut self, area: Rect, buf: &mut Buffer, state: &mut TableState) {
        let t = self.theme;
        let header = std::mem::take(&mut self.header);
        let has_header = !header.is_empty();
        let rows: Vec<Row> = std::mem::take(&mut self.rows).into_iter().map(|r| self.row(r)).collect();
        let mut table = ratatui::widgets::Table::new(rows, self.widths.clone())
            .style(t.text())
            .highlight_symbol(Line::from(vec![Span::styled("▌", t.fg(t.tokens().primary)), Span::raw(" ")]))
            .highlight_spacing(HighlightSpacing::Always);
        if has_header {
            table = table.header(self.row(header).style(t.subtle()));
        }
        StatefulWidget::render(table, area, buf, state);
        if let Some(selected) = state.selected() {
            let top = area.y + u16::from(has_header);
            let Some(offset) = selected.checked_sub(state.offset()) else { return };
            let y = top as usize + offset;
            if y < usize::from(area.bottom()) {
                t.select(buf, Rect::new(area.x, y as u16, area.width, 1));
            }
        }
    }
}

impl Widget for Table<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        StatefulWidget::render(self, area, buf, &mut TableState::default());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::StatusBadge;
    use ratatui::style::{Color, Modifier};

    /// Draws one selected row with a failed status and returns its first
    /// letter's cell, with the colors to compare against.
    fn failed_cell(tokens: kiso_tokens::Theme) -> (ratatui::buffer::Cell, Color, Color) {
        let theme = Theme::truecolor(tokens);
        let area = Rect::new(0, 0, 12, 1);
        let mut buf = Buffer::empty(area);
        let table = Table::new(&theme, [[StatusBadge::danger(&theme, "Failed")]], [Constraint::Fill(1)]);
        StatefulWidget::render(table, area, &mut buf, &mut TableState::new().with_selected(0));
        let cell = buf[(4, 0)].clone();
        assert_eq!(cell.symbol(), "F");
        assert_eq!(buf[(0, 0)].symbol(), "▌");
        assert_eq!(cell.bg, theme.selected_color());
        (cell, theme.color(tokens.danger_on_dark), theme.color(tokens.foreground))
    }

    #[test]
    fn selected_row_keeps_a_status_color_that_passes() {
        // Gold is an accent where every role passes on `selected`.
        let (cell, danger, _) = failed_cell(kiso_tokens::GOLD_DARK);
        assert_eq!(cell.fg, danger);
        assert!(!cell.modifier.contains(Modifier::BOLD));
    }

    #[test]
    fn selected_row_falls_back_when_a_status_color_fails() {
        // In violet, `danger-on-dark` is below 4.5:1 on `selected`.
        let (cell, _, foreground) = failed_cell(kiso_tokens::VIOLET_DARK);
        assert_eq!(cell.fg, foreground);
        assert!(cell.modifier.contains(Modifier::BOLD));
    }
}
