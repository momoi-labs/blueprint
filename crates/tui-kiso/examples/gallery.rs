//! A gallery of every component in the crate, like the web gallery.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery
//! Options: --accent <name>, --light, --256, --snapshot <dir>, --json <file>

use std::io::IsTerminal;
use std::path::Path;
use std::process::ExitCode;

use ratatui::backend::TestBackend;
use ratatui::buffer::{Buffer, Cell};
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::{Constraint, Rect};
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use ratatui::{Frame, Terminal};
use tui_kiso::{
    braille, fact, scramble, set_background, set_foreground, step, Act, Backdrop, Badge, BarGauge, Border, Button, ButtonState,
    ButtonVariant, Canvas, Card, CardVariant, Chart, ChartLegend, Columns, Dot, Field, FilterEdit, Filters, Form, Grid,
    AppShell, Ink, KeyHints, Look, Mark, Meter, Modal, Page, PageAlign, PageWidth, PanelFill, Pattern, Scroll, Search,
    Series, SideItem, Side, Sidebar, Size,
    Sparkline, Stat, StatusBadge, StepState, Stroke, Switch, SwitchState, Table, Tabs, Theme, ThemePicker, TimeRangeControl, Title,
    Toast, Tone, ACCENTS,
};

const PRODUCT: &str = env!("CARGO_PKG_NAME");
const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Each component, and what its page shows.
const PAGES: [(&str, &str); 71] = [
    ("Theme", "Token colors at this depth, and the look of titles and rules."),
    ("Grid", "The areas of a page, on tracks of whole columns. It draws nothing."),
    ("AppShell", "The areas of a screen. It draws nothing."),
    ("Card", "A surface of fill for related content, with a rule between its parts."),
    ("Separator", "The one rule: horizontal with a label, or vertical."),
    ("Split", "Panes from ratios, parted by a divider. The focus is on the divider."),
    ("BrandMark", "The product name as text, plain or on the accent fill."),
    ("Header", "The app bar: brand, version, scope, path and the right side."),
    ("Title", "Where the person is, across the width."),
    ("PageHeader", "The top of one page: path, title, description and actions."),
    ("Breadcrumb", "Where the person is in a hierarchy; the middle collapses."),
    ("Tabs", "The views of a screen; the current one has a heavy rule."),
    ("Sidebar", "The navigation: groups, counts, a disabled item, and scrolling."),
    ("Pagination", "The pages of a long list on one row; the current one is filled."),
    ("Link", "A destination, underlined, with a focus state."),
    ("KeyHints", "The footer keys. Help and quit always stay."),
    ("ScopeSwitcher", "The scope in the header, and the menu to change it."),
    ("Steps", "Where the person is in a guided flow: a row, a column or a count."),
    ("Button", "An action. The variant says what it is, the state what the keys do."),
    ("IconButton", "A button with a glyph and a name it falls back to."),
    ("FormActions", "The buttons that end a form: primary last, stacked when narrow."),
    ("DropdownMenu", "The actions of one row, opened with a, under the row."),
    ("CommandPalette", "Commands with their keys, opened with ctrl+p."),
    ("Form", "Labels in a column; focus is the list selection."),
    ("FormField", "A label, a control, and its help or its error, on whole tracks."),
    ("Label", "The name of a field, its help under it, and what is wrong with it."),
    ("Input", "One line of text on a fill. A long value slides to keep the cursor."),
    ("PasswordInput", "A secret as dots, shown and hidden with ctrl+r."),
    ("Textarea", "Lines that wrap; the view follows the cursor."),
    ("Checkbox", "A choice the form submits: a square box, then its label."),
    ("RadioGroup", "One choice out of a few that all show."),
    ("Switch", "One setting that is on or off, applied at once."),
    ("Select", "One choice from a list that opens under the field."),
    ("Combobox", "A select you type into: the list keeps what matches."),
    ("DetailSelect", "One choice whose options each have a description."),
    ("ChipInput", "Short values typed one by one, each a chip."),
    ("FilterInput", "The field that filters a list as the person types."),
    ("Search", "The footer search: / starts it, the list marks each match."),
    ("Filters", "One select per facet; f edits them, the page follows."),
    ("TimeRangeControl", "A window of time from a few presets, on one row."),
    ("AccentSelector", "One row of accent swatches with the current one marked."),
    ("ThemePicker", "The accent and dark or light on an elevated card, previewed live."),
    ("Page", "Rows that scroll: sections, columns, a selection, code."),
    ("Table", "Records in columns: a header on a fill, a selection, and its states."),
    ("KV", "The facts of one record: a muted key column, then the value."),
    ("Detail", "A record as a page: tabs, facts, a failure and its run."),
    ("Stat", "One number, its label, and how it changed."),
    ("Badge", "A label on a tint of its tone."),
    ("StatusBadge", "A mark and a word, in the tone's color, plain or as a pill."),
    ("Dot", "One cell that carries a tone."),
    ("CodeBlock", "Code on a card surface, with line numbers and marked lines."),
    ("LogView", "Log lines that follow the end, pause when scrolled, and wrap."),
    ("Disclosure", "A title that opens its content: ▸ closed, ▾ open."),
    ("StepBar", "One segment per step, for a table cell or a summary."),
    ("StepList", "The steps of a run, one row each, with a detail."),
    ("Lifecycle", "A detail header: status, verbs and the destructive action."),
    ("Diagram", "A few boxes and arrows, placed by layer and row."),
    ("Chart", "Series across a window, in braille, with a scale and a legend."),
    ("Sparkline", "The shape of one series in a cell; the number is beside it."),
    ("Meter", "A measurement against a known limit, on one row."),
    ("BarGauge", "Labelled measurements on one scale, values aligned right."),
    ("Dashboard", "Stats, a chart, meters and a gauge on the cards of a grid."),
    ("Alert", "A message about this view: a tint, a glyph and a title per tone."),
    ("Toast", "Notices, spinners and the steps of a run."),
    ("Spinner", "A braille frame with an optional label. The app counts the ticks."),
    ("Skeleton", "Blocks that stand for content on its way. The app owns time."),
    ("EmptyState", "A region with nothing in it: what is empty and what to do."),
    ("Modal", "A dialog over the dimmed page, opened with enter."),
    ("Question", "A question with facts, what happens, and buttons."),
    ("Drawer", "A panel over the page from one edge, for a record's details."),
    ("Popover", "Details next to what they are about, over a lit page."),
];
/// The sidebar groups: a title and how many pages of `PAGES` it takes, in order.
const GROUPS: [(&str, usize); 8] = [("Foundations", 7), ("Navigation", 11), ("Actions", 5), ("Forms", 19), ("Data", 15), ("Charts", 5), ("Feedback", 5), ("Overlays", 4)];
/// The index of a page, by name, so the order of `PAGES` is free to change.
const fn page(name: &str) -> usize {
    let (name, mut i) = (name.as_bytes(), 0);
    while i < PAGES.len() {
        let at = PAGES[i].0.as_bytes();
        let mut k = 0;
        while k < at.len() && k < name.len() && at[k] == name[k] {
            k += 1;
        }
        if k == at.len() && k == name.len() {
            return i;
        }
        i += 1;
    }
    panic!("no such page")
}
const FORM: usize = page("Form");
const CARD: usize = page("Card");
const FILTERS: usize = page("Filters");
const CHART: usize = page("Chart");

