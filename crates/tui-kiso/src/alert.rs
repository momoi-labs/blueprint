use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::widgets::Widget;

use crate::surface::{fill, put, write};
use crate::text::{cells, take_cells, wrap};
use crate::theme::xterm_rgb;
use crate::{blend, Button, Card, Size, Theme, Tone};

/// The mark of a tone. Each tone has its own shape, so color never carries
/// the severity alone.
pub(crate) fn glyph(tone: Tone) -> &'static str {
    match tone {
        Tone::Neutral => "○",
        Tone::Info => "●",
        Tone::Success => "✓",
        Tone::Warning => "▲",
        Tone::Danger => "✕",
    }
}

/// How much of the tone mixes into the card.
const TINT: f32 = 0.12;

/// The RGB a color draws as, when it is not a terminal default.
fn rgb_of(color: Color) -> Option<Rgb> {
    match color {
        Color::Rgb(r, g, b) => Some([r, g, b]),
        Color::Indexed(i) if i >= 16 => Some(xterm_rgb(i)),
        _ => None,
    }
}

/// One line of evidence: when, what happened, and what it means, such as
/// `10:54:31  pool connect refused  first failure`. A primary line is the
/// cause: bold, with `◂` before its label, so it does not depend on color.
#[derive(Clone, Copy, Debug)]
pub struct AlertLine<'a> {
    at: &'a str,
    event: &'a str,
    label: &'a str,
    primary: bool,
}

impl<'a> AlertLine<'a> {
    pub fn new(at: &'a str, event: &'a str, label: &'a str) -> Self {
        Self { at, event, label, primary: false }
    }

    /// Marks the line as the cause. Mark one line of an alert at most.
    #[must_use]
    pub fn primary(mut self) -> Self {
        self.primary = true;
        self
    }
}

/// A message about a condition in this view: a [`Card`] with a tint of its
/// [`Tone`], the tone's glyph and the title in the tone's color, the text
/// in `foreground`, and an optional action.
///
/// The tone shows in the tint, the glyph and the title. The rail, when the
/// look has one, stays the accent. In 256 colors there is no tint: the card
/// keeps its own fill. Draw it in [`Alert::height`] rows. An alert has no
/// keys: focus goes to its action.
///
/// A diagnostic adds slots, as rustc prints an error: a label row with a
/// code, the title as the message, `help:` with the action beside it, then
/// under a rule the facts, the lines of evidence and a `note:`. Each slot
/// wraps, so no text is cut.
#[derive(Clone, Copy, Debug)]
pub struct Alert<'a> {
    theme: &'a Theme,
    tone: Tone,
    title: &'a str,
    text: Option<&'a str>,
    action: Option<Button<'a>>,
    loud: bool,
    label: Option<&'a str>,
    code: Option<&'a str>,
    help: Option<&'a str>,
    facts: &'a [(&'a str, &'a str)],
    lines: &'a [AlertLine<'a>],
    note: Option<&'a str>,
}

/// A run of text on a row, `x` cells after the glyph column.
struct Seg {
    x: u16,
    text: String,
    style: Style,
    chip: bool,
}

/// A row of the alert: its text, and the column of the action, when the
/// action sits on it.
#[derive(Default)]
struct Row {
    segs: Vec<Seg>,
    action: Option<u16>,
}

impl Row {
    fn of(segs: Vec<Seg>) -> Self {
        Self { segs, action: None }
    }
}

fn seg(x: usize, text: impl Into<String>, style: Style) -> Seg {
    Seg { x: x as u16, text: text.into(), style, chip: false }
}

/// `text` in rows of at most `width` cells. A word longer than a row
/// breaks between graphemes, so nothing is cut.
fn rows_of(text: &str, width: usize) -> Vec<String> {
    let width = width.max(1);
    let mut out = Vec::new();
    for line in wrap(text, width) {
        let mut rest = line.as_str();
        while cells(rest) > width {
            let (head, _) = take_cells(rest, width);
            if head.is_empty() {
                break;
            }
            out.push(head.to_owned());
            rest = &rest[head.len()..];
        }
        out.push(rest.to_owned());
    }
    out
}

