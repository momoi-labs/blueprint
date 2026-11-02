//! The Kiso layout templates in a terminal, as the web gallery shows them:
//! the Northstar workspace's sign-in, its projects (list, record, new one,
//! delete), its overview and its reports.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example screens
//! Options: --page <login|crud|dashboard|charts>, --accent <name>, --light,
//! --snapshot <dir>, --json <file>

use std::io::IsTerminal;
use std::path::Path;
use std::process::ExitCode;

use ratatui::backend::TestBackend;
use ratatui::buffer::{Buffer, Cell};
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::{Constraint, Layout, Rect};
use ratatui::symbols::Marker;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Axis, Chart, Dataset, GraphType, Sparkline, Widget};
use ratatui::{Frame, Terminal};
use tui_kiso::{
    set_background, set_foreground, Act, Buttons, Columns, Field, Form, KeyHints, Mark, Page, Question, Scroll, Side, SideItem,
    Sidebar, StatusBadge, Tabs, Theme, Title, wrap, ACCENTS,
};

const SIZE: (u16, u16) = (100, 30);
const SMALL: (u16, u16) = (80, 24);
/// The reports page holds four panels and a diagram.
const TALL: (u16, u16) = (100, 40);

const USAGE: &str = "\
Usage: screens [--page <id>] [--accent <name>] [--light] [--snapshot <dir>] [--json <file>]

  --page <id>        Start on login, crud, dashboard or charts (default: login).
  --accent <name>    Start in this accent (default: the first).
  --light            Start in the light theme.
  --snapshot <dir>   Draw every screen to HTML files in <dir> and exit.
  --json <file>      Write every screen in every theme as JSON for the Kiso
                     site and exit.";

struct Project {
    name: &'static str,
    owner: &'static str,
    status: &'static str,
    tone: Tone,
}

#[derive(Clone, Copy)]
enum Tone {
    Success,
    Danger,
    Neutral,
}

impl Tone {
    fn badge<'a>(self, t: &'a Theme, label: &str) -> StatusBadge<'a> {
        match self {
            Tone::Success => StatusBadge::success(t, label),
            Tone::Danger => StatusBadge::danger(t, label),
            Tone::Neutral => StatusBadge::neutral(t, label),
        }
    }
}

const PROJECTS: [Project; 4] = [
    Project { name: "Website refresh", owner: "Alex Morgan", status: "Active", tone: Tone::Success },
    Project { name: "Mobile experience", owner: "Sam Lee", status: "Publishing", tone: Tone::Success },
    Project { name: "Brand guidelines", owner: "Priya Shah", status: "Blocked", tone: Tone::Danger },
    Project { name: "Customer interviews", owner: "Jo Park", status: "Paused", tone: Tone::Neutral },
];

/// Why a sign-in failed, as the web example's results.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Failure {
    Refused,
    Service,
    Network,
}

impl Failure {
    fn text(self) -> (&'static str, &'static str) {
        match self {
            Failure::Refused => ("Email or password not accepted", "Check both and try again, or reset your password."),
            Failure::Service => ("Northstar could not sign you in", "This is a problem on our side. Your details are kept; try again in a moment."),
            Failure::Network => ("Could not reach Northstar", "Check your connection, then try again. Your details are kept."),
        }
    }
}

/// The screens of the templates, in the order a person meets them.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Screen {
    Login(Option<Failure>),
    List,
    Detail,
    Create,
    Delete,
    Dashboard,
    Charts,
}

/// A state of a template: the screen, its id and its label.
type State = (Screen, &'static str, &'static str);

/// Each template the site shows: its id, name, description and states.
const PAGES: [(&str, &str, &str, &[State]); 4] = [
    ("login", "Login", "Sign in to the workspace, and each way it can fail.", &[
        (Screen::Login(None), "default", "Sign in"),
        (Screen::Login(Some(Failure::Refused)), "refused", "Credentials refused"),
        (Screen::Login(Some(Failure::Service)), "service", "Service failure"),
        (Screen::Login(Some(Failure::Network)), "network", "Connection failure"),
    ]),
    ("crud", "CRUD", "Projects as a list, a record, a new one and a delete, in a terminal.", &[
        (Screen::List, "list", "List"),
        (Screen::Detail, "detail", "Detail"),
        (Screen::Create, "create", "Create"),
        (Screen::Delete, "delete", "Delete"),
    ]),
    ("dashboard", "Dashboard", "The workspace overview: metrics, activity, delivery and what needs attention.", &[
        (Screen::Dashboard, "default", "Overview"),
    ]),
    ("charts", "Charts & diagrams", "Reports for a range: line charts, gauges, a sparkline and the delivery pipeline.", &[
        (Screen::Charts, "default", "Reports"),
    ]),
];

