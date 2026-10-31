//! A gallery of every component in the crate, like the web gallery.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery
//! Options: --accent <name>, --light, --snapshot <dir>, --json <file>

use std::io::IsTerminal;
use std::path::Path;
use std::process::ExitCode;

use ratatui::backend::TestBackend;
use ratatui::buffer::{Buffer, Cell};
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::{Constraint, Rect};
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::{TableState, Widget};
use ratatui::{Frame, Terminal};
use tui_kiso::{
    braille, fact, scramble, set_background, set_foreground, step, Act, Buttons, Columns, Field, FilterEdit, Filters, Form, Header,
    Ink, KeyHints, Look, Mark, Menu, Modal, Page, Palette, Pattern, Press, Question, Scroll, Search, SideItem, Side,
    Sidebar, StatusBadge, StepState, Stroke, Table, Tabs, Theme, ThemePicker, Title, Toast, ACCENTS,
};

const PRODUCT: &str = env!("CARGO_PKG_NAME");
const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Each component, and what its page shows.
const PAGES: [(&str, &str); 19] = [
    ("Theme", "Token colors at this depth, and the look of titles and rules."),
    ("Header", "The brand and version, then where the person is."),
    ("Title", "Where the person is, across the width."),
    ("Tabs", "The views of a screen; the current one takes the width."),
    ("Page", "Rows that scroll: sections, columns, a selection, code."),
    ("Table", "A ratatui table with Kiso's header and selection."),
    ("StatusBadge", "A mark and a word, in the tone's color."),
    ("KeyHints", "The footer keys. Help and quit always stay."),
    ("Buttons", "Solid buttons, half a row of fill above and below."),
    ("Form", "Labels in a column; focus is the list selection."),
    ("Modal", "The one framed element: a dialog over the page."),
    ("Question", "A question with facts, what happens, and buttons."),
    ("Palette", "Commands with their keys, opened with ctrl+p."),
    ("ThemePicker", "The accent and dark or light, previewed live."),
    ("Toast", "Notices, spinners and the steps of a run."),
    ("Sidebar", "The navigation, as wide as its longest line."),
    ("Filters", "One select per facet; f edits them, the page follows."),
    ("Menu", "The actions of one row, opened with a, under the row."),
    ("Detail", "A record as a page: tabs, facts, a failure and its run."),
];
const FORM: usize = 9;
const FILTERS: usize = 16;

const SIZE: (u16, u16) = (100, 30);

const USAGE: &str = "\
Usage: gallery [--accent <name>] [--light] [--snapshot <dir>] [--json <file>]

  --accent <name>    violet, terracotta, teal, cobalt, nocturne, tangerine,
                     red, gold, lime, plum, stone or steel. Default: gold.
  --light            Start with the light theme.
  --256              Send xterm-256 colors, as on a terminal without
                     truecolor.
  --snapshot <dir>   Write every page at 100 by 30 as HTML, then exit.
  --json <file>      Write every page and state in every theme as JSON for
                     the Kiso site, then exit.";

/// The states the Kiso site shows under a page, after the page itself.
const SITE_STATES: [(&str, usize, &str); 14] = [
    ("21-form-select", FORM, "Changed select"),
    ("20-form-typing", FORM, "Typing"),
    ("23-help", 10, "Help over a page"),
    ("29-help-80", 10, "At 80 by 24"),
    ("32-question-80", 11, "At 80 by 24"),
    ("31-palette-80", 12, "At 80 by 24"),
    ("24-theme-picker", 13, "Previewing an accent"),
    ("30-picker-80", 13, "At 80 by 24"),
    ("22-sidebar-focus", 15, "With focus"),
    ("28-80-by-24", 15, "Hidden at 80 by 24"),
    ("26-filter-editor", FILTERS, "Editing"),
    ("27-filtered", FILTERS, "Filtered"),
    ("34-filters-80", FILTERS, "Editing at 80 by 24"),
    ("33-menu-80", 17, "At 80 by 24"),
];

#[derive(Clone, Copy, PartialEq, Eq)]
enum Layer {
    Help,
}

struct App {
    theme: Theme,
    accent: usize,
    light: bool,
    page: usize,
    /// True when the page has focus, false for the sidebar.
    main: bool,
    layer: Option<Layer>,
    picker: Option<ThemePicker>,
    form: Form,
    filters: Filters,
    scroll: Scroll,
    quit: bool,
}

impl App {
    fn new(theme: Theme, accent: usize, light: bool) -> Self {
        Self {
            theme,
            accent,
            light,
            page: 0,
            main: false,
            layer: None,
            picker: None,
            form: demo_form(),
            filters: demo_filters(),
            scroll: Scroll::default(),
            quit: false,
        }
    }

