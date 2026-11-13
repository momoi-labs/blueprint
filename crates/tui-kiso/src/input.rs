//! The field surface that [`Input`], [`PasswordInput`], [`Textarea`] and
//! the values of a [`Form`](crate::Form) share: a fill with square corners
//! and one column of padding, with half a row above and below at `Md`.
//!
//! [`Textarea`]: crate::Textarea

use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use unicode_segmentation::UnicodeSegmentation;

use crate::surface::{under, write};
use crate::text::{cells, cut, first_grapheme, take_cells};
use crate::{blend, Size, Theme};

/// The states of a field that change how its surface looks.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub(crate) struct Flags {
    pub focused: bool,
    pub disabled: bool,
    pub read_only: bool,
    pub invalid: bool,
    /// The row selection of a list shows the focus, so the focus bars stay
    /// off. The danger bars of an invalid field stay on.
    pub selection: bool,
}

/// The colors of a field surface in one state.
pub(crate) struct Paint {
    pub bg: Color,
    pub text: Style,
    /// The placeholder and the cut marks.
    pub faint: Style,
    /// The show or hide word of a password.
    pub muted: Style,
    pub cursor: Option<Style>,
    pub bars: Option<Color>,
}

impl Paint {
    /// The paint of a field over `behind`, the color under its first cell.
    pub(crate) fn new(t: &Theme, flags: Flags, behind: Rgb) -> Self {
        let r = t.tokens();
        let (bg, text) = if flags.disabled {
            // Disabled is exempt from contrast, so the fill keeps its own
            // color in 256 colors too. Where `disabled-surface` is the color
            // under the field, as on a light page, a faint `input` shows
            // where the field is, as the border does on the web.
            let fill = if r.disabled_surface == behind { blend(&[behind, r.input], 0.35) } else { r.disabled_surface };
            (t.color(fill), t.color(r.subtle_foreground))
        } else {
            let fill = if flags.read_only { blend(&[behind, r.input], 0.5) } else { r.input };
            let style = t.fill(r.foreground, fill);
            (style.bg.unwrap_or(Color::Reset), style.fg.unwrap_or(Color::Reset))
        };
        let on = Style::new().bg(bg);
        let faint = on.fg(t.color(r.subtle_foreground));
        let bars = match flags {
            Flags { disabled: true, .. } => None,
            Flags { invalid: true, .. } => Some(t.color(r.danger)),
            Flags { focused: true, selection: false, .. } => Some(t.color(r.focus)),
            _ => None,
        };
        Self {
            bg,
            text: on.fg(text),
            faint,
            muted: if flags.disabled { faint } else { on.fg(t.color(r.muted_foreground)) },
            cursor: (flags.focused && !flags.disabled && !flags.read_only).then(|| t.fill(r.primary_foreground, r.primary)),
            bars,
        }
    }
}

/// A cell the surface does not own: drawn as a space in a page, skipped
/// by [`draw`], so a backdrop under it stays.
fn gap() -> Span<'static> {
    Span::raw(" ")
}

