use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::{StatefulWidget, Widget};

use crate::page::scrollbar;
use crate::surface::{fill, write};
use crate::text::{cells, cut, split};
use crate::{highlight, Theme, Tone};

/// The columns between the time, the level and the message.
const GAP: u16 = 2;

/// How serious a log line is. It colors the level text.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Level {
    /// `danger`.
    Error,
    /// `warning`.
    Warn,
    /// `foreground`.
    #[default]
    Info,
    /// `muted-foreground`.
    Debug,
}

impl Level {
    fn style(self, theme: &Theme) -> Style {
        match self {
            Level::Error => theme.fg(Tone::Danger.rgb(theme)),
            Level::Warn => theme.fg(Tone::Warning.rgb(theme)),
            Level::Info => theme.text(),
            Level::Debug => theme.muted(),
        }
    }
}

/// One line of a [`LogView`]: an optional time, an optional level with the
/// text the product gives it, such as "WARN", and the message.
#[derive(Clone, Debug)]
pub struct LogLine<'a> {
    time: Option<&'a str>,
    level: Option<(Level, &'a str)>,
    text: Line<'a>,
}

impl<'a> LogLine<'a> {
    pub fn new(text: impl Into<Line<'a>>) -> Self {
        Self { time: None, level: None, text: text.into() }
    }

    /// The time, in `subtle-foreground`, in a column of its own.
    #[must_use]
    pub fn time(mut self, time: &'a str) -> Self {
        self.time = Some(time);
        self
    }

    /// The level and its readable text, such as `(Level::Warn, "WARN")`.
    #[must_use]
    pub fn level(mut self, level: Level, text: &'a str) -> Self {
        self.level = Some((level, text));
        self
    }
}

/// Where a [`LogView`] is scrolled to, and whether it follows the end.
/// It starts following. Scrolling up pauses it; scrolling back to the end,
/// or [`LogState::end`], follows again.
#[derive(Clone, Debug)]
pub struct LogState {
    offset: usize,
    follow: bool,
    /// The rows and the view at the last draw.
    rows: usize,
    view: usize,
    /// The lines at the last draw, and when the view paused.
    lines: usize,
    paused_at: usize,
}

impl Default for LogState {
    fn default() -> Self {
        Self { offset: 0, follow: true, rows: 0, view: 0, lines: 0, paused_at: 0 }
    }
}

impl LogState {
    /// True while the view stays at the end as lines come in.
    pub fn is_following(&self) -> bool {
        self.follow
    }

    /// The first row on screen.
    pub fn offset(&self) -> usize {
        self.offset
    }

    /// Scrolls by `delta` rows. Up pauses the following; reaching the end
    /// follows again.
    pub fn scroll(&mut self, delta: isize) {
        let max = self.rows.saturating_sub(self.view);
        self.offset = self.offset.saturating_add_signed(delta).min(max);
        if self.offset >= max {
            self.follow = true;
        } else if self.follow {
            self.follow = false;
            self.paused_at = self.lines;
        }
    }

    /// Back to the end, following.
    pub fn end(&mut self) {
        self.follow = true;
    }

    /// To the first row, paused.
    pub fn top(&mut self) {
        self.scroll(-(self.offset as isize));
    }

    /// `↑` `↓` and `k` `j` scroll a row, page up and down half a view,
    /// `g` and home go to the top, `G` and end follow the end. Returns true
    /// when the key scrolled.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, code: KeyCode) -> bool {
        let half = (self.view / 2).max(1) as isize;
        let (before, follow) = (self.offset, self.follow);
        match code {
            KeyCode::Up | KeyCode::Char('k') => self.scroll(-1),
            KeyCode::Down | KeyCode::Char('j') => self.scroll(1),
            KeyCode::PageUp => self.scroll(-half),
            KeyCode::PageDown => self.scroll(half),
            KeyCode::Home | KeyCode::Char('g') => self.top(),
            KeyCode::End | KeyCode::Char('G') => self.end(),
            _ => return false,
        }
        self.offset != before || self.follow != follow
    }
}