    fn key(&mut self, key: KeyEvent) {
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        if ctrl && key.code == KeyCode::Char('c') {
            self.quit = true;
            return;
        }
        if self.layer.is_some() {
            // Any key closes help.
            self.layer = None;
            return;
        }
        // Help opens over any layer: F1 always, ? wherever it is not text.
        let typing = self.main && self.page == FORM && self.picker.is_none() && !self.filters.is_open();
        if key.code == KeyCode::F(1) || (key.code == KeyCode::Char('?') && !typing) {
            self.layer = Some(Layer::Help);
            return;
        }
        if let Some(mut picker) = self.picker {
            let open = picker.key(key.code);
            (self.accent, self.light) = (picker.accent, picker.light);
            self.theme = self.theme.with_tokens(picker.tokens());
            self.picker = open.then_some(picker);
            return;
        }
        if self.filters.is_open() {
            if self.filters.key(key) != FilterEdit::None {
                self.scroll.top();
            }
            return;
        }
        if self.main && self.page == FILTERS {
            match key.code {
                KeyCode::Char('f') => return self.filters.open(),
                KeyCode::Esc if self.filters.is_active() => return self.filters.clear(),
                _ => {}
            }
        }
        if self.main && self.page == FORM {
            match self.form.key(key) {
                Act::Cancel => self.main = false,
                Act::Submit | Act::Press(_) => self.form = demo_form(),
                Act::None => {}
            }
            return;
        }
        match key.code {
            KeyCode::Char('?') | KeyCode::F(1) => self.layer = Some(Layer::Help),
            KeyCode::Char('t') => self.picker = Some(ThemePicker::new(self.accent, self.light)),
            KeyCode::Tab | KeyCode::Enter if !self.main => self.main = true,
            KeyCode::Tab | KeyCode::Esc if self.main => self.main = false,
            KeyCode::Char('q') if self.main => self.main = false,
            KeyCode::Char('q') => self.quit = true,
            KeyCode::Up | KeyCode::Char('k') | KeyCode::Left if !self.main => self.open(self.page.saturating_sub(1)),
            KeyCode::Down | KeyCode::Char('j') | KeyCode::Right if !self.main => self.open(self.page + 1),
            KeyCode::Up | KeyCode::Char('k') => self.scroll.by(-1),
            KeyCode::Down | KeyCode::Char('j') => self.scroll.by(1),
            _ => {}
        }
    }

    fn open(&mut self, page: usize) {
        self.page = page.min(PAGES.len() - 1);
        self.scroll.top();
    }