impl<'a> Alert<'a> {
    pub fn new(theme: &'a Theme, tone: Tone, title: &'a str) -> Self {
        Self {
            theme,
            tone,
            title,
            text: None,
            action: None,
            loud: false,
            label: None,
            code: None,
            help: None,
            facts: &[],
            lines: &[],
            note: None,
        }
    }

    /// What happened, why, and what the person can do. It wraps.
    #[must_use]
    pub fn text(mut self, text: &'a str) -> Self {
        self.text = Some(text);
        self
    }

    /// The recovery, such as "Retry". It draws as size `Sm`, one row. With
    /// [`Alert::help`], it sits after the help when it fits on that row.
    #[must_use]
    pub fn action(mut self, action: Button<'a>) -> Self {
        self.action = Some(action.size(Size::Sm));
        self
    }

    #[must_use]
    pub fn loud(mut self) -> Self {
        self.loud = true;
        self
    }

    /// The severity and a short name, such as "Error · Database
    /// unreachable", on the glyph row in capitals. The title goes on the
    /// next row as the message.
    #[must_use]
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = Some(label);
        self
    }

    /// A code to search for or quote, such as `db-unreachable`, as a chip
    /// after the label.
    #[must_use]
    pub fn code(mut self, code: &'a str) -> Self {
        self.code = Some(code);
        self
    }

    /// The fix, after `help:` in bold.
    #[must_use]
    pub fn help(mut self, help: &'a str) -> Self {
        self.help = Some(help);
        self
    }

    /// Facts as name and value, such as `source` and `since`. A name
    /// shows in muted text with a colon after it.
    #[must_use]
    pub fn facts(mut self, facts: &'a [(&'a str, &'a str)]) -> Self {
        self.facts = facts;
        self
    }

    /// The lines of evidence, in aligned columns.
    #[must_use]
    pub fn lines(mut self, lines: &'a [AlertLine<'a>]) -> Self {
        self.lines = lines;
        self
    }

    /// What else to know, after `note:` in bold.
    #[must_use]
    pub fn note(mut self, note: &'a str) -> Self {
        self.note = Some(note);
        self
    }

    fn solid(&self) -> (Rgb, Rgb) {
        let r = self.theme.tokens();
        match self.tone {
            Tone::Danger => (r.danger_solid, r.danger_solid_foreground),
            Tone::Warning => (r.warning_solid, r.warning_solid_foreground),
            Tone::Success => (r.success_solid, r.success_solid_foreground),
            Tone::Info | Tone::Neutral => (r.info_solid, r.info_solid_foreground),
        }
    }

    fn tape_rows(&self) -> u16 {
        u16::from(self.loud)
    }

    fn card(&self) -> Card<'a> {
        Card::new(self.theme)
    }

    /// The columns for the text: inside the padding, after the glyph.
    fn text_width(&self, width: u16) -> usize {
        usize::from(self.card().inner(Rect::new(0, 0, width, 3)).width.saturating_sub(2))
    }

    /// The styles of the head, the body, and the muted parts.
    fn styles(&self) -> (Style, Style, Style) {
        let t = self.theme;
        if self.loud {
            let (bg, fg) = self.solid();
            (t.fg(fg), t.fg(fg), t.fg(blend(&[fg, bg], 0.15)))
        } else {
            (t.fg(self.tone.rgb(t)), t.text(), t.muted())
        }
    }

    /// `prefix` in bold, then `text` wrapped under itself.
    fn prefixed(rows: &mut Vec<Row>, width: usize, prefix: &str, text: &str, body: Style) {
        let indent = cells(prefix) + 1;
        for (i, line) in rows_of(text, width.saturating_sub(indent)).into_iter().enumerate() {
            let mut segs = Vec::new();
            if i == 0 {
                segs.push(seg(2, prefix, body.add_modifier(Modifier::BOLD)));
            }
            segs.push(seg(2 + indent, line, body));
            rows.push(Row::of(segs));
        }
    }

    /// Every row inside the card, after the tape, at `width` columns.
    fn rows(&self, width: u16) -> Vec<Row> {
        let w = self.text_width(width);
        let (head, body, meta) = self.styles();
        let bold = head.add_modifier(Modifier::BOLD);
        let mut rows = Vec::new();
        let first = self.label.map_or_else(|| self.title.to_owned(), str::to_uppercase);
        let mut used = 0;
        for (i, line) in rows_of(&first, w).into_iter().enumerate() {
            let mut segs = Vec::new();
            if i == 0 {
                segs.push(seg(0, glyph(self.tone), head));
            }
            used = cells(&line);
            segs.push(seg(2, line, bold));
            rows.push(Row::of(segs));
        }
        if let Some(code) = self.code {
            let chip = format!(" {code} ");
            let chip_width = cells(&chip);
            let chip = Seg { chip: true, ..seg(0, chip, body) };
            match rows.last_mut() {
                Some(row) if used + 1 + chip_width <= w => row.segs.push(Seg { x: (2 + used + 1) as u16, ..chip }),
                _ => rows.push(Row::of(vec![Seg { x: 2, ..chip }])),
            }
        }
        if self.label.is_some() {
            for line in rows_of(self.title, w) {
                rows.push(Row::of(vec![seg(2, line, bold)]));
            }
        }
        if let Some(text) = self.text {
            for line in rows_of(text, w) {
                rows.push(Row::of(vec![seg(2, line, body)]));
            }
        }
        if let Some(help) = self.help {
            Self::prefixed(&mut rows, w, "help:", help, body);
        }
        if let Some(action) = self.action {
            let width = usize::from(action.width());
            let end = rows.last().and_then(|row| row.segs.last()).map_or(0, |s| usize::from(s.x) - 2 + cells(&s.text));
            match rows.last_mut() {
                Some(row) if self.help.is_some() && end + 2 + width <= w => row.action = Some((2 + end + 2) as u16),
                _ => {
                    if self.help.is_none() {
                        rows.push(Row::default());
                    }
                    rows.push(Row { segs: Vec::new(), action: Some(2) });
                }
            }
        }
        if !self.facts.is_empty() || !self.lines.is_empty() || self.note.is_some() {
            rows.push(Row::of(vec![seg(2, "─".repeat(w), meta)]));
        }
        let name = self.facts.iter().map(|(name, _)| cells(name) + 2).max().unwrap_or(0);
        for (key, value) in self.facts {
            for (i, line) in rows_of(value, w.saturating_sub(name)).into_iter().enumerate() {
                let mut segs = Vec::new();
                if i == 0 {
                    segs.push(seg(2, format!("{key}:"), meta));
                }
                segs.push(seg(2 + name, line, body));
                rows.push(Row::of(segs));
            }
        }
        if !self.lines.is_empty() {
            if !self.facts.is_empty() {
                rows.push(Row::default());
            }
            let at = self.lines.iter().map(|l| cells(l.at)).max().unwrap_or(0) + 2;
            let event = self.lines.iter().map(|l| cells(l.event)).max().unwrap_or(0) + 2;
            let label = self.lines.iter().map(|l| cells(l.label) + if l.primary { 2 } else { 0 }).max().unwrap_or(0);
            let wide = at + event + label <= w;
            for line in self.lines {
                let strong = if line.primary { Modifier::BOLD } else { Modifier::empty() };
                let mark = if line.primary { "◂ " } else { "" };
                let label_text = format!("{mark}{}", line.label);
                let label_style = body.add_modifier(Modifier::ITALIC | strong);
                if wide {
                    rows.push(Row::of(vec![
                        seg(2, line.at, meta),
                        seg(2 + at, line.event, body.add_modifier(strong)),
                        seg(2 + at + event, label_text, label_style),
                    ]));
                    continue;
                }
                for (i, part) in rows_of(line.event, w.saturating_sub(at)).into_iter().enumerate() {
                    let mut segs = Vec::new();
                    if i == 0 {
                        segs.push(seg(2, line.at, meta));
                    }
                    segs.push(seg(2 + at, part, body.add_modifier(strong)));
                    rows.push(Row::of(segs));
                }
                for part in rows_of(&label_text, w.saturating_sub(at)) {
                    rows.push(Row::of(vec![seg(2 + at, part, label_style)]));
                }
            }
        }
        if let Some(note) = self.note {
            if !self.facts.is_empty() || !self.lines.is_empty() {
                rows.push(Row::default());
            }
            Self::prefixed(&mut rows, w, "note:", note, body);
        }
        rows
    }

    /// The rows the alert takes at `width` columns.
    pub fn height(&self, width: u16) -> u16 {
        2 + self.tape_rows() + self.rows(width).len() as u16
    }
}

