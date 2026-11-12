//! A review board: each web component drawn in cells, one per screen. It
//! shows the component as the crate draws it today, then each variant and
//! state planned for it, with a number to comment on. The appearance panel
//! changes all of them at once.
//!
//! Run: cargo run --manifest-path crates/tui-kiso/Cargo.toml --example review
//! Options: --accent <name>, --light, --nerd, --256, --snapshot <dir>

use std::io::IsTerminal;
use std::path::Path;
use std::process::ExitCode;
use std::time::Duration;

use kiso_tokens::Rgb;
use ratatui::backend::TestBackend;
use ratatui::buffer::Buffer;
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use ratatui::Terminal;
use tui_big_text::{BigText, PixelSize};
use tui_kiso::{
    blend, braille, set_background, set_foreground, Buttons, Field, Input, Press, StatusBadge,
    Theme, ACCENTS,
};

const USAGE: &str = "\
Usage: review [--accent <name>] [--light] [--nerd] [--256] [--snapshot <dir>]

  --accent <name>    Start in this accent (default: violet).
  --light            Start in the light theme.
  --nerd             Use Nerd Font glyphs for round caps.
  --256              Draw with the xterm-256 colors.
  --snapshot <dir>   Draw each component to HTML files in <dir> and exit.";

/// The appearance options and their values. The first is the default. The
/// accents come from the crate.
const OPTIONS: [(&str, &[&str]); 6] = [
    ("Theme", &["dark", "light"]),
    ("Accent", &[]),
    ("Background", &["glow", "solid", "dots", "grid", "crosses", "stripes"]),
    ("Strength", &["quiet", "visible"]),
    ("Panel fill", &["glass", "translucent", "solid"]),
    ("Border", &["none", "rail"]),
];
const THEME: usize = 0;
const ACCENT: usize = 1;
const CANVAS: usize = 2;
const STRENGTH: usize = 3;
const FILL: usize = 4;
const BORDER: usize = 5;
const GROUPS: [(&str, std::ops::Range<usize>); 3] =
    [("LOOK", 0..2), ("CANVAS", 2..5), ("FRAME", 5..6)];

/// The widths of the list, of the page at six tracks, and of the panel.
const SIDE: u16 = 22;
const WIDE: u16 = 94;
/// The grid of a page: tracks of UNIT columns, GAP columns apart. A page has
/// from three to six tracks, by the width of the terminal.
const UNIT: u16 = 13;
const GAP: u16 = 2;
const TRACKS: (u16, u16) = (3, 6);
/// The page at three tracks, with its margins.
const NARROW: u16 = span(TRACKS.0) + 6;
const PANEL: u16 = 40;
/// The rows a component's page can take. A shorter terminal scrolls it.
const TALL: u16 = 200;

type Draw = fn(&Surface, &mut Buffer, Rect) -> u16;

/// The batch: name, doc, purpose, and what draws it.
const PARTS: [(&str, &str, &str, Draw); 7] = [
    ("Card", "card.md", "Groups related content and actions on one surface.", card),
    ("Stat", "stat.md", "One number, its label, and how it changed.", stat),
    ("Badge", "badge.md", "Names a state or a class next to something else.", badge),
    ("StatusBadge", "status-badge.md", "The state of one record, in one of three tones.", status_badge),
    ("Dot", "dot.md", "A mark that carries a tone. It has no label.", dot),
    ("Button", "button.md", "Starts an action.", button),
    ("Switch", "switch.md", "One setting that is on or off, applied at once.", switch),
];

fn mix(a: Rgb, b: Rgb, p: f32) -> Rgb {
    blend(&[a, b], p)
}

fn len(text: &str) -> u16 {
    text.chars().count() as u16
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Tone {
    Neutral,
    Info,
    Success,
    Warning,
    Danger,
}

const TONES: [(Tone, &str); 5] = [
    (Tone::Neutral, "neutral"),
    (Tone::Info, "info"),
    (Tone::Success, "success"),
    (Tone::Warning, "warning"),
    (Tone::Danger, "danger"),
];

#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    Default,
    Primary,
    Destructive,
    Ghost,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum State {
    Rest,
    Hover,
    Focus,
    Disabled,
    Loading,
}

/// Fills, cards and pills: the shapes the web gets from CSS.
struct Surface<'a> {
    t: &'a Theme,
    nerd: bool,
    /// The chosen value of each appearance option.
    look: [usize; 6],
    tick: u32,
}

