//! The step family: [`Steps`], [`StepBar`] and [`StepList`] share one set of
//! marks. [`StepState`] and [`step`](crate::step) in `notice.rs` stay as they
//! are, for the Crush style lines of a run.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::{braille, StepState, Theme};

/// The accent as text: the `link` token, which follows the accent and keeps
/// its contrast on the page in light and in 256 colors.
fn accent(theme: &Theme) -> Style {
    theme.link()
}

/// The mark of a step and its style. Done `✓` in success, current `●` in
/// the accent, pending `○` in subtle, failed `×` in danger, skipped `–` in
/// muted. A running step shows a braille frame in the accent, current or
/// not. `current` only changes a pending step, since a done or failed step
/// keeps its own mark.
fn mark(theme: &Theme, state: StepState, current: bool) -> (&'static str, Style) {
    match state {
        StepState::Done => ("✓", theme.success()),
        StepState::Failed => ("×", theme.danger()),
        StepState::Skipped => ("–", theme.muted()),
        StepState::Running(tick) => (braille(tick), accent(theme)),
        StepState::Pending if current => ("●", accent(theme)),
        StepState::Pending => ("○", theme.subtle()),
    }
}

/// The style of a step's name. The current step is bold, so the position
/// does not rest on color alone.
fn label(theme: &Theme, state: StepState, current: bool) -> Style {
    let bold = Modifier::BOLD;
    match state {
        StepState::Failed => theme.danger().add_modifier(bold),
        StepState::Running(_) => accent(theme).add_modifier(bold),
        StepState::Done if current => theme.strong(),
        StepState::Done => theme.text(),
        StepState::Pending if current => accent(theme).add_modifier(bold),
        StepState::Pending | StepState::Skipped => theme.muted(),
    }
}

/// Writes `text` at `dx`, `dy` from the top left of `area`, cut at the edge
/// of the area and of the buffer. It keeps the fill under it.
fn at(buf: &mut Buffer, area: Rect, dx: u16, dy: u16, text: &str, style: Style) {
    let (x, y) = (area.x.saturating_add(dx), area.y.saturating_add(dy));
    let right = area.right().min(buf.area.right());
    if dy >= area.height || x >= right || x < buf.area.x || y < buf.area.y || y >= buf.area.bottom() {
        return;
    }
    buf.set_stringn(x, y, text, usize::from(right - x), style);
}

#[derive(Clone, Copy, Debug)]
struct Item<'a> {
    label: &'a str,
    detail: &'a str,
    state: StepState,
}

/// A bounded guided flow: where the person is among named steps.
///
/// Three forms, by the room. When every step fits on one row, it is the
/// horizontal form: `✓ Source ─── ● Options ─── ○ Review`. When it does
/// not, and the area has the rows, it is the vertical form: a mark, the
/// name, and under it a `│` connector with the step's detail. When it
/// has neither, it is one row of `● Step 2 of 5  Options`. [`Steps::height`]
/// says which rows to give it.
///
/// `current` is independent of the state, as on the web: the current step
/// can also have failed. Marks are shared with [`StepBar`] and
/// [`StepList`]: done `✓` in success, current `●` in the accent (a braille
/// frame when it runs), pending `○` in subtle, failed `×` in danger,
/// skipped `–` in muted. The caller owns validation and navigation.
#[derive(Clone, Debug)]
pub struct Steps<'a> {
    theme: &'a Theme,
    items: Vec<Item<'a>>,
    current: Option<usize>,
}

