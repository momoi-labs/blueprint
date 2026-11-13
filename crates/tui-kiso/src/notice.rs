use std::io::Write;

use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::{blend, Card, CardVariant, Size, Theme, Tone};

/// A short notice on the `popover` surface, an elevated [`Card`] of size
/// `Sm`: the tone's glyph and a bold label in the tone's color, then the
/// message in `foreground`. It lasts a few seconds after an action ends,
/// and any key clears it.
///
/// Give it three rows to draw the card with its half rows. Give it one row,
/// such as the footer in place of the key hints, and it draws a flat fill
/// across the row. [`Toast::stack`] places several at the top right.
#[derive(Clone, Debug)]
pub struct Toast<'a> {
    theme: &'a Theme,
    tone: Tone,
    label: Option<&'a str>,
    text: String,
}

impl<'a> Toast<'a> {
    /// A `Success` toast, labelled "DONE!".
    pub fn new(theme: &'a Theme, text: impl Into<String>) -> Self {
        Self { theme, tone: Tone::Success, label: None, text: text.into() }
    }

    /// The tone of the glyph and the label. `Success` by default.
    #[must_use]
    pub fn tone(mut self, tone: Tone) -> Self {
        self.tone = tone;
        self
    }

    /// The label before the message. By default the tone's: "DONE!",
    /// "INFO", "WARN", "FAILED", or none for `Neutral`.
    #[must_use]
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = Some(label);
        self
    }

    fn spans(&self) -> Vec<Span<'static>> {
        let t = self.theme;
        let head = t.fg(self.tone.rgb(t));
        let label = self.label.unwrap_or(match self.tone {
            Tone::Neutral => "",
            Tone::Info => "INFO",
            Tone::Success => "DONE!",
            Tone::Warning => "WARN",
            Tone::Danger => "FAILED",
        });
        let mut spans = vec![Span::styled(format!("{} ", crate::alert::glyph(self.tone)), head)];
        if !label.is_empty() {
            spans.push(Span::styled(format!("{label}  "), head.add_modifier(Modifier::BOLD)));
        }
        spans.push(Span::styled(self.text.clone(), t.text()));
        spans
    }

    /// The columns the card takes: the glyph, the label and the message,
    /// with one column of padding on each side.
    pub fn width(&self) -> u16 {
        let content: usize = self.spans().iter().map(|span| cells(&span.content)).sum();
        (content as u16).saturating_add(2)
    }

    /// The rows the card takes.
    pub fn height(&self) -> u16 {
        3
    }

    /// Draws the newest `MAX_STACK` toasts at the top right of `area`, the
    /// newest on top, one blank row apart. `toasts` runs from the oldest to
    /// the newest. A toast wider than the area is cut with `…`. The rail,
    /// when the look has one, needs the column before each card, so the
    /// toasts keep one column from the right edge.
    pub fn stack(area: Rect, buf: &mut Buffer, toasts: &[Toast<'_>]) {
        let mut y = area.y;
        for toast in toasts.iter().rev().take(Self::MAX_STACK) {
            let width = toast.width().min(area.width.saturating_sub(3));
            if width == 0 || y.saturating_add(toast.height()) > area.bottom() {
                return;
            }
            let x = area.right().saturating_sub(width + 1);
            toast.clone().render(Rect::new(x, y, width, toast.height()), buf);
            y = y.saturating_add(toast.height() + 1);
        }
    }

    /// The most toasts [`Toast::stack`] shows.
    pub const MAX_STACK: usize = 3;
}

impl Widget for Toast<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.intersection(buf.area).is_empty() {
            return;
        }
        let card = Card::new(self.theme).variant(CardVariant::Elevated).size(Size::Sm);
        card.render(area, buf);
        // One row has no half rows, so the text takes it.
        let row = if area.height >= 3 { area.y + 1 } else { area.y };
        let (x, width) = (area.x.saturating_add(1), area.width.saturating_sub(2));
        let (spans, _) = crate::text::cut(self.spans(), usize::from(width));
        if buf.area.contains(ratatui::layout::Position { x, y: row }) {
            buf.set_line(x, row, &Line::from(spans), width);
        }
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

/// Where a step of a run is, with the step list's five states.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum StepState {
    /// Not run yet: `·`, the name in `muted-foreground`.
    Pending,
    /// Running, with the tick for its spinner: a braille dot and the name
    /// in bold `success-on-dark`, since running is alive.
    Running(u32),
    /// `✓` in `success-on-dark`, the name in `info-on-dark`.
    Done,
    /// Not needed: `○` in `success-on-dark`, the name muted. Pass "Not
    /// needed" as the detail.
    Skipped,
    /// `×` and the name in bold `danger-on-dark`.
    Failed,
}

/// A step of a run, as a line of Crush's tool calls: a tree branch such as
/// `├──── ` in `subtle-foreground`, the state's mark, the name and the
/// detail in `muted-foreground`. Each state has its own mark, so color
/// never carries it alone.
pub fn step(theme: &Theme, branch: &str, state: StepState, name: &str, detail: &str) -> Line<'static> {
    let bold = |style: Style| style.add_modifier(Modifier::BOLD);
    let (mark, style) = match state {
        StepState::Pending => ("·".to_owned(), theme.muted()),
        StepState::Running(tick) => (braille(tick).to_owned(), bold(theme.success())),
        StepState::Done => ("✓".to_owned(), theme.info()),
        StepState::Skipped => ("○".to_owned(), theme.muted()),
        StepState::Failed => ("×".to_owned(), bold(theme.danger())),
    };
    let mark_style = match state {
        StepState::Pending => theme.subtle(),
        StepState::Failed => theme.danger(),
        _ => theme.success(),
    };
    Line::from(vec![
        Span::styled(format!("  {branch}"), theme.subtle()),
        Span::styled(format!("{mark} "), mark_style),
        Span::styled(format!("{name:<9}"), style),
        Span::styled(detail.to_owned(), theme.muted()),
    ])
}

