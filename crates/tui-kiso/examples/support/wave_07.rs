//! Gallery pages of wave 7: the shell and the navigation.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{
    AppShell, Breadcrumb, Button, ButtonVariant, Header, KeyHints, PageHeader, Search, Side, SideItem, Sidebar, Tabs, Theme,
};

use super::{caption, put};

/// `area` cut to `width` columns from its left edge, `dy` rows down.
fn row(area: Rect, dy: u16, width: u16, height: u16) -> Rect {
    Rect::new(area.x, area.y.saturating_add(dy), width.min(area.width), height).intersection(area)
}

/// A mark at the end of a row that is `width` wide, so a cut is visible.
fn edge(t: &Theme, buf: &mut Buffer, at: Rect) {
    if !at.is_empty() && at.right() < buf.area.right() {
        buf.set_string(at.right(), at.y, "│", t.subtle());
    }
}

pub fn header_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let right = [Span::styled("seba", t.muted()), Span::raw("  "), Span::styled("●", t.success()), Span::styled(" online", t.muted())];
    let rows: [(&str, u16, Header); 5] = [
        ("Brand and version", area.width, Header::new(t, "pg-probe", "0.4.0")),
        ("With the scope", area.width, Header::new(t, "pg-probe", "0.4.0").scope("pg-main")),
        (
            "With the path and the right side",
            area.width,
            Header::new(t, "pg-probe", "0.4.0").scope("pg-main").breadcrumb(["Machines", "pg-main-2", "Logs"]).right(right.clone()),
        ),
        (
            "At 36 columns the right side drops, then the path collapses",
            36,
            Header::new(t, "pg-probe", "0.4.0").scope("pg-main").breadcrumb(["Machines", "pg-main-2", "Logs"]).right(right),
        ),
        ("At 20 columns the brand stays", 20, Header::new(t, "pg-probe", "0.4.0").scope("pg-main").title("Machines")),
    ];
    for (i, (label, width, header)) in rows.into_iter().enumerate() {
        let y = i as u16 * 3;
        caption(t, buf, area, y, label);
        let at = row(area, y + 1, width, 1);
        header.render(at, buf);
        if width < area.width {
            edge(t, buf, at);
        }
    }
    caption(t, buf, area, 16, "Header is the app bar, once per screen.");
}

pub fn tabs_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let views = ["Running 12", "Waiting 3", "Blocking 1", "Done 40"];
    let rows: [(&str, u16, Tabs); 5] = [
        ("Running is current", area.width, Tabs::new(t, views, 0)),
        ("Waiting is current; the number is the key", area.width, Tabs::new(t, views, 1)),
        ("Blocking is disabled", area.width, Tabs::new(t, views, 0).disabled([2])),
        ("Without numbers, for tabs moved with [ and ]", area.width, Tabs::new(t, ["Summary", "Logs", "Settings"], 1).numbered(false)),
        ("At 26 columns the tabs farthest from the current one drop", 26, Tabs::new(t, views, 3)),
    ];
    for (i, (label, width, tabs)) in rows.into_iter().enumerate() {
        let y = i as u16 * 4;
        caption(t, buf, area, y, label);
        let at = row(area, y + 1, width, 2);
        tabs.render(at, buf);
        if width < area.width {
            edge(t, buf, Rect { height: 1, ..at });
        }
    }
    caption(t, buf, area, 21, "The current tab has the accent and a heavy rule.");
}

/// The height of a map, in rows: the header, the footer, and what is between.
const MAP_ROWS: u16 = 9;

