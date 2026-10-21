//! A gallery of every component in the crate, like the web gallery.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery
//! Options: --accent <name>, --snapshot <dir>

use std::io::IsTerminal;
use std::path::Path;
use std::process::ExitCode;

use ratatui::backend::TestBackend;
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::{Constraint, Layout, Rect};
use ratatui::style::Style;
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Paragraph, TableState};
use ratatui::{Frame, Terminal};
use tui_kiso::{Header, KeyHints, Modal, StatusBadge, Table, Theme};

const PRODUCT: &str = env!("CARGO_PKG_NAME");
const VERSION: &str = env!("CARGO_PKG_VERSION");

const ACCENTS: &[(&str, kiso_tokens::Theme)] = &[
    ("violet", kiso_tokens::VIOLET_DARK),
    ("terracotta", kiso_tokens::TERRACOTTA_DARK),
    ("teal", kiso_tokens::TEAL_DARK),
    ("cobalt", kiso_tokens::COBALT_DARK),
    ("nocturne", kiso_tokens::NOCTURNE_DARK),
    ("tangerine", kiso_tokens::TANGERINE_DARK),
    ("red", kiso_tokens::RED_DARK),
    ("gold", kiso_tokens::GOLD_DARK),
    ("lime", kiso_tokens::LIME_DARK),
];

const PAGES: [&str; 6] = ["Theme", "Header", "KeyHints", "Table", "StatusBadge", "Modal"];
const TABLE: usize = 3;
const MODAL: usize = 5;

const USAGE: &str = "\
Usage: gallery [--accent <name>] [--snapshot <dir>]

  --accent <name>    violet, terracotta, teal, cobalt, nocturne, tangerine,
                     red, gold or lime. Default: gold.
  --snapshot <dir>   Write every page at 80 by 24 as HTML, then exit.";

#[derive(Clone, Copy, PartialEq, Eq)]
enum Layer {
    Help,
    Confirm,
    /// The accent picker, with the highlighted index.
    Accent(usize),
}

struct App {
    theme: Theme,
    accent: usize,
    page: usize,
    pane: bool,
    layer: Option<Layer>,
    rows: TableState,
    quit: bool,
}

impl App {
    fn new(theme: Theme, accent: usize) -> Self {
        Self {
            theme,
            accent,
            page: 0,
            pane: false,
            layer: None,
            rows: TableState::new().with_selected(1),
            quit: false,
        }
    }

    fn key(&mut self, key: KeyEvent) {
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        if ctrl && key.code == KeyCode::Char('c') {
            self.quit = true;
            return;
        }
        match self.layer {
            // Any key closes help.
            Some(Layer::Help) => self.layer = None,
            Some(Layer::Confirm) => {
                if matches!(key.code, KeyCode::Enter | KeyCode::Esc | KeyCode::Char('q')) {
                    self.layer = None;
                }
            }
            Some(Layer::Accent(i)) => match key.code {
                KeyCode::Up | KeyCode::Char('k') => self.layer = Some(Layer::Accent(i.saturating_sub(1))),
                KeyCode::Down | KeyCode::Char('j') => {
                    self.layer = Some(Layer::Accent((i + 1).min(ACCENTS.len() - 1)));
                }
                KeyCode::Enter => {
                    self.accent = i;
                    self.theme = Theme::new(ACCENTS[i].1);
                    self.layer = None;
                }
                KeyCode::Esc | KeyCode::Char('q') => self.layer = None,
                _ => {}
            },
            None => match key.code {
                KeyCode::Char('?') | KeyCode::F(1) => self.layer = Some(Layer::Help),
                KeyCode::Char('a') => self.layer = Some(Layer::Accent(self.accent)),
                KeyCode::Up | KeyCode::Char('k') => self.step(-1),
                KeyCode::Down | KeyCode::Char('j') => self.step(1),
                KeyCode::Tab => self.pane = !self.pane,
                KeyCode::Enter if !self.pane => self.pane = true,
                KeyCode::Enter if self.page == MODAL => self.layer = Some(Layer::Confirm),
                KeyCode::Esc | KeyCode::Char('q') if self.pane => self.pane = false,
                KeyCode::Char('q') => self.quit = true,
                _ => {}
            },
        }
    }