struct App {
    theme: Theme,
    screen: Screen,
    login: Form,
    edit: Form,
    create: Form,
    scroll: Scroll,
    quit: bool,
}

impl App {
    fn new(theme: Theme) -> Self {
        Self { theme, screen: Screen::Login(None), login: login_form(None), edit: edit_form(), create: create_form(), scroll: Scroll::default(), quit: false }
    }

    fn key(&mut self, key: KeyEvent) {
        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
            self.quit = true;
            return;
        }
        // The sidebar's pages, from any page that has the sidebar.
        if matches!(self.screen, Screen::List | Screen::Dashboard | Screen::Charts) {
            match key.code {
                KeyCode::Char('o') => return self.open(Screen::Dashboard),
                KeyCode::Char('p') => return self.open(Screen::List),
                KeyCode::Char('r') => return self.open(Screen::Charts),
                KeyCode::Char('q') => {
                    self.quit = true;
                    return;
                }
                _ => {}
            }
        }
        match self.screen {
            // The first try is refused, as the web example's default, and
            // the second one signs in.
            Screen::Login(failure) => match self.login.key(key) {
                Act::Submit | Act::Press(_) => {
                    if failure.is_some() {
                        self.open(Screen::Dashboard);
                    } else {
                        self.screen = Screen::Login(Some(Failure::Refused));
                    }
                }
                Act::Cancel => self.quit = true,
                Act::None => {}
            },
            Screen::Dashboard | Screen::Charts => {}
            Screen::List => match key.code {
                KeyCode::Enter => self.open(Screen::Detail),
                KeyCode::Char('n') => self.open(Screen::Create),
                _ => {}
            },
            Screen::Detail => match key.code {
                KeyCode::Char('x') => self.open(Screen::Delete),
                KeyCode::Esc => self.open(Screen::List),
                _ => {
                    if self.edit.key(key) == Act::Cancel {
                        self.open(Screen::List);
                    }
                }
            },
            Screen::Create => match self.create.key(key) {
                Act::Cancel => self.open(Screen::List),
                Act::Submit | Act::Press(_) => {
                    self.create = create_form();
                    self.open(Screen::List);
                }
                Act::None => {}
            },
            Screen::Delete => match key.code {
                KeyCode::Enter => self.open(Screen::List),
                _ => self.open(Screen::Detail),
            },
        }
    }

    fn open(&mut self, screen: Screen) {
        self.screen = screen;
        self.scroll.top();
    }

    fn sidebar(&self) -> Sidebar<'_> {
        let t = &self.theme;
        let current = match self.screen {
            Screen::Dashboard => 0,
            Screen::Charts => 3,
            _ => 1,
        };
        Sidebar::new(t)
            .head([Line::from(vec![Span::styled(" northstar ", t.brand())]), Line::default(), Line::styled("Team workspace", t.muted())])
            .group("Workspace", ["Overview", "Projects", "Team", "Reports"].map(SideItem::new))
            .group("Manage", ["Settings", "Help & resources"].map(SideItem::new))
            .current(Some(current))
            .focused(false)
    }

    fn draw(&self, f: &mut Frame) {
        let t = &self.theme;
        let screen = f.area();
        let buf = f.buffer_mut();
        let body = body(screen);
        let foot = Rect::new(body.x, screen.bottom().saturating_sub(1), body.width, 1);
        // Sign-in is a gate before the workspace: no sidebar, one column.
        if let Screen::Login(failure) = self.screen {
            self.draw_login(buf, body, failure);
            KeyHints::new(t, [("tab", "next field"), ("enter", "sign in"), ("esc", "quit")]).render(foot, buf);
            return;
        }
        let sidebar = self.sidebar();
        let (side, main) = sidebar.split(body, Side::Left);
        if let Some(area) = side {
            sidebar.render(area, buf);
        }
        let width = usize::from(main.width);
        let page_area = |head: u16| Rect { y: main.y + head, height: main.height.saturating_sub(head), ..main };

        let hints: Vec<(&str, &str)> = match self.screen {
            Screen::Login(_) => Vec::new(),
            Screen::Dashboard => {
                draw_dashboard(buf, t, main);
                vec![("o", "overview"), ("p", "projects"), ("r", "reports"), ("q", "quit")]
            }
            Screen::Charts => {
                draw_charts(buf, t, main);
                vec![("o", "overview"), ("p", "projects"), ("r", "reports"), ("q", "quit")]
            }
            // gallery: crud
            Screen::List => {
                Title::new(t, "Projects").render(main, buf);
                put(buf, main, 1, Line::styled("Plan, organize and keep track of your team's work.", t.muted()));
                list_page(t, width).view(t, &self.scroll).selected(Some(0)).mark(Mark::Bar).render(page_area(3), buf);
                vec![("j/k", "project"), ("enter", "open"), ("n", "new"), ("o/r", "overview, reports"), ("q", "quit")]
            }
            Screen::Detail | Screen::Delete => {
                put(buf, main, 0, Tabs::new(t, ["Website refresh · Settings", "Activity"], 0).numbered(false).line(width));
                put(buf, main, 1, status_line(t));
                let mut page = Page::default();
                page.blank();
                let selected = self.edit.rows(&mut page, t, width, 12, 0..self.edit.fields.len());
                page.blank();
                let buttons = [("Discard", self.edit.press(0, false)), ("Save", self.edit.press(1, false))];
                for line in Buttons::new(t, buttons).lines(width.saturating_sub(1)) {
                    page.line(line);
                }
                page.view(t, &self.scroll).selected(selected).render(page_area(2), buf);
                vec![("tab", "next field"), ("ctrl+s", "save"), ("[ ]", "tab"), ("x", "delete"), ("esc", "back")]
            }
            Screen::Create => {
                Title::new(t, "New project").render(main, buf);
                put(buf, main, 1, Line::styled("A name, an owner, a schedule and the people on it.", t.muted()));
                let mut page = Page::default();
                let mut selected = None;
                for (title, range) in [("Basics", 0..3), ("Schedule", 3..6), ("Team", 6..9)] {
                    page.section(t, width, title, None);
                    selected = selected.or(self.create.rows(&mut page, t, width, 16, range));
                    page.blank();
                }
                let buttons = [("Cancel", self.create.press(0, false)), ("Create project", self.create.press(1, false))];
                for line in Buttons::new(t, buttons).lines(width.saturating_sub(1)) {
                    page.line(line);
                }
                page.view(t, &self.scroll).selected(selected).render(page_area(3), buf);
                vec![("tab", "next field"), ("←/→", "choose"), ("ctrl+s", "create"), ("esc", "cancel")]
            }
            // gallery end
        };
        // gallery: crud
        if self.screen == Screen::Delete {
            Question::new(t, "Delete Website refresh?")
                .facts([("Owner", "Alex Morgan"), ("Tasks", "18 of 24 done")])
                .block(["The project, its tasks and its activity are removed.", "This cannot be undone."])
                .buttons(["Cancel", "Delete project"])
                .focused(0)
                .danger(true)
                .render(screen, buf);
        } else {
            KeyHints::new(t, hints).render(foot, buf);
        }
        // gallery end
    }
}