impl Surface<'_> {
    fn tone(&self, tone: Tone) -> Rgb {
        let r = self.t.tokens();
        match tone {
            Tone::Neutral => r.foreground,
            Tone::Info => r.info_on_dark,
            Tone::Success => r.success_on_dark,
            Tone::Warning => r.warning_on_dark,
            Tone::Danger => r.danger_on_dark,
        }
    }

    /// The color behind a cell: its fill, or the screen's.
    fn under(&self, buf: &Buffer, x: u16, y: u16) -> Rgb {
        match buf[(x, y)].bg {
            Color::Rgb(r, g, b) => [r, g, b],
            _ => self.t.tokens().background,
        }
    }

    /// `color` over a cell at `alpha`. In 256 colors a blend would band, so
    /// the color stays whole.
    fn over(&self, buf: &Buffer, x: u16, y: u16, color: Rgb, alpha: f32) -> Color {
        if self.t.is_truecolor() {
            self.t.color(mix(self.under(buf, x, y), color, alpha))
        } else {
            self.t.color(color)
        }
    }

    fn fill(&self, buf: &mut Buffer, area: Rect, color: Rgb, alpha: f32) {
        for y in area.top()..area.bottom() {
            for x in area.left()..area.right() {
                let bg = self.over(buf, x, y, color, alpha);
                buf[(x, y)].set_bg(bg);
            }
        }
    }

    /// How much of the canvas a panel hides, from the Panel fill option.
    fn alpha(&self) -> f32 {
        match self.look[FILL] {
            _ if !self.t.is_truecolor() => 1.0,
            0 => 0.72,
            1 => 0.88,
            _ => 1.0,
        }
    }

    fn framed(&self) -> bool {
        self.look[BORDER] != 0
    }

    /// The canvas: a wash of the accent, or a pattern.
    fn canvas(&self, buf: &mut Buffer) {
        let r = self.t.tokens();
        let (w, h) = (buf.area.width, buf.area.height.min(40));
        let strong = self.look[STRENGTH] == 1;
        let canvas = self.look[CANVAS];
        if canvas == 0 && self.t.is_truecolor() {
            let most = if strong { 0.4 } else { 0.22 };
            for y in 0..buf.area.height {
                for x in 0..w {
                    let along = f32::from(x) / f32::from(w) * 0.65 + f32::from(y.min(h)) / f32::from(h) * 0.35;
                    let far = (along - 0.5).abs() * 2.0;
                    buf[(x, y)].set_bg(self.t.color(mix(r.background, r.primary, most * far)));
                }
            }
        }
        if canvas >= 2 {
            let style = self.t.fg(mix(r.background, r.foreground, if strong { 0.3 } else { 0.13 }));
            for y in 0..buf.area.height {
                for x in 0..w {
                    let symbol = match canvas {
                        2 if x % 4 == 0 && y % 2 == 0 => "·",
                        3 => match (x % 8 == 0, y % 4 == 0) {
                            (true, true) => "┼",
                            (true, false) => "│",
                            (false, true) => "─",
                            _ => continue,
                        },
                        4 if y % 3 == 0 && (x + y / 3 % 2 * 4) % 8 == 0 => "+",
                        5 if (x + y) % 4 == 0 => "╱",
                        _ => continue,
                    };
                    buf[(x, y)].set_symbol(symbol).set_style(style);
                }
            }
        }
    }

    /// A card: a fill with half a row above and below, so it has padding
    /// without the cost of two rows. A fill has square corners: a cell
    /// cannot draw a curve. The rail is a bar of the accent on the left. It
    /// does not change the size of the card.
    fn card(&self, buf: &mut Buffer, area: Rect, color: Rgb) {
        for at in area.positions() {
            buf[at].set_symbol(" ");
        }
        let alpha = self.alpha();
        let (top, bottom) = (area.top(), area.bottom() - 1);
        for x in area.left()..area.right() {
            for (y, symbol) in [(top, "▄"), (bottom, "▀")] {
                let fg = self.over(buf, x, y, color, alpha);
                buf[(x, y)].set_symbol(symbol).set_fg(fg);
            }
        }
        let inner = Rect { y: top + 1, height: area.height - 2, ..area };
        self.fill(buf, inner, color, alpha);
        if self.framed() && area.left() > 0 {
            let rail = self.t.color(self.t.tokens().primary);
            // The rail is half a column, in the cell before the card. There the
            // cell holds only the rail and the canvas, so the two half rows
            // close with a quadrant and leave no hole.
            let x = area.left() - 1;
            for y in top..=bottom {
                let symbol = if y == top { "▗" } else if y == bottom { "▝" } else { "▐" };
                buf[(x, y)].set_symbol(symbol).set_fg(rail);
            }
        }
    }

    /// The end of a pill: a whole cell of `color`. Only a Nerd Font can draw
    /// a round end.
    fn cap(&self, buf: &mut Buffer, x: u16, y: u16, left: bool, color: Color) {
        if !self.nerd {
            buf[(x, y)].set_symbol(" ").set_bg(color);
            return;
        }
        let symbol = if left { "\u{e0b6}" } else { "\u{e0b4}" };
        buf[(x, y)].set_symbol(symbol).set_fg(color);
    }

    /// A pill: the label on a fill with a cap at each end. `ends` gives the
    /// caps another color, such as the focus color.
    fn pill(&self, buf: &mut Buffer, x: u16, y: u16, label: &str, style: Style, ends: Option<Rgb>) -> u16 {
        let cap = ends.map_or(style.bg.unwrap_or_default(), |rgb| self.t.color(rgb));
        self.cap(buf, x, y, true, cap);
        buf.set_string(x + 1, y, label, style);
        self.cap(buf, x + 1 + len(label), y, false, cap);
        len(label) + 2
    }

    /// A Badge: the tone as text over a tint of it. `wide` is the `md` size.
    fn badge(&self, buf: &mut Buffer, x: u16, y: u16, label: &str, tone: Tone, wide: bool) -> u16 {
        let text = self.tone(tone);
        let by = if tone == Tone::Neutral { 0.14 } else { 0.2 };
        let fill = mix(self.under(buf, x, y), text, by);
        let label = if wide { format!(" {label} ") } else { label.to_owned() };
        self.pill(buf, x, y, &label, self.t.fill(text, fill), None)
    }

    /// A Button. The `md` size takes three rows, from `y`. The small size
    /// takes one. Keep a free cell on each side for the focus brackets.
    #[allow(clippy::too_many_arguments)]
    fn button(&self, buf: &mut Buffer, x: u16, y: u16, label: &str, kind: Kind, state: State, small: bool) -> u16 {
        let r = self.t.tokens();
        let hover = state == State::Hover;
        let (mut fill, mut text) = match (kind, hover) {
            (Kind::Default, false) => (Some(r.secondary), r.secondary_foreground),
            (Kind::Default, true) => (Some(r.secondary_hover), r.secondary_foreground),
            (Kind::Primary, false) => (Some(r.primary), r.primary_foreground),
            (Kind::Primary, true) => (Some(r.primary_hover), r.primary_foreground),
            (Kind::Destructive, false) => (Some(r.danger), r.danger_foreground),
            (Kind::Destructive, true) => (Some(mix(r.danger, r.foreground, 0.18)), r.danger_foreground),
            (Kind::Ghost, false) => (None, r.muted_foreground),
            (Kind::Ghost, true) => (Some(r.accent_surface_hover), r.foreground),
        };
        if state == State::Disabled {
            fill = fill.map(|_| r.disabled_surface);
            text = r.disabled;
        }
        let shown = if state == State::Loading { format!("{} {label}", braille(self.tick)) } else { label.to_owned() };
        let mut style = match fill {
            Some(fill) => self.t.fill(text, fill),
            None => self.t.fg(text),
        };
        if matches!(kind, Kind::Primary | Kind::Destructive) && state != State::Disabled {
            style = style.add_modifier(Modifier::BOLD);
        }
        let focus = (state == State::Focus).then_some(r.focus);
        let width = len(&shown) + 4;
        let row = if small { y } else { y + 1 };
        if small {
            buf.set_string(x + 1, y, format!(" {shown} "), style);
            if let Some(bg) = style.bg {
                let cap = focus.map_or(bg, |rgb| self.t.color(rgb));
                self.cap(buf, x, y, true, cap);
                self.cap(buf, x + width - 1, y, false, cap);
            } else if let Some(rgb) = focus {
                buf[(x, y)].set_symbol("▐").set_fg(self.t.color(rgb));
                buf[(x + width - 1, y)].set_symbol("▌").set_fg(self.t.color(rgb));
            }
        } else {
            if let Some(bg) = style.bg {
                for dx in 0..width {
                    buf[(x + dx, y)].set_symbol("▄").set_fg(bg);
                    buf[(x + dx, y + 2)].set_symbol("▀").set_fg(bg);
                }
            }
            buf.set_string(x, y + 1, format!("  {shown}  "), style);
            if let Some(rgb) = focus {
                let ring = self.t.color(rgb);
                for (dy, left, right) in [(0, "▗", "▖"), (1, "▐", "▌"), (2, "▝", "▘")] {
                    buf[(x - 1, y + dy)].set_symbol(left).set_fg(ring);
                    buf[(x + width, y + dy)].set_symbol(right).set_fg(ring);
                }
            }
        }
        // The first letter is the hotkey.
        if !matches!(state, State::Disabled | State::Loading) {
            buf[(x + 2, row)].modifier.insert(Modifier::UNDERLINED);
        }
        width
    }

    /// A Switch, four cells wide: a track with a square thumb at one end, as
    /// on the web. The thumb is two cells, half a cell from the end of the
    /// track. Focus is a bar of the focus color on each side, so keep a free
    /// cell there.
    fn switch(&self, buf: &mut Buffer, x: u16, y: u16, on: bool, state: State) -> u16 {
        let r = self.t.tokens();
        let (track, thumb) = match (state, on) {
            (State::Disabled, _) => (r.disabled_surface, r.disabled),
            (State::Hover, true) => (r.primary_hover, r.primary_foreground),
            (_, true) => (r.primary, r.primary_foreground),
            (State::Hover, false) => (r.muted_foreground, r.primary_foreground),
            (_, false) => (r.border_strong, r.primary_foreground),
        };
        buf.set_string(x, y, if on { " ▐█▌" } else { "▐█▌ " }, self.t.fill(thumb, track));
        if state == State::Focus && x > 0 {
            let focus = self.t.color(r.focus);
            buf[(x - 1, y)].set_symbol("▐").set_fg(focus);
            buf[(x + 4, y)].set_symbol("▌").set_fg(focus);
        }
        4
    }

    /// A Skeleton shape: a bar in the skeleton color.
    fn bone(&self, buf: &mut Buffer, x: u16, y: u16, width: u16) {
        let bg = self.t.color(self.t.tokens().skeleton);
        for dx in 0..width {
            buf[(x + dx, y)].set_symbol(" ").set_bg(bg);
        }
    }

    fn rule(&self, buf: &mut Buffer, x: u16, y: u16, width: u16) {
        buf.set_string(x, y, "─".repeat(usize::from(width)), self.t.border());
    }

    /// A card with rows of text. `pad` is the padding in columns, and `air`
    /// adds an empty row above and below. A row of `-` is a rule.
    fn boxed(&self, buf: &mut Buffer, area: Rect, color: Rgb, pad: u16, air: bool, rows: &[(&str, Style)]) {
        self.card(buf, area, color);
        let first = area.y + 1 + u16::from(air);
        for (y, (text, style)) in (first..area.bottom() - 1).zip(rows) {
            if *text == "-" {
                let inset = u16::from(self.framed());
                self.rule(buf, area.x + inset, y, area.width - inset * 2);
            } else {
                buf.set_stringn(area.x + pad, y, text, usize::from(area.width - pad * 2), *style);
            }
        }
    }
}