/// The map of `screen` in cells of 6 columns, one letter per area. The
/// header and the footer are one row each; the rest shares the rows between.
fn shell_map(t: &Theme, buf: &mut Buffer, at: Rect, shell: AppShell, screen: Rect) {
    let areas = shell.areas();
    let middle = u32::from(MAP_ROWS) - 2;
    let top = u32::from(areas.page.y);
    let span = u32::from(areas.footer.y).saturating_sub(top).max(1);
    let col = |x: u16| u32::from(x) / 6;
    let rows = |r: Rect| {
        let y0 = 1 + (u32::from(r.y).saturating_sub(top) * middle / span).min(middle - 1);
        let y1 = (1 + (u32::from(r.bottom()).saturating_sub(top) * middle).div_ceil(span)).clamp(y0 + 1, middle + 1);
        (y0, y1)
    };
    let scale = |r: Rect, role: char| {
        let (x0, x1) = (col(r.x), u32::from(r.right()).div_ceil(6));
        let (y0, y1) = match role {
            'H' => (0, 1),
            'F' => (u32::from(MAP_ROWS) - 1, u32::from(MAP_ROWS)),
            _ => rows(r),
        };
        Rect::new(at.x.saturating_add(x0 as u16), at.y.saturating_add(y0 as u16), (x1 - x0).max(1) as u16, (y1 - y0) as u16)
    };
    let frame = Rect::new(at.x, at.y, screen.width.div_ceil(6), MAP_ROWS);
    let fill = |buf: &mut Buffer, r: Rect, glyph: &str, style: Style| {
        for p in r.intersection(frame).intersection(buf.area).positions() {
            buf[p].set_symbol(glyph).set_style(style);
        }
    };
    let parts = [
        (Some(areas.page), 'P', t.text()),
        (areas.sidebar, 'S', t.muted()),
        (areas.header, 'H', t.strong()),
        (Some(areas.footer), 'F', t.muted()),
        (areas.overlay, 'O', t.link()),
    ];
    for (r, role, style) in parts {
        if let Some(r) = r {
            fill(buf, scale(r, role), &role.to_string(), style);
        }
    }
}

pub fn app_shell_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let maps: [(&str, Rect, bool); 3] = [
        ("From 100 columns: beside", Rect::new(0, 0, 120, 40), false),
        ("Under 100: collapsed", Rect::new(0, 0, 90, 30), false),
        ("Opened with a key", Rect::new(0, 0, 90, 30), true),
    ];
    let mut x = area.x;
    for (label, screen, open) in maps {
        let shell = AppShell::new(screen).side(Side::Left).sidebar(24).header(true).open(open);
        let wide = screen.width.div_ceil(6);
        buf.set_stringn(x, area.y, label, usize::from(area.right().saturating_sub(x)), t.muted());
        shell_map(t, buf, Rect::new(x, area.y + 1, wide, MAP_ROWS), shell, screen);
        x = x.saturating_add(wide.max(label.chars().count() as u16).saturating_add(3));
    }
    let lines = [
        "H header   S sidebar   P page   F footer   O overlay",
        "AppShell draws nothing. It returns the areas, like Grid.",
        "The sidebar side is the crate option: Side::Left or Side::Right.",
        "Under 80 by 24 it says so: draw message() and nothing else.",
    ];
    for (i, text) in lines.into_iter().enumerate() {
        put(buf, area, 11 + i as u16, Line::styled(text, if i == 0 { t.subtle() } else { t.muted() }));
    }
    let small = Rect::new(area.x, area.y + 16, area.width.min(48), 5).intersection(area);
    let mut hold = Buffer::empty(small);
    AppShell::new(small).message(t, &mut hold);
    for p in small.positions() {
        buf[p] = hold[p].clone();
    }
}

pub fn page_header_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let mut y = 0;
    let cases: [(&str, u16, PageHeader); 3] = [
        (
            "Breadcrumb, title, description and actions",
            area.width,
            PageHeader::new(t, "Machines")
                .breadcrumb(["Projects", "pg-main", "Machines"])
                .description("Every machine in pg-main, with its state and region.")
                .action(Button::new(t, "Export"))
                .action(Button::new(t, "New machine").variant(ButtonVariant::Primary)),
        ),
        ("Title only", area.width, PageHeader::new(t, "Machines")),
        (
            "At 40 columns the actions wrap below the title",
            40,
            PageHeader::new(t, "Machines")
                .description("Every machine in pg-main.")
                .action(Button::new(t, "Export"))
                .action(Button::new(t, "New machine").variant(ButtonVariant::Primary)),
        ),
    ];
    for (label, width, header) in cases {
        caption(t, buf, area, y, label);
        let height = header.height(width);
        let at = row(area, y + 1, width, height);
        header.render(at, buf);
        if width < area.width {
            edge(t, buf, Rect { height: 1, ..at });
        }
        y += height + 3;
    }
    caption(t, buf, area, y, "PageHeader is for one page. The app bar is Header.");
}