// gallery: login
impl App {
    /// The sign-in column: brand, heading, the failure when there is one,
    /// the form, and the access help a person needs when it fails.
    fn draw_login(&self, buf: &mut Buffer, body: Rect, failure: Option<Failure>) {
        let t = &self.theme;
        let width = body.width.min(60);
        let area = Rect { x: body.x + (body.width - width) / 2, width, ..body };
        let width = usize::from(width);
        let mut page = Page::default();
        page.blank();
        page.line(Line::from(vec![Span::styled(" northstar ", t.brand()), Span::styled("  app.northstar.example", t.muted())]));
        page.blank();
        page.line(Line::from(Title::new(t, "Sign in to your workspace").spans(width)));
        page.line(Line::styled("Use the email address your workspace invited.", t.muted()));
        page.blank();
        if let Some(failure) = failure {
            let (what, now) = failure.text();
            page.line(Line::styled(format!("✕ {what}"), t.danger()));
            for line in wrap(now, width.saturating_sub(2)) {
                page.line(Line::styled(format!("  {line}"), t.muted()));
            }
            page.blank();
        }
        let selected = self.login.rows(&mut page, t, width, 10, 0..self.login.fields.len());
        page.blank();
        for line in Buttons::new(t, [("Sign in", self.login.press(0, false))]).lines(width.saturating_sub(1)) {
            page.line(line);
        }
        page.blank();
        page.line(Line::styled("Reset password", t.link()));
        page.blank();
        page.section(t, width, "Trouble signing in?", None);
        for (lead, rest) in [
            ("No account yet?", "Ask a workspace admin to invite you."),
            ("Locked out?", "Wait 15 minutes, or contact your admin."),
        ] {
            page.line(Line::from(vec![Span::styled(format!("{lead} "), t.strong()), Span::styled(rest, t.muted())]));
        }
        page.view(t, &self.scroll).selected(selected).render(area, buf);
    }
}
// gallery end

