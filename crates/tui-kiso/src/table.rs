use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Flex, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{StatefulWidget, TableState, Widget};

use crate::page::scrollbar;
use crate::surface::{fill, write};
use crate::text::cut;
use crate::{EmptyState, Pagination, Size, Skeleton, Theme};

/// The columns before the first cell: the selection mark and a space.
const LEAD: u16 = 2;
/// The columns between two cells.
const GAP: u16 = 2;
/// The share of a column each loading bar takes, by row and column.
const BARS: [u32; 5] = [70, 45, 85, 60, 75];

/// A table of records: a header row in `muted-foreground` on a faint
/// `secondary` fill, then one row per record, two columns in. No line
/// borders and no frame: it sits on the page or on a [`Card`](crate::Card)
/// and draws no card itself.
///
/// Numeric columns align right, titles included. The selected row of a
/// [`TableState`] gets a `primary` `▌` in the first column and the
/// `selected` background, as the [`Sidebar`](crate::Sidebar) does, so cells
/// keep their colors. A cell below its minimum contrast on `selected`
/// takes `foreground`, and a status word in a state color that loses it
/// turns bold. Put a plain [`StatusBadge`](crate::StatusBadge) in a cell
/// for a state.
///
/// `Size::Sm`, the default, is one row per record, for dense tools.
/// `Size::Md` leaves a blank row between records. [`Table::striped`] tints
/// every other record. A table with more records than rows scrolls to keep
/// the selection on screen and shows the scrollbar a [`Page`](crate::Page)
/// draws, in its last column.
///
/// The states of the data: [`Table::empty`] shows an
/// [`EmptyState`] under the header when there are no records,
/// [`Table::loading`] shows [`Skeleton`] bars in each column, on the lower
/// half of each row so that two records keep a gap, and
/// [`Table::pagination`] adds a [`Pagination`] row under the records. For
/// a list in a [`Page`](crate::Page), use [`Columns`](crate::Columns).
#[derive(Clone, Debug)]
pub struct Table<'a> {
    theme: &'a Theme,
    header: Vec<Line<'a>>,
    rows: Vec<Vec<Line<'a>>>,
    widths: Vec<Constraint>,
    numeric: Vec<usize>,
    size: Size,
    striped: bool,
    empty: Option<EmptyState<'a>>,
    loading: Option<usize>,
    tick: Option<u32>,
    pagination: Option<Pagination<'a>>,
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
            size: Size::Sm,
            striped: false,
            empty: None,
            loading: None,
            tick: None,
            pagination: None,
        }
    }

    /// The column titles.
    #[must_use]
    pub fn header<C: Into<Line<'a>>>(mut self, titles: impl IntoIterator<Item = C>) -> Self {
        self.header = titles.into_iter().map(Into::into).collect();
        self
    }

    /// Columns that hold numbers, by index. They align right.
    #[must_use]
    pub fn numeric(mut self, columns: impl IntoIterator<Item = usize>) -> Self {
        self.numeric = columns.into_iter().collect();
        self
    }

    /// `Sm`, the default, is one row per record. `Md` leaves a blank row
    /// between records.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// Tints every other record with a faint `secondary`.
    #[must_use]
    pub fn striped(mut self, striped: bool) -> Self {
        self.striped = striped;
        self
    }

    /// What shows under the header when there are no records.
    #[must_use]
    pub fn empty(mut self, empty: EmptyState<'a>) -> Self {
        self.empty = Some(empty);
        self
    }

    /// The records are on their way: `rows` records of [`Skeleton`] bars,
    /// one per column, take the place of the records, so the table keeps
    /// its height.
    #[must_use]
    pub fn loading(mut self, rows: usize) -> Self {
        self.loading = Some(rows);
        self
    }

    /// Pulses the loading bars as `tick` counts up. See [`Skeleton::tick`].
    #[must_use]
    pub fn tick(mut self, tick: u32) -> Self {
        self.tick = Some(tick);
        self
    }

    /// The pages of a longer list, in a row under the records after a
    /// blank row.
    #[must_use]
    pub fn pagination(mut self, pagination: Pagination<'a>) -> Self {
        self.pagination = Some(pagination);
        self
    }

    /// The rows the table takes at `width` columns: the header, every
    /// record (or the loading rows, or the empty state), and the
    /// pagination with its blank row.
    pub fn height(&self, width: u16) -> u16 {
        let header = u16::from(!self.header.is_empty());
        let records = self.loading.unwrap_or(self.rows.len());
        let body = match &self.empty {
            Some(empty) if records == 0 => empty.height(width),
            _ => records_rows(records, self.size),
        };
        let pages = if self.pagination.is_some() && !self.shows_empty() { 2 } else { 0 };
        header.saturating_add(body).saturating_add(pages)
    }

    fn shows_empty(&self) -> bool {
        self.loading.is_none() && self.rows.is_empty() && self.empty.is_some()
    }

    /// The rows between two records.
    fn pitch(&self) -> usize {
        match self.size {
            Size::Sm => 1,
            Size::Md | Size::Lg => 2,
        }
    }

    /// The x and width of each column in `area`.
    fn columns(&self, area: Rect) -> Vec<(u16, u16)> {
        let inner = Rect { x: area.x.saturating_add(LEAD), width: area.width.saturating_sub(LEAD), ..area };
        let rects = Layout::horizontal(self.widths.clone()).spacing(GAP).flex(Flex::Start).split(Rect { height: 1, ..inner });
        rects.iter().map(|rect| (rect.x, rect.width)).collect()
    }

    /// One line in each column, cut with `…` to its width, numbers to the
    /// right.
    fn cells(&self, buf: &mut Buffer, columns: &[(u16, u16)], y: u16, cells: &[Line<'_>]) {
        for (i, ((x, width), line)) in columns.iter().zip(cells).enumerate() {
            let spans: Vec<Span> = line.spans.iter().map(|span| Span::styled(span.content.clone(), line.style.patch(span.style))).collect();
            let (spans, used) = cut(spans, usize::from(*width));
            let mut x = if self.numeric.contains(&i) { x + width - used as u16 } else { *x };
            for span in spans {
                x = x.saturating_add(write(buf, x, y, &span.content, span.style));
            }
        }
    }
}