    fn step(&mut self, delta: isize) {
        if !self.pane {
            self.page = self.page.saturating_add_signed(delta).min(PAGES.len() - 1);
        } else if self.page == TABLE {
            let row = self.rows.selected().unwrap_or(0).saturating_add_signed(delta);
            self.rows.select(Some(row.min(MACHINES.len() - 1)));
        }
    }

    fn draw(&mut self, f: &mut Frame) {
        let t = self.theme;
        let screen = f.area();
        f.buffer_mut().set_style(screen, t.base());
        let [top, body, bottom] =
            Layout::vertical([Constraint::Length(1), Constraint::Fill(1), Constraint::Length(1)])
                .areas(screen);
        let [side, rule, pane] =
            Layout::horizontal([Constraint::Length(16), Constraint::Length(1), Constraint::Fill(1)])
                .areas(body);

        f.render_widget(Header::new(&t, PRODUCT, VERSION).breadcrumb(["Gallery", PAGES[self.page]]), top);

        // Sidebar: the selected row has focus; otherwise the page is bold.
        let names = PAGES.iter().enumerate().map(|(i, name)| {
            let style = if i == self.page && self.pane { t.strong() } else { t.text() };
            [Line::styled(format!(" {name}"), style)]
        });
        let list = Table::new(&t, names, [Constraint::Fill(1)]).header([" Components"]);
        let mut state = TableState::new().with_selected(if self.pane { None } else { Some(self.page) });
        f.render_stateful_widget(list, side, &mut state);
        let rule_style = if self.pane { t.focus() } else { t.subtle() };
        f.render_widget(Paragraph::new(vec![Line::raw("│"); usize::from(rule.height)]).style(rule_style), rule);

        let [bar, content] = Layout::vertical([Constraint::Length(1), Constraint::Fill(1)]).areas(pane);
        f.render_widget(Paragraph::new(format!(" {}", PAGES[self.page])).style(t.bar()), bar);
        let content = content.inner(ratatui::layout::Margin::new(1, 0));
        match self.page {
            0 => self.theme_page(f, content),
            1 => header_page(f, content, &t),
            2 => hints_page(f, content, &t),
            TABLE => self.table_page(f, content),
            4 => badge_page(f, content, &t),
            _ => modal_page(f, content, &t),
        }

        let hints: Vec<(&str, &str)> = if !self.pane {
            vec![("↑↓", "move"), ("enter", "open"), ("a", "accent"), ("?", "help"), ("q", "quit")]
        } else if self.page == TABLE {
            vec![("↑↓", "select row"), ("tab", "list"), ("?", "help"), ("esc", "back")]
        } else if self.page == MODAL {
            vec![("enter", "confirmation"), ("tab", "list"), ("?", "help"), ("esc", "back")]
        } else {
            vec![("tab", "list"), ("?", "help"), ("esc", "back")]
        };
        f.render_widget(KeyHints::new(&t, hints), bottom);

        match self.layer {
            Some(Layer::Help) => f.render_widget(help(&t), screen),
            Some(Layer::Confirm) => f.render_widget(confirm(&t), screen),
            Some(Layer::Accent(i)) => f.render_widget(accents(&t, self.accent, i), screen),
            None => {}
        }
    }

