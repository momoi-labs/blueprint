//! The Kiso layout templates in a terminal, as the web gallery shows them:
//! the Tabi & Smoke back office's sign-in, its products (list, record, new
//! one, delete), its overview, its charts and its monthly reports.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example screens
//! Options: --page <login|crud|dashboard|charts|reports|report>,
//! --accent <name>, --light, --snapshot <dir>, --json <file>

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
    set_background, set_foreground, Act, AppShell, Columns, Field, Form, KeyHints, Mark, Page, Question, Scroll, Side, SideItem,
    Sidebar, StatusBadge, Tabs, Theme, Title, wrap, ACCENTS,
};

const SIZE: (u16, u16) = (100, 30);
const SMALL: (u16, u16) = (80, 24);
/// The charts page holds four panels and a diagram, and the monthly report
/// its summary, a chart, a table and the method.
const TALL: (u16, u16) = (100, 40);

const USAGE: &str = "\
Usage: screens [--page <id>] [--accent <name>] [--light] [--snapshot <dir>] [--json <file>]

  --page <id>        Start on login, crud, dashboard, charts, reports or report
                     (default: login).
  --accent <name>    Start in this accent (default: the first).
  --light            Start in the light theme.
  --snapshot <dir>   Draw every screen to HTML files in <dir> and exit.
  --json <file>      Write every screen in every theme as JSON for the Kiso
                     site and exit.";

struct Product {
    name: &'static str,
    sku: &'static str,
    price: &'static str,
    stock: u64,
    reorder: u64,
    sold: u64,
}

impl Product {
    fn status(&self) -> (&'static str, Tone) {
        if self.stock == 0 {
            ("Out of stock", Tone::Danger)
        } else if self.stock <= self.reorder {
            ("Low stock", Tone::Neutral)
        } else {
            ("In stock", Tone::Success)
        }
    }
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

const PRODUCTS: [Product; 7] = [
    Product { name: "Shuriken, four point", sku: "SHU-0406", price: "$24.00", stock: 182, reorder: 60, sold: 96 },
    Product { name: "Kunai, classic", sku: "KUN-0101", price: "$18.50", stock: 64, reorder: 40, sold: 71 },
    Product { name: "Smoke bomb, grey", sku: "SMK-0303", price: "$12.00", stock: 0, reorder: 50, sold: 88 },
    Product { name: "Grappling hook, 15 m", sku: "GRP-0015", price: "$89.00", stock: 9, reorder: 20, sold: 23 },
    Product { name: "Tabi boots, split toe", sku: "TAB-0042", price: "$54.00", stock: 31, reorder: 15, sold: 34 },
    Product { name: "Water shoes, mizugumo", sku: "MIZ-0007", price: "$120.00", stock: 4, reorder: 5, sold: 7 },
    Product { name: "Night suit, midnight blue", sku: "SUT-0021", price: "$64.00", stock: 48, reorder: 20, sold: 29 },
];

struct Month {
    name: &'static str,
    period: &'static str,
    prepared: &'static str,
    days: [&'static str; 3],
    first: i32,
    orders: &'static str,
    revenue: &'static str,
    average: &'static str,
    on_time: u64,
}

const MONTHS: [Month; 3] = [
    Month { name: "September 2026", period: "1 to 30 September", prepared: "1 October", days: ["09-01", "09-15", "09-30"], first: 61, orders: "312", revenue: "$18,420", average: "$59.04", on_time: 96 },
    Month { name: "August 2026", period: "1 to 31 August", prepared: "1 September", days: ["08-01", "08-15", "08-30"], first: 31, orders: "286", revenue: "$16,390", average: "$57.31", on_time: 94 },
    Month { name: "July 2026", period: "1 to 31 July", prepared: "3 August", days: ["07-01", "07-15", "07-30"], first: 1, orders: "241", revenue: "$13,105", average: "$54.38", on_time: 91 },
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
            Failure::Service => ("Tabi & Smoke could not sign you in", "This is a problem on our side. Your details are kept; try again in a moment."),
            Failure::Network => ("Could not reach Tabi & Smoke", "Check your connection, then try again. Your details are kept."),
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
    Reports,
    Report(usize),
}

/// A state of a template: the screen, its id and its label.
type State = (Screen, &'static str, &'static str);

/// Each template the site shows: its id, name, description and states.
const PAGES: [(&str, &str, &str, &[State]); 6] = [
    ("login", "Login", "Sign in to the back office, and each way it can fail.", &[
        (Screen::Login(None), "default", "Sign in"),
        (Screen::Login(Some(Failure::Refused)), "refused", "Credentials refused"),
        (Screen::Login(Some(Failure::Service)), "service", "Service failure"),
        (Screen::Login(Some(Failure::Network)), "network", "Connection failure"),
    ]),
    ("crud", "CRUD", "Products as a list, a record, a new one and a delete, in a terminal.", &[
        (Screen::List, "list", "List"),
        (Screen::Detail, "detail", "Detail"),
        (Screen::Create, "create", "Create"),
        (Screen::Delete, "delete", "Delete"),
    ]),
    ("dashboard", "Dashboard", "The shop overview: metrics, orders, shipping and what needs attention.", &[
        (Screen::Dashboard, "default", "Overview"),
    ]),
    ("charts", "Charts & diagrams", "Sales and stock for a range: line charts, gauges, a sparkline and the shop systems.", &[
        (Screen::Charts, "default", "Charts"),
    ]),
    ("reports", "Reports", "One report for each closed month, as a list to open.", &[
        (Screen::Reports, "default", "Reports"),
    ]),
    ("report", "Monthly report", "A month of the shop on one page: summary, sales, products and method.", &[
        (Screen::Report(0), "2026-09", "September 2026"),
        (Screen::Report(1), "2026-08", "August 2026"),
        (Screen::Report(2), "2026-07", "July 2026"),
    ]),
];

struct App {
    theme: Theme,
    screen: Screen,
    login: Form,
    edit: Form,
    create: Form,
    scroll: Scroll,
    month: usize,
    quit: bool,
}

impl App {
    fn new(theme: Theme) -> Self {
        Self { theme, screen: Screen::Login(None), login: login_form(None), edit: edit_form(), create: create_form(), scroll: Scroll::default(), month: 0, quit: false }
    }