const SIZE: (u16, u16) = (100, 30);

/// The appearance options and their values. The first is the default.
const APPEARANCE: [(&str, &[&str]); 7] = [
    ("Background", &["solid", "glow", "dots", "grid", "crosses", "stripes"]),
    ("Strength", &["quiet", "visible"]),
    ("Panel fill", &["glass", "translucent", "solid"]),
    ("Border", &["none", "rail"]),
    ("Ends", &["square", "round"]),
    ("Page width", &["full", "contained"]),
    ("Page align", &["start", "center", "end"]),
];
const CANVASES: [Canvas; 6] = [Canvas::Solid, Canvas::Glow, Canvas::Dots, Canvas::Grid, Canvas::Crosses, Canvas::Stripes];
/// The width of the appearance panel, and the width a page keeps beside it.
const PANEL: u16 = Grid::span(3);
const BESIDE: u16 = 67;

const USAGE: &str = "\
Usage: gallery [--accent <name>] [--light] [--256] [--snapshot <dir>] [--json <file>]

  --accent <name>    violet, terracotta, teal, cobalt, nocturne, tangerine,
                     red, gold, lime, plum, stone or steel. Default: gold.
  --light            Start with the light theme.
  --256              Send xterm-256 colors, as on a terminal without
                     truecolor.
  --snapshot <dir>   Write every page at 100 by 30 as HTML, then exit.
  --json <file>      Write every page and state in every theme as JSON for
                     the Kiso site, then exit.";

/// The states the Kiso site shows under a page, after the page itself.
const SITE_STATES: [(&str, usize, &str); 15] = [
    ("21-form-select", FORM, "Changed select"),
    ("20-form-typing", FORM, "Typing"),
    ("23-help", page("Modal"), "Help over a page"),
    ("29-help-80", page("Modal"), "At 80 by 24"),
    ("32-question-80", page("Question"), "At 80 by 24"),
    ("31-palette-80", page("CommandPalette"), "At 80 by 24"),
    ("24-theme-picker", page("ThemePicker"), "Previewing an accent"),
    ("30-picker-80", page("ThemePicker"), "At 80 by 24"),
    ("22-sidebar-focus", page("Sidebar"), "With focus"),
    ("28-80-by-24", page("Sidebar"), "Hidden at 80 by 24"),
    ("26-filter-editor", FILTERS, "Editing"),
    ("27-filtered", FILTERS, "Filtered"),
    ("34-filters-80", FILTERS, "Editing at 80 by 24"),
    ("33-menu-80", page("DropdownMenu"), "At 80 by 24"),
    ("35-chart-80", CHART, "At 80 by 24"),
];