pub fn breadcrumb_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let path = ["Projects", "pg-main", "Machines", "pg-main-2", "Logs"];
    let widths: [(u16, &str); 5] = [
        (area.width, "The whole path"),
        (46, "At 46 columns the middle collapses"),
        (30, "At 30 columns, less of the path"),
        (18, "At 18 columns, the first part drops"),
        (6, "At 6 columns, the page alone"),
    ];
    for (i, (width, label)) in widths.into_iter().enumerate() {
        let y = i as u16 * 3;
        caption(t, buf, area, y, label);
        let at = row(area, y + 1, width, 1);
        Breadcrumb::new(t, path).render(at, buf);
        if width < area.width {
            edge(t, buf, at);
        }
    }
    caption(t, buf, area, 16, "The last part is the page: bold. The parts above it are muted.");
}

pub fn sidebar_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let apps = |t: &Theme| {
        ["comfyui", "laya", "legacy"].map(|name| {
            let item = SideItem::new(name).mark(Span::styled("●", if name == "legacy" { t.subtle() } else { t.success() }));
            item.disabled(name == "legacy")
        })
    };
    let side = |focused: bool| {
        Sidebar::new(t)
            .head([Line::styled(" self-host ", t.brand()), Line::styled("  momoi.internal", t.muted())])
            .group("Pages", [SideItem::new("Overview").key("1"), SideItem::new("Databases").key("2").badge("3"), SideItem::new("Routes").key("3")])
            .group("Applications", apps(t))
            .current(Some(1))
            .focused(focused)
    };
    let long = Sidebar::new(t)
        .group("Machines", (1..=14).map(|n| {
                let item = SideItem::new(format!("pg-main-{n}"));
                if n % 4 == 0 { item.badge("2") } else { item }
            }))
        .current(Some(11))
        .focused(true);
    let tall = area.height.saturating_sub(2);
    let columns = [(0, "The page has focus"), (24, "The sidebar has focus"), (48, "Taller than the screen")];
    for (x, label) in columns {
        put(buf, Rect { x: area.x + x, width: area.width.saturating_sub(x), ..area }, 0, Line::styled(label, t.muted()));
    }
    side(false).render(Rect::new(area.x, area.y + 2, 20, tall).intersection(area), buf);
    side(true).render(Rect::new(area.x + 24, area.y + 2, 20, tall).intersection(area), buf);
    long.render(Rect::new(area.x + 48, area.y + 2, 20, tall.min(10)).intersection(area), buf);
    let note = "Navigation is the list of SideItems inside the Sidebar. A group has a caption; an item has a key, a mark, a count and a disabled state.";
    let at = Rect { y: area.y + 14, ..area };
    for (i, text) in tui_kiso::wrap(note, 20).into_iter().enumerate() {
        put(buf, Rect { x: area.x + 48, ..at }, i as u16 + 2, Line::styled(text, t.muted()));
    }
}

pub fn hints_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let hints = [("↑↓", "move"), ("enter", "open"), ("/", "search"), ("s", "sort"), ("?", "help"), ("q", "quit")];
    let widths: [(u16, &str); 5] = [
        (60, "At 60 columns, every hint fits"),
        (40, "At 40 columns, sort and search drop first"),
        (26, "At 26 columns, open drops too"),
        (15, "At 15 columns, help and quit stay"),
        (8, "At 8 columns, quit stays alone"),
    ];
    for (n, (width, label)) in widths.into_iter().enumerate() {
        let y = n as u16 * 3;
        caption(t, buf, area, y, label);
        let line = row(area, y + 1, width, 1);
        KeyHints::new(t, hints).render(line, buf);
        edge(t, buf, line);
    }
    caption(t, buf, area, 15, "The current view's label is bold");
    let views = [("1", "Overview"), ("2", "Machines"), ("3", "Logs"), ("?", "help"), ("q", "quit")];
    KeyHints::new(t, views).current(1).render(row(area, 16, area.width, 1), buf);
    caption(t, buf, area, 18, "After a search prompt");
    let search = Search { query: "fail".into(), typing: true };
    let keys = [("↑/↓", "move"), ("enter", "keep"), ("esc", "clear")];
    KeyHints::new(t, keys).prefix(search.prompt(t, 3, 40)).render(row(area, 19, area.width, 1), buf);
}
