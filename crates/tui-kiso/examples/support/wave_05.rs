//! The pages of the data display components: table, key value, pagination,
//! filter input, search, log view and code block.

use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{StatefulWidget, TableState, Widget};
use tui_kiso::{
    fact, CodeBlock, EmptyState, FilterInput, KeyHints, Level, LogLine, LogState, LogView, Pagination, Search, Size,
    StatusBadge, Table, Theme, KV,
};

use super::{caption, inside, machines, put, MACHINES};

/// The width of one of two columns on a page 70 columns wide.
const COL: u16 = 34;
/// Where the second column starts.
const SECOND: u16 = COL + 2;

/// `area` from `x` columns in.
fn from(area: Rect, x: u16) -> Rect {
    let x = x.min(area.width);
    Rect { x: area.x + x, width: area.width - x, ..area }
}

/// A table of two columns with `records` of the machines, for the empty
/// and loading states.
fn names(t: &Theme, records: usize) -> Table<'_> {
    let rows = MACHINES.iter().take(records).map(|m| [Line::raw(m.name), (m.state)(t).into()]);
    Table::new(t, rows, [11, 15].map(Constraint::Length)).header(["Name", "State"])
}

pub fn table_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Size sm, a selected row. CPU % and Memory align right.");
    let rows = Rect::new(area.x, area.y + 1, area.width, 5).intersection(area);
    StatefulWidget::render(machines(t), rows, buf, &mut TableState::new().with_selected(1));

    caption(t, buf, area, 7, "Paged: the rows it shows at the left, the pages at the right");
    let paged = machines(t).pagination(Pagination::new(t, 2, 44).summary(9, 12, 173));
    let height = paged.height(area.width);
    if let Some(rect) = inside(area, 0, 8, area.width, height) {
        Widget::render(paged, rect, buf);
    }

    // A caption shows only with its table, on a page too short for both.
    let empty = names(t, 0).empty(EmptyState::new(t, "No machines").text("Create one to see it here."));
    if let Some(rect) = inside(area, 0, 17, COL, empty.height(COL)) {
        caption(t, buf, area, 16, "Empty: what to do next");
        Widget::render(empty, rect, buf);
    }
    let loading = names(t, 0).loading(3);
    if let Some(rect) = inside(area, SECOND, 17, COL, loading.height(COL)) {
        caption(t, buf, from(area, SECOND), 16, "Loading: a bar per column");
        Widget::render(loading, rect, buf);
    }
}

fn pairs(t: &Theme) -> Vec<(&'static str, Line<'_>)> {
    vec![
        ("Region", Line::raw("eu-west")),
        ("State", StatusBadge::success(t, "Running").into()),
        ("Image", Line::raw("postgres:18")),
        ("Restart policy", Line::raw("always")),
        ("Memory limit", Line::raw("1 GiB")),
    ]
}

pub fn kv_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Size sm: a muted key column");
    caption(t, buf, from(area, SECOND), 0, "Size md: a blank row between pairs");
    let sm = KV::new(t, pairs(t));
    if let Some(rect) = inside(area, 0, 2, COL, sm.height(COL)) {
        sm.render(rect, buf);
    }
    let md = KV::new(t, pairs(t)).size(Size::Md);
    if let Some(rect) = inside(area, SECOND, 2, COL, md.height(COL)) {
        md.render(rect, buf);
    }

    caption(t, buf, area, 12, "Two columns on Grid tracks: down, then across");
    let width = area.width.min(68);
    let two = KV::new(t, pairs(t).into_iter().chain([("Created", Line::raw("3 days ago"))])).columns(2);
    if let Some(rect) = inside(area, 0, 14, width, two.height(width)) {
        two.render(rect, buf);
    }

    caption(t, buf, area, 18, "fact is one row of a KV, for the rows of a Page. A long key is cut.");
    put(buf, area, 20, fact(t, 12, "Status", [Span::raw("Failed")]));
    put(buf, area, 21, fact(t, 12, "Last successful backup", [Span::raw("2 hours ago")]));
}