// gallery: login
fn login_form(failure: Option<Failure>) -> Form {
    // After a refusal the email is kept and the password is cleared; after
    // a service or network failure both are kept.
    let email = Field::text("Email", "name@example.com");
    let password = Field::text("Password", "").secret();
    let fields = match failure {
        None => vec![email, password],
        Some(Failure::Refused) => vec![email.filled("alex@northstar.example"), password],
        Some(_) => vec![email.filled("alex@northstar.example"), password.filled("correct-horse")],
    };
    Form::new(fields, 1)
}
// gallery end

// gallery: dashboard, charts
/// One month of activity, as the web example: tasks completed and opened
/// each day, and the backlog by status.
fn activity() -> [Vec<(f64, f64)>; 2] {
    let day = |f: fn(f64) -> f64| (0..30).map(|i| (f64::from(i), f(f64::from(i)).round())).collect();
    [day(|i| 8.0 + i / 30.0 + (i / 4.0).sin() * 3.0), day(|i| 7.0 + (i / 3.0).cos() * 2.0)]
}

fn backlog() -> [Vec<(f64, f64)>; 3] {
    let day = |f: fn(f64) -> f64| (0..30).map(|i| (f64::from(i), f(f64::from(i)).round())).collect();
    [day(|i| 32.0 + (i / 9.0).sin() * 8.0), day(|i| 14.0 + (i / 4.0).cos() * 3.0), day(|i| 5.0 + (i / 5.0).sin() * 2.0)]
}

const OWNERS: [(&str, u64); 4] = [("Alex Morgan", 14), ("Sam Lee", 11), ("Priya Shah", 9), ("Jo Park", 6)];

/// A panel's heading: the title, a rule, and text at its end.
fn heading(buf: &mut Buffer, t: &Theme, area: Rect, title: &str, meta: &str) {
    let mut page = Page::default();
    page.section_meta(t, usize::from(area.width), title, meta);
    page.view(t, &Scroll::default()).render(Rect { height: area.height.min(1), ..area }, buf);
}

/// A meter as one row: the filled share in the foreground, the rest as a
/// faint track, as the web Meter and BarGauge.
fn meter(t: &Theme, value: u64, max: u64, width: usize) -> Line<'static> {
    let filled = (width as u64 * value.min(max) / max.max(1)) as usize;
    Line::from(vec![Span::styled("━".repeat(filled), t.text()), Span::styled("─".repeat(width - filled), t.border())])
}

/// A label with its value at the right edge.
fn labelled(t: &Theme, label: &str, value: &str, width: usize) -> Line<'static> {
    let gap = width.saturating_sub(label.chars().count() + value.chars().count());
    Line::from(vec![Span::styled(label.to_owned(), t.text()), Span::raw(" ".repeat(gap)), Span::styled(value.to_owned(), t.strong())])
}

/// The legend of a chart: each series in its chart color.
fn legend(t: &Theme, names: &[&str]) -> Line<'static> {
    let colors = chart_colors(t);
    let mut spans = Vec::new();
    for (name, color) in names.iter().zip(colors) {
        spans.push(Span::styled("━ ", t.fg(color)));
        spans.push(Span::styled(format!("{name}   "), t.muted()));
    }
    Line::from(spans)
}

fn chart_colors(t: &Theme) -> [kiso_tokens::Rgb; 3] {
    let k = t.tokens();
    [k.chart_1, k.chart_2, k.chart_3]
}