#[derive(Clone, Copy, PartialEq, Eq)]
enum Layer {
    Help,
    /// The code that sets the look the appearance panel shows.
    Code,
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
    /// The appearance options, and the one with focus while the panel is open.
    looks: Vec<Field>,
    panel: Option<usize>,
    form: Form,
    filters: Filters,
    /// The open overlay of a wave 8 page: its selected row or button, and
    /// what was typed into it.
    overlay: Option<usize>,
    query: String,
    /// The choice of the DetailSelect page.
    detail: usize,
    scroll: Scroll,
    /// The window of time of the range control and the dashboard.
    range: usize,
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
            looks: APPEARANCE.into_iter().map(|(label, values)| Field::select(label, values.iter().copied())).collect(),
            panel: None,
            form: demo_form(),
            filters: demo_filters(),
            overlay: None,
            query: String::new(),
            detail: 0,
            scroll: Scroll::default(),
            range: 1,
            quit: false,
        }
    }

    /// True on the pages the range control moves.
    fn ranged(&self) -> bool {
        matches!(PAGES[self.page].0, "TimeRangeControl" | "Dashboard")
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
        let name = PAGES[self.page].0;
        let typing = (self.main && self.page == FORM && self.picker.is_none() && !self.filters.is_open())
            || (self.overlay.is_some() && wave_08::types(name));
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
        if let Some(focus) = self.panel {
            let count = self.looks.len();
            match key.code {
                KeyCode::Char('s' | 'q') | KeyCode::Esc => self.panel = None,
                KeyCode::Char('e') => self.layer = Some(Layer::Code),
                KeyCode::Down | KeyCode::Char('j') | KeyCode::Tab => self.panel = Some((focus + 1) % count),
                KeyCode::Up | KeyCode::Char('k') | KeyCode::BackTab => self.panel = Some((focus + count - 1) % count),
                KeyCode::Enter => _ = self.looks[focus].key(KeyEvent::new(KeyCode::Right, KeyModifiers::NONE)),
                _ => _ = self.looks[focus].key(key),
            }
            return;
        }
        if self.filters.is_open() {
            if self.filters.key(key) != FilterEdit::None {
                self.scroll.top();
            }
            return;
        }
        if let Some(pick) = self.overlay {
            let rows = wave_08::rows(&self.theme, name, &self.query);
            match key.code {
                KeyCode::Esc | KeyCode::Enter => {
                    self.overlay = None;
                    self.query.clear();
                }
                KeyCode::Up | KeyCode::Left => self.overlay = Some(pick.saturating_sub(1)),
                KeyCode::Down | KeyCode::Right => self.overlay = Some((pick + 1).min(rows.saturating_sub(1))),
                KeyCode::Backspace if wave_08::types(name) => _ = self.query.pop(),
                KeyCode::Char(c) if wave_08::types(name) => {
                    self.query.push(c);
                    self.overlay = Some(0);
                }
                _ => {}
            }
            return;
        }
        if self.main {
            match key.code {
                KeyCode::Enter | KeyCode::Char('o') if wave_08::opens(name) => return self.overlay = Some(wave_08::first(name)),
                KeyCode::Enter if name == "ThemePicker" => return self.picker = Some(ThemePicker::new(self.accent, self.light)),
                KeyCode::Up | KeyCode::Down | KeyCode::Char('j' | 'k') if name == "DetailSelect" => {
                    return self.detail = wave_08::detail_key(&self.theme, self.detail, key.code);
                }
                _ => {}
            }
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
            KeyCode::Char('s') => self.panel = Some(0),
            KeyCode::Char('e') => self.layer = Some(Layer::Code),
            KeyCode::Tab | KeyCode::Enter if !self.main => self.main = true,
            KeyCode::Tab | KeyCode::Esc if self.main => self.main = false,
            KeyCode::Char('q') if self.main => self.main = false,
            KeyCode::Char('q') => self.quit = true,
            KeyCode::Left | KeyCode::Right if self.main && self.ranged() => {
                let by = if key.code == KeyCode::Left { -1 } else { 1 };
                self.range = TimeRangeControl::new(&self.theme, wave_06::RANGES, self.range).moved(by);
            }
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

    /// The theme with the look the appearance panel chose.
    fn themed(&self) -> Theme {
        let chosen = |i: usize| self.looks[i].chosen();
        self.theme.with_look(Look {
            fill: [PanelFill::Glass, PanelFill::Translucent, PanelFill::Solid][chosen(2)],
            border: [Border::None, Border::Rail][chosen(3)],
            round: chosen(4) == 1,
            ..self.theme.look()
        })
    }

    /// What an app writes to get the look the panel shows.
    fn code(&self) -> String {
        let chosen = |i: usize| self.looks[i].chosen();
        let canvas = ["Solid", "Glow", "Dots", "Grid", "Crosses", "Stripes"][chosen(0)];
        let fill = ["Glass", "Translucent", "Solid"][chosen(2)];
        let border = ["None", "Rail"][chosen(3)];
        let width = ["Full", "Contained"][chosen(5)];
        let align = ["Start", "Center", "End"][chosen(6)];
        format!(
            "let tokens = Accent::by_name(\"{accent}\").unwrap().tokens({light});
let theme = Theme::truecolor(tokens).with_look(Look {{
    fill: PanelFill::{fill},
    border: Border::{border},
    round: {round},
    ..Look::DEFAULT
}});

let shell = AppShell::new(screen)
    .page_width(PageWidth::{width})
    .page_align(PageAlign::{align});

// Under the page: Glow first, a pattern last.
Backdrop::new(&theme, Canvas::{canvas})
    .strong({strong})
    .render(screen, buf);",
            accent = ACCENTS[self.accent].name,
            light = self.light,
            round = chosen(4) == 1,
            strong = chosen(1) == 1,
        )
    }

    /// The appearance panel: a Drawer on the right. It gets only its own
    /// columns as the screen, so the page beside it stays lit and shows each
    /// change as it is made.
    fn appearance(&self, t: &Theme, buf: &mut Buffer, area: Rect, focus: usize) {
        if area.width < 20 || area.height < 4 {
            return;
        }
        let body = tui_kiso::Drawer::new(t, "Appearance").draw(area, buf);
        for (i, field) in self.looks.iter().enumerate() {
            let y = body.y + i as u16;
            if y >= body.bottom() {
                return;
            }
            if i == focus {
                buf.set_style(Rect::new(area.x, y, area.width, 1), t.selected());
            }
            let lines = field.lines(t, usize::from(body.width), 12, i == focus);
            buf.set_line(area.x, y, &lines[0], body.width + 2);
        }
        let note = body.y + 1 + self.looks.len() as u16;
        if note < body.bottom() {
            buf.set_stringn(body.x, note, "Round ends need a Nerd Font.", usize::from(body.width), t.subtle());
        }
    }

    fn sidebar(&self) -> Sidebar<'_> {
        let t = &self.theme;
        let brand = Line::from(vec![Span::styled(format!(" {PRODUCT} {VERSION} "), t.brand())]);
        let mut side = Sidebar::new(t).head([brand, Line::default(), Line::styled("Kiso for ratatui", t.muted())]);
        let mut from = 0;
        for (title, count) in GROUPS {
            side = side.group(title, PAGES[from..from + count].iter().map(|(name, _)| SideItem::new(*name)));
            from += count;
        }
        side.current(Some(self.page))
            .focused(!self.main)
    }

    fn draw(&self, f: &mut Frame) {
        let t = &self.themed();
        let screen = f.area();
        let buf = f.buffer_mut();
        // No fill: the terminal's background, set with OSC 11, shows through.
        let sidebar = self.sidebar();
        let shell = AppShell::new(screen).side(Side::Left).sidebar(sidebar.width());
        if shell.too_small() {
            shell.message(t, buf);
            return;
        }
        let areas = shell.areas();
        let foot = areas.footer;
        // The glow is a color under the whole screen, so it goes first. A
        // pattern takes whole cells, so it goes last, below what the page
        // drew.
        let backdrop = Backdrop::new(t, CANVASES[self.looks[0].chosen()]).strong(self.looks[1].chosen() == 1);
        let glow = CANVASES[self.looks[0].chosen()] == Canvas::Glow;
        if glow {
            backdrop.render(screen, buf);
        }
        let (side, main) = (areas.sidebar, areas.page);
        if let Some(area) = side {
            sidebar.render(area, buf);
        }

        let canvas = (main, buf.clone());
        // The panel pushes the page while the page still fits, then covers it.
        let panel = self.panel.map(|focus| (focus, Rect { x: main.right().saturating_sub(PANEL), width: PANEL.min(main.width), ..main }));
        let main = if self.panel.is_some() && main.width >= BESIDE + PANEL + 2 { Rect { width: main.width - PANEL - 2, ..main } } else { main };
        // The panel takes its columns first, so the page is placed here and
        // not by the shell.
        let width = [PageWidth::Full, PageWidth::Contained][self.looks[5].chosen()];
        let align = [PageAlign::Start, PageAlign::Center, PageAlign::End][self.looks[6].chosen()];
        let main = AppShell::place(main, width, align);

        let (name, about) = PAGES[self.page];
        let title = if side.is_none() { format!("{name} · {} of {}", self.page + 1, PAGES.len()) } else { name.to_owned() };
        Title::new(t, title).render(main, buf);
        put(buf, main, 1, Line::styled(about, t.muted()));
        let area = Rect { y: main.y + 3, height: main.height.saturating_sub(3), ..main };
        self.content(buf, area);
        if !glow {
            pattern_under_page(buf, &canvas.1, canvas.0, area, backdrop);
        }

        let keys: Vec<(&str, &str)> = match (self.layer, self.main) {
            (Some(_), _) => vec![("any key", "close")],
            _ if self.overlay.is_some() => vec![("↑/↓", "choose"), ("enter", "pick"), ("esc", "close")],
            (None, true) if wave_08::opens(name) => vec![("enter", "open"), ("tab", "components"), ("?", "help"), ("esc", "back")],
            (None, true) if self.page == FORM => {
                vec![("tab", "next"), ("shift+tab", "back"), ("←/→", "choose"), ("ctrl+s", "send"), ("esc", "back")]
            }
            _ if self.panel.is_some() => vec![("↑/↓", "option"), ("←/→", "value"), ("e", "export"), ("s", "close")],
            _ if self.filters.is_open() => vec![("↑/↓", "facet"), ("←/→", "choose"), ("enter", "keep"), ("esc", "cancel")],
            (None, true) if self.page == FILTERS => vec![("f", "filters"), ("tab", "components"), ("?", "help"), ("esc", "back")],
            (None, true) if self.ranged() => vec![("←/→", "range"), ("tab", "components"), ("t", "theme"), ("?", "help"), ("esc", "back")],
            (None, true) => vec![("j/k", "scroll"), ("tab", "components"), ("t", "theme"), ("s", "appearance"), ("e", "export"), ("?", "help"), ("esc", "back")],
            // Without the sidebar, ←→ go through the components.
            (None, false) => {
                let browse = if side.is_some() { "j/k" } else { "←/→" };
                vec![(browse, "component"), ("enter", "open"), ("t", "theme"), ("s", "appearance"), ("e", "export"), ("?", "help"), ("q", "quit")]
            }
        };
        KeyHints::new(t, keys).render(foot, buf);

        if let Some((focus, area)) = panel {
            self.appearance(t, buf, area, focus);
        }
        if self.filters.is_open() {
            self.filters.view(t, "Filter machines").render(screen, buf);
        }
        if let Some(picker) = &self.picker {
            picker.view(t).render(screen, buf);
        }
        if let Some(pick) = self.overlay {
            wave_08::overlay(t, buf, screen, area, name, pick, &self.query);
        }
        // Help goes over every other layer.
        match self.layer {
            Some(Layer::Help) => help(t).render(screen, buf),
            Some(Layer::Code) => {
                let code = self.code();
                let lines: Vec<Line> = code.lines().map(|line| Line::styled(line.to_owned(), t.text())).collect();
                Modal::new(t, "Export this look").width(70).body(lines).hints([("any key", "close")]).render(screen, buf);
            }
            None => {}
        }
    }

    fn content(&self, buf: &mut Buffer, area: Rect) {
        let t = &self.themed();
        let width = usize::from(area.width);
        match PAGES[self.page].0 {
            "Theme" => self.theme_page(width).view(t, &self.scroll).render(area, buf),
            "Header" => wave_07::header_page(t, buf, area),
            "Title" => title_page(t, buf, area),
            "Tabs" => wave_07::tabs_page(t, buf, area),
            "Page" => {
                let page = list_page(t, width);
                page.view(t, &self.scroll).selected(Some(1)).mark(if self.main { Mark::Bar } else { Mark::Dim }).render(area, buf);
            }
            "Table" => wave_05::table_page(t, buf, area),
            "StatusBadge" => badge_page(t, buf, area),
            "KeyHints" => wave_07::hints_page(t, buf, area),
            "FormActions" => wave_03::form_actions_page(t, buf, area),
            "Form" => {
                let mut page = Page::default();
                page.section(t, width, "Deploy application", None);
                let label = self.form.label_width();
                let item = self.form.rows(&mut page, t, width, label, 0..self.form.fields.len());
                page.blank();
                for line in self.form.actions(t, &["Cancel", "Deploy"], false).lines(width.saturating_sub(1) as u16) {
                    page.line(line);
                }
                let selected = if self.main { self.form.item() } else { None };
                page.view(t, &self.scroll).selected(selected).render(area, buf);
                let row = item.and_then(|item| page.item_area(item, area, &self.scroll));
                if let Some(list) = row.and_then(|row| self.form.list(t, Rect { height: 1, ..row }, label)) {
                    list.render(area, buf);
                }
            }
            "Modal" => wave_08::backdrop_page(t, buf, area, "Enter opens a dialog to rename the machine; esc closes it."),
            "Question" => wave_08::backdrop_page(t, buf, area, "Enter asks before a delete. Focus starts on the safe answer."),
            "CommandPalette" => wave_08::backdrop_page(t, buf, area, "Enter opens the commands; typing filters them."),
            "ThemePicker" => wave_08::backdrop_page(t, buf, area, "Enter or t opens it: the app redraws in the accent under the cursor."),
            "Toast" => toast_page(t, buf, area),
            "Sidebar" => wave_07::sidebar_page(t, buf, area),
            "AppShell" => wave_07::app_shell_page(t, buf, area),
            "PageHeader" => wave_07::page_header_page(t, buf, area),
            "Breadcrumb" => wave_07::breadcrumb_page(t, buf, area),
            "Filters" => {
                let page = filtered_page(t, width, &self.filters);
                page.view(t, &self.scroll).selected(Some(0)).mark(if self.main { Mark::Bar } else { Mark::Dim }).render(area, buf);
            }
            "DropdownMenu" => wave_08::backdrop_page(t, buf, area, "Enter opens the actions of the selected row."),
            "Drawer" => wave_08::backdrop_page(t, buf, area, "Enter opens the details of the selected row from the right edge."),
            "Popover" => wave_08::popover_page(t, buf, area),
            "ScopeSwitcher" => wave_08::scope_page(t, buf, area, self.main),
            "DetailSelect" => wave_08::detail_select_page(t, buf, area, self.detail, self.main),
            "Detail" => detail_page(t, width).view(t, &self.scroll).render(area, buf),
            "Chart" => chart_page(t, buf, area),
            "Sparkline" => sparkline_page(t, width).view(t, &self.scroll).render(area, buf),
            "Meter" => meter_page(t, width).view(t, &self.scroll).render(area, buf),
            "BarGauge" => bar_gauge_page(t, width).view(t, &self.scroll).render(area, buf),
            "Card" => card_page(t, buf, area),
            "Stat" => stat_page(t, buf, area),
            "Badge" => tone_badge_page(t, buf, area),
            "Dot" => dot_page(t, buf, area),
            "Button" => button_page(t, buf, area),
            "Switch" => switch_page(t, buf, area),
            "Alert" => wave_04::alert_page(t, buf, area),
            "Spinner" => wave_04::spinner_page(t, buf, area),
            "Skeleton" => wave_04::skeleton_page(t, buf, area),
            "EmptyState" => wave_04::empty_state_page(t, buf, area),
            "Link" => wave_04::link_page(t, buf, area),
            "Separator" => wave_04::separator_page(t, buf, area),
            "Diagram" => wave_06::diagram_page(t, buf, area),
            "TimeRangeControl" => wave_06::time_range_page(t, buf, area, self.range),
            "Dashboard" => wave_06::dashboard_page(t, buf, area, self.range),
            "AccentSelector" => wave_10::accent_selector_page(t, buf, area),
            "BrandMark" => wave_10::brand_mark_page(t, buf, area),
            "Label" => wave_02::label_page(t, buf, area),
            "Input" => wave_02::input_page(t, buf, area),
            "PasswordInput" => wave_02::password_page(t, buf, area),
            "Textarea" => wave_02::textarea_page(t, buf, area),
            "FormField" => wave_02::form_field_page(t, buf, area),
            "Split" => wave_09::split_page(t, buf, area),
            "Disclosure" => wave_09::disclosure_page(t, buf, area),
            "Steps" => wave_09::steps_page(t, buf, area),
            "StepBar" => wave_09::step_bar_page(t, buf, area),
            "StepList" => wave_09::step_list_page(t, buf, area),
            "Lifecycle" => wave_09::lifecycle_page(t, buf, area),
            "KV" => wave_05::kv_page(t, buf, area),
            "Pagination" => wave_05::pagination_page(t, buf, area),
            "FilterInput" => wave_05::filter_input_page(t, buf, area),
            "Search" => wave_05::search_page(t, buf, area),
            "LogView" => wave_05::log_view_page(t, buf, area),
            "CodeBlock" => wave_05::code_block_page(t, buf, area),
            "Checkbox" => wave_03::checkbox_page(t, buf, area),
            "RadioGroup" => wave_03::radio_group_page(t, buf, area),
            "Select" => wave_03::select_page(t, buf, area),
            "Combobox" => wave_03::combobox_page(t, buf, area),
            "ChipInput" => wave_03::chip_input_page(t, buf, area),
            "IconButton" => wave_03::icon_button_page(t, buf, area),
            _ => grid_page(t, buf, area),
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

/// A pattern of the canvas is for the empty part of a page: the rows
/// below what the page drew, after one empty row. `before` is the screen
/// before the page.
fn pattern_under_page(buf: &mut Buffer, before: &Buffer, main: Rect, area: Rect, backdrop: Backdrop) {
    let (main, area) = (main.intersection(buf.area), area.intersection(buf.area));
    let last = area.positions().filter(|at| buf[*at] != before[*at]).map(|at| at.y).max();
    let top = last.map_or(area.top(), |y| y.saturating_add(2));
    let mut pattern = Buffer::empty(main);
    backdrop.render(main, &mut pattern);
    for at in main.positions().filter(|at| at.y >= top) {
        buf[at] = pattern[at].clone();
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

fn machines(t: &Theme) -> Table<'_> {
    let rows = MACHINES.iter().map(|m| {
        [Line::raw(m.name), (m.state)(t).into(), Line::styled(m.region, t.muted()), Line::raw(m.cpu), Line::raw(m.memory)]
    });
    let widths = [11, 15, 8, 5, 7].map(Constraint::Length);
    Table::new(t, rows, widths).header(["Name", "State", "Region", "CPU %", "Memory"]).numeric([3, 4])
}

fn badge_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let variants = || {
        [
            ("success", StatusBadge::success(t, "Running")),
            ("success, pulse", StatusBadge::success(t, "Provisioning").pulse(true)),
            ("danger", StatusBadge::danger(t, "Failed")),
            ("neutral", StatusBadge::neutral(t, "Stopped")),
        ]
    };
    for (i, (name, badge)) in variants().into_iter().enumerate() {
        let mut line: Line = badge.into();
        line.spans.insert(0, Span::styled(format!("{name:<16}"), t.muted()));
        put(buf, area, i as u16, line);
    }
    caption(t, buf, area, 5, "As a pill, for a header, a card or a detail page");
    for (i, (name, badge)) in variants().into_iter().enumerate() {
        let badge = badge.pill(true);
        let dy = 7 + i as u16 * 2;
        if let Some(rect) = inside(area, 16, dy, badge.width(), 1) {
            caption(t, buf, area, dy, name);
            badge.render(rect, buf);
        }
    }
}

/// The rectangle at `x` and `dy` of `area`, when all of it is on the page.
/// A widget that does not fit is not drawn.
fn inside(area: Rect, x: u16, dy: u16, width: u16, height: u16) -> Option<Rect> {
    let rect = Rect::new(area.x + x, area.y + dy, width, height);
    (rect.right() <= area.right() && rect.bottom() <= area.bottom() && rect.bottom() <= area.intersection(rect).bottom())
        .then_some(rect)
}

fn card_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let cards = [
        ("Plain, size md", Card::new(t), 0, 0),
        ("Elevated, for a popover or a menu", Card::new(t).variant(CardVariant::Elevated), 35, 0),
        ("Size sm", Card::new(t).size(Size::Sm), 0, 9),
        ("Hover, for a card that is a link", Card::new(t).hover(true), 35, 9),
    ];
    for (name, card, x, dy) in cards {
        let Some(rect) = inside(area, x, dy + 2, 32, 6) else { continue };
        buf.set_string(rect.x, rect.y - 2, name, t.muted());
        card.render(rect, buf);
        let inner = card.inner(rect);
        let width = usize::from(inner.width);
        card.title(buf, rect, "Backups", "7 kept");
        buf.set_stringn(inner.x, inner.y + 1, "Daily at 02:00 UTC", width, t.muted());
        card.rule(buf, rect, inner.y + 2);
        buf.set_stringn(inner.x, inner.y + 3, "Last run    12 min ago", width, t.text());
    }
    for (x, name, card) in [(0, "Loading", Card::new(t).loading(true)), (35, "Loading, bars pulse", Card::new(t).loading(true).tick(2))] {
        if let Some(rect) = inside(area, x, 20, 32, 6) {
            buf.set_string(rect.x, rect.y - 2, name, t.muted());
            card.render(rect, buf);
        }
    }
}

fn stat_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "In a card, with a delta and a note");
    let stat = Stat::new(t, "Tasks completed", "186").delta(Badge::new(t, Tone::Success, "+18.6%")).note("32 more than last month");
    if let Some(rect) = inside(area, 0, 2, 34, stat.height()) {
        stat.render(rect, buf);
    }
    caption(t, buf, area, 8, "Without a card, in a row of facts");
    for (i, (label, value)) in [("Projects", "24"), ("Tasks", "186"), ("On time", "94.2%")].into_iter().enumerate() {
        let stat = Stat::new(t, label, value).card(false);
        if let Some(rect) = inside(area, i as u16 * 15, 10, 13, stat.height()) {
            stat.render(rect, buf);
        }
    }
    caption(t, buf, area, 14, "Loading keeps the height. A trend sits under the value");
    let stat = Stat::new(t, "Tasks completed", "").note("").loading(true).tick(1);
    if let Some(rect) = inside(area, 0, 16, 34, stat.height()) {
        stat.render(rect, buf);
    }
    let trend = Sparkline::new(t, wave(40, 60.0, 20.0, 0.0)).primary(true);
    let stat = Stat::new(t, "Queries/s", "1,284").delta(Badge::new(t, Tone::Success, "+4.2%")).trend(trend).note("last hour");
    if let Some(rect) = inside(area, 36, 16, 34, stat.height()) {
        stat.render(rect, buf);
    }
}