/// The rows of a field surface `width` columns wide around `body`, rows of
/// spans for the `width - 2` cells inside the padding. Each row starts and
/// ends with a cell for the focus bar, outside the fill.
pub(crate) fn frame(paint: &Paint, size: Size, width: u16, body: Vec<Vec<Span<'static>>>) -> Vec<Line<'static>> {
    let width = usize::from(width.max(2));
    let inner = width - 2;
    let pad = Span::styled(" ", paint.text);
    let bar = |symbol: &'static str| paint.bars.map_or_else(gap, |color| Span::styled(symbol, Style::new().fg(color)));
    let half = |symbol: &str| Span::styled(symbol.repeat(width), Style::new().fg(paint.bg));
    let mut lines = Vec::new();
    if size != Size::Sm {
        lines.push(Line::from(vec![bar("▗"), half("▄"), bar("▖")]));
    }
    for row in body {
        let (mut spans, used) = cut(row, inner);
        spans.push(Span::styled(" ".repeat(inner - used), paint.text));
        let mut line = vec![bar("▐"), pad.clone()];
        line.extend(spans);
        line.extend([pad.clone(), bar("▌")]);
        lines.push(Line::from(line));
    }
    if size != Size::Sm {
        lines.push(Line::from(vec![bar("▝"), half("▀"), bar("▘")]));
    }
    lines
}

/// Draws the rows of [`frame`] with the fill at `area.x`, so the focus bars
/// land in the cell before and the cell after it. Cells the surface does
/// not own keep what is under them.
pub(crate) fn draw(buf: &mut Buffer, area: Rect, lines: &[Line<'static>]) {
    for (dy, line) in lines.iter().enumerate().take(usize::from(area.height)) {
        let y = area.y.saturating_add(dy as u16);
        let mut x = i32::from(area.x) - 1;
        for span in &line.spans {
            if x >= 0 && span.style != Style::default() {
                write(buf, x as u16, y, &span.content, span.style);
            }
            x += span.width() as i32;
        }
    }
}

/// One row of text in `width` cells. With a cursor, the view slides so the
/// cursor stays in sight; without one, it shows the start. A cut edge
/// shows `…` in `faint`.
pub(crate) fn one_row(
    graphemes: &[&str],
    cursor: Option<(usize, Style)>,
    width: usize,
    text: Style,
    faint: Style,
) -> Vec<Span<'static>> {
    let width = width.max(1);
    let Some((at, caret)) = cursor else {
        let all = graphemes.concat();
        if cells(&all) <= width {
            return vec![Span::styled(all, text)];
        }
        let (head, _) = take_cells(&all, width - 1);
        return vec![Span::styled(head.to_owned(), text), Span::styled("…", faint)];
    };
    let w = |g: &str| cells(g);
    let at = at.min(graphemes.len());
    // A grapheme wider than the room shows as a one-cell cursor.
    let under = graphemes.get(at).copied().filter(|g| w(g) <= width).unwrap_or(" ");
    let after = (at + 1).min(graphemes.len());
    let mut used = w(under).max(1);
    let mut start = at;
    while start > 0 && used + w(graphemes[start - 1]) <= width {
        start -= 1;
        used += w(graphemes[start]);
    }
    let mut end = after;
    while end < graphemes.len() && used + w(graphemes[end]) <= width {
        used += w(graphemes[end]);
        end += 1;
    }
    // Room for the cut marks: text after the cursor goes first, then text
    // before it.
    loop {
        let marks = usize::from(start > 0) + usize::from(end < graphemes.len());
        if used + marks <= width {
            break;
        }
        if end > after {
            end -= 1;
            used -= w(graphemes[end]);
        } else if start < at {
            used -= w(graphemes[start]);
            start += 1;
        } else {
            break;
        }
    }
    let left = start > 0 && used < width;
    let right = end < graphemes.len() && used + usize::from(left) < width;
    vec![
        Span::styled(if left { "…" } else { "" }, faint),
        Span::styled(graphemes[start..at].concat(), text),
        Span::styled(under.to_owned(), caret),
        Span::styled(graphemes[after..end].concat(), text),
        Span::styled(if right { "…" } else { "" }, faint),
    ]
}

/// The placeholder in `width` cells, with the cursor on its first cell.
pub(crate) fn placeholder(text: &str, cursor: Option<Style>, width: usize, faint: Style) -> Vec<Span<'static>> {
    let width = width.max(1);
    let shown = match cells(text) > width {
        true => format!("{}…", take_cells(text, width - 1).0),
        false => text.to_owned(),
    };
    let shown = shown.as_str();
    let Some(caret) = cursor else {
        return vec![Span::styled(shown.to_owned(), faint)];
    };
    let (first, rest) = first_grapheme(shown);
    let first = if first.is_empty() { " " } else { first };
    vec![Span::styled(first.to_owned(), caret), Span::styled(rest.to_owned(), faint)]
}

/// What a field shows and the state it is in. [`Input`], [`PasswordInput`]
/// and [`Textarea`](crate::Textarea) share it.
#[derive(Clone, Copy, Debug)]
pub(crate) struct Common<'a> {
    pub theme: &'a Theme,
    pub value: &'a str,
    pub placeholder: &'a str,
    pub cursor: Option<usize>,
    pub size: Size,
    pub flags: Flags,
}

impl<'a> Common<'a> {
    pub(crate) fn new(theme: &'a Theme, value: &'a str) -> Self {
        Self { theme, value, placeholder: "", cursor: None, size: Size::Md, flags: Flags::default() }
    }

    /// The cursor as a count of graphemes, at the end unless set.
    pub(crate) fn caret(&self) -> usize {
        let n = self.value.graphemes(true).count();
        self.cursor.unwrap_or(n).min(n)
    }

    /// The colors under the first cell of `area`, read before drawing.
    pub(crate) fn behind(&self, buf: &Buffer, area: Rect) -> Rgb {
        under(self.theme, buf, area.x, area.y.saturating_add(u16::from(self.size != Size::Sm)))
    }
}