    fn theme_page(&self, f: &mut Frame, area: Rect) {
        let t = self.theme;
        let r = t.tokens();
        let depth = if t.is_truecolor() { "truecolor" } else { "xterm-256" };
        let mut lines = vec![
            caption_line(&t, "Accent", ACCENTS[self.accent].0),
            caption_line(&t, "Color depth", depth),
            Line::raw(""),
        ];
        let surfaces = [
            ("background", r.background),
            ("surface", r.surface),
            ("elevated-surface", r.elevated_surface),
            ("muted", r.muted),
            ("selected", r.selected),
            ("primary", r.primary),
            ("border", r.border),
            ("focus", r.focus),
            ("disabled", r.disabled),
        ];
        let text = [
            ("foreground", r.foreground),
            ("muted-foreground", r.muted_foreground),
            ("subtle-foreground", r.subtle_foreground),
            ("link", r.link),
            ("primary-foreground", r.primary_foreground),
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
            vec![
                Span::styled("███", Style::new().fg(color)),
                Span::styled(format!(" {name:<19}"), t.text()),
                Span::styled(value, t.muted()),
            ]
        };
        for (a, b) in surfaces.into_iter().zip(text) {
            let mut spans = swatch(a);
            spans.push(Span::raw(" "));
            spans.extend(swatch(b));
            lines.push(Line::from(spans));
        }
        lines.push(Line::raw(""));
        f.render_widget(Paragraph::new(lines), area);
        let y = area.y + 13;
        let row = |y: u16| Rect::new(area.x, y, area.width, 1).intersection(area);
        f.render_widget(Paragraph::new(" bar()  Table header row and section bar").style(t.bar()), row(y));
        f.render_widget(Paragraph::new(" selected()  A selected row").style(t.base().patch(t.selected())), row(y + 1));
        f.render_widget(Paragraph::new(" surface()  An inline panel").style(t.surface()), row(y + 2));
        f.render_widget(Paragraph::new(" elevated()  A popup").style(t.elevated()), row(y + 3));
    }