    fn sidebar(&self) -> Sidebar<'_> {
        let t = &self.theme;
        let brand = Line::from(vec![Span::styled(format!(" {PRODUCT} {VERSION} "), t.brand())]);
        Sidebar::new(t)
            .head([brand, Line::default(), Line::styled("Kiso for ratatui", t.muted())])
            .group("Components", PAGES.iter().map(|(name, _)| SideItem::new(*name)))
            .current(Some(self.page))
            .focused(!self.main)
    }

    fn draw(&self, f: &mut Frame) {
        let t = &self.theme;
        let screen = f.area();
        let buf = f.buffer_mut();
        // No fill: the terminal's background, set with OSC 11, shows through.
        let body = body(screen);
        let foot = Rect::new(body.x, screen.bottom().saturating_sub(1), body.width, 1);
        let sidebar = self.sidebar();
        let (side, main) = sidebar.split(body, Side::Left);
        if let Some(area) = side {
            sidebar.render(area, buf);
        }

        let (name, about) = PAGES[self.page];
        let title = if side.is_none() { format!("{name} · {} of {}", self.page + 1, PAGES.len()) } else { name.to_owned() };
        Title::new(t, title).render(main, buf);
        put(buf, main, 1, Line::styled(about, t.muted()));
        let area = Rect { y: main.y + 3, height: main.height.saturating_sub(3), ..main };
        self.content(buf, area);

        let keys: Vec<(&str, &str)> = match (self.layer, self.main) {
            (Some(Layer::Help), _) => vec![("any key", "close")],
            (None, true) if self.page == FORM => {
                vec![("tab", "next"), ("shift+tab", "back"), ("←/→", "choose"), ("ctrl+s", "send"), ("esc", "back")]
            }
            _ if self.filters.is_open() => vec![("↑/↓", "facet"), ("←/→", "choose"), ("enter", "keep"), ("esc", "cancel")],
            (None, true) if self.page == FILTERS => vec![("f", "filters"), ("tab", "components"), ("?", "help"), ("esc", "back")],
            (None, true) => vec![("j/k", "scroll"), ("tab", "components"), ("t", "theme"), ("?", "help"), ("esc", "back")],
            // Without the sidebar, ←→ go through the components.
            (None, false) => {
                let browse = if side.is_some() { "j/k" } else { "←/→" };
                vec![(browse, "component"), ("enter", "open"), ("t", "theme"), ("?", "help"), ("q", "quit")]
            }
        };
        KeyHints::new(t, keys).render(foot, buf);

        if self.filters.is_open() {
            self.filters.view(t, "Filter machines").render(screen, buf);
        }
        if let Some(picker) = &self.picker {
            picker.view(t).render(screen, buf);
        }
        // Help goes over every other layer.
        if self.layer == Some(Layer::Help) {
            help(t).render(screen, buf);
        }
    }

    fn content(&self, buf: &mut Buffer, area: Rect) {
        let t = &self.theme;
        let width = usize::from(area.width);
        match PAGES[self.page].0 {
            "Theme" => self.theme_page(width).view(t, &self.scroll).render(area, buf),
            "Header" => header_page(t, buf, area),
            "Title" => title_page(t, buf, area),
            "Tabs" => tabs_page(t, buf, area),
            "Page" => {
                let page = list_page(t, width);
                page.view(t, &self.scroll).selected(Some(1)).mark(if self.main { Mark::Bar } else { Mark::Dim }).render(area, buf);
            }
            "Table" => table_page(t, buf, area),
            "StatusBadge" => badge_page(t, buf, area),
            "KeyHints" => hints_page(t, buf, area),
            "Buttons" => buttons_page(t, buf, area),
            "Form" => {
                let mut page = Page::default();
                page.section(t, width, "Deploy application", None);
                self.form.rows(&mut page, t, width, 17, 0..self.form.fields.len());
                page.blank();
                let buttons = [("Cancel", self.form.press(0, false)), ("Deploy", self.form.press(1, false))];
                for line in Buttons::new(t, buttons).lines(width.saturating_sub(1)) {
                    page.line(line);
                }
                let selected = if self.main { self.form.item() } else { None };
                page.view(t, &self.scroll).selected(selected).render(area, buf);
            }
            "Modal" => {
                caption(t, buf, area, 0, "Help, as ? opens it. The page under it stays as it was.");
                help(t).render(Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area }, buf);
            }
            "Question" => {
                caption(t, buf, area, 0, "Focus starts on the safe answer; a destructive one turns danger.");
                let question = Question::new(t, "Delete pg-main-2?")
                    .facts([("Machine", "pg-main-2"), ("Region", "eu-west")])
                    .block(["This deletes the machine and its disk.", "Backups stay for 7 days."])
                    .buttons(["Cancel", "Delete"])
                    .focused(1)
                    .danger(true);
                question.render(Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area }, buf);
            }
            "Palette" => {
                caption(t, buf, area, 0, "Typing filters; the selected command is filled with primary.");
                let commands = [("Go to Machines", "1"), ("Go to Logs", "2"), ("Restart machine", "r"), ("Theme", "t"), ("Quit", "q")];
                let palette = Palette::new(t, commands).filter("").selected(0);
                palette.render(Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area }, buf);
            }
            "ThemePicker" => {
                caption(t, buf, area, 0, "Press t anywhere: the app redraws in the accent under the cursor.");
                let picker = ThemePicker::new(self.accent, self.light);
                picker.view(t).render(Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area }, buf);
            }
            "Toast" => toast_page(t, buf, area),
            "Sidebar" => sidebar_page(t, buf, area),
            "Filters" => {
                let page = filtered_page(t, width, &self.filters);
                page.view(t, &self.scroll).selected(Some(0)).mark(if self.main { Mark::Bar } else { Mark::Dim }).render(area, buf);
            }
            "Menu" => {
                let (page, scroll) = (machine_page(t, width), Scroll::default());
                page.view(t, &scroll).selected(Some(1)).render(area, buf);
                if let Some(row) = page.item_area(1, area, &scroll) {
                    let menu = Menu::new(t, "pg-main-2", row).action("Open", "enter").action("Restart", "r").action("Copy URL", "c");
                    menu.danger("Delete", "x").selected(3).render(area, buf);
                }
            }
            _ => detail_page(t, width).view(t, &self.scroll).render(area, buf),
        }
    }

    fn theme_page(&self, width: usize) -> Page {
        let t = &self.theme;
        let r = t.tokens();
        let mut page = Page::default();
        let fact = |key: &str, value: &str| Line::from(vec![Span::styled(format!("  {key:<13}"), t.muted()), Span::raw(value.to_owned())]);
        page.line(fact("Accent", ACCENTS[self.accent].name));
        page.line(fact("Mode", if self.light { "light" } else { "dark" }));
        page.line(fact("Color depth", if t.is_truecolor() { "truecolor" } else { "xterm-256" }));
        page.blank();
        page.section(t, width, "Tokens", None);
        let surfaces = [
            ("background", r.background),
            ("card", r.card),
            ("muted", r.muted),
            ("selected", r.selected),
            ("primary", r.primary),
            ("chart-1", r.chart_1),
            ("border", r.border),
            ("danger", r.danger),
        ];
        let text = [
            ("foreground", r.foreground),
            ("muted-foreground", r.muted_foreground),
            ("subtle-foreground", r.subtle_foreground),
            ("link", r.link),
            ("success-on-dark", r.success_on_dark),
            ("warning-on-dark", r.warning_on_dark),
            ("danger-on-dark", r.danger_on_dark),
            ("info-on-dark", r.info_on_dark),
        ];
        let swatch = |(name, rgb): (&'static str, kiso_tokens::Rgb)| {
            let color = if name == "selected" { t.selected_color() } else { t.color(rgb) };
            let value = match color {
                ratatui::style::Color::Indexed(i) => format!("{i:>7}"),
                _ => format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2]),
            };
            vec![Span::styled("██", Style::new().fg(color)), Span::styled(format!(" {name:<18}"), t.text()), Span::styled(value, t.muted())]
        };
        for (a, b) in surfaces.into_iter().zip(text) {
            let mut spans = vec![Span::raw("  ")];
            spans.extend(swatch(a));
            spans.push(Span::raw("   "));
            spans.extend(swatch(b));
            page.line(Line::from(spans));
        }
        page.blank();
        page.section(t, width, "Look", None);
        let look = t.look();
        let stroke = |label: &str, stroke: Stroke| {
            let ink = match stroke.ink {
                Ink::Primary => "primary",
                Ink::Gradient => "gradient",
                Ink::Faint => "faint",
            };
            let mut spans = vec![Span::styled(format!("  {label:<13}"), t.muted()), Span::raw(format!("{:<9}{ink:<10}", stroke.pattern.name()))];
            spans.extend(stroke.spans(t, 16));
            Line::from(spans)
        };
        page.line(stroke("Title line", look.title));
        page.line(stroke("Section rule", look.rule));
        page.blank();
        for pattern in Pattern::ALL {
            let mut spans = vec![Span::styled(format!("  {:<13}", pattern.name()), t.muted())];
            spans.extend(Stroke::new(pattern, Ink::Faint).spans(t, 16));
            spans.push(Span::raw("  "));
            spans.extend(Stroke::new(pattern, Ink::Gradient).spans(t, 16));
            page.line(Line::from(spans));
        }
        page
    }
}

fn caption(t: &Theme, buf: &mut Buffer, area: Rect, dy: u16, text: &str) {
    put(buf, area, dy, Line::styled(text.to_owned(), t.muted()));
}