/// The builder methods every field widget has.
macro_rules! field_builders {
    () => {
        /// Shown in `subtle-foreground` while the value is empty.
        #[must_use]
        pub fn placeholder(mut self, placeholder: &'a str) -> Self {
            self.common.placeholder = placeholder;
            self
        }

        /// The cursor, as a count of graphemes. At the end of the value
        /// unless set. It shows while the field has focus.
        #[must_use]
        pub fn cursor(mut self, cursor: usize) -> Self {
            self.common.cursor = Some(cursor);
            self
        }

        /// `Md` has half a row of fill above and below, as a `Md`
        /// [`Button`](crate::Button), so the two line up on one row. `Sm`
        /// is one row.
        #[must_use]
        pub fn size(mut self, size: crate::Size) -> Self {
            self.common.size = size;
            self
        }

        /// The keys go to the field: a half-cell bar of `focus` on each
        /// side and the cursor. Keep one free cell on each side.
        #[must_use]
        pub fn focused(mut self, focused: bool) -> Self {
            self.common.flags.focused = focused;
            self
        }

        /// The `disabled-surface` fill and `subtle-foreground` text, with
        /// no cursor and no focus.
        #[must_use]
        pub fn disabled(mut self, disabled: bool) -> Self {
            self.common.flags.disabled = disabled;
            self
        }

        /// The fill at half strength and no cursor. It can still take
        /// focus, to select and copy.
        #[must_use]
        pub fn read_only(mut self, read_only: bool) -> Self {
            self.common.flags.read_only = read_only;
            self
        }

        /// The value is wrong: the focus bars turn `danger` and stay on
        /// without focus. Put a [`ValidationMessage`](crate::ValidationMessage)
        /// under the field to say why.
        #[must_use]
        pub fn invalid(mut self, invalid: bool) -> Self {
            self.common.flags.invalid = invalid;
            self
        }

        /// The rows the field takes.
        pub fn height(&self) -> u16 {
            self.text_rows() + if self.common.size != crate::Size::Sm { 2 } else { 0 }
        }

        #[allow(dead_code)]
        pub(crate) fn flags(mut self, flags: crate::input::Flags) -> Self {
            self.common.flags = flags;
            self
        }
    };
}
pub(crate) use field_builders;

/// One line of text the person types: a fill with square corners in the
/// `input` color and one column of padding, the value in `foreground`, or
/// the placeholder in `subtle-foreground` while it is empty.
///
/// It draws from the top left of its area, as wide as the area. A long
/// value slides sideways to keep the cursor in sight, and a cut edge shows
/// `…`. Edit the value with [`Field::key`](crate::Field::key).
#[derive(Clone, Copy, Debug)]
pub struct Input<'a> {
    common: Common<'a>,
}

impl<'a> Input<'a> {
    pub fn new(theme: &'a Theme, value: &'a str) -> Self {
        Self { common: Common::new(theme, value) }
    }

    field_builders!();

    fn text_rows(&self) -> u16 {
        1
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        text_lines(&self.common, width, behind, None)
    }
}

impl Widget for Input<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let lines = self.lines(area.width, self.common.behind(buf, area));
        draw(buf, area, &lines);
    }
}

/// A secret, such as a password: an [`Input`] whose value shows as `•`
/// until it is shown, with the word `show` or `hide` in
/// `muted-foreground` at its end. ctrl+r shows and hides it in a
/// [`Field`](crate::Field).
#[derive(Clone, Copy, Debug)]
pub struct PasswordInput<'a> {
    common: Common<'a>,
    shown: bool,
}

impl<'a> PasswordInput<'a> {
    pub fn new(theme: &'a Theme, value: &'a str) -> Self {
        Self { common: Common::new(theme, value), shown: false }
    }

    field_builders!();

    /// The value shows as typed, and the word at the end is `hide`.
    #[must_use]
    pub fn shown(mut self, shown: bool) -> Self {
        self.shown = shown;
        self
    }

    fn text_rows(&self) -> u16 {
        1
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        text_lines(&self.common, width, behind, Some(self.shown))
    }
}

impl Widget for PasswordInput<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let lines = self.lines(area.width, self.common.behind(buf, area));
        draw(buf, area, &lines);
    }
}