/// A heading across the page, such as TODAY.
fn head(s: &Surface, buf: &mut Buffer, a: Rect, y: u16, text: &str, primary: bool) {
    let r = s.t.tokens();
    let style = if primary { s.t.fg(r.primary) } else { s.t.subtle() };
    buf.set_string(a.x, y, text, style.add_modifier(Modifier::BOLD));
    let used = len(text) + 1;
    s.rule(buf, a.x + used, y, a.width - used);
}

fn wrapped(text: &str, width: usize) -> Vec<String> {
    let mut lines = vec![String::new()];
    for word in text.split(' ') {
        let line = lines.last_mut().expect("a line");
        if line.is_empty() {
            line.push_str(word);
        } else if line.chars().count() + 1 + word.chars().count() > width {
            lines.push(word.to_owned());
        } else {
            line.push(' ');
            line.push_str(word);
        }
    }
    lines
}

/// The width of a number of tracks, with the gaps between them.
const fn span(tracks: u16) -> u16 {
    tracks * (UNIT + GAP) - GAP
}

/// The grid of a page. Each thing on the page is a cell of whole tracks. A
/// cell that does not fit in the open row starts the next row, so a narrow
/// terminal gets a longer page and not a cut one. One empty row parts the
/// rows of cells.
struct Grid<'a> {
    s: &'a Surface<'a>,
    buf: &'a mut Buffer,
    x: u16,
    y: u16,
    tracks: u16,
    /// The tracks taken in the open row, and the height of that row.
    taken: u16,
    rows: u16,
}

impl<'a> Grid<'a> {
    fn new(s: &'a Surface<'a>, buf: &'a mut Buffer, a: Rect) -> Self {
        let tracks = ((a.width + GAP) / (UNIT + GAP)).clamp(TRACKS.0, TRACKS.1);
        Self { s, buf, x: a.x, y: a.y, tracks, taken: 0, rows: 0 }
    }

    /// A page longer than the buffer loses its end and does not panic.
    fn fits(&self, rows: u16) -> bool {
        self.y + rows <= self.buf.area.bottom()
    }

    /// Ends the open row.
    fn wrap(&mut self) {
        if self.taken > 0 {
            self.y += self.rows + 1;
            self.taken = 0;
            self.rows = 0;
        }
    }

    fn space(&mut self) {
        self.wrap();
        self.y += 1;
    }

    fn head(&mut self, text: &str, primary: bool) {
        self.wrap();
        if self.fits(1) {
            head(self.s, self.buf, Rect::new(self.x, self.y, span(self.tracks), 1), self.y, text, primary);
        }
        self.y += 2;
    }

    /// The number and name of a variation, across the page. Comments refer to
    /// the number. The cells after it show the variation.
    fn label(&mut self, id: &str, name: &str) {
        self.wrap();
        let t = self.s.t;
        let at = self.x + len(id) + 1;
        for (i, line) in wrapped(name, usize::from(span(self.tracks) - len(id) - 1)).into_iter().enumerate() {
            if self.fits(1) {
                if i == 0 {
                    self.buf.set_string(self.x, self.y, id, t.fg(t.tokens().primary).add_modifier(Modifier::BOLD));
                }
                self.buf.set_string(at, self.y, line, t.muted());
            }
            self.y += 1;
        }
    }

    /// A cell of `tracks` tracks and `rows` rows. `draw` gets its area and
    /// keeps inside it.
    fn cell(&mut self, tracks: u16, rows: u16, draw: impl FnOnce(&mut Buffer, Rect)) {
        let tracks = tracks.min(self.tracks);
        if self.taken + tracks > self.tracks {
            self.wrap();
        }
        let area = Rect::new(self.x + self.taken * (UNIT + GAP), self.y, span(tracks), rows);
        if self.fits(rows) {
            draw(self.buf, area);
        }
        self.taken += tracks;
        self.rows = self.rows.max(rows);
    }

    /// A cell with the number and name of its variation on top, then `gap`
    /// empty rows.
    fn item(&mut self, id: &str, name: &str, tracks: u16, rows: u16, gap: u16, draw: impl FnOnce(&mut Buffer, Rect)) {
        let t = self.s.t;
        self.cell(tracks, rows + 1 + gap, |buf, c| {
            buf.set_string(c.x, c.y, id, t.fg(t.tokens().primary).add_modifier(Modifier::BOLD));
            let used = len(id) + 1;
            buf.set_stringn(c.x + used, c.y, name, usize::from(c.width - used), t.muted());
            draw(buf, Rect { y: c.y + 1 + gap, height: rows, ..c });
        });
    }

    /// Notes under the variations: limits, and changes this review suggests.
    /// Returns the row after the page.
    fn notes(mut self, list: &[&str]) -> u16 {
        self.head("NOTES", false);
        let t = self.s.t;
        for note in list {
            for (i, line) in wrapped(note, usize::from(span(self.tracks)) - 4).into_iter().enumerate() {
                if self.fits(1) {
                    if i == 0 {
                        self.buf.set_string(self.x, self.y, "→", t.subtle());
                    }
                    self.buf.set_string(self.x + 2, self.y, line, t.muted());
                }
                self.y += 1;
            }
        }
        self.y
    }
}

/// The three bars of a loading card.
fn bones(s: &Surface, buf: &mut Buffer, c: Rect, parts: [u16; 3]) {
    let most = c.width - 4;
    for (i, part) in parts.into_iter().enumerate() {
        s.bone(buf, c.x + 2, c.y + 1 + i as u16, most * part / 10);
    }
}