/// `line` on row `dy` of `area`, when that row is on screen.
fn put(buf: &mut Buffer, area: Rect, dy: u16, line: Line) {
    let area = area.intersection(buf.area);
    if dy < area.height {
        buf.set_line(area.x, area.y + dy, &line, area.width);
    }
}

fn header_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows: [(&str, Header); 4] = [
        ("Brand only", Header::new(t, "pg-probe", "0.4.0")),
        ("With a title", Header::new(t, "pg-probe", "0.4.0").title("Machines")),
        ("With a breadcrumb", Header::new(t, "pg-probe", "0.4.0").breadcrumb(["Projects", "pg-main", "Machines"])),
        ("At 32 columns, the end is cut", Header::new(t, "pg-probe", "0.4.0").breadcrumb(["Projects", "pg-main", "Machines"])),
    ];
    for (i, (label, header)) in rows.into_iter().enumerate() {
        let y = i as u16 * 3;
        caption(t, buf, area, y, label);
        let width = if i == 3 { 32.min(area.width) } else { area.width };
        header.render(Rect::new(area.x, area.y + y + 1, width, 1).intersection(area), buf);
    }
}

fn title_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let looks = [
        ("The default: a heavy line in primary", Look::DEFAULT),
        ("Shade in the gradient", Look { title: Stroke::new(Pattern::Shade, Ink::Gradient), ..Look::DEFAULT }),
        ("Thin and faint", Look { title: Stroke::new(Pattern::Thin, Ink::Faint), ..Look::DEFAULT }),
    ];
    for (i, (label, look)) in looks.into_iter().enumerate() {
        let y = i as u16 * 3;
        caption(t, buf, area, y, label);
        let themed = t.with_look(look);
        Title::new(&themed, "Machines").render(Rect::new(area.x, area.y + y + 1, area.width, 1).intersection(area), buf);
    }
    caption(t, buf, area, 10, "Set the look once for the product with Theme::with_look.");
}

fn tabs_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let views = ["Running 12", "Waiting 3", "Blocking 1"];
    for (i, current) in [0, 1].into_iter().enumerate() {
        let y = i as u16 * 3;
        caption(t, buf, area, y, if current == 0 { "Running is current" } else { "Waiting is current; 1 and 3 are the keys" });
        Tabs::new(t, views, current).render(Rect::new(area.x, area.y + y + 1, area.width, 1).intersection(area), buf);
    }
}

struct Machine {
    name: &'static str,
    state: fn(&Theme) -> StatusBadge<'_>,
    region: &'static str,
    cpu: &'static str,
    memory: &'static str,
}

const MACHINES: [Machine; 4] = [
    Machine { name: "pg-main-1", state: |t| StatusBadge::success(t, "Running"), region: "eu-west", cpu: "42.5", memory: "16 GiB" },
    Machine { name: "pg-main-2", state: |t| StatusBadge::danger(t, "Failed"), region: "eu-west", cpu: "0.0", memory: "16 GiB" },
    Machine { name: "pg-replica", state: |t| StatusBadge::success(t, "Provisioning").pulse(true), region: "us-east", cpu: "12.1", memory: "8 GiB" },
    Machine { name: "pg-archive", state: |t| StatusBadge::neutral(t, "Stopped"), region: "us-east", cpu: "—", memory: "4 GiB" },
];

fn list_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    let search = Search { query: "pg-main".into(), typing: false };
    let shown: Vec<&Machine> = MACHINES.iter().filter(|m| search.hit(&[m.name])).collect();
    page.section_meta(t, width, "Machines", &search.count(shown.len(), MACHINES.len()));
    let columns = Columns::new(width, &[12, 0, 9, 6, 8]);
    page.line(columns.head(t, &["Name", "State", "Region", "CPU %", "Memory"]));
    for m in shown {
        let line = columns.row(vec![
            vec![Span::raw(m.name)],
            Line::from((m.state)(t)).spans.into_iter().map(|s| Span::styled(s.content.into_owned(), s.style)).collect(),
            vec![Span::styled(m.region, t.muted())],
            vec![Span::raw(format!("{:>6}", m.cpu))],
            vec![Span::raw(m.memory)],
        ]);
        page.item([search.mark(t, line)]);
    }
    page.blank();
    page.section(t, width, "Start command", None);
    page.code(Line::raw("postgres -D /var/lib/postgresql/18/main"));
    page.blank();
    page.line(Line::styled("  The search \"pg-main\" keeps 2 of 4 and marks the match.", t.muted()));
    page
}

fn table_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "No selection. CPU % and Memory are numeric.");
    machines(t).render(Rect::new(area.x, area.y + 1, area.width, 5).intersection(area), buf);
    caption(t, buf, area, 7, "A selected row: a bar, and only the background changes.");
    let rows = Rect::new(area.x, area.y + 8, area.width, 5).intersection(area);
    ratatui::widgets::StatefulWidget::render(machines(t), rows, buf, &mut TableState::new().with_selected(1));
}

fn machines(t: &Theme) -> Table<'_> {
    let rows = MACHINES.iter().map(|m| {
        [Line::raw(m.name), (m.state)(t).into(), Line::styled(m.region, t.muted()), Line::raw(m.cpu), Line::raw(m.memory)]
    });
    let widths = [11, 15, 8, 5, 7].map(Constraint::Length);
    Table::new(t, rows, widths).header(["Name", "State", "Region", "CPU %", "Memory"]).numeric([3, 4])
}