impl<'a> Steps<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, items: Vec::new(), current: None }
    }

    /// Adds a step.
    #[must_use]
    pub fn step(self, label: &'a str, state: StepState) -> Self {
        self.described(label, "", state)
    }

    /// Adds a step with a line of supporting text, shown in the vertical
    /// form.
    #[must_use]
    pub fn described(mut self, label: &'a str, detail: &'a str, state: StepState) -> Self {
        self.items.push(Item { label, detail, state });
        self
    }

    /// The step the person is on. Nothing is current until the caller says.
    #[must_use]
    pub fn current(mut self, index: usize) -> Self {
        self.current = Some(index);
        self
    }

    /// The columns of the horizontal form.
    pub fn width(&self) -> u16 {
        let marks: usize = self.items.iter().map(|i| 2 + cells(i.label)).sum();
        let links = self.items.len().saturating_sub(1) * 5;
        u16::try_from(marks + links).unwrap_or(u16::MAX)
    }

    /// The rows of the vertical form: one per step, and with any detail a
    /// connector row between steps.
    pub fn rows(&self) -> u16 {
        let n = self.items.len();
        if n == 0 {
            return 0;
        }
        let rows = if self.items.iter().any(|i| !i.detail.is_empty()) {
            2 * n - 1 + usize::from(!self.items[n - 1].detail.is_empty())
        } else {
            n
        };
        u16::try_from(rows).unwrap_or(u16::MAX)
    }

    /// The rows to give it at `width`: one when the horizontal form fits,
    /// the rows of the vertical form when it does not.
    pub fn height(&self, width: u16) -> u16 {
        if self.width() <= width {
            1.min(self.rows())
        } else {
            self.rows()
        }
    }

    fn row(&self) -> Line<'static> {
        let t = self.theme;
        let mut spans = Vec::new();
        for (i, item) in self.items.iter().enumerate() {
            let current = self.current == Some(i);
            let (glyph, style) = mark(t, item.state, current);
            if i > 0 {
                let done = matches!(self.items[i - 1].state, StepState::Done);
                spans.push(Span::styled(" ─── ", if done { t.success() } else { t.subtle() }));
            }
            spans.push(Span::styled(format!("{glyph} "), style));
            spans.push(Span::styled(item.label.to_owned(), label(t, item.state, current)));
        }
        Line::from(spans)
    }

    fn count(&self) -> Line<'static> {
        let t = self.theme;
        let n = self.items.len();
        match self.current.filter(|i| *i < n) {
            Some(i) => {
                let item = self.items[i];
                let (glyph, style) = mark(t, item.state, true);
                Line::from(vec![
                    Span::styled(format!("{glyph} "), style),
                    Span::styled(format!("Step {} of {n}", i + 1), t.muted()),
                    Span::styled(format!("  {}", item.label), label(t, item.state, true)),
                ])
            }
            None if self.items.iter().all(|i| matches!(i.state, StepState::Done | StepState::Skipped)) => {
                Line::from(Span::styled(format!("✓ All {n} steps done"), t.success()))
            }
            None => Line::from(Span::styled("No current step", t.muted())),
        }
    }

    fn column(&self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let detailed = self.items.iter().any(|i| !i.detail.is_empty());
        let mut dy = 0u16;
        for (i, item) in self.items.iter().enumerate() {
            let current = self.current == Some(i);
            let (glyph, style) = mark(t, item.state, current);
            at(buf, area, 0, dy, glyph, style);
            at(buf, area, 2, dy, item.label, label(t, item.state, current));
            dy = dy.saturating_add(1);
            if !detailed {
                continue;
            }
            let last = i + 1 == self.items.len();
            if !last {
                let done = matches!(item.state, StepState::Done);
                at(buf, area, 0, dy, "│", if done { t.success() } else { t.subtle() });
            }
            if !item.detail.is_empty() {
                at(buf, area, 2, dy, item.detail, t.muted());
            }
            if !last || !item.detail.is_empty() {
                dy = dy.saturating_add(1);
            }
        }
    }
}

impl Widget for Steps<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if self.items.is_empty() || area.width == 0 || area.height == 0 {
            return;
        }
        let line = if self.width() <= area.width {
            self.row()
        } else if area.height >= self.rows() {
            return self.column(area, buf);
        } else {
            self.count()
        };
        let mut x = 0u16;
        for span in &line.spans {
            at(buf, area, x, 0, &span.content, span.style);
            x = x.saturating_add(cells(&span.content) as u16);
        }
    }
}

/// One row that sums up a run: one segment per step, in the step's state.
/// It answers "how far" and "where it stopped" where a [`StepList`] does
/// not fit, such as a table cell. It draws no text; the app puts the count
/// or the current step beside it.
///
/// A done segment is `━` in success, a failed one `━` in danger with `×` in
/// the middle when it is three cells wide, a skipped one `╌` in muted, a
/// pending one `─` in subtle. A running one is `━` in the accent, as far as
/// [`StepBar::progress`] says, and `─` after it. The segments share the
/// width, with one cell between them when the width allows.
#[derive(Clone, Debug)]
pub struct StepBar<'a> {
    theme: &'a Theme,
    states: Vec<StepState>,
    progress: Option<f32>,
}