impl Widget for Alert<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let card = self.card();
        card.render(area, buf);
        let tone = self.tone.rgb(t);
        let (wash, alpha) = if self.loud { (self.solid().0, 1.0) } else { (tone, TINT) };
        if (self.loud || t.is_truecolor()) && area.height >= 3 {
            // The half rows hold the card color in their foreground.
            let (top, bottom) = (area.top(), area.bottom() - 1);
            for x in area.left()..area.right() {
                for y in [top, bottom] {
                    if let Some(cell) = buf.cell_mut((x, y)) {
                        if let Some(rgb) = rgb_of(cell.fg) {
                            cell.fg = t.color(blend(&[rgb, wash], alpha));
                        }
                    }
                }
            }
            fill(t, buf, Rect { y: top + 1, height: area.height - 2, ..area }, wash, alpha);
        }
        if self.loud && area.height >= 3 {
            let tape = t.color(t.tokens().tape);
            for x in area.left()..area.right() {
                put(buf, x, area.top() + 1, "▚", tape);
            }
        }
        let shift = self.tape_rows().min(area.height);
        let inner = card.inner(Rect { y: area.y.saturating_add(shift), height: area.height - shift, ..area });
        if inner.is_empty() {
            return;
        }
        let body_fg = if self.loud { self.solid().1 } else { t.tokens().foreground };
        for (row, y) in self.rows(area.width).into_iter().zip(inner.y..inner.bottom()) {
            for s in row.segs {
                let x = inner.x.saturating_add(s.x);
                if x >= inner.right() {
                    continue;
                }
                let (text, _) = take_cells(&s.text, usize::from(inner.right() - x));
                let style = if s.chip {
                    match buf.cell((x, y)).and_then(|cell| rgb_of(cell.bg)) {
                        Some(bg) => s.style.bg(t.color(blend(&[bg, body_fg], 0.2))),
                        None => s.style.add_modifier(Modifier::REVERSED),
                    }
                } else {
                    s.style
                };
                write(buf, x, y, text, style);
            }
            if let (Some(dx), Some(action)) = (row.action, self.action) {
                action.render(Rect::new(inner.x.saturating_add(dx), y, action.width(), 1), buf);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn an_alert_has_a_glyph_a_title_a_wrapped_text_and_an_action() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let button = Button::new(&theme, "Retry");
        let alert = Alert::new(&theme, Tone::Danger, "Replica down").text("The replica did not answer in time.").action(button);
        // Width 26: 22 inside the padding, 20 after the glyph.
        assert_eq!(alert.height(26), 2 + 1 + 2 + 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 26, 7));
        alert.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "  ✕ Replica down          ");
        assert_eq!(row(&buf, 2), "    The replica did not   ");
        assert_eq!(row(&buf, 3), "    answer in time.       ");
        assert_eq!(buf[(2, 1)].fg, theme.color(theme.tokens().danger_on_dark));
        assert_eq!(buf[(4, 2)].fg, theme.color(theme.tokens().foreground));
        assert!(row(&buf, 5).contains("Retry"));
    }

    #[test]
    fn the_tone_tints_the_card_in_truecolor_only() {
        let truecolor = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (mut plain, mut tinted) = (Buffer::empty(Rect::new(0, 0, 12, 3)), Buffer::empty(Rect::new(0, 0, 12, 3)));
        Card::new(&truecolor).render(plain.area, &mut plain);
        Alert::new(&truecolor, Tone::Danger, "x").render(tinted.area, &mut tinted);
        assert_ne!(plain[(5, 1)].bg, tinted[(5, 1)].bg);
        let indexed = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let (mut plain, mut tinted) = (Buffer::empty(Rect::new(0, 0, 12, 3)), Buffer::empty(Rect::new(0, 0, 12, 3)));
        Card::new(&indexed).render(plain.area, &mut plain);
        Alert::new(&indexed, Tone::Danger, "x").render(tinted.area, &mut tinted);
        assert_eq!(plain[(5, 1)].bg, tinted[(5, 1)].bg);
    }

    #[test]
    fn a_loud_alert_fills_the_card_with_the_solid_color_under_a_tape_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let r = theme.tokens();
        let alert = Alert::new(&theme, Tone::Danger, "Database error").text("connection refused").loud();
        assert_eq!(alert.height(30), 2 + 1 + 1 + 1);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 5));
        alert.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "▚".repeat(30));
        assert_eq!(buf[(5, 1)].fg, theme.color(r.tape));
        assert_eq!(buf[(5, 1)].bg, theme.color(r.danger_solid));
        assert_eq!(row(&buf, 2), "  ✕ Database error            ");
        assert_eq!(row(&buf, 3), "    connection refused        ");
        assert_eq!(buf[(2, 2)].fg, theme.color(r.danger_solid_foreground));
        assert_eq!(buf[(4, 3)].fg, theme.color(r.danger_solid_foreground));
        assert_eq!(buf[(20, 3)].bg, theme.color(r.danger_solid));
    }

    #[test]
    fn a_loud_warning_uses_the_triangle_on_the_yellow_fill_in_256_colors_too() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_LIGHT);
        let r = theme.tokens();
        let mut buf = Buffer::empty(Rect::new(0, 0, 20, 4));
        Alert::new(&theme, Tone::Warning, "Lag").loud().render(buf.area, &mut buf);
        assert_eq!(buf[(2, 2)].symbol(), "▲");
        assert_eq!(buf[(2, 2)].fg, theme.color(r.warning_solid_foreground));
        assert_eq!(buf[(10, 2)].bg, theme.color(r.warning_solid));
        assert_eq!(buf[(10, 1)].symbol(), "▚");
    }

    #[test]
    fn a_loud_alert_in_a_short_area_does_not_panic() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for height in 0..4 {
            let mut buf = Buffer::empty(Rect::new(0, 0, 8, height));
            Alert::new(&theme, Tone::Danger, "x").text("y").loud().render(buf.area, &mut buf);
        }
    }

    #[test]
    fn each_tone_has_its_own_glyph() {
        let glyphs: Vec<_> = Tone::ALL.map(glyph).to_vec();
        for (i, one) in glyphs.iter().enumerate() {
            assert!(!glyphs[i + 1..].contains(one));
        }
    }

    const FACTS: [(&str, &str); 2] = [("source", "primary-replica-02.eu-west-1.internal:5432"), ("since", "4 minutes ago, at 10:54:31")];

    fn evidence() -> [AlertLine<'static>; 3] {
        [
            AlertLine::new("10:54:31", "pool connect refused", "first failure").primary(),
            AlertLine::new("10:54:31", "retry 3/3 failed", "gave up here"),
            AlertLine::new("10:54:32", "products.list 503", "what users see"),
        ]
    }

    /// The alert at a level of the gallery: 0 simple, 1 detailed, 2 full.
    fn diagnostic<'a>(theme: &'a Theme, lines: &'a [AlertLine<'a>], level: usize, loud: bool) -> Alert<'a> {
        let mut alert = Alert::new(theme, Tone::Danger, "Checkout cannot reach the primary database").label("Error · Database unreachable");
        if level >= 1 {
            alert = alert.code("db-unreachable").help("Fail over to replica-03.").action(Button::new(theme, "Fail over"));
        }
        if level >= 2 {
            alert = alert.facts(&FACTS).lines(lines).note("Checkout returns 503 until the primary accepts connections.");
        }
        if loud {
            alert = alert.loud();
        }
        alert
    }

    fn squeeze(text: &str) -> String {
        text.split_whitespace().collect()
    }

    #[test]
    fn each_level_fits_its_height_and_cuts_no_text() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let lines = evidence();
        let texts = [
            "ERROR · DATABASE UNREACHABLE",
            "Checkout cannot reach the primary database",
            "db-unreachable",
            "help: Fail over to replica-03.",
            "Fail over",
            "source: primary-replica-02.eu-west-1.internal:5432",
            "since: 4 minutes ago, at 10:54:31",
            "10:54:31 pool connect refused",
            "◂ first failure",
            "retry 3/3 failed",
            "gave up here",
            "products.list 503",
            "what users see",
            "note: Checkout returns 503 until the primary accepts connections.",
        ];
        let shown = [2, 5, 14];
        for loud in [false, true] {
            for (level, count) in shown.into_iter().enumerate() {
                for width in [100, 80, 40] {
                    let alert = diagnostic(&theme, &lines, level, loud);
                    let height = alert.height(width);
                    let mut buf = Buffer::empty(Rect::new(0, 0, width, height));
                    alert.render(buf.area, &mut buf);
                    let all: String = (0..height).map(|y| squeeze(&row(&buf, y))).collect();
                    for text in &texts[..count] {
                        assert!(all.contains(&squeeze(text)), "level {level} at {width}, loud {loud}: {text:?} is cut in {all:?}");
                    }
                    assert!(!row(&buf, height - 2).trim().is_empty(), "level {level} at {width}, loud {loud}: the last row is empty");
                    if level == 2 {
                        assert!((0..height).any(|y| row(&buf, y).contains("◂ first failure")), "no mark at {width}, loud {loud}");
                        assert!(!(0..height).any(|y| row(&buf, y).contains("◂ gave up")));
                    }
                }
            }
        }
    }

    #[test]
    fn the_evidence_aligns_in_columns_when_it_fits() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let lines = evidence();
        let alert = diagnostic(&theme, &lines, 2, true);
        let height = alert.height(80);
        let mut buf = Buffer::empty(Rect::new(0, 0, 80, height));
        alert.render(buf.area, &mut buf);
        let rows: Vec<String> = (0..height).map(|y| row(&buf, y)).collect();
        let first = rows.iter().position(|r| r.contains("pool connect refused")).expect("the primary line");
        let second = rows.iter().position(|r| r.contains("retry 3/3 failed")).expect("a line");
        let column = |y: usize, text: &str| rows[y].find(text).map(|i| rows[y][..i].chars().count());
        assert_eq!(column(first, "pool"), column(second, "retry"));
        assert_eq!(column(first, "◂"), column(second, "gave"));
        let at = column(first, "pool").unwrap_or(0) as u16;
        assert!(buf[(at, first as u16)].modifier.contains(Modifier::BOLD));
        assert!(rows.iter().any(|r| r.contains("help: Fail over to replica-03.") && r.contains("Fail over ")));
    }

    #[test]
    fn an_alert_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 6, 3));
        let button = Button::new(&theme, "Retry");
        Alert::new(&theme, Tone::Info, "A long title").text("some text that wraps").action(button).render(Rect::new(3, 1, 30, 8), &mut buf);
    }
}