fn badge_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let variants = [
        ("success", StatusBadge::success(t, "Running")),
        ("success, pulse", StatusBadge::success(t, "Provisioning").pulse(true)),
        ("danger", StatusBadge::danger(t, "Failed")),
        ("neutral", StatusBadge::neutral(t, "Stopped")),
    ];
    for (i, (name, badge)) in variants.into_iter().enumerate() {
        let mut line: Line = badge.into();
        line.spans.insert(0, Span::styled(format!("{name:<16}"), t.muted()));
        put(buf, area, i as u16, line);
    }
}

fn hints_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let hints = [("↑↓", "move"), ("enter", "open"), ("/", "search"), ("s", "sort"), ("?", "help"), ("q", "quit")];
    let widths: [(u16, &str); 4] = [
        (60, "At 60 columns, every hint fits"),
        (40, "At 40 columns, sort and search drop"),
        (30, "At 30 columns, open drops too"),
        (22, "At 22 columns, help and quit stay"),
    ];
    for (n, (width, label)) in widths.into_iter().enumerate() {
        let y = n as u16 * 3;
        caption(t, buf, area, y, label);
        let line = Rect::new(area.x, area.y + y + 1, width.min(area.width), 1).intersection(area);
        KeyHints::new(t, hints).render(line, buf);
        if !line.is_empty() && line.right() < area.right() {
            buf.set_string(line.right(), line.y, "│", t.subtle());
        }
    }
    caption(t, buf, area, 12, "The current view's label is bold");
    let views = [("1", "Overview"), ("2", "Machines"), ("3", "Logs"), ("?", "help"), ("q", "quit")];
    KeyHints::new(t, views).current(1).render(Rect::new(area.x, area.y + 13, area.width, 1).intersection(area), buf);
    caption(t, buf, area, 15, "After a search prompt");
    let search = Search { query: "fail".into(), typing: true };
    let keys = [("↑/↓", "move"), ("enter", "keep"), ("esc", "clear")];
    KeyHints::new(t, keys).prefix(search.prompt(t, 3, 40)).render(Rect::new(area.x, area.y + 16, area.width, 1).intersection(area), buf);
}

fn buttons_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows = [
        ("Plain", Press::Plain),
        ("Focused", Press::Focused),
        ("Danger: focused and destructive", Press::Danger),
        ("Off: does nothing yet", Press::Off),
    ];
    for (i, (label, press)) in rows.into_iter().enumerate() {
        let y = area.y + i as u16 * 4;
        if y + 3 > area.bottom() {
            break;
        }
        put(buf, area, y - area.y + 1, Line::styled(label, t.muted()));
        Buttons::new(t, [("Cancel", Press::Plain), ("Remove", press)]).render(Rect::new(area.x, y, 40, 3).intersection(area), buf);
    }
}

fn demo_form() -> Form {
    let mut name = Field::text("Name", "My app");
    name.error = Some("Another application is called this.".into());
    let name = name.filled("laya");
    let fields = vec![
        Field::select("Definition", ["Container image", "Compose file", "Native process"]).hint("An image that is already published."),
        name,
        Field::text("Container image", "nginx:alpine").hint("One container serving HTTP."),
        Field::text("Token", "Leave empty to keep it").secret(),
        Field::check("Start on boot"),
    ];
    let mut form = Form::new(fields, 2);
    form.focus = 2;
    form
}

fn toast_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "A toast replaces the key hints for a few seconds");
    Toast::new(t, "laya restarted in 1.6 s.").render(Rect::new(area.x, area.y + 1, area.width, 1).intersection(area), buf);
    caption(t, buf, area, 3, "Spinners: scramble for a few seconds of work, braille for a refresh");
    let mut spans = scramble(t, 10, 7);
    spans.extend([Span::styled(" Restarting", t.muted()), Span::raw("    "), Span::styled(braille(3), t.fg(t.tokens().primary)), Span::styled(" every 2 s", t.muted())]);
    put(buf, area, 4, Line::from(spans));
    caption(t, buf, area, 6, "The steps of a run: done, skipped, failed, running, pending");
    let steps = [
        step(t, "├──── ", StepState::Done, "Prepare", "account sf-app-ymau548satec"),
        step(t, "├──── ", StepState::Skipped, "Install", "Not needed"),
        step(t, "├──── ", StepState::Failed, "Route", "laya.momoi.internal is taken"),
        step(t, "├──── ", StepState::Running(3), "Retry", "another hostname"),
        step(t, "└──── ", StepState::Pending, "Start", "laya-apple serve"),
    ];
    for (i, line) in steps.into_iter().enumerate() {
        put(buf, area, 7 + i as u16, line);
    }
}

fn sidebar_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let side = |focused: bool| {
        Sidebar::new(t)
            .head([Line::styled(" self-host ", t.brand()), Line::default(), Line::styled("  momoi.internal", t.muted())])
            .group("Pages", ["Overview", "Databases", "Routes"].into_iter().enumerate().map(|(i, name)| SideItem::new(name).key(["1", "2", "3"][i])))
            .group("Applications", ["comfyui", "laya"].map(|name| SideItem::new(name).mark(Span::styled("●", t.success()))))
            .current(Some(1))
            .focused(focused)
    };
    caption(t, buf, area, 0, "The page has focus");
    let right = Rect { x: area.x + 30, width: area.width.saturating_sub(30), ..area };
    put(buf, right, 0, Line::styled("The sidebar has focus", t.muted()));
    side(false).render(Rect::new(area.x + 1, area.y + 2, 22, area.height.saturating_sub(2)).intersection(area), buf);
    side(true).render(Rect::new(area.x + 31, area.y + 2, 22, area.height.saturating_sub(2)).intersection(area), buf);
}