/// A line chart of daily series over September, with the axes muted.
fn line_chart<'a>(t: &Theme, series: &'a [Vec<(f64, f64)>], names: &[&'a str], max: f64) -> Chart<'a> {
    let colors = chart_colors(t);
    let datasets = series
        .iter()
        .zip(names)
        .zip(colors)
        .map(|((data, name), color)| {
            Dataset::default().name(*name).marker(Marker::Braille).graph_type(GraphType::Line).style(t.fg(color)).data(data)
        })
        .collect();
    let half = format!("{}", (max / 2.0).round());
    Chart::new(datasets)
        .x_axis(Axis::default().bounds([0.0, 29.0]).style(t.border()).labels(["09-01", "09-15", "09-30"].map(|l| Span::styled(l, t.muted()))))
        .y_axis(Axis::default().bounds([0.0, max]).style(t.border()).labels(["0".to_owned(), half, format!("{max}")].map(|l| Span::styled(l, t.muted()))))
        .legend_position(None)
}
// gallery end

// gallery: dashboard
/// The overview: the range, four metrics, activity beside delivery, and the
/// projects that need attention.
fn draw_dashboard(buf: &mut Buffer, t: &Theme, main: Rect) {
    let width = usize::from(main.width);
    Title::new(t, "Overview").render(main, buf);
    put(buf, main, 1, Line::from(vec![
        Span::styled("What needs attention, what is healthy and where to go next.", t.muted()),
    ]));
    put(buf, main, 2, Line::from(vec![Span::styled("◷ Last 30 days ▾", t.link()), Span::styled("   refreshed just now", t.subtle())]));
    let [stats, panels, table] = Layout::vertical([Constraint::Length(4), Constraint::Length(13), Constraint::Min(0)])
        .spacing(1)
        .areas(Rect { y: main.y + 4, height: main.height.saturating_sub(4), ..main });
    let metrics = [
        ("Active projects", "24", "+4", "4 this month"),
        ("Tasks completed", "186", "+18.6%", "32 above August"),
        ("Team members", "12", "+2", "In 3 groups"),
        ("On-time delivery", "94.2%", "+2.1%", "Target 90%"),
    ];
    let cells = Layout::horizontal([Constraint::Fill(1); 4]).spacing(2).split(stats);
    for (&(label, value, delta, foot), &cell) in metrics.iter().zip(cells.iter()) {
        put(buf, cell, 0, Line::styled(label, t.muted()));
        put(buf, cell, 1, Line::from(vec![Span::styled(value, t.strong()), Span::raw("  "), Span::styled(delta, t.success())]));
        put(buf, cell, 2, Line::styled(foot, t.subtle()));
    }
    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(panels);
    heading(buf, t, left, "Tasks per day", "avg 9 · now 14");
    put(buf, left, 1, legend(t, &["Completed"]));
    let [completed, _] = activity();
    line_chart(t, &[completed], &["Completed"], 16.0).render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Delivery", "");
    let w = usize::from(right.width);
    let mut rows = vec![labelled(t, "Delivered on time", "94%", w), meter(t, 94, 100, w)];
    for (name, open) in OWNERS {
        rows.push(labelled(t, name, &open.to_string(), w));
        rows.push(meter(t, open, 16, w));
    }
    for (i, row) in rows.into_iter().enumerate() {
        put(buf, right, 2 + i as u16, row);
    }
    heading(buf, t, table, "Needs attention", "view all projects  p");
    let columns = Columns::new(width, &[22, 10, 0, 8]);
    put(buf, table, 2, columns.head(t, &["Project", "Status", "Issue", "Since"]));
    let rows = [
        ("Brand guidelines", StatusBadge::danger(t, "Blocked"), "Waiting on the legal review", "3 days"),
        ("Customer interviews", StatusBadge::neutral(t, "Overdue"), "Due Sep 12, 4 of 10 tasks open", "6 days"),
    ];
    for (i, (name, badge, issue, since)) in rows.into_iter().enumerate() {
        let line = columns.row(vec![
            vec![Span::styled(name, t.link())],
            owned(badge.into()),
            vec![Span::raw(issue)],
            vec![Span::styled(since, t.muted())],
        ]);
        put(buf, table, 3 + i as u16, line);
    }
}
// gallery end

// gallery: charts
/// The reports: the range, two line charts with the owners and the delivery
/// beside them, and the delivery pipeline as its edges.
fn draw_charts(buf: &mut Buffer, t: &Theme, main: Rect) {
    Title::new(t, "Reports").render(main, buf);
    put(buf, main, 1, Line::styled("Throughput, delivery and the systems the team ships to.", t.muted()));
    put(buf, main, 2, Line::from(vec![Span::styled("◷ Last 30 days ▾", t.link()), Span::styled("   Sep 1 to Sep 30, UTC", t.subtle())]));
    let [top, middle, pipeline] = Layout::vertical([Constraint::Length(12), Constraint::Length(11), Constraint::Min(0)])
        .spacing(1)
        .areas(Rect { y: main.y + 4, height: main.height.saturating_sub(4), ..main });

    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(top);
    let tasks = activity();
    heading(buf, t, left, "Tasks per day", "");
    put(buf, left, 1, legend(t, &["Completed", "Opened"]));
    line_chart(t, &tasks, &["Completed", "Opened"], 16.0).render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Open tasks by owner", "");
    let w = usize::from(right.width);
    for (i, (name, open)) in OWNERS.into_iter().enumerate() {
        put(buf, right, 2 + 2 * i as u16, labelled(t, name, &open.to_string(), w));
        put(buf, right, 3 + 2 * i as u16, meter(t, open, 16, w));
    }

    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(middle);
    let statuses = backlog();
    heading(buf, t, left, "Backlog by status", "");
    put(buf, left, 1, legend(t, &["To do", "In progress", "In review"]));
    line_chart(t, &statuses, &["To do", "In progress", "In review"], 44.0)
        .render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "On-time delivery", "");
    put(buf, right, 2, labelled(t, "Delivered on time", "94%", w));
    put(buf, right, 3, meter(t, 94, 100, w));
    let values: Vec<u64> = tasks[0].iter().map(|&(_, v)| v as u64).collect();
    Sparkline::default().data(&values).style(t.fg(chart_colors(t)[0])).render(Rect { y: right.y + 5, height: right.height.saturating_sub(5).min(4), ..right }, buf);

    heading(buf, t, pipeline, "Delivery pipeline", "6 links");
    let node = |name: &'static str| Span::styled(name, t.strong());
    let edge = |label: String| Span::styled(label, t.muted());
    let mut lines = vec![
        Line::from(vec![node("northstar/website"), edge(" ── build ──▶ ".into()), node("website:2026.09.18")]),
        Line::from(vec![node("website:2026.09.18"), edge(" ── deploy ──▶ ".into()), node("northstar-web"), edge(", ".into()), node("northstar-worker")]),
        Line::from(vec![node("northstar.example"), edge(" ── :8000 ──▶ ".into()), node("northstar-web")]),
        Line::from(vec![node("northstar-web"), edge(", ".into()), node("northstar-worker"), edge(" ── DATABASE_URL ──▶ ".into()), node("northstar-db")]),
    ];
    let mut cache = vec![node("northstar-web"), Span::styled(" ┄┄ REDIS_URL ┄┄▶ ", t.danger()), node("northstar-cache"), Span::raw("  ")];
    cache.extend(owned(StatusBadge::danger(t, "Failed").into()));
    lines.push(Line::from(cache));
    for (i, line) in lines.into_iter().enumerate() {
        put(buf, pipeline, 2 + i as u16, line);
    }
}
// gallery end