/// A scrolling region of log lines: an optional time column in
/// `subtle-foreground`, a level column in the level's color (error
/// `danger`, warn `warning`, info `foreground`, debug `muted-foreground`),
/// then the message. Long messages are cut with `…`, or wrap under the
/// message column with [`LogView::wrap`].
///
/// It follows the end as lines come in. Scrolling up pauses it, and the
/// last row then says "Paused" and how many lines came in since. The
/// scrollbar a [`Page`](crate::Page) draws sits in the last column.
/// [`LogView::highlight`] marks the matches of a search. Keys go to
/// [`LogState::key`]. It draws no fill, so it sits on the page or on a
/// [`Card`](crate::Card).
#[derive(Clone, Copy, Debug)]
pub struct LogView<'a> {
    theme: &'a Theme,
    lines: &'a [LogLine<'a>],
    wrap: bool,
    query: &'a str,
}

impl<'a> LogView<'a> {
    pub fn new(theme: &'a Theme, lines: &'a [LogLine<'a>]) -> Self {
        Self { theme, lines, wrap: false, query: "" }
    }

    /// Long messages wrap under the message column instead of being cut.
    #[must_use]
    pub fn wrap(mut self, wrap: bool) -> Self {
        self.wrap = wrap;
        self
    }

    /// Marks each match of `query` in the messages, as a search does.
    #[must_use]
    pub fn highlight(mut self, query: &'a str) -> Self {
        self.query = query;
        self
    }
}

impl StatefulWidget for LogView<'_> {
    type State = LogState;

    fn render(self, area: Rect, buf: &mut Buffer, state: &mut LogState) {
        let t = self.theme;
        let area = area.intersection(buf.area);
        let column = |width: usize| if width > 0 { width as u16 + GAP } else { 0 };
        let time = column(self.lines.iter().filter_map(|line| line.time).map(cells).max().unwrap_or(0));
        let level = column(self.lines.iter().filter_map(|line| line.level).map(|(_, text)| cells(text)).max().unwrap_or(0));
        // The last column is the scrollbar's.
        let message = area.width.saturating_sub(1).saturating_sub(time + level).max(1);
        let message_of = |line: &LogLine| -> Vec<Span<'static>> {
            let owned = line.text.spans.iter().map(|span| Span::styled(span.content.to_string(), line.text.style.patch(span.style)));
            let owned = Line::from(owned.collect::<Vec<_>>()).patch_style(t.text());
            highlight(t, owned, self.query).spans
        };
        let heights: Vec<usize> = match self.wrap {
            true => self.lines.iter().map(|line| split(message_of(line), usize::from(message)).len()).collect(),
            false => vec![1; self.lines.len()],
        };
        let rows: usize = heights.iter().sum();
        let paused = !state.follow;
        let view = usize::from(area.height.saturating_sub(u16::from(paused && area.height > 1)));
        let max = rows.saturating_sub(view);
        state.offset = if state.follow { max } else { state.offset.min(max) };
        state.rows = rows;
        state.view = view;
        state.lines = self.lines.len();
        if area.is_empty() {
            return;
        }

        // The first line on screen and the rows of it above the view.
        let (mut first, mut skip) = (0, state.offset);
        while first < heights.len() && skip >= heights[first] {
            skip -= heights[first];
            first += 1;
        }
        let mut y = area.y;
        let bottom = area.y + view as u16;
        for line in &self.lines[first.min(self.lines.len())..] {
            if y >= bottom {
                break;
            }
            let parts = if self.wrap { split(message_of(line), usize::from(message)) } else { vec![cut(message_of(line), usize::from(message)).0] };
            for (i, part) in parts.into_iter().enumerate().skip(std::mem::take(&mut skip)) {
                if y >= bottom {
                    break;
                }
                if i == 0 {
                    if let Some(text) = line.time {
                        write(buf, area.x, y, text, t.subtle());
                    }
                    if let Some((lvl, text)) = line.level {
                        write(buf, area.x.saturating_add(time), y, text, lvl.style(t));
                    }
                }
                let x = area.x.saturating_add(time + level);
                if x < area.right() {
                    buf.set_line(x, y, &Line::from(part), message.min(area.right() - x));
                }
                y += 1;
            }
        }
        scrollbar(buf, t, Rect::new(area.right() - 1, area.y, 1, view as u16), state.offset, rows);