fn demo_filters() -> Filters {
    Filters::default().facet("Region", ["eu-west", "us-east"]).facet("State", ["Running", "Failed", "Provisioning", "Stopped"])
}

fn machine_line(t: &Theme, columns: &Columns, m: &Machine) -> Line<'static> {
    columns.row(vec![
        vec![Span::raw(m.name)],
        Line::from((m.state)(t)).spans.into_iter().map(|s| Span::styled(s.content.into_owned(), s.style)).collect(),
        vec![Span::styled(m.region, t.muted())],
        vec![Span::raw(format!("{:>6}", m.cpu))],
        vec![Span::raw(m.memory)],
    ])
}

/// The machines, through the filters.
fn filtered_page(t: &Theme, width: usize, filters: &Filters) -> Page {
    let mut page = Page::default();
    // The badge's word, after its mark.
    let state = |m: &Machine| Line::from((m.state)(t)).to_string().split_once(' ').map(|(_, word)| word.to_owned()).unwrap_or_default();
    let shown: Vec<&Machine> = MACHINES.iter().filter(|m| filters.allows(0, m.region) && filters.allows(1, &state(m))).collect();
    if filters.is_active() {
        page.line(filters.line(t, width));
        page.blank();
    }
    let count = if filters.is_active() { format!("{} of {}", shown.len(), MACHINES.len()) } else { MACHINES.len().to_string() };
    page.section_meta(t, width, "Machines", &count);
    let columns = Columns::new(width, &[12, 0, 9, 6, 8]);
    page.line(columns.head(t, &["Name", "State", "Region", "CPU %", "Memory"]));
    for m in &shown {
        page.item([machine_line(t, &columns, m)]);
    }
    if shown.is_empty() {
        page.line(Line::styled("  Nothing matches the filters.", t.muted()));
    }
    page.blank();
    page.line(Line::styled("  f opens the filters. The page follows each change; esc in the editor puts them back.", t.muted()));
    page
}

fn machine_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.section(t, width, "Machines", Some(MACHINES.len()));
    let columns = Columns::new(width, &[12, 0, 9, 6, 8]);
    page.line(columns.head(t, &["Name", "State", "Region", "CPU %", "Memory"]));
    for m in &MACHINES {
        page.item([machine_line(t, &columns, m)]);
    }
    page
}

/// One record as a page: the tabs on the title line, its facts, the
/// failure and the steps of its last run.
fn detail_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.line(Tabs::new(t, ["pg-main-2 · Summary", "Logs", "Settings"], 0).numbered(false).line(width));
    page.line(Line::styled("[ and ] move between tabs; esc goes back to the list as it was.", t.muted()));
    page.blank();
    page.section(t, width, "Facts", None);
    let failed: Line = StatusBadge::danger(t, "Failed").into();
    let failed = failed.spans.into_iter().map(|s| Span::styled(s.content.into_owned(), s.style));
    page.line(fact(t, 12, "Status", failed));
    page.line(fact(t, 12, "Region", [Span::raw("eu-west")]));
    page.line(fact(t, 12, "Started", [Span::raw("22 Oct 2026 18:42:06")]));
    page.line(fact(t, 12, "Finished", [Span::raw("22 Oct 2026 18:42:41")]));
    page.blank();
    page.section(t, width, "Failure", None);
    page.blank();
    page.code(Line::styled("disk /dev/vdb is full: 0 B of 512 GiB free", t.danger()));
    page.blank();
    page.section(t, width, "Last run", None);
    page.line(step(t, "├──── ", StepState::Done, "Stop", "postgres stopped in 2.1 s"));
    page.line(step(t, "├──── ", StepState::Failed, "Resize", "the disk is full"));
    page.line(step(t, "└──── ", StepState::Pending, "Start", "Not run"));
    page
}

fn help(t: &Theme) -> Modal<'_> {
    let keys = [
        ("j k ↑ ↓", "Move in the list, or scroll the page"),
        ("enter tab", "Focus the page"),
        ("esc tab", "Back to the components"),
        ("← →", "Previous or next component"),
        ("t", "Theme: accent, dark or light"),
        ("f", "Filters, on the Filters page"),
        ("↑ ↓ ← →", "In the filters: facet, then its value"),
        ("tab", "In a form: the next field"),
        ("shift+tab", "In a form: the field before"),
        ("ctrl+s", "In a form: send it"),
        ("? F1", "This help; F1 also while typing"),
        ("q", "Quit from the components"),
        ("ctrl+c", "Quit"),
    ];
    let lines = keys.map(|(key, label)| Line::from(vec![Span::styled(format!("{key:<12}"), t.text()), Span::styled(label, t.muted())]));
    Modal::new(t, "Help").width(56).body(lines.to_vec()).hints([("any key", "close")])
}

/// The accent, light, 256 colors, and where to write a snapshot or JSON.
type Options = (usize, bool, bool, Option<String>, Option<String>);

fn parse() -> Result<Options, String> {
    let (mut accent, mut light, mut xterm, mut snapshot, mut json) = (7, false, false, None, None);
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--accent" => {
                let name = args.next().ok_or("--accent needs a name")?;
                accent = ACCENTS.iter().position(|a| a.name == name).ok_or(format!("unknown accent \"{name}\""))?;
            }
            "--light" => light = true,
            "--256" => xterm = true,
            "--snapshot" => snapshot = Some(args.next().ok_or("--snapshot needs a directory")?),
            "--json" => json = Some(args.next().ok_or("--json needs a file")?),
            "-h" | "--help" => return Err(String::new()),
            other => return Err(format!("unknown option \"{other}\"")),
        }
    }
    Ok((accent, light, xterm, snapshot, json))
}