fn tone_badge_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows = Tone::ALL.map(|tone| (tone.name(), Badge::new(t, tone, tone.name())));
    let more = [
        ("outline", Badge::new(t, Tone::Neutral, "Beta").outline(true)),
        ("with a dot", Badge::new(t, Tone::Success, "live").dot(true)),
    ];
    for (i, (name, badge)) in rows.into_iter().chain(more).enumerate() {
        let dy = i as u16 * 2;
        if let Some(rect) = inside(area, 16, dy, badge.width(), 1) {
            caption(t, buf, area, dy, name);
            badge.render(rect, buf);
        }
    }
}

fn dot_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    for (i, tone) in Tone::ALL.into_iter().enumerate() {
        let dot = Span::from(Dot::new(t, tone));
        put(buf, area, i as u16, Line::from(vec![Span::styled(format!("{:<16}", tone.name()), t.muted()), dot]));
    }
    let frames = [0, 1].map(|tick| Span::from(Dot::new(t, Tone::Success).pulse(tick)));
    let [first, second] = frames;
    put(buf, area, 6, Line::from(vec![Span::styled(format!("{:<16}", "pulse, frames"), t.muted()), first, Span::raw(" "), second]));
    let named = Line::from(vec![Span::from(Dot::new(t, Tone::Warning)), Span::styled(" laya-staging", t.text())]);
    put(buf, area, 8, Line::styled("Before a name that says the state", t.muted()));
    put(buf, area, 9, named);
}