        if paused {
            let row = Rect { y: area.bottom() - 1, height: 1, ..area };
            let alpha = if t.is_truecolor() { t.look().fill.alpha() } else { 1.0 };
            fill(t, buf, row, t.tokens().secondary, alpha);
            let new = self.lines.len().saturating_sub(state.paused_at);
            let text = match new {
                0 => " Paused".to_owned(),
                1 => " Paused, 1 new line".to_owned(),
                n => format!(" Paused, {n} new lines"),
            };
            let keys = [Span::styled("G", t.text()), Span::styled(" follow ", t.muted())];
            let room = usize::from(row.width).saturating_sub(10);
            let (spans, _) = cut(vec![Span::styled(text, t.text())], room);
            buf.set_line(row.x, row.y, &Line::from(spans), row.width);
            if row.width >= 20 {
                buf.set_line(row.right() - 9, row.y, &Line::from(keys.to_vec()), 9);
            }
        }
    }
}

impl Widget for LogView<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        StatefulWidget::render(self, area, buf, &mut LogState::default());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    fn lines(n: usize) -> Vec<LogLine<'static>> {
        (0..n).map(|i| LogLine::new(format!("line {i}")).time("12:00:01").level(Level::Info, "INFO")).collect()
    }

    #[test]
    fn it_follows_the_end_and_pauses_when_scrolled_up() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 3));
        let mut state = LogState::default();
        let log = lines(10);
        StatefulWidget::render(LogView::new(&theme, &log), buf.area, &mut buf, &mut state);
        assert_eq!(row(&buf, 2), "12:00:01  INFO  line 9                 │");
        state.scroll(-1);
        assert!(!state.is_following());
        let log = lines(13);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 3));
        StatefulWidget::render(LogView::new(&theme, &log), buf.area, &mut buf, &mut state);
        assert!(row(&buf, 1).contains("line 7"), "the view stays where it was: {}", row(&buf, 1));
        assert!(row(&buf, 2).starts_with(" Paused, 3 new lines") && row(&buf, 2).ends_with("G follow"), "{}", row(&buf, 2));
        state.end();
        StatefulWidget::render(LogView::new(&theme, &log), buf.area, &mut buf, &mut state);
        assert!(row(&buf, 2).contains("line 12"));
    }

    #[test]
    fn levels_take_their_color_and_long_lines_wrap() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let log = [LogLine::new("disk almost full on pg-main-1").level(Level::Warn, "WARN")];
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 3));
        StatefulWidget::render(LogView::new(&theme, &log).wrap(true), buf.area, &mut buf, &mut LogState::default());
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().warning_on_dark));
        assert_eq!(row(&buf, 0), "WARN  disk almost f");
        assert_eq!(row(&buf, 1), "      ull on pg-mai");
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
        Widget::render(LogView::new(&theme, &log), buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "WARN  disk almost…");
    }

    #[test]
    fn small_areas_draw_without_panicking() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let log = lines(5);
        for (w, h) in [(0, 0), (1, 1), (4, 2), (12, 1)] {
            let mut state = LogState::default();
            state.scroll(-2);
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            StatefulWidget::render(LogView::new(&theme, &log).wrap(true).highlight("line"), buf.area, &mut buf, &mut state);
        }
    }
}