fn card(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let r = *t.tokens();
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    g.cell(3, 4, |buf, c| {
        buf.set_string(c.x, c.y, "Backups", t.strong());
        s.rule(buf, c.x + 8, c.y, c.width - 8);
        buf.set_string(c.x, c.y + 1, "Daily at 02:00 UTC", t.muted());
        buf.set_string(c.x, c.y + 2, "Last run    12 min ago", t.text());
        buf.set_string(c.x, c.y + 3, "Retention   30 days", t.text());
    });
    g.cell(3, 2, |buf, c| {
        buf.set_string(c.x, c.y, "A section is a title and a rule.", t.subtle());
        buf.set_string(c.x, c.y + 1, "There is no Card in the crate.", t.subtle());
    });

    g.head("PLANNED", true);
    let body = [
        ("Backups", t.strong()),
        ("Daily at 02:00 UTC", t.muted()),
        ("", t.text()),
        ("Last run    12 min ago", t.text()),
        ("Retention   30 days", t.text()),
    ];
    g.item("1.1", "plain (default), size md", 3, 7, 1, |buf, c| s.boxed(buf, c, r.card, 2, false, &body));
    g.item("1.2", "elevated", 3, 7, 1, |buf, c| s.boxed(buf, c, r.popover, 2, false, &body));

    let short = [("Backups", t.strong()), ("Daily at 02:00 UTC", t.muted()), ("Last run  12 min ago", t.text())];
    g.item("1.3", "size sm", 2, 5, 1, |buf, c| s.boxed(buf, c, r.card, 1, false, &short));
    g.item("1.4", "size lg", 2, 7, 1, |buf, c| s.boxed(buf, c, r.card, 3, true, &short));
    g.item("1.5", "loading", 2, 5, 1, |buf, c| {
        s.card(buf, c, r.card);
        bones(s, buf, c, [4, 10, 6]);
    });

    let parts = [
        ("Backups", t.strong()),
        ("-", t.text()),
        ("Last run    12 min ago", t.text()),
        ("Retention   30 days", t.text()),
        ("-", t.text()),
        ("", t.text()),
    ];
    g.item("1.6", "header, content, footer", 3, 8, 1, |buf, c| {
        s.boxed(buf, c, r.card, 2, false, &parts);
        buf.set_string(c.x + 2, c.y + 6, "Updated 2 min ago", t.subtle());
        s.button(buf, c.right() - 13, c.y + 6, "Run now", Kind::Default, State::Rest, true);
    });
    let link = [
        ("laya-prod", t.strong()),
        ("PostgreSQL 17 · us-east", t.muted()),
        ("", t.text()),
        ("Open cluster →", t.link()),
    ];
    g.item("1.7", "the card is a link, hover", 3, 6, 1, |buf, c| s.boxed(buf, c, r.elevated_surface, 2, false, &link));

    g.notes(&[
        "Border and Panel fill come from Appearance. Press s and change them here.",
        "The card has half a row of fill above and below. The rail is a bar of the accent on the left, in the same size of card.",
        "Suggested: drop size lg (1.4). It costs two more rows and four more columns, and md already reads as padded.",
        "Suggested: elevated (1.2) only for popovers and menus. On a page it is hard to tell from plain.",
        "Not possible: shadows, round fills, and a line border with even margins. The fill color carries the elevation.",
    ])
}

fn stat(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let r = *t.tokens();
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    for (label, value, foot) in [("Active projects", "24", "4 started this month"), ("Tasks completed", "186", "32 more than last month")] {
        g.cell(2, 3, |buf, c| {
            buf.set_string(c.x, c.y, label, t.muted());
            s.rule(buf, c.x + len(label) + 1, c.y, c.width - len(label) - 1);
            buf.set_string(c.x, c.y + 1, value, t.strong());
            buf.set_string(c.x, c.y + 2, foot, t.muted());
        });
    }

    g.head("PLANNED", true);
    g.item("2.1", "default", 2, 5, 1, |buf, c| {
        s.card(buf, c, r.card);
        buf.set_string(c.x + 2, c.y + 1, "Tasks completed", t.muted());
        s.badge(buf, c.x + 18, c.y + 1, "+18.6%", Tone::Success, false);
        buf.set_string(c.x + 2, c.y + 2, "186", t.strong());
        buf.set_string(c.x + 2, c.y + 3, "32 more than last month", t.muted());
    });
    g.item("2.2", "big value", 2, 7, 1, |buf, c| {
        s.card(buf, c, r.card);
        buf.set_string(c.x + 2, c.y + 1, "Tasks completed", t.muted());
        s.badge(buf, c.x + 18, c.y + 1, "+18.6%", Tone::Success, false);
        BigText::builder()
            .pixel_size(PixelSize::Sextant)
            .style(t.strong())
            .lines(vec![Line::from("186")])
            .build()
            .render(Rect::new(c.x + 2, c.y + 2, 12, 3), buf);
        buf.set_string(c.x + 2, c.y + 5, "32 more than last month", t.muted());
    });
    g.item("2.3", "loading", 2, 5, 1, |buf, c| {
        s.card(buf, c, r.card);
        bones(s, buf, c, [5, 3, 10]);
    });

    g.item("2.4", "StatDelta variants", 3, 1, 0, |buf, c| {
        let mut dx = 0;
        for (tone, label) in [(Tone::Neutral, "0"), (Tone::Info, "new"), (Tone::Success, "+18.6%"), (Tone::Warning, "4 late"), (Tone::Danger, "-2.1%")] {
            dx += s.badge(buf, c.x + dx, c.y, label, tone, false) + 2;
        }
    });

    g.label("2.5", "without a card, in a row of facts");
    for (label, value) in [("Projects", "24"), ("Tasks", "186"), ("On time", "94.2%")] {
        g.cell(1, 2, |buf, c| {
            buf.set_string(c.x, c.y, label, t.muted());
            buf.set_string(c.x, c.y + 1, value, t.strong());
        });
    }

    g.notes(&[
        "Suggested: 2.1 is the default. The big value (2.2) is an option of the product, for a dashboard with room. It costs two rows a card and needs the tui-big-text crate.",
        "The delta is a Badge of size sm. Its tone is a judgment, not the direction: lower latency can be success.",
        "Suggested: keep 2.5 for dense tools. A monitor with 80 by 24 has no rows for cards.",
    ])
}