fn button_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    // A button starts one column in, so the focus bars have room.
    let row = |buf: &mut Buffer, dy: u16, name: &str, buttons: &[Button]| {
        let height = buttons.iter().map(Button::height).max().unwrap_or(1);
        if inside(area, 0, dy, 1, height + 2).is_none() {
            return;
        }
        caption(t, buf, area, dy, name);
        let mut x = 1;
        for button in buttons {
            if let Some(rect) = inside(area, x, dy + 2, button.width(), button.height()) {
                button.render(rect, buf);
            }
            x += 14;
        }
    };
    let kinds = [
        (ButtonVariant::Default, "Cancel"),
        (ButtonVariant::Primary, "Save"),
        (ButtonVariant::Destructive, "Remove"),
        (ButtonVariant::Ghost, "Skip"),
    ];
    let variants = kinds.map(|(variant, label)| Button::new(t, label).variant(variant));
    row(buf, 0, "Variants: default, primary, destructive, ghost", &variants);
    let states = [ButtonState::Rest, ButtonState::Hover, ButtonState::Focus, ButtonState::Disabled, ButtonState::Loading(0)];
    let states = states.map(|state| Button::new(t, "Save").variant(ButtonVariant::Primary).state(state));
    row(buf, 6, "States: default, hover, focus, disabled, loading", &states);
    row(buf, 12, "Size sm, one row, for a card footer, a toolbar or a table", &variants.map(|button| button.size(Size::Sm)));
}