/// The rows of a one-line field. `secret` is whether a secret shows, or
/// None for plain text.
fn text_lines(c: &Common, width: u16, behind: Rgb, secret: Option<bool>) -> Vec<Line<'static>> {
    let paint = Paint::new(c.theme, c.flags, behind);
    let inner = usize::from(width.saturating_sub(2));
    // The word goes when the field is too narrow for it and some text.
    let word = secret.filter(|_| inner >= 8).map(|shown| if shown { "hide" } else { "show" });
    let room = inner - word.map_or(0, |word| cells(word) + 1);
    let caret = paint.cursor.map(|style| (c.caret(), style));
    let mut row = if c.value.is_empty() {
        placeholder(c.placeholder, paint.cursor, room, paint.faint)
    } else {
        let graphemes: Vec<&str> = match secret {
            Some(false) => vec!["•"; c.value.graphemes(true).count()],
            _ => c.value.graphemes(true).collect(),
        };
        one_row(&graphemes, caret, room, paint.text, paint.faint)
    };
    if let Some(word) = word {
        let used: usize = row.iter().map(Span::width).sum();
        row.push(Span::styled(" ".repeat(room.saturating_sub(used) + 1), paint.text));
        row.push(Span::styled(word, paint.muted));
    }
    frame(&paint, c.size, width, vec![row])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn md_has_half_rows_and_focus_goes_outside() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let input = Input::new(&theme, "laya").focused(true);
        assert_eq!(input.height(), 3);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 3));
        input.render(Rect::new(1, 0, 10, 3), &mut buf);
        assert_eq!(row(&buf, 0), "▗▄▄▄▄▄▄▄▄▄▄▖");
        assert_eq!(row(&buf, 1), "▐ laya     ▌");
        assert_eq!(row(&buf, 2), "▝▀▀▀▀▀▀▀▀▀▀▘");
        let r = theme.tokens();
        assert_eq!(buf[(6, 1)].bg, theme.color(r.primary), "the cursor sits after the text");
        assert_eq!(buf[(2, 1)].bg, theme.color(r.input));
    }

    #[test]
    fn a_long_value_keeps_the_cursor_and_marks_the_cut() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        Input::new(&theme, "ghcr.io/kiso/app").focused(true).size(Size::Sm).render(Rect::new(1, 0, 10, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▐ …so/app  ▌");
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        Input::new(&theme, "ghcr.io/kiso/app").size(Size::Sm).render(Rect::new(1, 0, 10, 1), &mut buf);
        assert_eq!(row(&buf, 0), "  ghcr.io…  ");
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        Input::new(&theme, "ghcr.io/kiso/app").focused(true).cursor(8).size(Size::Sm).render(Rect::new(1, 0, 10, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▐ …r.io/k… ▌");
    }

    #[test]
    fn states_set_the_fill_and_the_bars() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let r = theme.tokens();
        let draw = |input: Input| {
            let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
            input.size(Size::Sm).render(Rect::new(1, 0, 10, 1), &mut buf);
            buf
        };
        let off = draw(Input::new(&theme, "").placeholder("My app").disabled(true).focused(true));
        assert_eq!(off[(2, 0)].bg, theme.color(r.disabled_surface));
        assert_eq!(off[(0, 0)].symbol(), " ", "no focus bar when disabled");
        let bad = draw(Input::new(&theme, "x").invalid(true));
        assert_eq!((bad[(0, 0)].symbol(), bad[(0, 0)].fg), ("▐", theme.color(r.danger)));
        let read = draw(Input::new(&theme, "x").read_only(true).focused(true));
        assert_ne!(read[(2, 0)].bg, theme.color(r.input));
        assert!(read.content.iter().all(|cell| cell.bg != theme.color(r.primary)), "no cursor");
    }

    #[test]
    fn a_password_masks_and_has_a_word() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 14, 1));
        PasswordInput::new(&theme, "hunter2").size(Size::Sm).render(Rect::new(1, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "  ••••… show  ");
        let mut buf = Buffer::empty(Rect::new(0, 0, 14, 1));
        PasswordInput::new(&theme, "hunter2").shown(true).size(Size::Sm).render(Rect::new(1, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "  hunt… hide  ");
    }

    #[test]
    fn a_field_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 2));
        Input::new(&theme, "中文字").focused(true).invalid(true).render(Rect::new(0, 1, 30, 3), &mut buf);
        PasswordInput::new(&theme, "x").render(Rect::new(3, 0, 1, 1), &mut buf);
        for width in 0..12 {
            let lines = Input::new(&theme, "中文字abc").focused(true).cursor(1).lines(width, [0; 3]);
            assert!(lines.iter().all(|line| line.width() == usize::from(width.max(2)) + 2), "{width}");
        }
    }
}