    fn table_page(&mut self, f: &mut Frame, area: Rect) {
        let t = self.theme;
        let [a, b, _, c, d, _, e] = Layout::vertical([
            Constraint::Length(1),
            Constraint::Length(5),
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(5),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .areas(area);
        f.render_widget(caption(&t, "No selection. CPU % and Memory are numeric."), a);
        f.render_widget(machines(&t), b);
        f.render_widget(caption(&t, "Selected row: only the background changes."), c);
        f.render_stateful_widget(machines(&t), d, &mut self.rows);
        let note = if self.pane { "↑↓ moves the selection." } else { "Press enter to move the selection." };
        f.render_widget(caption(&t, note), e);
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

fn machines(t: &Theme) -> Table<'_> {
    let rows = MACHINES.iter().map(|m| {
        [
            Line::raw(m.name),
            (m.state)(t).into(),
            Line::styled(m.region, t.muted()),
            Line::raw(m.cpu),
            Line::raw(m.memory),
        ]
    });
    let widths = [11, 15, 8, 5, 7].map(Constraint::Length);
    Table::new(t, rows, widths).header(["Name", "State", "Region", "CPU %", "Memory"]).numeric([3, 4])
}

fn caption(t: &Theme, text: &'static str) -> Paragraph<'static> {
    Paragraph::new(text).style(t.muted())
}

fn caption_line(t: &Theme, label: &'static str, value: &'static str) -> Line<'static> {
    Line::from(vec![Span::styled(format!("{label:<13}"), t.muted()), Span::styled(value, t.text())])
}

fn header_page(f: &mut Frame, area: Rect, t: &Theme) {
    let rows = Layout::vertical([Constraint::Length(1); 12]).split(area);
    f.render_widget(caption(t, "Brand only"), rows[0]);
    f.render_widget(Header::new(t, "pg-probe", "0.4.0"), rows[1]);
    f.render_widget(caption(t, "With a title"), rows[3]);
    f.render_widget(Header::new(t, "pg-probe", "0.4.0").title("Machines"), rows[4]);
    f.render_widget(caption(t, "With a breadcrumb"), rows[6]);
    f.render_widget(Header::new(t, "pg-probe", "0.4.0").breadcrumb(["Projects", "pg-main", "Machines"]), rows[7]);
    f.render_widget(caption(t, "At 32 columns, the end is cut"), rows[9]);
    let narrow = Rect { width: 32.min(rows[10].width), ..rows[10] };
    f.render_widget(Header::new(t, "pg-probe", "0.4.0").breadcrumb(["Projects", "pg-main", "Machines"]), narrow);
}

fn hints_page(f: &mut Frame, area: Rect, t: &Theme) {
    let hints = [("↑↓", "move"), ("enter", "open"), ("/", "filter"), ("s", "sort"), ("?", "help"), ("q", "quit")];
    let rows = Layout::vertical([Constraint::Length(1); 15]).split(area);
    let widths: [(u16, &str); 4] = [
        (56, "At 56 columns, every hint fits"),
        (40, "At 40 columns, sort and filter drop"),
        (30, "At 30 columns, open drops too"),
        (22, "At 22 columns, help and quit stay"),
    ];
    for (n, (width, label)) in widths.into_iter().enumerate() {
        let y = n * 3;
        f.render_widget(caption(t, label), rows[y]);
        let line = Rect { width: width.min(rows[y + 1].width), ..rows[y + 1] };
        f.render_widget(KeyHints::new(t, hints), line);
        if line.right() < area.right() {
            f.buffer_mut().set_string(line.right(), line.y, "│", t.subtle());
        }
    }
    f.render_widget(caption(t, "The current view's label is bold"), rows[12]);
    let views = [("1", "Overview"), ("2", "Machines"), ("3", "Logs"), ("?", "help"), ("q", "quit")];
    f.render_widget(KeyHints::new(t, views).current(1), rows[13]);
}

fn badge_page(f: &mut Frame, area: Rect, t: &Theme) {
    let lines = vec![
        variant(t, "success", StatusBadge::success(t, "Running")),
        variant(t, "success, pulse", StatusBadge::success(t, "Provisioning").pulse(true)),
        variant(t, "danger", StatusBadge::danger(t, "Failed")),
        variant(t, "neutral", StatusBadge::neutral(t, "Stopped")),
    ];
    let [a, _, b, c] = Layout::vertical([
        Constraint::Length(4),
        Constraint::Length(1),
        Constraint::Length(1),
        Constraint::Length(5),
    ])
    .areas(area);
    f.render_widget(Paragraph::new(lines), a);
    f.render_widget(caption(t, "In a table, on a selected row"), b);
    let rows = MACHINES.iter().map(|m| [Line::raw(m.name), (m.state)(t).into()]);
    let table = Table::new(t, rows, [Constraint::Length(11), Constraint::Length(15)]).header(["Name", "State"]);
    f.render_stateful_widget(table, c, &mut TableState::new().with_selected(1));
}

fn variant<'a>(t: &Theme, name: &str, badge: StatusBadge<'a>) -> Line<'a> {
    let mut line: Line = badge.into();
    line.spans.insert(0, Span::styled(format!("{name:<16}"), t.muted()));
    line
}

fn modal_page(f: &mut Frame, area: Rect, t: &Theme) {
    let [a, b, _, c, d] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Length(9),
        Constraint::Length(1),
        Constraint::Length(1),
        Constraint::Length(9),
    ])
    .areas(area);
    f.render_widget(caption(t, "Help, opened with ?"), a);
    f.render_widget(machines(t), b);
    let body = vec![key_line(t, "↑↓ j k", "Move"), key_line(t, "enter", "Open"), key_line(t, "q", "Quit")];
    f.render_widget(Modal::new(t, "Help").body(body).hints([("any key", "close")]), b);
    f.render_widget(caption(t, "Confirmation, opened with enter"), c);
    f.render_widget(machines(t), d);
    f.render_widget(confirm(t), d);
}

fn key_line<'a>(t: &Theme, key: &'a str, label: &'a str) -> Line<'a> {
    Line::from(vec![Span::styled(format!("{key:<11}"), t.link()), Span::styled(label, t.text())])
}