fn switch_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows = [
        ("off", Switch::new(t, false)),
        ("on", Switch::new(t, true)),
        ("hover", Switch::new(t, true).state(SwitchState::Hover)),
        ("focus", Switch::new(t, true).state(SwitchState::Focus)),
        ("disabled", Switch::new(t, true).state(SwitchState::Disabled)),
        ("with the word", Switch::new(t, true).word(true)),
    ];
    // A switch starts one column in, so the focus bars have room.
    for (i, (name, switch)) in rows.into_iter().enumerate() {
        let dy = i as u16 * 2;
        if let Some(rect) = inside(area, 17, dy, switch.width(), 1) {
            caption(t, buf, area, dy, name);
            switch.render(rect, buf);
        }
    }
}

fn grid_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let mut grid = Grid::new(Rect { y: area.y + 2, ..area });
    let tracks = grid.tracks();
    caption(t, buf, area, 0, &format!("{tracks} tracks of {} columns, {} apart, at this width", Grid::TRACK, Grid::GAP));
    let spans = (0..tracks).map(|_| 1).chain([2, tracks - 2, tracks]);
    for span in spans {
        let cell = grid.cell(span, 3);
        if cell.right() > area.right() || cell.bottom() > area.bottom().min(buf.area.bottom()) {
            continue;
        }
        let card = Card::new(t).size(Size::Sm);
        card.render(cell, buf);
        let inner = card.inner(cell);
        let label = if span == 1 { "1 track".to_owned() } else { format!("{span} tracks") };
        buf.set_stringn(inner.x, inner.y, label, usize::from(inner.width), t.muted());
    }
}