/// The rows `records` records take: one each, and a blank row between two
/// at `Md`.
fn records_rows(records: usize, size: Size) -> u16 {
    let rows = match size {
        Size::Sm => records,
        Size::Md | Size::Lg => (records * 2).saturating_sub(1),
    };
    u16::try_from(rows).unwrap_or(u16::MAX)
}

impl StatefulWidget for Table<'_> {
    type State = TableState;

    fn render(self, area: Rect, buf: &mut Buffer, state: &mut TableState) {
        let t = self.theme;
        let r = t.tokens();
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let mut y = area.y;
        let columns = self.columns(area);
        if !self.header.is_empty() {
            let alpha = if t.is_truecolor() { t.look().fill.alpha() } else { 1.0 };
            fill(t, buf, Rect { height: 1, ..area }, r.secondary, alpha);
            let titles: Vec<Line> = self.header.iter().map(|line| line.clone().patch_style(t.muted())).collect();
            self.cells(buf, &columns, y, &titles);
            y += 1;
        }
        let paged = self.pagination.is_some() && !self.shows_empty();
        // The pagination keeps its row and the blank row above it.
        let reserve = if paged && area.bottom().saturating_sub(y) >= 3 { 2 } else { 0 };
        let body = Rect::new(area.x, y, area.width, area.bottom().saturating_sub(y).saturating_sub(reserve));

        if self.shows_empty() {
            if let Some(empty) = self.empty {
                empty.render(body, buf);
            }
            return;
        }

        let pitch = self.pitch();
        let mut last = y;
        if let Some(loading) = self.loading {
            for record in 0..loading {
                let row_y = body.y.saturating_add(u16::try_from(record * pitch).unwrap_or(u16::MAX));
                if row_y >= body.bottom() {
                    break;
                }
                for (i, (x, width)) in columns.iter().enumerate() {
                    let share = BARS[(record + i * 2) % BARS.len()];
                    let bar = ((u32::from(*width) * share / 100) as u16).max(1).min(*width);
                    let x = if self.numeric.contains(&i) { x + width - bar } else { *x };
                    let rect = Rect::new(x, row_y, bar, 1).intersection(buf.area);
                    let behind: Vec<_> = rect.positions().map(|at| buf[at].bg).collect();
                    Skeleton::new(t).pulse(self.tick).render(rect, buf);
                    // The bar takes the lower half of its row, so the bars
                    // of two records keep half a row between them.
                    for (at, bg) in rect.positions().zip(behind) {
                        let bar = buf[at].bg;
                        buf[at].set_symbol("▄").set_fg(bar).set_bg(bg);
                    }
                }
                last = row_y + 1;
            }
        } else {
            let total = self.rows.len();
            // The records that fit: a blank row between two at `Md`, none
            // after the last.
            let fit = usize::from(body.height).div_ceil(pitch);
            if let Some(selected) = state.selected() {
                let selected = selected.min(total.saturating_sub(1));
                *state.selected_mut() = Some(selected);
                if selected < state.offset() {
                    *state.offset_mut() = selected;
                } else if fit > 0 && selected >= state.offset() + fit {
                    *state.offset_mut() = selected + 1 - fit;
                }
            }
            *state.offset_mut() = state.offset().min(total.saturating_sub(fit));
            let offset = state.offset();
            let bar = total > fit && body.height > 0;
            let rows_area = Rect { width: body.width.saturating_sub(u16::from(bar)), ..body };
            let columns = if bar { self.columns(rows_area) } else { columns };
            for (dy, (index, cells)) in self.rows.iter().enumerate().skip(offset).take(fit).enumerate() {
                let row_y = body.y + (dy * pitch) as u16;
                let row = Rect::new(rows_area.x, row_y, rows_area.width, 1);
                if self.striped && index % 2 == 1 {
                    fill(t, buf, row, r.secondary, if t.is_truecolor() { 0.5 } else { 1.0 });
                }
                self.cells(buf, &columns, row_y, cells);
                if state.selected() == Some(index) {
                    // The bar goes on first, so the selection checks its
                    // contrast as a mark, as it does for the row.
                    if let Some(cell) = buf.cell_mut((row.x, row.y)) {
                        cell.set_symbol("▌").set_fg(t.color(r.primary));
                    }
                    t.select(buf, row);
                }
                last = row_y + 1;
            }
            if bar {
                let rows = (total * pitch).saturating_sub(pitch - 1);
                let track = Rect::new(body.right().saturating_sub(1), body.y, 1, body.height);
                scrollbar(buf, t, track, offset * pitch, rows);
            }
        }

        if let Some(pagination) = self.pagination.filter(|_| paged) {
            let row_y = last.saturating_add(1).min(area.bottom().saturating_sub(1));
            if row_y >= y {
                pagination.render(Rect::new(area.x.saturating_add(LEAD), row_y, area.width.saturating_sub(LEAD), 1), buf);
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

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

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

    fn machines(theme: &Theme) -> Table<'_> {
        let rows = [["pg-main-1", "12"], ["pg-main-2", "7"], ["laya", "130"], ["mochi", "4"]];
        Table::new(theme, rows, [Constraint::Length(10), Constraint::Length(5)]).header(["Name", "CPU"]).numeric([1])
    }

    #[test]
    fn the_header_has_a_fill_and_numbers_align_right() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 5));
        Widget::render(machines(&theme), buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "  Name          CPU ");
        assert_eq!(row(&buf, 3), "  laya          130 ");
        assert_eq!(buf[(0, 0)].bg, buf[(19, 0)].bg);
        assert_ne!(buf[(0, 0)].bg, Color::Reset, "the header has a fill");
        assert_eq!(buf[(0, 1)].bg, Color::Reset, "a record has none");
        assert_eq!(buf[(2, 0)].fg, theme.color(theme.tokens().muted_foreground));
    }

    #[test]
    fn md_leaves_a_blank_row_and_the_selection_stays_on_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 4));
        let mut state = TableState::new().with_selected(3);
        StatefulWidget::render(machines(&theme).size(Size::Md), buf.area, &mut buf, &mut state);
        // Three body rows hold two records at `Md`.
        assert_eq!(state.offset(), 2);
        assert!(row(&buf, 1).starts_with("  laya"));
        assert_eq!(row(&buf, 2).trim_end_matches('│').trim_end(), "", "a blank row");
        assert!(row(&buf, 3).starts_with("▌ mochi"));
        assert_eq!(buf[(19, 3)].symbol(), "│", "the scrollbar is in the last column");
    }

    #[test]
    fn empty_loading_and_paged_states() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let empty = Table::new(&theme, Vec::<[&str; 2]>::new(), [Constraint::Length(10), Constraint::Length(5)])
            .header(["Name", "CPU"])
            .empty(EmptyState::new(&theme, "No machines"));
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 8));
        Widget::render(empty, buf.area, &mut buf);
        assert!((1..8).any(|y| row(&buf, y).contains("No machines")));

        let loading = machines(&theme).loading(3);
        assert_eq!(loading.height(20), 4);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 5));
        Widget::render(loading, buf.area, &mut buf);
        assert!(row(&buf, 1).chars().all(|c| c == '▄' || c == ' '), "bars, no text: {}", row(&buf, 1));
        assert_eq!(buf[(2, 1)].symbol(), "▄");
        assert_ne!(buf[(2, 1)].fg, Color::Reset);
        assert_eq!(buf[(2, 1)].bg, Color::Reset, "the half above the bar keeps what was there");
        assert_eq!(buf[(2, 4)].symbol(), " ", "three rows only");

        let paged = machines(&theme).pagination(Pagination::new(&theme, 0, 3));
        assert_eq!(paged.height(20), 7);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 10));
        Widget::render(paged, buf.area, &mut buf);
        assert_eq!(row(&buf, 5).trim(), "");
        assert!(row(&buf, 6).contains('1') && row(&buf, 6).contains('›'), "{}", row(&buf, 6));
    }

    #[test]
    fn tiny_areas_draw_without_panicking() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for (w, h) in [(0, 0), (1, 1), (3, 2), (8, 3), (40, 1)] {
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            let mut state = TableState::new().with_selected(9);
            StatefulWidget::render(machines(&theme).pagination(Pagination::new(&theme, 2, 9)), buf.area, &mut buf, &mut state);
            Widget::render(machines(&theme).loading(4).size(Size::Md), buf.area, &mut buf);
        }
    }
}