fn help(t: &Theme) -> Modal<'_> {
    let body = Text::from(vec![
        Line::styled("Gallery", t.strong()),
        key_line(t, "↑↓ j k", "Move in the list"),
        key_line(t, "enter tab", "Focus the pane"),
        key_line(t, "esc q", "Back to the list"),
        Line::raw(""),
        Line::styled("Everywhere", t.strong()),
        key_line(t, "? F1", "This help"),
        key_line(t, "a", "Pick the accent"),
        key_line(t, "q", "Quit from the list"),
        key_line(t, "ctrl+c", "Quit"),
    ]);
    Modal::new(t, "Help").body(body).hints([("any key", "close")])
}

/// The accent picker: a swatch of each accent's primary and its name. The
/// highlighted row has the `selected` background; the applied accent is
/// marked, so color is not the only cue.
fn accents(t: &Theme, current: usize, highlighted: usize) -> Modal<'_> {
    let body: Vec<Line> = ACCENTS
        .iter()
        .enumerate()
        .map(|(i, (name, tokens))| {
            let mark = if i == current { "✓" } else { " " };
            let row = if i == highlighted { t.selected() } else { Style::new() };
            Line::from(vec![
                Span::styled("██ ", Style::new().fg(t.color(tokens.primary))),
                Span::styled(format!("{name:<12}{mark} "), t.text().patch(row)),
            ])
        })
        .collect();
    Modal::new(t, "Accent").body(body).width(30).hints([("enter", "apply"), ("esc", "cancel")])
}

fn confirm(t: &Theme) -> Modal<'_> {
    let body = vec![
        Line::raw("This deletes the machine and its disk."),
        Line::styled("Backups stay for 7 days.", t.muted()),
    ];
    Modal::new(t, "Delete pg-main-2?").body(body).hints([("enter", "delete"), ("esc", "cancel")])
}

fn parse() -> Result<(usize, Option<String>), String> {
    let (mut accent, mut snapshot) = (7, None);
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--accent" => {
                let name = args.next().ok_or("--accent needs a name")?;
                accent = ACCENTS.iter().position(|(n, _)| *n == name).ok_or(format!("unknown accent \"{name}\""))?;
            }
            "--snapshot" => snapshot = Some(args.next().ok_or("--snapshot needs a directory")?),
            "-h" | "--help" => return Err(String::new()),
            other => return Err(format!("unknown option \"{other}\"")),
        }
    }
    Ok((accent, snapshot))
}