fn badge(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let r = *t.tokens();
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    g.cell(3, 1, |buf, c| {
        let mut dx = 0;
        for (tone, label) in TONES {
            buf.set_string(c.x + dx, c.y, label, t.fg(s.tone(tone)));
            dx += len(label) + 3;
        }
    });
    g.cell(3, 1, |buf, c| {
        buf.set_string(c.x, c.y, "No Badge. A product colors a word.", t.subtle());
    });

    g.head("PLANNED", true);
    for (id, name, wide) in [("3.1", "size sm (default)", false), ("3.2", "size md", true)] {
        g.label(id, name);
        for (tone, label) in TONES {
            g.cell(1, 1, |buf, c| {
                s.badge(buf, c.x, c.y, label, tone, wide);
            });
        }
    }

    g.item("3.3", "outline look", 2, 1, 0, |buf, c| {
        let edge = t.border();
        let mut dx = 0;
        for label in ["Beta", "v2", "read"] {
            buf.set_string(c.x + dx, c.y, "▕", edge);
            buf.set_string(c.x + dx + 1, c.y, label, t.text());
            buf.set_string(c.x + dx + 1 + len(label), c.y, "▏", edge);
            dx += len(label) + 4;
        }
    });
    g.item("3.4", "with a Dot", 3, 1, 0, |buf, c| {
        let mut dx = 0;
        for (tone, label) in [(Tone::Success, "● live"), (Tone::Warning, "● degraded"), (Tone::Danger, "● down")] {
            dx += s.badge(buf, c.x + dx, c.y, label, tone, false) + 2;
        }
    });
    g.item("3.5", "loading", 1, 1, 0, |buf, c| {
        s.badge(buf, c.x, c.y, &format!("{} syncing", braille(s.tick)), Tone::Neutral, false);
    });

    g.label("3.6", "on a card, and on a selected row");
    g.space();
    let tags = |buf: &mut Buffer, x: u16, y: u16| {
        let mut dx = 0;
        for (tone, label) in [(Tone::Success, "live"), (Tone::Info, "New"), (Tone::Neutral, "v17")] {
            dx += s.badge(buf, x + dx, y, label, tone, false) + 1;
        }
    };
    g.cell(3, 3, |buf, c| {
        s.card(buf, c, r.card);
        buf.set_string(c.x + 2, c.y + 1, "laya-prod", t.text());
        tags(buf, c.x + 14, c.y + 1);
    });
    g.cell(3, 3, |buf, c| {
        buf.set_style(Rect::new(c.x, c.y + 1, c.width, 1), t.selected());
        buf.set_string(c.x, c.y + 1, "▌", t.fg(r.primary));
        buf.set_string(c.x + 2, c.y + 1, "laya-prod", t.text());
        tags(buf, c.x + 14, c.y + 1);
    });

    g.notes(&[
        "The web Badge is the tone as text and a 1px border on the surface color. A cell has no 1px border, so a tint of the tone takes its place.",
        "The web says a Badge is not a pill, and a cell cannot draw a curve. The ends are whole cells. A Nerd Font (n) rounds them.",
        "Suggested: one size. sm (3.1) costs two cells more than the word. md (3.2) costs four and adds nothing a terminal needs.",
        "In 256 colors there is no tint. The Badge is the colored word, as today.",
    ])
}

fn status_badge(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let r = *t.tokens();
    let list = |t| {
        [
            StatusBadge::success(t, "Running"),
            StatusBadge::success(t, "Provisioning").pulse(true),
            StatusBadge::danger(t, "Failed"),
            StatusBadge::neutral(t, "Stopped"),
        ]
    };
    let pills: [(Tone, &str); 4] = [
        (Tone::Success, "● Running"),
        (Tone::Success, "◐ Provisioning"),
        (Tone::Danger, "● Failed"),
        (Tone::Neutral, "○ Stopped"),
    ];
    // Two states to a cell, from `first`.
    let plain = |buf: &mut Buffer, c: Rect, first: usize| {
        let mut dx = 0;
        for one in list(t).into_iter().skip(first).take(2) {
            let line = Line::from(one);
            let width = line.width() as u16;
            buf.set_line(c.x + dx, c.y, &line, width);
            dx += width + 3;
        }
    };
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    g.cell(3, 1, |buf, c| plain(buf, c, 0));
    g.cell(3, 1, |buf, c| plain(buf, c, 2));

    g.head("PLANNED", true);
    g.label("4.1", "pill: success, success with pulse, danger, neutral");
    for first in [0, 2] {
        g.cell(3, 1, |buf, c| {
            let mut dx = 0;
            for (tone, label) in pills.into_iter().skip(first).take(2) {
                dx += s.badge(buf, c.x + dx, c.y, label, tone, false) + 2;
            }
        });
    }

    g.label("4.2", "plain, as today");
    g.cell(3, 1, |buf, c| plain(buf, c, 0));
    g.cell(3, 1, |buf, c| plain(buf, c, 2));

    for (id, name, pill) in [("4.3", "in a table, pills", true), ("4.4", "in a table, plain", false)] {
        g.item(id, name, 3, 5, 0, |buf, c| {
            buf.set_style(Rect::new(c.x, c.y, c.width, 1), t.bar());
            buf.set_string(c.x + 2, c.y, "Database       Size   State", t.bar());
            let rows = [("orders", "12.4 GB", 0), ("billing", " 3.1 GB", 1), ("sessions", " 2.2 GB", 2), ("audit", " 840 MB", 3)];
            for (i, (name, size, state)) in rows.into_iter().enumerate() {
                let ry = c.y + 1 + i as u16;
                if i == 0 {
                    buf.set_style(Rect::new(c.x, ry, c.width, 1), t.selected());
                    buf.set_string(c.x, ry, "▌", t.fg(r.primary));
                }
                buf.set_string(c.x + 2, ry, format!("{name:<12} {size}"), t.text());
                if pill {
                    let (tone, label) = pills[state];
                    s.badge(buf, c.x + 24, ry, label, tone, false);
                } else {
                    let line = Line::from(list(t)[state].clone());
                    buf.set_line(c.x + 25, ry, &line, 16);
                }
            }
        });
    }

    g.notes(&[
        "Suggested: the pill (4.1) in headers, cards and detail pages. Plain (4.2) in tables, where a column of pills is heavy (compare 4.3 and 4.4).",
        "The mark and the word always name the state, so the tone is never the only signal.",
        "The pulse is ◐. The terminal does not animate it today. It can swap ◐ and ◑ once a second if you want motion.",
    ])
}

fn dot(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    g.cell(3, 1, |buf, c| {
        let line = Line::from(StatusBadge::success(t, "Running"));
        buf.set_line(c.x, c.y, &line, 12);
    });
    g.cell(3, 1, |buf, c| {
        buf.set_string(c.x, c.y, "A Dot exists only inside StatusBadge.", t.subtle());
    });

    g.head("PLANNED", true);
    g.label("5.1", "variants");
    for (tone, label) in TONES {
        g.cell(1, 1, |buf, c| {
            buf.set_string(c.x, c.y, "●", t.fg(s.tone(tone)));
            buf.set_string(c.x + 2, c.y, label, t.muted());
        });
    }

    g.item("5.2", "pulse (it moves in the terminal)", 3, 1, 0, |buf, c| {
        let frame = if s.tick.is_multiple_of(2) { "●" } else { "◉" };
        buf.set_string(c.x, c.y, frame, t.success());
        buf.set_string(c.x + 2, c.y, "Receiving", t.text());
        buf.set_string(c.x + 16, c.y, "frames: ● ◉", t.subtle());
    });
    g.item("5.3", "neutral as a ring", 3, 1, 0, |buf, c| {
        buf.set_string(c.x, c.y, "○", t.muted());
        buf.set_string(c.x + 2, c.y, "Stopped", t.muted());
    });

    g.item("5.4", "in a list, before a name", 3, 3, 0, |buf, c| {
        for (i, (tone, name)) in [(Tone::Success, "laya-prod"), (Tone::Warning, "laya-staging"), (Tone::Danger, "laya-dev")].into_iter().enumerate() {
            buf.set_string(c.x, c.y + i as u16, "●", t.fg(s.tone(tone)));
            buf.set_string(c.x + 2, c.y + i as u16, name, t.text());
        }
    });

    g.notes(&[
        "One size. A mark is one cell, so size lg has no terminal form.",
        "Suggested: neutral draws the ring (5.3), as StatusBadge does. Then a neutral state differs from the others by shape and not only by color.",
        "5.4 needs text beside it that names the state, or a legend. A Dot alone says nothing to a color-blind reader.",
    ])
}