/// The screen less two columns on each side and the footer.
fn body(screen: Rect) -> Rect {
    Rect::new(screen.x + 2, screen.y, screen.width.saturating_sub(4), screen.height.saturating_sub(1))
}

fn put(buf: &mut Buffer, area: Rect, dy: u16, line: Line) {
    if dy < area.height {
        buf.set_line(area.x, area.y + dy, &line, area.width);
    }
}

fn owned(line: Line<'_>) -> Vec<Span<'static>> {
    line.spans.into_iter().map(|s| Span::styled(s.content.into_owned(), s.style)).collect()
}

// gallery: crud
/// The projects as rows a person moves through.
fn list_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.section(t, width, "All projects", Some(PROJECTS.len()));
    let columns = Columns::new(width, &[22, 14, 0]);
    page.line(columns.head(t, &["Project", "Owner", "Status"]));
    for project in &PROJECTS {
        let status: Line = project.tone.badge(t, project.status).into();
        page.item([columns.row(vec![vec![Span::raw(project.name)], vec![Span::styled(project.owner, t.muted())], owned(status)])]);
    }
    page.blank();
    page.line(Line::styled(format!("  {} of {} projects", PROJECTS.len(), PROJECTS.len()), t.muted()));
    page
}

/// The record's status and what can be done to it, as the web Lifecycle row.
fn status_line(t: &Theme) -> Line<'static> {
    let mut spans = vec![Span::raw("  ")];
    spans.extend(owned(StatusBadge::success(t, "Active").into()));
    spans.push(Span::raw("  "));
    spans.extend(owned(StatusBadge::success(t, "On track").into()));
    spans.push(Span::styled("    Owned by Alex Morgan, due Sep 18.", t.muted()));
    Line::from(spans)
}