fn demo_form() -> Form {
    let mut name = Field::text("Name", "My app");
    name.error = Some("Another application is called this.".into());
    let name = name.filled("laya");
    let regions = ["eu-west-1", "eu-west-2", "eu-central-1", "us-east-1", "us-west-2", "ap-south-1"];
    let fields = vec![
        Field::select("Definition", ["Container image", "Compose file", "Native process"]).hint("An image that is already published."),
        name,
        Field::text("Image", "nginx:alpine").hint("One container serving HTTP."),
        Field::text("Token", "Leave empty to keep it").secret(),
        Field::combobox("Region", regions, "Type a region").choose(0).hint("Type to filter, enter to open the list."),
        Field::chips("Hosts", "Add a host").with_chips(["web-1", "web-2"]).hint("Enter or a comma adds a host."),
        Field::radio("Size", ["Small", "Medium", "Large"]).choose(1),
        Field::area("Notes", "What changed in this release"),
        Field::switch("Backups").on(true),
        Field::checkbox("Start on boot"),
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
    wave_04::toast_cards(t, buf, Rect { y: area.y.saturating_add(13), height: area.height.saturating_sub(13), ..area });
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

/// A smooth, repeatable series of `n` samples around `base`, for the
/// chart pages.
fn wave(n: usize, base: f64, swing: f64, phase: f64) -> Vec<f64> {
    (0..n).map(|i| {
        let x = i as f64 / 6.0 + phase;
        (base + swing * (x.sin() + 0.4 * (2.3 * x).cos())).max(0.0)
    }).collect()
}

fn chart_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let mut replica: Vec<Option<f64>> = wave(60, 30.0, 12.0, 2.0).into_iter().map(Some).collect();
    // The collector missed a few samples: the line breaks there.
    for sample in &mut replica[34..39] {
        *sample = None;
    }
    let cpu = Chart::new(t, "CPU by machine (%)")
        .meta("last hour")
        .series([
            Series::new("pg-main-1", wave(60, 55.0, 20.0, 0.0)),
            Series::new("pg-replica", replica),
            Series::new("pg-archive", wave(60, 12.0, 4.0, 4.0)),
        ])
        .times(["18:00", "18:15", "18:30", "18:45", "19:00"])
        .range(0.0, 100.0)
        .format(|v| format!("{v:.0}"));
    let height = (area.height * 3 / 5).clamp(1, 14);
    cpu.render(Rect { height, ..area }, buf);
    let connections = Chart::new(t, "Connections")
        .series([Series::new("Active", wave(60, 40.0, 15.0, 1.0)).slot(4)])
        .times(["18:00", "19:00"])
        .legend(ChartLegend::Inline)
        .format(|v| format!("{v:.0}"));
    let y = area.y + height + 1;
    connections.render(Rect { y, height: area.bottom().saturating_sub(y).min(9), ..area }.intersection(area), buf);
}

fn sparkline_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.section(t, width, "Applications", Some(3));
    let columns = Columns::new(width, &[12, 7, 0]);
    page.line(columns.head(t, &["Name", "CPU %", "Last hour"]));
    let apps: [(&str, Vec<Option<f64>>); 3] = [
        ("laya", wave(40, 40.0, 15.0, 0.0).into_iter().map(Some).collect()),
        ("comfyui", wave(40, 70.0, 20.0, 3.0).into_iter().enumerate().map(|(i, v)| (!(14..20).contains(&i)).then_some(v)).collect()),
        ("archive", vec![Some(2.0); 40]),
    ];
    for (name, values) in apps {
        let current = values.last().copied().flatten().map_or("—".to_owned(), |v| format!("{v:.1}"));
        let line = Sparkline::new(t, values).range(0.0, 100.0).line(columns.widths()[2]);
        page.item([columns.row(vec![vec![Span::raw(name)], vec![Span::raw(format!("{current:>7}"))], line.spans])]);
    }
    page.blank();
    page.line(Line::styled("  One scale, 0 to 100, for every row. comfyui missed samples.", t.muted()));
    page.blank();
    page.section(t, width, "Tones", None);
    let samples = wave(30, 20.0, 8.0, 1.0);
    page.line(fact(t, 14, "Neutral", Sparkline::new(t, samples.clone()).line(30).spans));
    page.line(fact(t, 14, "Primary", Sparkline::new(t, samples).primary(true).line(30).spans));
    page.line(fact(t, 14, "One sample", [Span::styled("draws nothing", t.muted())]));
    page
}

fn meter_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    page.section(t, width, "States", None);
    let row = width.min(64);
    let meters = [
        Meter::new(t, "Connections", 64.0).value_text("64 of 100"),
        Meter::new(t, "Disk used", 0.0).value_text("0 of 512 GiB"),
        Meter::new(t, "Memory", 18.4).range(0.0, 16.0).value_text("18.4 of 16 GiB"),
        Meter::new(t, "Replication", None),
    ];
    for meter in meters {
        page.line(meter.label_width(12).line(row));
    }
    page.blank();
    page.line(Line::styled("  Memory is over its limit: the track stops full, the text keeps 18.4.", t.muted()));
    page.blank();
    page.section(t, width, "Thresholds change the tone", None);
    for (label, value) in [("Below", 54.0), ("Warning", 78.0), ("Danger", 95.0)] {
        page.line(Meter::new(t, label, value).value_text(format!("{value:.0}")).thresholds(70.0, 90.0).label_width(12).line(row));
    }
    page.line(Line::styled("  Color is a weak signal: the number and a badge say the state too.", t.muted()));
    page.blank();
    page.section(t, width, "At 24 columns, the track drops", None);
    page.line(Meter::new(t, "Connections", 64.0).value_text("64 of 100").line(24));
    page
}

fn bar_gauge_page(t: &Theme, width: usize) -> Page {
    let mut page = Page::default();
    let gauge = BarGauge::new(t, "Disk used (GiB)", 512.0)
        .row("pg-main-1", 412.0)
        .row("pg-main-2", 512.0)
        .row("pg-replica", 96.5)
        .row("pg-archive", None)
        .thresholds(400.0, 480.0)
        .format(|v| format!("{v:.1} GiB"));
    for line in gauge.lines(width) {
        page.line(line);
    }
    page.blank();
    page.line(Line::styled("  Rows keep their order. From 400 a row warns; from 480 it is in danger.", t.muted()));
    page.blank();
    for line in BarGauge::new(t, "Empty group", 100.0).lines(width) {
        page.line(line);
    }
    page
}