fn button(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let kinds = [(Kind::Default, "Cancel"), (Kind::Primary, "Save"), (Kind::Destructive, "Remove"), (Kind::Ghost, "Skip")];
    let states = [(State::Rest, "default"), (State::Hover, "hover"), (State::Focus, "focus"), (State::Disabled, "disabled"), (State::Loading, "loading")];
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    for pair in [[("Cancel", Press::Plain), ("Save", Press::Focused)], [("Remove", Press::Danger), ("Remove", Press::Off)]] {
        g.cell(2, 3, |buf, c| {
            let today = Buttons::new(t, pair);
            let width = (today.width() as u16).min(c.width);
            today.render(Rect::new(c.x, c.y, width, 3), buf);
        });
    }
    g.cell(3, 2, |buf, c| {
        buf.set_string(c.x, c.y, "Plain, Focused, Danger, Off.", t.subtle());
        buf.set_string(c.x, c.y + 1, "The primary color means focus.", t.subtle());
    });

    // A button starts one column in, so the focus brackets have room.
    g.head("PLANNED", true);
    g.label("6.1", "variants: default, primary, destructive, ghost");
    for (kind, label) in kinds {
        g.cell(1, 3, |buf, c| {
            s.button(buf, c.x + 1, c.y, label, kind, State::Rest, false);
        });
    }

    for (id, kind, label) in [("6.2", Kind::Primary, "Save"), ("6.3", Kind::Default, "Cancel"), ("6.4", Kind::Destructive, "Remove"), ("6.5", Kind::Ghost, "Skip")] {
        let names: Vec<&str> = states.iter().map(|(_, name)| *name).collect();
        let name = match kind {
            Kind::Primary => "primary",
            Kind::Default => "default",
            Kind::Destructive => "destructive",
            Kind::Ghost => "ghost",
        };
        g.label(id, &format!("{name}: {}", names.join(", ")));
        for (state, _) in states {
            let shown = if state == State::Loading && kind == Kind::Primary { "Saving" } else { label };
            g.cell(1, 3, |buf, c| {
                s.button(buf, c.x + 1, c.y, shown, kind, state, false);
            });
        }
    }

    g.label("6.6", "size sm, one row: the four variants, then focus and loading");
    for (kind, label) in kinds {
        g.cell(1, 1, |buf, c| {
            s.button(buf, c.x, c.y, label, kind, State::Rest, true);
        });
    }
    g.cell(1, 1, |buf, c| {
        s.button(buf, c.x, c.y, "Save", Kind::Primary, State::Focus, true);
    });
    g.cell(1, 1, |buf, c| {
        s.button(buf, c.x, c.y, "Saving", Kind::Primary, State::Loading, true);
    });

    g.label("6.7", "with an icon");
    for (kind, label) in [(Kind::Primary, "+ New project"), (Kind::Default, "↻ Refresh"), (Kind::Ghost, "⋯ More")] {
        g.cell(2, 3, |buf, c| {
            s.button(buf, c.x + 1, c.y, label, kind, State::Rest, false);
        });
    }

    g.notes(&[
        "The variant says what the action is. The state says what the pointer and the keys do. Today the primary color means focus, so a form cannot show a primary action that is not focused.",
        "Focus is a bracket in the focus color on each side (third column). A terminal cannot draw a ring. Tell me if it is too quiet.",
        "Suggested: two sizes. md takes three rows, for forms and dialogs. sm takes one row, for card footers, toolbars and tables. xs, lg and xl have no terminal form.",
        "The first letter is underlined as the hotkey. With an icon (6.7) the underline lands on the icon, so the hotkey needs a rule. Suggested: underline the first letter of the label.",
        "Suggested: the default variant fills with the secondary color, not the card color the web uses. On a card, the web's would vanish.",
    ])
}

fn switch(s: &Surface, buf: &mut Buffer, a: Rect) -> u16 {
    let t = s.t;
    let r = *t.tokens();
    let mut g = Grid::new(s, buf, a);
    g.head("TODAY", false);
    g.cell(3, 2, |buf, c| {
        let mut on = Field::check("Daily backups");
        on.key(KeyEvent::new(KeyCode::Char(' '), KeyModifiers::NONE));
        for (i, field) in [on, Field::check("Email me the report")].iter().enumerate() {
            let lines = field.lines(t, 40, 13, false);
            buf.set_line(c.x, c.y + i as u16, &lines[0], 40);
        }
    });
    g.cell(3, 1, |buf, c| {
        buf.set_string(c.x, c.y, "No Switch. A boolean is a checkbox.", t.subtle());
    });

    g.head("PLANNED", true);
    g.label("7.1", "off, on");
    for (on, label) in [(false, "Email me the report"), (true, "Daily backups")] {
        g.cell(2, 1, |buf, c| {
            s.switch(buf, c.x, c.y, on, State::Rest);
            buf.set_string(c.x + 6, c.y, label, t.text());
        });
    }

    g.label("7.2", "with a description, in a card");
    g.space();
    g.cell(4, 7, |buf, c| {
        s.card(buf, c, r.card);
        for (i, (label, about, on)) in [("Daily backups", "Runs at 02:00 UTC.", true), ("Email me the report", "One message after each run.", false)].into_iter().enumerate() {
            let ry = c.y + 1 + i as u16 * 3;
            buf.set_string(c.x + 2, ry, label, t.text());
            buf.set_string(c.x + 2, ry + 1, about, t.muted());
            s.switch(buf, c.right() - 6, ry, on, State::Rest);
            if i == 0 {
                s.rule(buf, c.x + 2, ry + 2, c.width - 4);
            }
        }
    });

    g.label("7.3", "states");
    for (name, state) in [("hover", State::Hover), ("focus", State::Focus), ("disabled", State::Disabled)] {
        g.cell(2, 1, |buf, c| {
            s.switch(buf, c.x, c.y, false, state);
            s.switch(buf, c.x + 6, c.y, true, state);
            buf.set_string(c.x + 12, c.y, name, t.muted());
        });
    }
    g.cell(3, 1, |buf, c| {
        s.switch(buf, c.x, c.y, true, State::Rest);
        buf.set_string(c.x + 6, c.y, format!("{} Saving", braille(s.tick)), t.muted());
        buf.set_string(c.x + 31, c.y, "loading", t.subtle());
    });
    g.cell(3, 1, |buf, c| {
        s.switch(buf, c.x, c.y, false, State::Rest);
        buf.set_string(c.x + 6, c.y, "× Could not save.", t.danger());
        buf.set_string(c.x + 24, c.y, "Retry", t.link().add_modifier(Modifier::UNDERLINED));
        buf.set_string(c.x + 31, c.y, "error", t.subtle());
    });

    g.label("7.4", "with the state as a word");
    for (on, word) in [(true, "On"), (false, "Off")] {
        g.cell(1, 1, |buf, c| {
            s.switch(buf, c.x, c.y, on, State::Rest);
            buf.set_string(c.x + 5, c.y, word, if on { t.text() } else { t.muted() });
        });
    }

    g.notes(&[
        "Four cells wide: a track and a square thumb, as on the web. Space or Enter toggles it, and a click does too.",
        "One size. The small size has no terminal form.",
        "Suggested: Switch for a setting that applies at once, Checkbox for a choice a form submits. The checkbox of today stays for forms.",
        "Suggested: 7.4 where the switch stands alone. Thumb position and color are weak signals in a terminal with few colors.",
        "Focus is a bar of the focus color on each side. In a form, the focused row also gets the selection fill, as today.",
    ])
}