    fn key(&mut self, key: KeyEvent) {
        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
            self.quit = true;
            return;
        }
        // The sidebar's pages, from any page that has the sidebar.
        if matches!(self.screen, Screen::List | Screen::Dashboard | Screen::Charts | Screen::Reports | Screen::Report(_)) {
            match key.code {
                KeyCode::Char('o') => return self.open(Screen::Dashboard),
                KeyCode::Char('p') => return self.open(Screen::List),
                KeyCode::Char('c') => return self.open(Screen::Charts),
                KeyCode::Char('r') => return self.open(Screen::Reports),
                KeyCode::Char('q') => {
                    self.quit = true;
                    return;
                }
                _ => {}
            }
        }
        match self.screen {
            Screen::Login(_) => match self.login.key(key) {
                Act::Submit | Act::Press(_) => self.open(Screen::Dashboard),
                Act::Cancel => self.quit = true,
                Act::None => {}
            },
            Screen::Dashboard | Screen::Charts => {}
            Screen::Reports => match key.code {
                KeyCode::Char('j') | KeyCode::Down => self.month = (self.month + 1).min(MONTHS.len() - 1),
                KeyCode::Char('k') | KeyCode::Up => self.month = self.month.saturating_sub(1),
                KeyCode::Enter => self.open(Screen::Report(self.month)),
                _ => {}
            },
            Screen::Report(_) => {
                if key.code == KeyCode::Esc {
                    self.open(Screen::Reports);
                }
            }
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
            Screen::Charts => 2,
            Screen::Reports | Screen::Report(_) => 3,
            _ => 1,
        };
        Sidebar::new(t)
            .head([Line::from(vec![Span::styled(" tabi & smoke ", t.brand())]), Line::default(), Line::styled("Back office", t.muted())])
            .group("Shop", ["Overview", "Products"].map(SideItem::new))
            .group("Insights", ["Charts", "Reports"].map(SideItem::new))
            .current(Some(current))
            .focused(false)
    }