/// Copies `text` to the clipboard with OSC 52. Some terminals block it, so
/// also say what was copied, such as in a toast.
pub fn set_clipboard(out: &mut impl Write, text: &str) -> std::io::Result<()> {
    write!(out, "\x1b]52;c;{}\x1b\\", base64(text.as_bytes()))?;
    out.flush()
}

/// Standard base64 with padding.
fn base64(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let n = chunk.iter().enumerate().fold(0u32, |n, (i, b)| n | u32::from(*b) << (16 - 8 * i));
        for i in 0..4 {
            if i <= chunk.len() {
                out.push(char::from(ALPHABET[(n >> (18 - 6 * i)) as usize & 63]));
            } else {
                out.push('=');
            }
        }
    }
    out
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

/// Sets the terminal's own text color with OSC 10, so text without a color
/// of its own, such as `Span::raw`, shows `foreground`. Send it with
/// [`set_background`]: in a light theme, a terminal's light default text
/// would vanish. `None` puts the terminal's color back with OSC 110.
pub fn set_foreground(out: &mut impl Write, rgb: Option<Rgb>) -> std::io::Result<()> {
    match rgb {
        Some([r, g, b]) => write!(out, "\x1b]10;#{r:02x}{g:02x}{b:02x}\x1b\\")?,
        None => write!(out, "\x1b]110\x1b\\")?,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_clipboard_gets_base64() {
        let mut out = Vec::new();
        set_clipboard(&mut out, "hi").unwrap();
        assert_eq!(out, b"\x1b]52;c;aGk=\x1b\\");
        assert_eq!(base64(b"https://laya.momoi.internal/"), "aHR0cHM6Ly9sYXlhLm1vbW9pLmludGVybmFsLw==");
        assert_eq!(base64(b"abc"), "YWJj");
    }

    #[test]
    fn the_terminal_colors_go_and_come_back() {
        let mut out = Vec::new();
        set_foreground(&mut out, Some([0xee, 0xec, 0xe9])).unwrap();
        set_foreground(&mut out, None).unwrap();
        assert_eq!(out, b"\x1b]10;#eeece9\x1b\\\x1b]110\x1b\\");
    }

    #[test]
    fn a_failing_writer_is_an_error() {
        struct Broken;
        impl Write for Broken {
            fn write(&mut self, _: &[u8]) -> std::io::Result<usize> {
                Err(std::io::ErrorKind::BrokenPipe.into())
            }
            fn flush(&mut self) -> std::io::Result<()> {
                Ok(())
            }
        }
        assert!(set_clipboard(&mut Broken, "hi").is_err());
    }

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn a_toast_is_a_card_with_a_glyph_a_label_and_the_message() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let toast = Toast::new(&theme, "laya restarted");
        assert_eq!(toast.width(), 25);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 3));
        toast.render(Rect::new(1, 0, 25, 3), &mut buf);
        assert_eq!(row(&buf, 0).trim(), "▄".repeat(25));
        assert_eq!(row(&buf, 1), "  ✓ DONE!  laya restarted     ");
        assert_eq!(buf[(2, 1)].fg, theme.color(theme.tokens().success_on_dark));
        assert_ne!(buf[(5, 1)].bg, ratatui::style::Color::Reset);
    }

    #[test]
    fn a_toast_in_one_row_is_a_flat_fill_across_it() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 1));
        Toast::new(&theme, "Copied").tone(Tone::Info).render(buf.area, &mut buf);
        assert_eq!(row(&buf, 0), " ● INFO  Copied     ");
        assert_eq!(buf[(0, 0)].bg, buf[(19, 0)].bg);
    }

    #[test]
    fn a_stack_shows_the_newest_three_on_top_at_the_right() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let texts = ["one", "two", "three", "four"];
        let toasts: Vec<_> = texts.iter().map(|text| Toast::new(&theme, *text).tone(Tone::Neutral)).collect();
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 14));
        Toast::stack(buf.area, &mut buf, &toasts);
        let text = |y| row(&buf, y).trim().to_owned();
        assert_eq!(text(1), "○ four");
        assert_eq!(text(5), "○ three");
        assert_eq!(text(9), "○ two");
        // The oldest is out, and one blank row parts the cards.
        assert!(!(0..14).any(|y| text(y).contains("one")));
        assert_eq!(text(3), "");
        // One column stays free at the right.
        assert_eq!(buf[(29, 1)].symbol(), " ");
        assert_eq!(buf[(29, 1)].bg, ratatui::style::Color::Reset);
    }

    #[test]
    fn a_toast_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 2));
        Toast::new(&theme, "a long message").render(Rect::new(4, 1, 30, 3), &mut buf);
        Toast::stack(buf.area, &mut buf, &[Toast::new(&theme, "a long message")]);
    }

    #[test]
    fn each_step_state_has_its_own_mark() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let states = [StepState::Pending, StepState::Running(0), StepState::Done, StepState::Skipped, StepState::Failed];
        let marks: Vec<String> = states.iter().map(|s| step(&theme, "", *s, "Pull", "").spans[1].content.to_string()).collect();
        assert_eq!(marks, ["· ", "⠋ ", "✓ ", "○ ", "× "]);
    }
}