struct App {
    theme: Theme,
    nerd: bool,
    part: usize,
    scroll: u16,
    /// How far the page can scroll at this height.
    reach: u16,
    /// The rows the page of this component takes.
    tall: u16,
    panel: bool,
    /// The appearance options, as fields of a form.
    fields: Vec<Field>,
    focus: usize,
    tick: u32,
    quit: bool,
}

impl App {
    fn new(theme: Theme, accent: usize, light: bool, nerd: bool) -> Self {
        let fields = OPTIONS
            .into_iter()
            .enumerate()
            .map(|(i, (label, values))| match i {
                ACCENT => Field::select(label, ACCENTS.iter().map(|accent| accent.name)),
                _ => Field::select(label, values.iter().copied()),
            })
            .collect();
        let mut app = Self { theme, nerd, part: 0, scroll: 0, reach: 0, tall: 0, panel: true, fields, focus: BORDER, tick: 0, quit: false };
        app.choose(THEME, usize::from(light));
        app.choose(ACCENT, accent);
        app
    }

    fn choose(&mut self, option: usize, value: usize) {
        if let Input::Select(_, chosen) = &mut self.fields[option].input {
            *chosen = value;
        }
    }

    fn look(&self) -> [usize; 6] {
        std::array::from_fn(|i| self.fields[i].chosen())
    }

    fn retheme(&mut self, paint: bool) -> std::io::Result<()> {
        let tokens = ACCENTS[self.fields[ACCENT].chosen()].tokens(self.fields[THEME].chosen() == 1);
        self.theme = self.theme.with_tokens(tokens);
        if paint {
            let mut out = std::io::stdout();
            set_background(&mut out, Some(tokens.background))?;
            set_foreground(&mut out, Some(tokens.foreground))?;
        }
        Ok(())
    }

    fn go(&mut self, part: usize) {
        self.part = part % PARTS.len();
        self.scroll = 0;
    }

    fn key(&mut self, code: KeyCode, modifiers: KeyModifiers) -> std::io::Result<()> {
        let count = self.fields.len();
        match code {
            KeyCode::Char('c') if modifiers.contains(KeyModifiers::CONTROL) => self.quit = true,
            KeyCode::Char('q') | KeyCode::Esc => self.quit = true,
            KeyCode::Char('s') => self.panel = !self.panel,
            KeyCode::Char('n') => self.nerd = !self.nerd,
            KeyCode::Char(c @ '1'..='7') => self.go(c as usize - '1' as usize),
            KeyCode::Tab | KeyCode::Char(']') => self.go(self.part + 1),
            KeyCode::BackTab | KeyCode::Char('[') => self.go(self.part + PARTS.len() - 1),
            KeyCode::PageDown | KeyCode::Char(' ') => self.scroll = (self.scroll + 10).min(self.reach),
            KeyCode::PageUp => self.scroll = self.scroll.saturating_sub(10),
            KeyCode::Down | KeyCode::Char('j') if self.panel => self.focus = (self.focus + 1) % count,
            KeyCode::Up | KeyCode::Char('k') if self.panel => self.focus = (self.focus + count - 1) % count,
            KeyCode::Down | KeyCode::Char('j') => self.scroll = (self.scroll + 1).min(self.reach),
            KeyCode::Up | KeyCode::Char('k') => self.scroll = self.scroll.saturating_sub(1),
            KeyCode::Left | KeyCode::Right | KeyCode::Char('h' | 'l') | KeyCode::Enter if self.panel => {
                let code = if code == KeyCode::Enter { KeyCode::Right } else { code };
                self.fields[self.focus].key(KeyEvent::new(code, modifiers));
                self.retheme(true)?;
            }
            _ => {}
        }
        Ok(())
    }

    fn draw(&mut self, buf: &mut Buffer) {
        let area = buf.area;
        let t = self.theme;
        let r = *t.tokens();
        let (w, h) = (area.width, area.height);
        if w < SIDE + NARROW || h < 12 {
            let text = format!("Make the terminal at least {} by 12.", SIDE + NARROW);
            buf.set_stringn(0, 0, text, usize::from(w), t.muted());
            return;
        }
        let s = Surface { t: &t, nerd: self.nerd, look: self.look(), tick: self.tick };

        // The list of components.
        let side = Rect::new(0, 0, SIDE, h);
        buf.set_style(side, t.fill(r.foreground, r.sidebar));
        buf.set_string(2, 1, "tui-kiso review", t.strong());
        buf.set_string(2, 2, "Batch 1, web look", t.subtle());
        for (i, (name, ..)) in PARTS.into_iter().enumerate() {
            let y = 4 + i as u16;
            if y >= h - 1 {
                break;
            }
            let chosen = i == self.part;
            if chosen {
                buf.set_style(Rect::new(0, y, SIDE, 1), t.selected());
                buf.set_string(0, y, "▌", t.fg(r.primary));
            }
            buf.set_string(2, y, format!("{}", i + 1), t.subtle());
            buf.set_string(4, y, name, if chosen { t.strong() } else { t.text() });
        }

        // The page. The panel pushes it while it still fits, then covers it.
        let room = w - SIDE;
        let panel = if self.panel { PANEL } else { 0 };
        let wide = if room >= NARROW + panel { room - panel } else { room };
        let mut page = Buffer::empty(Rect::new(0, 0, wide, TALL));
        s.canvas(&mut page);
        let (name, doc, purpose, draw) = PARTS[self.part];
        page.set_string(3, 1, format!("{} {name}", self.part + 1), t.strong());
        page.set_string(6 + len(name), 1, format!("kiso/docs/components/{doc}"), t.subtle());
        let mut top = 2;
        for line in wrapped(purpose, usize::from(wide - 6)) {
            page.set_string(3, top, line, t.muted());
            top += 1;
        }
        let end = draw(&s, &mut page, Rect::new(3, top + 1, wide - 6, TALL - top - 1));
        self.tall = (end + 1).min(TALL);
        let shown = h - 1;
        self.reach = self.tall.saturating_sub(shown);
        self.scroll = self.scroll.min(self.reach);
        for y in 0..shown.min(TALL - self.scroll) {
            for x in 0..wide {
                buf[(SIDE + x, y)] = page[(x, y + self.scroll)].clone();
            }
        }
        // The scrollbar of the crate's Page: a `│` track and a primary thumb,
        // in the right margin of the page, or beside the panel that covers it.
        let bar = (SIDE + wide - 1).min(w - panel - 1);
        if self.reach > 0 {
            let (view, total) = (usize::from(shown), usize::from(self.tall));
            let size = (view * view / total).max(1);
            let from = usize::from(self.scroll) * (view - size) / (total - view);
            for dy in 0..view {
                let color = if (from..from + size).contains(&dy) { r.primary } else { r.border };
                let cell = &mut buf[(bar, dy as u16)];
                cell.set_symbol("│").set_fg(t.color(color));
            }
        }

        let mut hints = Vec::new();
        let more = if self.reach > 0 { "pgdn" } else { "" };
        for (key, label) in [("tab", "next"), ("1-7", "component"), ("s", "appearance"), ("n", "nerd font"), (more, "scroll"), ("q", "quit")] {
            if key.is_empty() {
                continue;
            }
            hints.push(Span::styled(format!("{key} "), t.text()));
            hints.push(Span::styled(format!("{label}  "), t.muted()));
        }
        buf.set_style(Rect::new(SIDE, h - 1, room, 1), t.base());
        buf.set_line(SIDE + 3, h - 1, &Line::from(hints), room - 3);
        if self.panel {
            self.appearance(buf, &s);
        }
    }