    fn draw(&self, f: &mut Frame) {
        let t = &self.theme;
        let screen = f.area();
        let buf = f.buffer_mut();
        let sidebar = self.sidebar();
        let gate = matches!(self.screen, Screen::Login(_));
        let shell = AppShell::new(screen).side(Side::Left).sidebar(if gate { 0 } else { sidebar.width() });
        if shell.too_small() {
            shell.message(t, buf);
            return;
        }
        let areas = shell.areas();
        let foot = areas.footer;
        // Sign-in is a gate before the workspace: no sidebar, one column.
        if let Screen::Login(failure) = self.screen {
            let body = Rect { width: areas.page.width + 2, ..areas.page };
            self.draw_login(buf, body, failure);
            KeyHints::new(t, [("tab", "next field"), ("enter", "sign in"), ("esc", "quit")]).render(foot, buf);
            return;
        }
        let main = areas.page;
        if let Some(area) = areas.sidebar {
            sidebar.render(area, buf);
        }
        let width = usize::from(main.width);
        let page_area = |head: u16| Rect { y: main.y + head, height: main.height.saturating_sub(head), ..main };

        let pages = [("o", "overview"), ("p", "products"), ("c", "charts"), ("r", "reports"), ("q", "quit")];
        let hints: Vec<(&str, &str)> = match self.screen {
            Screen::Login(_) => Vec::new(),
            Screen::Dashboard => {
                draw_dashboard(buf, t, main);
                pages.to_vec()
            }
            Screen::Charts => {
                draw_charts(buf, t, main);
                pages.to_vec()
            }
            Screen::Reports => {
                draw_reports(buf, t, main, &self.scroll, self.month);
                vec![("j/k", "month"), ("enter", "open"), ("o/p/c", "overview, products, charts"), ("q", "quit")]
            }
            Screen::Report(month) => {
                draw_report(buf, t, main, &MONTHS[month]);
                vec![("esc", "reports"), ("o/p/c", "overview, products, charts"), ("q", "quit")]
            }
            // gallery: crud
            Screen::List => {
                Title::new(t, "Products").render(main, buf);
                put(buf, main, 1, Line::styled("What the shop sells, with the stock on the shelves.", t.muted()));
                list_page(t, width).view(t, &self.scroll).selected(Some(0)).mark(Mark::Bar).render(page_area(3), buf);
                vec![("j/k", "product"), ("enter", "open"), ("n", "new"), ("o/c/r", "pages"), ("q", "quit")]
            }
            Screen::Detail | Screen::Delete => {
                put(buf, main, 0, Tabs::new(t, ["Shuriken, four point · Details", "Stock", "Orders"], 0).numbered(false).line(width));
                put(buf, main, 1, status_line(t));
                let mut page = Page::default();
                page.blank();
                let selected = self.edit.rows(&mut page, t, width, 12, 0..self.edit.fields.len());
                page.blank();
                for line in self.edit.actions(t, &["Discard", "Save"], false).lines(width.saturating_sub(1) as u16) {
                    page.line(line);
                }
                page.view(t, &self.scroll).selected(selected).render(page_area(2), buf);
                vec![("tab", "next field"), ("ctrl+s", "save"), ("[ ]", "tab"), ("x", "delete"), ("esc", "back")]
            }
            Screen::Create => {
                Title::new(t, "New product").render(main, buf);
                put(buf, main, 1, Line::styled("A name, a SKU, a category, a price and the first stock.", t.muted()));
                let mut page = Page::default();
                let mut selected = None;
                for (title, range) in [("Product", 0..3), ("Price and stock", 3..6)] {
                    page.section(t, width, title, None);
                    selected = selected.or(self.create.rows(&mut page, t, width, 16, range));
                    page.blank();
                }
                let actions = self.create.actions(t, &["Cancel", "Create product"], false);
                for line in actions.lines(width.saturating_sub(1) as u16) {
                    page.line(line);
                }
                page.view(t, &self.scroll).selected(selected).render(page_area(3), buf);
                vec![("tab", "next field"), ("←/→", "choose"), ("ctrl+s", "create"), ("esc", "cancel")]
            }
            // gallery end
        };
        // gallery: crud
        if self.screen == Screen::Delete {
            Question::new(t, "Delete Shuriken, four point?")
                .facts([("SKU", "SHU-0406"), ("In stock", "182 units")])
                .block(["The product and its stock record are removed.", "This cannot be undone."])
                .buttons(["Cancel", "Delete product"])
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
        page.line(Line::from(vec![Span::styled(" tabi & smoke ", t.brand()), Span::styled("  admin.best-gear.ninja", t.muted())]));
        page.blank();
        page.line(Line::from(Title::new(t, "Sign in to the back office").spans(width)));
        page.line(Line::styled("Use the email address the shop invited.", t.muted()));
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
        for line in self.login.actions(t, &["Sign in"], false).lines(width.saturating_sub(1) as u16) {
            page.line(line);
        }
        page.blank();
        page.line(Line::styled("Reset password", t.link()));
        page.blank();
        page.section(t, width, "Trouble signing in?", None);
        for (lead, rest) in [
            ("No account yet?", "Ask the shop owner to invite your email."),
            ("Locked out?", "Wait 15 minutes, or ask the shop owner."),
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
    let email = Field::text("Email", "name@example.com").filled("aki@best-gear.ninja");
    let password = Field::text("Password", "").secret();
    let fields = match failure {
        Some(Failure::Refused) => vec![email, password],
        _ => vec![email, password.filled("quiet-steps")],
    };
    Form::new(fields, 1)
}
// gallery end

// gallery: dashboard, charts, report
/// Thirty days of the shop from a first day, as the web example: orders
/// and returns each day, and the units in stock by category.
fn sales(first: i32) -> [Vec<(f64, f64)>; 2] {
    let day = |f: fn(f64) -> f64| (0..30).map(|i| (f64::from(i), f(f64::from(i + first)).round())).collect();
    [day(|i| 8.0 + i / 30.0 + (i / 4.0).sin() * 3.0), day(|i| 1.0 + (i / 3.0).cos())]
}

fn stock() -> [Vec<(f64, f64)>; 3] {
    let day = |f: fn(f64) -> f64| (0..30).map(|i| (f64::from(i), f(f64::from(i + 61)).round())).collect();
    [day(|i| 210.0 + (i / 9.0).sin() * 30.0), day(|i| 40.0 + (i / 4.0).cos() * 6.0), day(|i| (90.0 - i).max(0.0))]
}

const CATEGORIES: [(&str, u64); 6] = [("Throwing", 96), ("Vanishing", 88), ("Tools", 71), ("Footwear", 41), ("Apparel", 29), ("Climbing", 23)];

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

/// A line chart of daily series over a month, with the axes muted.
fn line_chart<'a>(t: &Theme, series: &'a [Vec<(f64, f64)>], names: &[&'a str], max: f64, days: [&'a str; 3]) -> Chart<'a> {
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
        .x_axis(Axis::default().bounds([0.0, 29.0]).style(t.border()).labels(days.map(|l| Span::styled(l, t.muted()))))
        .y_axis(Axis::default().bounds([0.0, max]).style(t.border()).labels(["0".to_owned(), half, format!("{max}")].map(|l| Span::styled(l, t.muted()))))
        .legend_position(None)
}
// gallery end

// gallery: dashboard
/// The overview: the range, four metrics, orders beside shipping, and the
/// products that need attention.
fn draw_dashboard(buf: &mut Buffer, t: &Theme, main: Rect) {
    let width = usize::from(main.width);
    Title::new(t, "Overview").render(main, buf);
    put(buf, main, 1, Line::from(vec![
        Span::styled("What needs attention, what is healthy and where to go next.", t.muted()),
    ]));
    put(buf, main, 2, Line::from(vec![Span::styled("◷ Last 30 days ▾", t.link()), Span::styled("   refreshed just now", t.subtle())]));
    let [stats, panels, table] = Layout::vertical([Constraint::Length(3), Constraint::Length(12), Constraint::Min(0)])
        .spacing(1)
        .areas(Rect { y: main.y + 4, height: main.height.saturating_sub(4), ..main });
    let metrics = [
        ("Revenue", "$18,420", "+12.4%", "After refunds"),
        ("Orders", "312", "+9.1%", "26 above August"),
        ("Average order", "$59.04", "+3.0%", "Per paid order"),
        ("Shipped on time", "96%", "+2%", "Target 95%"),
    ];
    let cells = Layout::horizontal([Constraint::Fill(1); 4]).spacing(2).split(stats);
    for (&(label, value, delta, foot), &cell) in metrics.iter().zip(cells.iter()) {
        put(buf, cell, 0, Line::styled(label, t.muted()));
        put(buf, cell, 1, Line::from(vec![Span::styled(value, t.strong()), Span::raw("  "), Span::styled(delta, t.success())]));
        put(buf, cell, 2, Line::styled(foot, t.subtle()));
    }
    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(panels);
    heading(buf, t, left, "Orders per day", "avg 11 · now 10");
    put(buf, left, 1, legend(t, &["Orders"]));
    let [orders, _] = sales(MONTHS[0].first);
    line_chart(t, &[orders], &["Orders"], 16.0, MONTHS[0].days).render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Shipping", "");
    let w = usize::from(right.width);
    let mut rows = vec![labelled(t, "Shipped on time", "96%", w), meter(t, 96, 100, w)];
    for (name, sold) in CATEGORIES.into_iter().take(4) {
        rows.push(labelled(t, name, &sold.to_string(), w));
        rows.push(meter(t, sold, 120, w));
    }
    for (i, row) in rows.into_iter().enumerate() {
        put(buf, right, 2 + i as u16, row);
    }
    heading(buf, t, table, "Needs attention", "view all products  p");
    let columns = Columns::new(width, &[26, 16, 10, 0]);
    put(buf, table, 2, columns.head(t, &["Product", "Status", "In stock", "Reorder at"]));
    let low = PRODUCTS.iter().filter(|product| product.stock <= product.reorder);
    for (i, product) in low.enumerate() {
        let (status, tone) = product.status();
        let line = columns.row(vec![
            vec![Span::styled(product.name, t.link())],
            owned(tone.badge(t, status).into()),
            vec![Span::raw(product.stock.to_string())],
            vec![Span::styled(product.reorder.to_string(), t.muted())],
        ]);
        put(buf, table, 3 + i as u16, line);
    }
}
// gallery end

// gallery: charts
/// The charts: the range, two line charts with the categories and the
/// shipping beside them, and the shop systems as their edges.
fn draw_charts(buf: &mut Buffer, t: &Theme, main: Rect) {
    Title::new(t, "Charts").render(main, buf);
    put(buf, main, 1, Line::styled("Sales and stock in the range, and the systems behind the shop.", t.muted()));
    put(buf, main, 2, Line::from(vec![Span::styled("◷ Last 30 days ▾", t.link()), Span::styled("   Sep 1 to Sep 30, UTC", t.subtle())]));
    let [top, middle, systems] = Layout::vertical([Constraint::Length(14), Constraint::Length(9), Constraint::Min(0)])
        .spacing(1)
        .areas(Rect { y: main.y + 4, height: main.height.saturating_sub(4), ..main });

    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(top);
    let orders = sales(MONTHS[0].first);
    heading(buf, t, left, "Orders per day", "");
    put(buf, left, 1, legend(t, &["Orders", "Returns"]));
    line_chart(t, &orders, &["Orders", "Returns"], 16.0, MONTHS[0].days).render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Units sold by category", "");
    let w = usize::from(right.width);
    for (i, (name, sold)) in CATEGORIES.into_iter().enumerate() {
        put(buf, right, 2 + 2 * i as u16, labelled(t, name, &sold.to_string(), w));
        put(buf, right, 3 + 2 * i as u16, meter(t, sold, 120, w));
    }

    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(middle);
    let shelves = stock();
    heading(buf, t, left, "Stock by category", "");
    put(buf, left, 1, legend(t, &["Throwing", "Footwear", "Vanishing"]));
    line_chart(t, &shelves, &["Throwing", "Footwear", "Vanishing"], 300.0, MONTHS[0].days)
        .render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Shipping", "");
    put(buf, right, 2, labelled(t, "Shipped on time", "96%", w));
    put(buf, right, 3, meter(t, 96, 100, w));
    let values: Vec<u64> = orders[0].iter().map(|&(_, v)| v as u64).collect();
    Sparkline::default().data(&values).style(t.fg(chart_colors(t)[0])).render(Rect { y: right.y + 5, height: right.height.saturating_sub(5).min(4), ..right }, buf);

    heading(buf, t, systems, "Shop systems", "7 links");
    let node = |name: &'static str| Span::styled(name, t.strong());
    let edge = |label: String| Span::styled(label, t.muted());
    let mut lines = vec![
        Line::from(vec![node("tabiandsmoke/storefront"), edge(" ── build ──▶ ".into()), node("storefront:2026.09.18")]),
        Line::from(vec![node("storefront:2026.09.18"), edge(" ── deploy ──▶ ".into()), node("shop-web"), edge(", ".into()), node("shop-orders")]),
        Line::from(vec![node("best-gear.ninja"), edge(" ── :8000 ──▶ ".into()), node("shop-web")]),
        Line::from(vec![node("shop-web"), edge(", ".into()), node("shop-orders"), edge(" ── DATABASE_URL ──▶ ".into()), node("shop-db")]),
    ];
    let mut cache = vec![node("shop-web"), Span::styled(" ┄┄ REDIS_URL ┄┄▶ ", t.danger()), node("shop-cache"), Span::raw("  ")];
    cache.extend(owned(StatusBadge::danger(t, "Failed").into()));
    lines.push(Line::from(cache));
    for (i, line) in lines.into_iter().enumerate() {
        put(buf, systems, 2 + i as u16, line);
    }
}
// gallery end

// gallery: reports
fn draw_reports(buf: &mut Buffer, t: &Theme, main: Rect, scroll: &Scroll, selected: usize) {
    let width = usize::from(main.width);
    Title::new(t, "Reports").render(main, buf);
    put(buf, main, 1, Line::styled("One report for each closed month. Open a month to read or print it.", t.muted()));
    let mut page = Page::default();
    page.section(t, width, "Monthly reports", Some(MONTHS.len()));
    let columns = Columns::new(width, &[16, 7, 9, 16, 0]);
    page.line(columns.head(t, &["Month", "Orders", "Revenue", "Shipped on time", "Prepared"]));
    for month in &MONTHS {
        page.item([columns.row(vec![
            vec![Span::raw(month.name)],
            vec![Span::raw(month.orders)],
            vec![Span::raw(month.revenue)],
            vec![Span::raw(format!("{}%", month.on_time))],
            vec![Span::styled(month.prepared, t.muted())],
        ])]);
    }
    page.blank();
    page.line(Line::styled(format!("  {} of {} reports", MONTHS.len(), MONTHS.len()), t.muted()));
    page.view(t, scroll).selected(Some(selected)).mark(Mark::Bar).render(Rect { y: main.y + 3, height: main.height.saturating_sub(3), ..main }, buf);
}
// gallery end

// gallery: report
fn draw_report(buf: &mut Buffer, t: &Theme, main: Rect, month: &Month) {
    let width = usize::from(main.width);
    Title::new(t, format!("Tabi & Smoke, {}", month.name)).render(main, buf);
    put(buf, main, 1, Line::styled(format!("Shop report · {} · prepared on {}", month.period, month.prepared), t.muted()));
    let shipping = if month.on_time >= 95 {
        "Shipping stayed above the 95% target for the whole month."
    } else {
        "Shipping fell below the 95% target this month."
    };
    let lead = format!("The shop took {} orders for {} in revenue. {shipping}", month.orders, month.revenue);
    for (i, line) in wrap(&lead, width).into_iter().enumerate() {
        put(buf, main, 3 + i as u16, Line::raw(line));
    }
    let [summary, charts, table, method] =
        Layout::vertical([Constraint::Length(5), Constraint::Length(9), Constraint::Length(10), Constraint::Min(0)])
            .spacing(1)
            .areas(Rect { y: main.y + 6, height: main.height.saturating_sub(6), ..main });

    heading(buf, t, summary, "Summary", "");
    let on_time = format!("{}%", month.on_time);
    let metrics = [
        ("Revenue", month.revenue, "After refunds"),
        ("Orders", month.orders, "Paid orders"),
        ("Average order", month.average, "Per paid order"),
        ("Shipped on time", on_time.as_str(), "Target 95%"),
    ];
    let stats = Rect { y: summary.y + 2, height: summary.height.saturating_sub(2), ..summary };
    let cells = Layout::horizontal([Constraint::Fill(1); 4]).spacing(2).split(stats);
    for (&(label, value, foot), &cell) in metrics.iter().zip(cells.iter()) {
        put(buf, cell, 0, Line::styled(label, t.muted()));
        put(buf, cell, 1, Line::styled(value.to_owned(), t.strong()));
        put(buf, cell, 2, Line::styled(foot, t.subtle()));
    }

    let [left, right] = Layout::horizontal([Constraint::Fill(2), Constraint::Fill(1)]).spacing(3).areas(charts);
    let orders = sales(month.first);
    heading(buf, t, left, "Orders per day", "");
    put(buf, left, 1, legend(t, &["Orders", "Returns"]));
    line_chart(t, &orders, &["Orders", "Returns"], 16.0, month.days).render(Rect { y: left.y + 2, height: left.height.saturating_sub(2), ..left }, buf);
    heading(buf, t, right, "Shipping", "");
    let w = usize::from(right.width);
    put(buf, right, 2, labelled(t, "Shipped on time", &on_time, w));
    put(buf, right, 3, meter(t, month.on_time, 100, w));
    for (i, line) in wrap("On time means shipped within two working days.", w).into_iter().enumerate() {
        put(buf, right, 5 + i as u16, Line::styled(line, t.muted()));
    }

    heading(buf, t, table, "Products by units sold", "");
    let columns = Columns::new(width, &[26, 8, 8, 4, 0]);
    put(buf, table, 2, columns.head(t, &["Product", "SKU", "Price", "Sold", "Stock status"]));
    let mut sold: Vec<&Product> = PRODUCTS.iter().collect();
    sold.sort_by_key(|product| std::cmp::Reverse(product.sold));
    for (i, product) in sold.into_iter().enumerate() {
        let (status, tone) = product.status();
        let line = columns.row(vec![
            vec![Span::raw(product.name)],
            vec![Span::styled(product.sku, t.muted())],
            vec![Span::raw(product.price)],
            vec![Span::raw(product.sold.to_string())],
            owned(tone.badge(t, status).into()),
        ]);
        put(buf, table, 3 + i as u16, line);
    }

    heading(buf, t, method, "Method", "");
    let text = "Counts come from the order system at midnight UTC each day. An order counts as on time when it ships within two working days.";
    for (i, line) in wrap(text, width).into_iter().enumerate() {
        put(buf, method, 1 + i as u16, Line::styled(line, t.muted()));
    }
}
// gallery end

fn put(buf: &mut Buffer, area: Rect, dy: u16, line: Line) {
    if dy < area.height {
        buf.set_line(area.x, area.y + dy, &line, area.width);
    }
}

fn owned(line: Line<'_>) -> Vec<Span<'static>> {
    line.spans.into_iter().map(|s| Span::styled(s.content.into_owned(), s.style)).collect()
}

// gallery: crud
/// The products as rows a person moves through.
fn list_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.section(t, width, "All products", Some(PRODUCTS.len()));
    let columns = Columns::new(width, &[26, 6, 0]);
    page.line(columns.head(t, &["Product", "Stock", "Status"]));
    for product in &PRODUCTS {
        let (status, tone) = product.status();
        let status: Line = tone.badge(t, status).into();
        page.item([columns.row(vec![vec![Span::raw(product.name)], vec![Span::styled(product.stock.to_string(), t.muted())], owned(status)])]);
    }
    page.blank();
    page.line(Line::styled(format!("  {} of {} products", PRODUCTS.len(), PRODUCTS.len()), t.muted()));
    page
}

/// The record's status and where it stands, as the web detail page.
fn status_line(t: &Theme) -> Line<'static> {
    let mut spans = vec![Span::raw("  ")];
    spans.extend(owned(StatusBadge::success(t, "In stock").into()));
    spans.push(Span::styled("    SHU-0406, Throwing. 96 units sold this month.", t.muted()));
    Line::from(spans)
}

fn edit_form() -> Form {
    let fields = vec![
        Field::text("Name", "").filled("Shuriken, four point"),
        Field::text("SKU", "").filled("SHU-0406"),
        Field::select("Category", ["Throwing", "Tools", "Vanishing", "Climbing", "Footwear", "Apparel"]),
        Field::text("Price (USD)", "0.00").filled("24.00"),
        Field::text("Stock", "0").filled("182"),
        Field::text("Reorder at", "0").filled("60"),
    ];
    Form::new(fields, 2)
}
// gallery end

// gallery: crud
fn create_form() -> Form {
    let fields = vec![
        Field::text("Name", "Caltrops, pack of 20"),
        Field::text("SKU", "CAL-0020"),
        Field::select("Category", ["Throwing", "Tools", "Vanishing", "Climbing", "Footwear", "Apparel"]),
        Field::text("Price (USD)", "0.00"),
        Field::text("Stock", "0"),
        Field::text("Reorder at", "0"),
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
    let size = if page == "charts" || page == "report" { TALL } else { SIZE };
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