fn main() -> ExitCode {
    let (accent, snapshot_dir) = match parse() {
        Ok(options) => options,
        Err(message) => {
            if !message.is_empty() {
                eprintln!("gallery: {message}\n");
            }
            eprintln!("{USAGE}");
            return ExitCode::from(if message.is_empty() { 0 } else { 2 });
        }
    };
    let app = App::new(Theme::new(ACCENTS[accent].1), accent);
    if let Some(dir) = snapshot_dir {
        return match snapshot(Path::new(&dir), app) {
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
    let result = run(&mut terminal, app);
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

/// Writes every page, and the states a page alone does not show, at
/// 80 by 24 as HTML.
fn snapshot(dir: &Path, base: App) -> std::io::Result<usize> {
    std::fs::create_dir_all(dir)?;
    let mut shots = Vec::new();
    let press = |app: &mut App, codes: &[KeyCode]| {
        for &code in codes {
            app.key(KeyEvent::new(code, KeyModifiers::NONE));
        }
    };
    let mut states: Vec<(String, App)> = Vec::new();
    for (i, name) in PAGES.iter().enumerate() {
        let mut app = App::new(base.theme, base.accent);
        app.page = i;
        states.push((format!("{:02}-{}", i + 1, name.to_lowercase()), app));
    }
    let mut app = App::new(base.theme, base.accent);
    press(&mut app, &[KeyCode::Down, KeyCode::Down, KeyCode::Down, KeyCode::Enter, KeyCode::Down]);
    states.push(("07-table-focused".into(), app));
    let mut app = App::new(base.theme, base.accent);
    press(&mut app, &[KeyCode::Char('?')]);
    states.push(("08-help".into(), app));
    let mut app = App::new(base.theme, base.accent);
    app.page = MODAL;
    press(&mut app, &[KeyCode::Enter, KeyCode::Enter]);
    states.push(("09-confirmation".into(), app));
    let mut app = App::new(base.theme, base.accent);
    press(&mut app, &[KeyCode::Char('a'), KeyCode::Up]);
    states.push(("10-accent".into(), app));

    for (name, mut app) in states {
        let Ok(mut terminal) = Terminal::new(TestBackend::new(80, 24));
        let Ok(_) = terminal.draw(|f| app.draw(f));
        let frame = html::buffer(terminal.backend().buffer());
        std::fs::write(dir.join(format!("{name}.html")), html::page(&name, &frame))?;
        shots.push((name, frame));
    }
    let body: String = shots.iter().map(|(name, frame)| format!("<h2>{name}</h2>{frame}")).collect();
    std::fs::write(dir.join("index.html"), html::page("tui-kiso gallery", &body))?;
    Ok(shots.len())
}

/// A ratatui buffer as HTML: one span per run of equal style.
mod html {
    use ratatui::buffer::Buffer;
    use ratatui::style::{Color, Modifier};

    const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

    fn css(color: Color) -> Option<String> {
        let [r, g, b] = match color {
            Color::Rgb(r, g, b) => [r, g, b],
            Color::Indexed(i @ 16..=231) => {
                let i = i - 16;
                [LEVELS[usize::from(i / 36)], LEVELS[usize::from(i / 6 % 6)], LEVELS[usize::from(i % 6)]]
            }
            Color::Indexed(i @ 232..=255) => [8 + 10 * (i - 232); 3],
            Color::Reset => return None,
            // Kiso never sends the 16 named colors. Show one loudly.
            _ => [255, 0, 255],
        };
        Some(format!("#{r:02x}{g:02x}{b:02x}"))
    }

    fn escape(text: &str) -> String {
        text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
    }

    pub fn buffer(buffer: &Buffer) -> String {
        let area = buffer.area;
        let mut out = String::from("<div class=\"term\">");
        for y in 0..area.height {
            out.push_str("<div class=\"row\">");
            let mut run: Option<(String, String)> = None;
            for x in 0..area.width {
                let cell = &buffer[(x, y)];
                let mut style = String::new();
                if let Some(c) = css(cell.fg) {
                    style += &format!("color:{c};");
                }
                if let Some(c) = css(cell.bg) {
                    style += &format!("background:{c};");
                }
                if cell.modifier.contains(Modifier::BOLD) {
                    style += "font-weight:700;";
                }
                match &mut run {
                    Some((s, text)) if *s == style => text.push_str(cell.symbol()),
                    _ => {
                        if let Some((s, text)) = run.take() {
                            out += &format!("<span style=\"{s}\">{}</span>", escape(&text));
                        }
                        run = Some((style, cell.symbol().to_owned()));
                    }
                }
            }
            if let Some((s, text)) = run {
                out += &format!("<span style=\"{s}\">{}</span>", escape(&text));
            }
            out.push_str("</div>");
        }
        out + "</div>"
    }

    pub fn page(title: &str, body: &str) -> String {
        format!(
            "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>{}</title><style>{STYLE}</style></head><body>{body}</body></html>",
            escape(title)
        )
    }

    const STYLE: &str = "body{margin:0;padding:8px;background:#151411;color:#eeece9;font:14px/1.5 system-ui,sans-serif}\
h2{font-size:15px;margin:16px 0 6px}\
.term{font-family:\"JetBrains Mono\",\"DejaVu Sans Mono\",ui-monospace,monospace;font-size:13px;line-height:17px;white-space:pre;display:inline-block;border:1px solid #494744;font-variant-ligatures:none}\
.row{height:17px}.row span{display:inline-block;height:17px;vertical-align:top}";
}