fn edit_form() -> Form {
    let fields = vec![
        Field::text("Name", "").filled("Website refresh"),
        Field::text("Owner", "").filled("Alex Morgan"),
        Field::select("Category", ["Design", "Content", "Research", "Product"]),
        Field::text("Due date", "YYYY-MM-DD").filled("2026-09-18"),
        Field::select("Priority", ["High", "Medium", "Low"]),
        Field::text("Budget", "0").filled("12000"),
        Field::text("Repository", "github.com/org/repo").filled("github.com/northstar/website"),
    ];
    Form::new(fields, 2)
}
// gallery end

// gallery: crud
fn create_form() -> Form {
    let fields = vec![
        Field::text("Name", "Docs portal"),
        Field::text("Owner", "Who leads it"),
        Field::text("Description", "One sentence your team will read first."),
        Field::text("Start date", "YYYY-MM-DD"),
        Field::text("Due date", "YYYY-MM-DD"),
        Field::select("Priority", ["Medium", "High", "Low"]),
        Field::select("Category", ["Design", "Content", "Research", "Product"]),
        Field::text("Repository", "github.com/northstar/website"),
        Field::select("Who can invite", ["Admins only", "All members"]),
    ];
    Form::new(fields, 2)
}
// gallery end

/// The first screen, the accent, light, and where to write a snapshot or JSON.
type Options = (Screen, usize, bool, Option<String>, Option<String>);

fn parse() -> Result<Options, String> {
    let (mut screen, mut accent, mut light, mut snapshot, mut json) = (Screen::Login(None), 0, false, None, None);
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--accent" => {
                let name = args.next().ok_or("--accent needs a name")?;
                accent = ACCENTS.iter().position(|a| a.name == name).ok_or(format!("unknown accent {name}"))?;
            }
            "--page" => {
                let id = args.next().ok_or("--page needs an id")?;
                screen = PAGES.iter().find(|page| page.0 == id).ok_or(format!("unknown page {id}"))?.3[0].0;
            }
            "--light" => light = true,
            "--snapshot" => snapshot = Some(args.next().ok_or("--snapshot needs a directory")?),
            "--json" => json = Some(args.next().ok_or("--json needs a file")?),
            "-h" | "--help" => return Err(String::new()),
            other => return Err(format!("unknown option {other}")),
        }
    }
    Ok((screen, accent, light, snapshot, json))
}