impl<'a> StepBar<'a> {
    pub fn new(theme: &'a Theme, states: impl IntoIterator<Item = StepState>) -> Self {
        Self { theme, states: states.into_iter().collect(), progress: None }
    }

    /// How much of a running segment is done, from 0 to 1. Without it, a
    /// running segment is full.
    #[must_use]
    pub fn progress(mut self, progress: f32) -> Self {
        self.progress = Some(progress.clamp(0.0, 1.0));
        self
    }

    /// The least width that gives each step one cell and a gap.
    pub fn min_width(&self) -> u16 {
        u16::try_from((2 * self.states.len()).saturating_sub(1)).unwrap_or(u16::MAX)
    }

    /// The cells of each segment at `width`.
    fn sizes(&self, width: u16) -> (Vec<u16>, u16) {
        let n = u16::try_from(self.states.len()).unwrap_or(u16::MAX);
        let gap = u16::from(width >= self.min_width());
        let room = width.saturating_sub(gap * n.saturating_sub(1));
        let sizes = (0..n).map(|i| room / n + u16::from(i < room % n)).collect();
        (sizes, gap)
    }
}

impl Widget for StepBar<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if self.states.is_empty() || area.width == 0 || area.height == 0 {
            return;
        }
        let t = self.theme;
        let (sizes, gap) = self.sizes(area.width);
        let mut x = 0u16;
        for (state, size) in self.states.iter().zip(sizes) {
            let n = usize::from(size);
            let (text, style) = match state {
                StepState::Done => ("━".repeat(n), t.success()),
                StepState::Failed => ("━".repeat(n), t.danger()),
                StepState::Skipped => ("╌".repeat(n), t.muted()),
                StepState::Pending => ("─".repeat(n), t.subtle()),
                StepState::Running(_) => {
                    let full = self.progress.map_or(n, |p| (p * n as f32).round() as usize);
                    at(buf, area, x, 0, &"━".repeat(full), accent(t));
                    at(buf, area, x.saturating_add(full as u16), 0, &"─".repeat(n - full), t.subtle());
                    x = x.saturating_add(size).saturating_add(gap);
                    continue;
                }
            };
            at(buf, area, x, 0, &text, style);
            if *state == StepState::Failed && n >= 3 {
                // `×` in the middle cell.
                at(buf, area, x.saturating_add(size / 2), 0, "×", style);
            }
            x = x.saturating_add(size).saturating_add(gap);
        }
    }
}

/// The steps of a run, one row each: the mark, the name in a column, then
/// its detail in `muted-foreground`. The vertical form when each step has
/// something to say, such as how long it took or why it was skipped.
///
/// It uses the same marks as [`Steps`] and [`StepBar`]. For the Crush style
/// line with a tree branch, use [`step`](crate::step).
#[derive(Clone, Debug)]
pub struct StepList<'a> {
    theme: &'a Theme,
    items: Vec<Item<'a>>,
}

impl<'a> StepList<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, items: Vec::new() }
    }

    /// Adds a step with its detail, which may be empty.
    #[must_use]
    pub fn step(mut self, label: &'a str, detail: &'a str, state: StepState) -> Self {
        self.items.push(Item { label, detail, state });
        self
    }

    /// The rows it takes: one per step.
    pub fn height(&self) -> u16 {
        u16::try_from(self.items.len()).unwrap_or(u16::MAX)
    }
}