pub fn pagination_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows: [(&str, Pagination, u16); 6] = [
        ("The first page", Pagination::new(t, 0, 9), 40),
        ("Page 5 of 9", Pagination::new(t, 4, 9), 40),
        ("The last page", Pagination::new(t, 8, 9), 40),
        ("Few pages", Pagination::new(t, 1, 4), 40),
        ("With a summary", Pagination::new(t, 2, 9).summary(41, 60, 173), 64),
        ("Under 24 columns", Pagination::new(t, 2, 9), 20),
    ];
    for (i, (name, pagination, width)) in rows.into_iter().enumerate() {
        let dy = i as u16 * 3;
        caption(t, buf, area, dy, name);
        if let Some(rect) = inside(area, 0, dy + 1, width.min(area.width), 1) {
            pagination.render(rect, buf);
        }
    }
    caption(t, buf, area, 19, "← → or h l move it. The app loads the page and the rows.");
}

pub fn filter_input_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let width = 44.min(area.width.saturating_sub(2));
    let kept = Search { query: "pg-main".into(), typing: false };
    let typing = Search { query: String::new(), typing: true };

    caption(t, buf, area, 0, "A kept query: the count says what is left");
    if let Some(rect) = inside(area, 1, 1, width, 3) {
        FilterInput::new(t, &kept).count(2, 4).render(rect, buf);
    }
    caption(t, buf, area, 5, "Typing: the cursor and the focus bars");
    if let Some(rect) = inside(area, 1, 6, width, 3) {
        FilterInput::new(t, &typing).placeholder("Filter machines").count(4, 4).render(rect, buf);
    }
    caption(t, buf, area, 10, "Size sm, one row, above the list it filters");
    if let Some(rect) = inside(area, 1, 11, width, 1) {
        FilterInput::new(t, &kept).size(Size::Sm).count(2, 4).render(rect, buf);
    }
    let shown = MACHINES.iter().filter(|m| kept.hit(&[m.name]));
    let rows = shown.map(|m| [kept.mark(t, Line::raw(m.name)), (m.state)(t).into()]);
    let list = Table::new(t, rows, [11, 15].map(Constraint::Length)).header(["Name", "State"]);
    if let Some(rect) = inside(area, 0, 13, width + 2, list.height(width + 2)) {
        Widget::render(list, rect, buf);
    }
    caption(t, buf, area, 18, "It is a text filter: no chips and no typed conditions.");
    caption(t, buf, area, 19, "Filters narrow a list by facet.");
}

pub fn search_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let width = usize::from(area.width);
    let hints = |search: &Search, matches: usize, width: usize| {
        let prompt = search.prompt(t, matches, width);
        Line::from(KeyHints::new(t, [("enter", "keep"), ("esc", "clear")]).prefix(prompt).spans(width))
    };
    let typing = Search { query: "pg".into(), typing: true };
    let kept = Search { query: "pg".into(), typing: false };

    caption(t, buf, area, 0, "The footer while typing: / starts it, then the query and a cursor");
    put(buf, area, 1, hints(&typing, 3, width));
    caption(t, buf, area, 3, "Kept with enter: the field stays, without a cursor");
    put(buf, area, 4, hints(&kept, 3, width));
    caption(t, buf, area, 6, "On a narrow row the count goes first");
    put(buf, area, 7, Line::from(typing.prompt(t, 3, 14)));

    caption(t, buf, area, 9, "The list marks each match");
    for (i, m) in MACHINES.iter().enumerate() {
        let line = Line::from(vec![Span::raw("  "), Span::raw(m.name)]);
        put(buf, area, 10 + i as u16, kept.mark(t, line));
    }
    caption(t, buf, area, 15, "For a field above a list, draw a FilterInput on the same Search.");
}

