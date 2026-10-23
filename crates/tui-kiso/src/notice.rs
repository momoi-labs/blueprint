use std::io::Write;

use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::{blend, Theme};

/// A notice across the footer row, as Crush's: a bold label on the
/// `success-on-dark` fill, then the message. Show it in place of the key
/// hints for a few seconds after an action ends.
#[derive(Clone, Debug)]
pub struct Toast<'a> {
    theme: &'a Theme,
    label: &'a str,
    text: String,
}

impl<'a> Toast<'a> {
    pub fn new(theme: &'a Theme, text: impl Into<String>) -> Self {
        Self { theme, label: "DONE!", text: text.into() }
    }

    /// The label before the message. "DONE!" by default.
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = label;
        self
    }
}

impl Widget for Toast<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let r = self.theme.tokens();
        buf.set_style(area, self.theme.fill(r.background, r.success_on_dark));
        let line = Line::from(vec![
            Span::styled(format!(" {} ", self.label), Style::new().add_modifier(Modifier::BOLD)),
            Span::raw(format!(" {}", self.text)),
        ]);
        buf.set_line(area.x, area.y, &line, area.width);
    }
}

/// `count` characters that change on every tick, in the title gradient:
/// Crush's spinner, for work that takes a few seconds, such as a restart.
/// Call it about every 80 ms with a new tick.
pub fn scramble(theme: &Theme, count: usize, tick: u32) -> Vec<Span<'static>> {
    const CHARS: &[u8] = b"0123456789abcdefABCDEF~!@#$%^&*+=?";
    (0..count)
        .map(|i| {
            let hash =
                u64::from(tick).wrapping_mul(6_364_136_223_846_793_005).wrapping_add((i as u64).wrapping_mul(1_442_695_040_888_963_407));
            let ch = CHARS[(hash >> 33) as usize % CHARS.len()] as char;
            let at = i as f32 / count.max(2).saturating_sub(1) as f32;
            Span::styled(ch.to_string(), theme.fg(blend(&theme.stops(), at)))
        })
        .collect()
}

/// A braille dot that turns on every tick, for a refresh that never ends.
/// `⠿` is the stopped one, as for a paused view.
pub fn braille(tick: u32) -> &'static str {
    const FRAMES: [&str; 10] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    FRAMES[tick as usize % FRAMES.len()]
}

/// A step of a run, as a line of Crush's tool calls: a tree branch such as
/// `├──── ` in `subtle-foreground`, `✓` or `×`, the name in `info` and the
/// detail in `muted-foreground`.
pub fn step(theme: &Theme, branch: &str, ok: bool, name: &str, detail: &str) -> Line<'static> {
    let mark = if ok { Span::styled("✓ ", theme.success()) } else { Span::styled("× ", theme.danger()) };
    Line::from(vec![
        Span::styled(format!("  {branch}"), theme.subtle()),
        mark,
        Span::styled(format!("{name:<9}"), theme.info()),
        Span::styled(detail.to_owned(), theme.muted()),
    ])
}

/// Sets the terminal's own background with OSC 11, so the cells a view
/// leaves unpainted show `background`, with the terminal's transparency.
/// `None` puts the terminal's color back with OSC 111; send it on exit.
pub fn set_background(out: &mut impl Write, rgb: Option<Rgb>) -> std::io::Result<()> {
    match rgb {
        Some([r, g, b]) => write!(out, "\x1b]11;#{r:02x}{g:02x}{b:02x}\x1b\\")?,
        None => write!(out, "\x1b]111\x1b\\")?,
    }
    out.flush()
}

/// Shows or hides the terminal's own progress bar with OSC 9;4, for work
/// that runs in the background. Ghostty draws it as a thin bar along the
/// top of the window; terminals without it ignore it.
pub fn set_progress(out: &mut impl Write, busy: bool) -> std::io::Result<()> {
    write!(out, "\x1b]9;4;{}\x1b\\", if busy { 3 } else { 0 })?;
    out.flush()
}