impl Widget for StepList<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let name = self.items.iter().map(|i| cells(i.label)).max().unwrap_or(0) as u16;
        for (dy, item) in (0..area.height).zip(&self.items) {
            let (glyph, style) = mark(t, item.state, false);
            at(buf, area, 0, dy, glyph, style);
            at(buf, area, 2, dy, item.label, label(t, item.state, false));
            at(buf, area, 4 + name, dy, item.detail, t.muted());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn theme() -> Theme {
        Theme::truecolor(kiso_tokens::GOLD_DARK)
    }

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn each_state_has_its_own_mark() {
        let t = theme();
        let states = [StepState::Done, StepState::Pending, StepState::Failed, StepState::Skipped, StepState::Running(0)];
        let marks: Vec<_> = states.iter().map(|s| mark(&t, *s, false).0).collect();
        assert_eq!(marks, ["✓", "○", "×", "–", "⠋"]);
        assert_eq!(mark(&t, StepState::Pending, true).0, "●");
        assert_eq!(mark(&t, StepState::Done, true).0, "✓");
    }

    #[test]
    fn the_horizontal_form_joins_marks_with_connectors() {
        let t = theme();
        let steps = Steps::new(&t).step("Source", StepState::Done).step("Options", StepState::Pending).step("Review", StepState::Pending).current(1);
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 1));
        steps.clone().render(Rect::new(0, 0, 50, 1), &mut buf);
        assert_eq!(row(&buf, 0), "✓ Source ─── ● Options ─── ○ Review");
        assert_eq!((steps.width(), steps.height(50), steps.height(20)), (35, 1, 3));
    }

    #[test]
    fn a_narrow_area_falls_back_to_the_column_and_then_to_the_count() {
        let t = theme();
        let steps = Steps::new(&t)
            .described("Source", "Where the data is", StepState::Done)
            .described("Options", "", StepState::Pending)
            .step("Review", StepState::Pending)
            .current(1);
        assert_eq!(steps.rows(), 5);
        let mut buf = Buffer::empty(Rect::new(0, 0, 24, 5));
        steps.clone().render(Rect::new(0, 0, 24, 5), &mut buf);
        let rows: Vec<_> = (0..5).map(|y| row(&buf, y)).collect();
        assert_eq!(rows, ["✓ Source", "│ Where the data is", "● Options", "│", "○ Review"]);
        let mut buf = Buffer::empty(Rect::new(0, 0, 24, 1));
        steps.render(Rect::new(0, 0, 24, 1), &mut buf);
        assert_eq!(row(&buf, 0), "● Step 2 of 3  Options");
    }

    #[test]
    fn the_count_without_a_current_step_does_not_invent_progress() {
        let t = theme();
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
        Steps::new(&t).step("Alpha one", StepState::Done).step("Beta two", StepState::Pending).render(Rect::new(0, 0, 20, 1), &mut buf);
        assert_eq!(row(&buf, 0), "No current step");
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
        Steps::new(&t).step("Alpha one", StepState::Done).step("Beta two", StepState::Skipped).render(Rect::new(0, 0, 20, 1), &mut buf);
        assert_eq!(row(&buf, 0), "✓ All 2 steps done");
        Steps::new(&t).render(Rect::new(0, 0, 5, 1), &mut buf);
    }

    #[test]
    fn the_bar_shares_the_width_and_shows_where_it_stopped() {
        let t = theme();
        let states = [StepState::Done, StepState::Done, StepState::Failed, StepState::Pending];
        let mut buf = Buffer::empty(Rect::new(0, 0, 23, 1));
        StepBar::new(&t, states).render(Rect::new(0, 0, 23, 1), &mut buf);
        assert_eq!(row(&buf, 0), "━━━━━ ━━━━━ ━━×━━ ─────");
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        StepBar::new(&t, [StepState::Running(0), StepState::Pending, StepState::Skipped]).progress(0.5).render(Rect::new(0, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "━━── ─── ╌╌╌");
    }

    #[test]
    fn the_bar_holds_in_a_tiny_or_empty_area() {
        let t = theme();
        let mut buf = Buffer::empty(Rect::new(0, 0, 3, 1));
        StepBar::new(&t, [StepState::Done; 6]).render(Rect::new(0, 0, 3, 1), &mut buf);
        StepBar::new(&t, []).render(Rect::new(0, 0, 3, 1), &mut buf);
        StepBar::new(&t, [StepState::Done]).render(Rect::new(0, 0, 0, 1), &mut buf);
        StepBar::new(&t, [StepState::Done; 4]).render(Rect::new(1, 0, 40, 5), &mut buf);
    }

    #[test]
    fn the_list_aligns_the_details() {
        let t = theme();
        let list = StepList::new(&t).step("Pull", "1.2 s", StepState::Done).step("Build", "", StepState::Running(0)).step("Push", "Not needed", StepState::Skipped);
        assert_eq!(list.height(), 3);
        let mut buf = Buffer::empty(Rect::new(0, 0, 24, 3));
        list.render(Rect::new(0, 0, 24, 3), &mut buf);
        let rows: Vec<_> = (0..3).map(|y| row(&buf, y)).collect();
        assert_eq!(rows, ["✓ Pull   1.2 s", "⠋ Build", "– Push   Not needed"]);
    }
}