fn log() -> Vec<LogLine<'static>> {
    let rows: [(&str, Level, &str, &str); 14] = [
        ("12:00:01", Level::Info, "INFO", "starting postgres 18.1 on pg-main-1"),
        ("12:00:01", Level::Debug, "DEBUG", "loaded config from /etc/postgresql/18/main"),
        ("12:00:02", Level::Info, "INFO", "listening on 127.0.0.1:5432"),
        ("12:00:04", Level::Info, "INFO", "replica pg-replica connected"),
        ("12:00:09", Level::Warn, "WARN", "checkpoint took 4.2 s, longer than the target"),
        ("12:00:12", Level::Debug, "DEBUG", "autovacuum on table machines"),
        ("12:00:15", Level::Error, "ERROR", "replica pg-replica stopped answering"),
        ("12:00:15", Level::Info, "INFO", "waiting for the replica to come back"),
        ("12:00:21", Level::Info, "INFO", "replica pg-replica connected"),
        ("12:00:30", Level::Warn, "WARN", "disk almost full: 91% of /var/lib/postgresql"),
        ("12:00:31", Level::Info, "INFO", "backup started"),
        ("12:00:44", Level::Info, "INFO", "backup done in 13 s"),
        ("12:00:45", Level::Debug, "DEBUG", "wal segment 0000000100000000000000A3 archived"),
        ("12:00:50", Level::Info, "INFO", "3 clients connected"),
    ];
    rows.into_iter().map(|(time, level, word, text)| LogLine::new(text).time(time).level(level, word)).collect()
}

pub fn log_view_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let lines = log();
    let width = area.width.min(70);

    caption(t, buf, area, 0, "Following the end. The level takes its tone; the time is subtle.");
    if let Some(rect) = inside(area, 0, 1, width, 7) {
        StatefulWidget::render(LogView::new(t, &lines), rect, buf, &mut LogState::default());
    }

    caption(t, buf, area, 9, "Scrolled up: it pauses and counts what came since");
    if let Some(rect) = inside(area, 0, 10, width, 6) {
        let mut state = LogState::default();
        // The view as it was, ten lines in, before ↑ ↑ paused it.
        let mut before = Buffer::empty(rect);
        StatefulWidget::render(LogView::new(t, &lines[..10]), rect, &mut before, &mut state);
        state.scroll(-2);
        StatefulWidget::render(LogView::new(t, &lines), rect, buf, &mut state);
    }

    // The rows that are left, on a short page.
    let rows = area.height.saturating_sub(18).min(6);
    let narrow = width.min(48);
    if let Some(rect) = inside(area, 0, 18, narrow, rows).filter(|_| rows >= 3) {
        caption(t, buf, area, 17, "Wrap on, and the matches of \"replica\" marked");
        let mut state = LogState::default();
        StatefulWidget::render(LogView::new(t, &lines[2..9]).wrap(true).highlight("replica"), rect, buf, &mut state);
    }
}

const COMPOSE: &str = "services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db
    volumes:
      - data:/var/lib/postgresql/data";

const COMMAND: &str = "pg_basebackup -h pg-main-1 -D /var/lib/postgresql/18/replica -U replicator -X stream -P";

pub fn code_block_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Line numbers, a title and lines 3 to 4 marked. No syntax color.");
    let width = area.width.min(56);
    let compose = CodeBlock::new(t, COMPOSE).line_numbers(true).title("compose.yaml").highlight(3..=4);
    if let Some(rect) = inside(area, 0, 1, width, compose.height(width)) {
        compose.render(rect, buf);
    }

    caption(t, buf, area, 12, "A long line is cut");
    caption(t, buf, from(area, SECOND), 12, "or wraps");
    let cut = CodeBlock::new(t, COMMAND).size(Size::Sm);
    if let Some(rect) = inside(area, 0, 13, COL, cut.height(COL)) {
        cut.render(rect, buf);
    }
    let wrapped = CodeBlock::new(t, COMMAND).size(Size::Sm).wrap(true);
    if let Some(rect) = inside(area, SECOND, 13, COL, wrapped.height(COL)) {
        wrapped.render(rect, buf);
    }
}