fn help(t: &Theme) -> Modal<'_> {
    let keys = [
        ("j k ↑ ↓", "Move in the list, or scroll the page"),
        ("enter tab", "Focus the page"),
        ("esc tab", "Back to the components"),
        ("← →", "Previous or next component"),
        ("t", "Theme: accent, dark or light"),
        ("s", "Appearance: background, cards, page"),
        ("e", "Export the code for the look"),
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
    let enter = vec![code(KeyCode::Enter)];
    states.push(("31-palette-80".into(), [open(page("CommandPalette")), enter.clone()].concat(), small));
    states.push(("32-question-80".into(), [open(page("Question")), enter.clone()].concat(), small));
    states.push(("33-menu-80".into(), [open(page("DropdownMenu")), enter.clone()].concat(), small));
    states.push(("34-filters-80".into(), filters, small));
    states.push(("35-chart-80".into(), open(CHART), small));
    // Dots, and a rail on the cards. The panel pushes a wide page and covers a narrow one.
    let looks = [keys("s"), vec![code(KeyCode::Right), code(KeyCode::Right)], vec![code(KeyCode::Down); 3], vec![code(KeyCode::Right)]].concat();
    states.push(("36-appearance".into(), [open(CARD), looks.clone()].concat(), (136, 30)));
    states.push(("37-appearance-100".into(), [open(CARD), looks].concat(), SIZE));
    // Stripes at full strength under a table: no pattern between its columns.
    let stripes = [keys("s"), vec![code(KeyCode::Left), code(KeyCode::Down), code(KeyCode::Right), code(KeyCode::Char('s'))]].concat();
    states.push(("38-table-stripes".into(), [open(page("Table")), stripes].concat(), SIZE));
    // The dashboard at a small size, and on dots with a rail and translucent cards.
    let dashboard = PAGES.iter().position(|(name, _)| *name == "Dashboard").unwrap_or(0);
    states.push(("39-dashboard-80".into(), open(dashboard), small));
    let dots = [keys("s"), vec![code(KeyCode::Right), code(KeyCode::Right)], vec![code(KeyCode::Down); 3], vec![code(KeyCode::Right)]].concat();
    states.push(("40-dashboard-rail".into(), [open(dashboard), dots.clone()].concat(), (136, 30)));
    // The list of the form's select, open over the fields under it.
    states.push(("41-form-list".into(), [open(FORM), vec![code(KeyCode::BackTab), code(KeyCode::BackTab), code(KeyCode::Enter), code(KeyCode::Down)]].concat(), SIZE));
    // Each overlay open, at full size, at 80 by 24, and on dots with a rail.
    let at = |name: &str| open(PAGES.iter().position(|(page, _)| *page == name).unwrap_or(0));
    let opened = |name: &str, more: Vec<KeyEvent>| [at(name), enter.clone(), more].concat();
    states.push(("42-modal-open".into(), opened("Modal", vec![]), SIZE));
    states.push(("43-question-open".into(), opened("Question", vec![]), SIZE));
    states.push(("44-palette-open".into(), opened("CommandPalette", vec![code(KeyCode::Down)]), SIZE));
    states.push(("45-palette-filter".into(), opened("CommandPalette", keys("re")), SIZE));
    states.push(("46-palette-empty".into(), opened("CommandPalette", keys("zz")), SIZE));
    states.push(("47-menu-open".into(), opened("DropdownMenu", vec![code(KeyCode::Down); 4]), SIZE));
    states.push(("48-drawer-open".into(), opened("Drawer", vec![]), SIZE));
    states.push(("49-popover-open".into(), opened("Popover", vec![]), SIZE));
    states.push(("50-scope-open".into(), opened("ScopeSwitcher", vec![]), SIZE));
    states.push(("51-scope-filter".into(), opened("ScopeSwitcher", keys("pg")), SIZE));
    states.push(("52-detail-select".into(), [at("DetailSelect"), vec![code(KeyCode::Down)]].concat(), SIZE));
    states.push(("53-picker-page".into(), opened("ThemePicker", vec![]), SIZE));
    states.push(("54-drawer-80".into(), opened("Drawer", vec![]), small));
    states.push(("55-modal-80".into(), opened("Modal", vec![]), small));
    states.push(("56-scope-80".into(), opened("ScopeSwitcher", vec![]), small));
    states.push(("57-popover-80".into(), opened("Popover", vec![]), small));
    let rail = |name: &str| [at(name), dots.clone(), keys("s"), enter.clone()].concat();
    states.push(("58-modal-rail".into(), rail("Modal"), (136, 30)));
    states.push(("59-drawer-rail".into(), rail("Drawer"), (136, 30)));
    states.push(("60-palette-rail".into(), rail("CommandPalette"), (136, 30)));
    states.push(("61-menu-rail".into(), rail("DropdownMenu"), (136, 30)));
    states.push(("62-popover-rail".into(), rail("Popover"), (136, 30)));
    // A wide screen: a full page takes the column, a contained one stops at
    // six tracks, in the center or at the end.
    let wide = (200, 30);
    let contained = |aligns: usize| [keys("s"), vec![code(KeyCode::Down); 5], vec![code(KeyCode::Right), code(KeyCode::Down)], vec![code(KeyCode::Right); aligns], keys("s")].concat();
    states.push(("67-look-code".into(), [open(CARD), contained(1), keys("e")].concat(), wide));
    states.push(("68-page-rail".into(), rail("Page"), (136, 30)));
    states.push(("69-card-rail".into(), rail("Card"), (136, 30)));
    states.push(("63-page-full".into(), open(dashboard), wide));
    states.push(("64-page-contained".into(), [open(dashboard), contained(0)].concat(), wide));
    states.push(("65-page-center".into(), [at("Skeleton"), contained(1)].concat(), wide));
    states.push(("66-page-end".into(), [at("Grid"), contained(2)].concat(), wide));
    states
}

/// Where each component's name shows in the sidebar of `buffer`: its row,
/// first column, width, and page. A name a dialog covers is left out.
fn sidebar_links(buffer: &Buffer, theme: Theme) -> Vec<(u16, u16, u16, usize)> {
    let app = App::new(theme, 0, false);
    let shell = AppShell::new(buffer.area).side(Side::Left).sidebar(app.sidebar().width());
    let Some(side) = shell.areas().sidebar.filter(|_| !shell.too_small()) else { return Vec::new() };
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
    // Every page at small sizes, with and without focus, with help, and
    // with the appearance panel over a pattern, so a page that writes
    // outside its area fails here, and in CI.
    for page in 0..PAGES.len() {
        for (width, height) in [(1, 1), (30, 6), (40, 10), (60, 15), (80, 12), (80, 24)] {
            for (main, help, panel) in [(false, false, false), (true, false, false), (false, true, false), (true, false, true)] {
                let mut app = App::new(theme, accent, light);
                if panel {
                    // Left of the first canvas is the last one, the stripes.
                    app.key(KeyEvent::from(KeyCode::Char('s')));
                    app.key(KeyEvent::from(KeyCode::Left));
                }
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
#[path = "support/wave_08.rs"]
mod wave_08;
#[path = "support/wave_07.rs"]
mod wave_07;

/// The feedback components: alert, toast stack, spinner, skeleton and more.
#[path = "support/wave_04.rs"]
mod wave_04;
#[path = "support/wave_06.rs"]
mod wave_06;

/// The accent selector and the brand mark.
#[path = "support/wave_10.rs"]
mod wave_10;

/// The layout and flow components: split, disclosure, steps and lifecycle.
#[path = "support/wave_09.rs"]
mod wave_09;

/// The gallery as JSON for the Kiso site.
#[path = "support/json.rs"]
mod json;

/// The pages of the field components.
#[path = "support/wave_02.rs"]
mod wave_02;

/// The data display pages: table, key value, pagination, filter input,
/// search, log view and code block.
#[path = "support/wave_05.rs"]
mod wave_05;
/// The pages of the form choices and actions.
#[path = "support/wave_03.rs"]
mod wave_03;