fn main() -> ExitCode {
    let (first, accent, light, snapshot_dir, json) = match parse() {
        Ok(options) => options,
        Err(message) => {
            if !message.is_empty() {
                eprintln!("screens: {message}\n");
            }
            eprintln!("{USAGE}");
            return ExitCode::from(if message.is_empty() { 0 } else { 2 });
        }
    };
    let tokens = ACCENTS[accent].tokens(light);
    if let Some(file) = json {
        return match export(Path::new(&file), accent, light) {
            Ok(count) => {
                println!("Wrote {count} screens to {file}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("screens: could not write {file}: {error}");
                ExitCode::FAILURE
            }
        };
    }
    if let Some(dir) = snapshot_dir {
        return match snapshot(Path::new(&dir), Theme::truecolor(tokens)) {
            Ok(count) => {
                println!("Wrote {count} screens to {dir}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("screens: could not write to {dir}: {error}");
                ExitCode::FAILURE
            }
        };
    }
    if !std::io::stdout().is_terminal() {
        eprintln!("screens: stdout is not a terminal. Use --snapshot <dir>.");
        return ExitCode::from(2);
    }
    let mut terminal = ratatui::init();
    let mut app = App::new(Theme::new(tokens));
    app.screen = first;
    let result = run(&mut terminal, app);
    let _ = set_background(&mut std::io::stdout(), None);
    let _ = set_foreground(&mut std::io::stdout(), None);
    ratatui::restore();
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("screens: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run(terminal: &mut ratatui::DefaultTerminal, mut app: App) -> std::io::Result<()> {
    let mut out = std::io::stdout();
    let tokens = app.theme.tokens();
    set_background(&mut out, Some(tokens.background))?;
    set_foreground(&mut out, Some(tokens.foreground))?;
    while !app.quit {
        terminal.draw(|f| app.draw(f))?;
        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                app.key(key);
            }
        }
    }
    Ok(())
}

/// Every screen the site shows, by page: its id, label, the screen, and the
/// size.
fn states(page: &str) -> Vec<(String, String, Screen, (u16, u16))> {
    let Some(&(_, _, _, screens)) = PAGES.iter().find(|p| p.0 == page) else { return Vec::new() };
    let size = if page == "charts" { TALL } else { SIZE };
    let mut states: Vec<_> = screens.iter().map(|&(screen, id, label)| (id.to_owned(), label.to_owned(), screen, size)).collect();
    if page == "crud" {
        states.push(("list-80".into(), "List at 80 by 24".into(), Screen::List, SMALL));
    }
    states
}

fn all_states() -> Vec<(String, String, Screen, (u16, u16))> {
    PAGES
        .iter()
        .flat_map(|page| states(page.0).into_iter().map(move |(id, label, screen, size)| (format!("{}-{id}", page.0), label, screen, size)))
        .collect()
}

fn draw_state(theme: Theme, screen: Screen, (width, height): (u16, u16)) -> Buffer {
    let mut app = App::new(theme);
    app.screen = screen;
    if let Screen::Login(failure) = screen {
        app.login = login_form(failure);
    }
    let Ok(mut terminal) = Terminal::new(TestBackend::new(width, height));
    let Ok(_) = terminal.draw(|f| app.draw(f));
    terminal.backend().buffer().clone()
}

/// Writes every screen as HTML.
fn snapshot(dir: &Path, theme: Theme) -> std::io::Result<usize> {
    std::fs::create_dir_all(dir)?;
    // Every screen at small sizes, so one that writes outside its area
    // fails here, and in CI.
    for (_, _, screen, _) in all_states() {
        for size in [(1, 1), (30, 6), (40, 10), (60, 15), (80, 12)] {
            draw_state(theme, screen, size);
        }
    }
    let mut shots = Vec::new();
    for (id, _, screen, size) in all_states() {
        let mut buffer = draw_state(theme, screen, size);
        html::opaque(&mut buffer, &theme);
        let frame = html::buffer(&buffer);
        std::fs::write(dir.join(format!("{id}.html")), html::page(&id, &frame))?;
        shots.push((id, frame));
    }
    let body: String = shots.iter().map(|(name, frame)| format!("<h2>{name}</h2>{frame}")).collect();
    std::fs::write(dir.join("index.html"), html::page("tui-kiso screens", &body))?;
    Ok(shots.len())
}

/// Writes every screen, drawn in every accent, dark and light, as JSON for
/// the Kiso site. The text comes from `accent` and `light`.
fn export(file: &Path, accent: usize, light: bool) -> std::io::Result<usize> {
    let themes: Vec<(usize, bool)> = (0..ACCENTS.len()).flat_map(|a| [(a, false), (a, true)]).collect();
    let base = themes.iter().position(|&theme| theme == (accent, light)).unwrap_or(0);
    let names = themes.iter().map(|&(a, l)| (format!("{}-{}", ACCENTS[a].name, if l { "light" } else { "dark" }), ACCENTS[a].tokens(l)));
    let mut gallery = json::Gallery::new(names, base);
    let mut count = 0;
    for &(page, name, about, _) in &PAGES {
        let mut list = Vec::new();
        for (id, label, screen, size) in states(page) {
            let (buffers, terminal): (Vec<Buffer>, Vec<Cell>) = themes
                .iter()
                .map(|&(a, l)| {
                    let theme = Theme::truecolor(ACCENTS[a].tokens(l));
                    let mut buffer = draw_state(theme, screen, size);
                    html::opaque(&mut buffer, &theme);
                    let mut colors = Cell::default();
                    colors.set_style(theme.base());
                    (buffer, colors)
                })
                .unzip();
            list.push(gallery.state(&id, &label, &buffers, &terminal, &[], &[]));
        }
        count += list.len();
        gallery.page(page, name, about, list);
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