    fn appearance(&self, buf: &mut Buffer, s: &Surface) {
        let t = *s.t;
        let r = *t.tokens();
        let (w, h) = (buf.area.width, buf.area.height);
        let x = w - PANEL;
        let area = Rect::new(x, 0, PANEL, h);
        for at in area.positions() {
            buf[at].reset();
        }
        buf.set_style(area, t.fill(r.popover_foreground, r.popover));
        for y in 0..h {
            buf.set_string(x, y, "│", t.border());
        }
        buf.set_string(x + 3, 1, "Appearance", t.strong());
        buf.set_string(x + PANEL - 4, 1, "s", t.subtle());
        s.rule(buf, x + 3, 2, PANEL - 6);
        let mut y = 4;
        for (group, options) in GROUPS {
            if y + options.len() as u16 >= h {
                break;
            }
            buf.set_string(x + 3, y, group, t.subtle());
            y += 1;
            for i in options {
                let focused = i == self.focus;
                if focused {
                    buf.set_style(Rect::new(x + 1, y, PANEL - 2, 1), t.selected());
                }
                let lines = self.fields[i].lines(&t, usize::from(PANEL) - 4, 13, focused);
                buf.set_line(x + 1, y, &lines[0], PANEL - 3);
                y += 1;
            }
            y += 1;
        }
        if h > 22 {
            let keys = Line::from(vec![
                Span::styled("↑↓ ", t.text()),
                Span::styled("option  ", t.muted()),
                Span::styled("←→ ", t.text()),
                Span::styled("value", t.muted()),
            ]);
            buf.set_line(x + 3, h - 2, &keys, PANEL - 5);
        }
    }
}

type Options = (usize, bool, bool, bool, Option<String>);

fn parse() -> Result<Options, String> {
    let (mut accent, mut light, mut nerd, mut indexed, mut snapshot) = (0, false, false, false, None);
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--accent" => {
                let name = args.next().ok_or("--accent needs a name")?;
                accent = ACCENTS.iter().position(|a| a.name == name).ok_or(format!("unknown accent {name}"))?;
            }
            "--light" => light = true,
            "--nerd" => nerd = true,
            "--256" => indexed = true,
            "--snapshot" => snapshot = Some(args.next().ok_or("--snapshot needs a directory")?),
            "-h" | "--help" => return Err(String::new()),
            other => return Err(format!("unknown option {other}")),
        }
    }
    Ok((accent, light, nerd, indexed, snapshot))
}

fn main() -> ExitCode {
    let (accent, light, nerd, indexed, snapshot_dir) = match parse() {
        Ok(options) => options,
        Err(message) => {
            if !message.is_empty() {
                eprintln!("review: {message}\n");
            }
            eprintln!("{USAGE}");
            return ExitCode::from(if message.is_empty() { 0 } else { 2 });
        }
    };
    if let Some(dir) = snapshot_dir {
        return match snapshot(Path::new(&dir), accent, nerd) {
            Ok(count) => {
                println!("Wrote {count} states to {dir}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("review: could not write to {dir}: {error}");
                ExitCode::FAILURE
            }
        };
    }
    if !std::io::stdout().is_terminal() {
        eprintln!("review: stdout is not a terminal. Use --snapshot <dir>.");
        return ExitCode::from(2);
    }
    let tokens = ACCENTS[accent].tokens(light);
    let theme = if indexed { Theme::xterm_256(tokens) } else { Theme::new(tokens) };
    let mut terminal = ratatui::init();
    let result = run(&mut terminal, App::new(theme, accent, light, nerd));
    let mut out = std::io::stdout();
    let _ = set_background(&mut out, None);
    let _ = set_foreground(&mut out, None);
    ratatui::restore();
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("review: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run(terminal: &mut ratatui::DefaultTerminal, mut app: App) -> std::io::Result<()> {
    app.retheme(true)?;
    while !app.quit {
        terminal.draw(|frame| app.draw(frame.buffer_mut()))?;
        // The spinners and the pulse move twice a second.
        if !event::poll(Duration::from_millis(500))? {
            app.tick = app.tick.wrapping_add(1);
            continue;
        }
        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                app.key(key.code, key.modifiers)?;
            }
        }
    }
    Ok(())
}

/// The looks worth comparing: a name, light, and option values to set.
type Look = (&'static str, bool, &'static [(usize, usize)]);
const LOOKS: [Look; 4] = [
    ("default", false, &[]),
    ("light", true, &[]),
    ("rail-dots", false, &[(CANVAS, 2), (BORDER, 1)]),
    ("solid", false, &[(CANVAS, 1), (FILL, 2)]),
];

#[allow(clippy::too_many_arguments)]
fn shot(theme: Theme, accent: usize, nerd: bool, light: bool, set: &[(usize, usize)], part: usize, panel: bool, wide: u16) -> Buffer {
    let mut app = App::new(theme, accent, light, nerd);
    for (option, value) in set {
        app.choose(*option, *value);
    }
    app.part = part;
    app.panel = panel;
    let width = SIDE + wide + if panel { PANEL } else { 0 };
    let draw = |app: &mut App, size: (u16, u16)| {
        let mut terminal = Terminal::new(TestBackend::new(size.0, size.1)).expect("a test backend");
        terminal.draw(|frame| app.draw(frame.buffer_mut())).expect("a draw");
        terminal.backend().buffer().clone()
    };
    // Small sizes too, so a page that writes outside its area fails.
    for size in [(1, 1), (SIDE + NARROW, 12), (80, 24), (95, 30), (110, 30), (SIDE + WIDE, 12), (SIDE + WIDE + 10, 30), (220, 60)] {
        draw(&mut app, size);
    }
    draw(&mut app, (width, TALL));
    let tall = app.tall + 1;
    draw(&mut app, (width, tall))
}

fn snapshot(dir: &Path, accent: usize, nerd: bool) -> std::io::Result<usize> {
    std::fs::create_dir_all(dir)?;
    let mut body = String::new();
    let mut count = 0;
    // The default look also at three and four tracks, to show the grid.
    let narrow = [("-3-tracks", NARROW), ("-4-tracks", NARROW + UNIT + GAP)];
    for (i, (name, ..)) in PARTS.into_iter().enumerate() {
        for (look, light, set) in LOOKS {
            for (depth, truecolor, wide) in [("", true, WIDE), ("-256", false, WIDE)].into_iter().chain(narrow.map(|(name, wide)| (name, true, wide))) {
                if !depth.is_empty() && look != "default" {
                    continue;
                }
                let tokens = ACCENTS[accent].tokens(light);
                let theme = if truecolor { Theme::truecolor(tokens) } else { Theme::xterm_256(tokens) };
                let mut buffer = shot(theme, accent, nerd, light, set, i, look == "rail-dots", wide);
                html::opaque(&mut buffer, &theme);
                let frame = html::buffer(&buffer);
                let id = format!("{}-{}-{look}{depth}", i + 1, name.to_lowercase());
                std::fs::write(dir.join(format!("{id}.html")), html::page(&id, &frame))?;
                body += &format!("<h2>{id}</h2>{frame}");
                count += 1;
            }
        }
    }
    std::fs::write(dir.join("index.html"), html::page("tui-kiso review", &body))?;
    Ok(count)
}

/// A ratatui buffer as HTML: one span per run of equal style.
#[path = "support/html.rs"]
mod html;