fn main() -> ExitCode {
    let (accent, light, xterm, snapshot_dir, json) = match parse() {
        Ok(options) => options,
        Err(message) => {
            if !message.is_empty() {
                eprintln!("gallery: {message}\n");
            }
            eprintln!("{USAGE}");
            return ExitCode::from(if message.is_empty() { 0 } else { 2 });
        }
    };
    let tokens = ACCENTS[accent].tokens(light);
    if let Some(file) = json {
        return match export(Path::new(&file), accent, light) {
            Ok(count) => {
                println!("Wrote {count} states to {file}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("gallery: could not write {file}: {error}");
                ExitCode::FAILURE
            }
        };
    }
    if let Some(dir) = snapshot_dir {
        let theme = if xterm { Theme::xterm_256(tokens) } else { Theme::truecolor(tokens) };
        return match snapshot(Path::new(&dir), theme, accent, light) {
            Ok(count) => {
                println!("Wrote {count} pages to {dir}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("gallery: could not write to {dir}: {error}");
                ExitCode::FAILURE
            }
        };
    }
    if !std::io::stdout().is_terminal() {
        eprintln!("gallery: stdout is not a terminal. Use --snapshot <dir>.");
        return ExitCode::from(2);
    }
    // ratatui::init enters raw mode and the alternate screen, and restores
    // the terminal on panic.
    let mut terminal = ratatui::init();
    let theme = if xterm { Theme::xterm_256(tokens) } else { Theme::new(tokens) };
    let result = run(&mut terminal, App::new(theme, accent, light));
    let _ = set_background(&mut std::io::stdout(), None);
    let _ = set_foreground(&mut std::io::stdout(), None);
    ratatui::restore();
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("gallery: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run(terminal: &mut ratatui::DefaultTerminal, mut app: App) -> std::io::Result<()> {
    let mut out = std::io::stdout();
    let mut colors = None;
    while !app.quit {
        // The terminal's own colors follow the theme, so cells the widgets
        // leave unpainted show it.
        let tokens = app.theme.tokens();
        let now = Some((tokens.background, tokens.foreground));
        if now != colors {
            set_background(&mut out, now.map(|c| c.0))?;
            set_foreground(&mut out, now.map(|c| c.1))?;
            colors = now;
        }
        terminal.draw(|f| app.draw(f))?;
        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                app.key(key);
            }
        }
    }
    Ok(())
}

/// A state: its name, the keys that reach it, and the screen size.
type State = (String, Vec<KeyEvent>, (u16, u16));

/// Every page at 100 by 30, and the states a page alone does not show.
fn states() -> Vec<State> {
    let code = |c: KeyCode| KeyEvent::new(c, KeyModifiers::NONE);
    let keys = |text: &str| text.chars().map(|c| code(KeyCode::Char(c))).collect::<Vec<_>>();
    let mut states: Vec<(String, Vec<KeyEvent>, (u16, u16))> = Vec::new();
    for (i, (name, _)) in PAGES.iter().enumerate() {
        let open = [vec![code(KeyCode::Down); i], vec![code(KeyCode::Enter)]].concat();
        states.push((format!("{:02}-{}", i + 1, name.to_lowercase()), open, SIZE));
    }
    let open = |page: usize| [vec![code(KeyCode::Down); page], vec![code(KeyCode::Enter)]].concat();
    let form = open(FORM);
    let filters = [open(FILTERS), keys("f"), vec![code(KeyCode::Right), code(KeyCode::Down), code(KeyCode::Right)]].concat();
    let small = (80, 24);
    states.push(("20-form-typing".into(), [form.clone(), keys("ghcr.io/kiso/app")].concat(), SIZE));
    states.push(("21-form-select".into(), [form, vec![code(KeyCode::BackTab), code(KeyCode::BackTab), code(KeyCode::Right)]].concat(), SIZE));
    states.push(("22-sidebar-focus".into(), keys("jjj"), SIZE));
    states.push(("23-help".into(), keys("?"), SIZE));
    states.push(("24-theme-picker".into(), [keys("t"), vec![code(KeyCode::Up)]].concat(), SIZE));
    states.push(("25-light".into(), [keys("t"), vec![code(KeyCode::Right), code(KeyCode::Enter)]].concat(), SIZE));
    states.push(("26-filter-editor".into(), filters.clone(), SIZE));
    states.push(("27-filtered".into(), [filters.clone(), vec![code(KeyCode::Enter)]].concat(), SIZE));
    states.push(("28-80-by-24".into(), keys("jjjj"), small));
    // Every dialog fits 80 by 24.
    states.push(("29-help-80".into(), keys("?"), small));
    states.push(("30-picker-80".into(), keys("t"), small));
    states.push(("31-palette-80".into(), [vec![code(KeyCode::Down); 12], vec![code(KeyCode::Enter)]].concat(), small));
    states.push(("32-question-80".into(), [vec![code(KeyCode::Down); 11], vec![code(KeyCode::Enter)]].concat(), small));
    states.push(("33-menu-80".into(), open(17), small));
    states.push(("34-filters-80".into(), filters, small));
    states
}

/// The screen less two columns on each side and the footer.
fn body(screen: Rect) -> Rect {
    Rect::new(screen.x + 2, screen.y, screen.width.saturating_sub(4), screen.height.saturating_sub(1))
}

/// Where each component's name shows in the sidebar of `buffer`: its row,
/// first column, width, and page. A name a dialog covers is left out.
fn sidebar_links(buffer: &Buffer, theme: Theme) -> Vec<(u16, u16, u16, usize)> {
    let app = App::new(theme, 0, false);
    let Some(side) = app.sidebar().split(body(buffer.area), Side::Left).0 else { return Vec::new() };
    (side.top()..side.bottom())
        .filter_map(|y| {
            let text: String = (side.left()..side.right()).map(|x| buffer[(x, y)].symbol()).collect();
            let page = PAGES.iter().position(|(name, _)| text.trim() == *name)?;
            Some((y, side.x, side.width, page))
        })
        .collect()
}

/// The screen after `events`, and the theme then, which the picker can
/// change.
fn draw_state(theme: Theme, accent: usize, light: bool, events: &[KeyEvent], (width, height): (u16, u16)) -> (Buffer, Theme) {
    let mut app = App::new(theme, accent, light);
    let Ok(mut terminal) = Terminal::new(TestBackend::new(width, height));
    for event in events {
        let Ok(_) = terminal.draw(|f| app.draw(f));
        app.key(*event);
    }
    let Ok(_) = terminal.draw(|f| app.draw(f));
    (terminal.backend().buffer().clone(), app.theme)
}

/// Writes every state as HTML.
fn snapshot(dir: &Path, theme: Theme, accent: usize, light: bool) -> std::io::Result<usize> {
    std::fs::create_dir_all(dir)?;
    // Every page at small sizes, with and without focus and with help, so a
    // page that writes outside its area fails here, and in CI.
    for page in 0..PAGES.len() {
        for (width, height) in [(1, 1), (30, 6), (40, 10), (60, 15), (80, 12), (80, 24)] {
            for (main, help) in [(false, false), (true, false), (false, true)] {
                let mut app = App::new(theme, accent, light);
                (app.page, app.main) = (page, main);
                app.layer = help.then_some(Layer::Help);
                let Ok(mut terminal) = Terminal::new(TestBackend::new(width, height));
                let Ok(_) = terminal.draw(|f| app.draw(f));
            }
        }
    }

    let mut shots = Vec::new();
    for (name, events, size) in states() {
        let (mut buffer, theme) = draw_state(theme, accent, light, &events, size);
        html::opaque(&mut buffer, &theme);
        let frame = html::buffer(&buffer);
        std::fs::write(dir.join(format!("{name}.html")), html::page(&name, &frame))?;
        shots.push((name, frame));
    }
    let body: String = shots.iter().map(|(name, frame)| format!("<h2>{name}</h2>{frame}")).collect();
    std::fs::write(dir.join("index.html"), html::page("tui-kiso gallery", &body))?;
    Ok(shots.len())
}

/// Writes every page and its site states, each drawn in every accent, dark
/// and light, as JSON for the Kiso site. The text comes from `accent` and
/// `light`.
fn export(file: &Path, accent: usize, light: bool) -> std::io::Result<usize> {
    let themes: Vec<(usize, bool)> = (0..ACCENTS.len()).flat_map(|a| [(a, false), (a, true)]).collect();
    let base = themes.iter().position(|&theme| theme == (accent, light)).unwrap_or(0);
    let names = themes.iter().map(|&(a, l)| (format!("{}-{}", ACCENTS[a].name, if l { "light" } else { "dark" }), ACCENTS[a].tokens(l)));
    let mut gallery = json::Gallery::new(names, base);
    let states = states();
    let mut count = 0;
    for (page, (name, about)) in PAGES.iter().enumerate() {
        let first = (states[page].0.as_str(), "Default");
        let shown = std::iter::once(first).chain(SITE_STATES.iter().filter(|s| s.1 == page).map(|s| (s.0, s.2)));
        let mut list = Vec::new();
        for (id, label) in shown {
            let Some((_, events, size)) = states.iter().find(|s| s.0 == id) else { continue };
            // The terminal's own colors follow the state's theme, which the
            // picker changes, as OSC 10 and 11 do.
            let draw = |events: &[KeyEvent]| -> (Vec<Buffer>, Vec<Cell>) {
                themes
                    .iter()
                    .map(|&(a, l)| {
                        let (mut buffer, theme) = draw_state(Theme::truecolor(ACCENTS[a].tokens(l)), a, l, events, *size);
                        html::opaque(&mut buffer, &theme);
                        let mut colors = Cell::default();
                        colors.set_style(theme.base());
                        (buffer, colors)
                    })
                    .unzip()
            };
            let (buffers, terminal) = draw(events);
            // A page scrolls with j, as on the page itself. The form takes
            // j as text, so it has no scroll.
            let mut scrolled: Vec<Vec<Buffer>> = Vec::new();
            if label == "Default" && page != FORM {
                let mut keys = events.clone();
                while scrolled.len() < 60 {
                    keys.push(KeyEvent::new(KeyCode::Char('j'), KeyModifiers::NONE));
                    let (next, _) = draw(&keys);
                    if next[base] == scrolled.last().unwrap_or(&buffers)[base] {
                        break;
                    }
                    scrolled.push(next);
                }
            }
            let links = sidebar_links(&buffers[base], Theme::truecolor(ACCENTS[accent].tokens(light)));
            list.push(gallery.state(&id[3..], label, &buffers, &terminal, &scrolled, &links));
            count += 1;
        }
        gallery.page(&name.to_lowercase(), name, about, list);
    }
    std::fs::write(file, gallery.finish())?;
    Ok(count)
}

/// A ratatui buffer as HTML: one span per run of equal style.
#[path = "support/html.rs"]
mod html;

/// The gallery as JSON for the Kiso site.
#[path = "support/json.rs"]
mod json;
