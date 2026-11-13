use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use unicode_segmentation::UnicodeSegmentation;

use crate::input::{draw, frame, one_row, placeholder, Flags, Paint};
use crate::surface::{under, write};
use crate::text::{cells, cut, take_cells};
use crate::overlay::{place, surface};
use crate::{Size, Theme};

/// The most options an [`OptionList`] shows at once.
const ROWS: usize = 8;

/// The builder methods of the choice fields: [`Select`], [`Combobox`] and
/// [`ChipInput`](crate::ChipInput).
macro_rules! choice_builders {
    () => {
        /// Shown in `subtle-foreground` while nothing is chosen or typed.
        #[must_use]
        pub fn placeholder(mut self, placeholder: &'a str) -> Self {
            self.placeholder = placeholder;
            self
        }

        /// `Md` has half a row of fill above and below, `Sm` is one row.
        #[must_use]
        pub fn size(mut self, size: crate::Size) -> Self {
            self.size = size;
            self
        }

        /// A half-cell bar of `focus` on each side. Keep one free cell on
        /// each side.
        #[must_use]
        pub fn focused(mut self, focused: bool) -> Self {
            self.flags.focused = focused;
            self
        }

        #[must_use]
        pub fn disabled(mut self, disabled: bool) -> Self {
            self.flags.disabled = disabled;
            self
        }

        /// The bars turn `danger` and stay on without focus.
        #[must_use]
        pub fn invalid(mut self, invalid: bool) -> Self {
            self.flags.invalid = invalid;
            self
        }

        pub(crate) fn flags(mut self, flags: crate::input::Flags) -> Self {
            self.flags = flags;
            self
        }
    };
}
pub(crate) use choice_builders;

/// The options that hold `query`, in any case, as indexes into `options`.
pub(crate) fn matches(options: &[String], query: &str) -> Vec<usize> {
    let query = query.to_lowercase();
    (0..options.len()).filter(|&i| options[i].to_lowercase().contains(&query)).collect()
}

/// A body row of `inner` cells: `text`, then `▾` against the right end.
fn with_arrow(paint: &Paint, text: Vec<Span<'static>>, inner: usize) -> Vec<Span<'static>> {
    if inner < 3 {
        return vec![Span::styled("▾", paint.muted)];
    }
    let (mut spans, used) = cut(text, inner - 2);
    spans.push(Span::styled(" ".repeat(inner - 1 - used), paint.text));
    spans.push(Span::styled("▾", paint.muted));
    spans
}

/// Draws a field's rows, then its open list under it, or over it when the
/// screen has no room below.
fn draw_open(buf: &mut Buffer, area: Rect, lines: &[Line<'static>], list: Option<OptionList>) {
    draw(buf, area, lines);
    if let Some(list) = list {
        let screen = buf.area;
        list.render(screen, buf);
    }
}

/// One choice from a list: the [`Input`](crate::Input) surface with the
/// chosen option and a `▾` at its right end. Open, an [`OptionList`] shows
/// the options under the field on an elevated surface, or above it when
/// there is no room below.
///
/// It draws from the top left of its area, as wide as the area, and the
/// list anywhere on the buffer. In a [`Form`](crate::Form), a select is
/// the compact `‹ value ›`: ←→ change it and enter opens the list.
#[derive(Clone, Debug)]
pub struct Select<'a> {
    theme: &'a Theme,
    options: Vec<String>,
    chosen: Option<usize>,
    open: Option<usize>,
    placeholder: &'a str,
    size: Size,
    flags: Flags,
}

impl<'a> Select<'a> {
    pub fn new(theme: &'a Theme, options: impl IntoIterator<Item = impl Into<String>>, chosen: Option<usize>) -> Self {
        let options = options.into_iter().map(Into::into).collect();
        Self { theme, options, chosen, open: None, placeholder: "", size: Size::Md, flags: Flags::default() }
    }

    choice_builders!();

    /// The list is open, on this option.
    #[must_use]
    pub fn open(mut self, selected: Option<usize>) -> Self {
        self.open = selected;
        self
    }

    /// The rows the field takes, without the list.
    pub fn height(&self) -> u16 {
        if self.size != Size::Sm { 3 } else { 1 }
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        let paint = Paint::new(self.theme, self.flags, behind);
        let inner = usize::from(width.saturating_sub(2));
        let text = match self.chosen.and_then(|i| self.options.get(i)) {
            Some(option) => vec![Span::styled(option.clone(), paint.text)],
            None => vec![Span::styled(self.placeholder.to_owned(), paint.faint)],
        };
        frame(&paint, self.size, width, vec![with_arrow(&paint, text, inner)])
    }

    fn list(&self, area: Rect) -> Option<OptionList<'a>> {
        let selected = self.open.filter(|_| !self.flags.disabled)?;
        let anchor = Rect { height: self.height(), ..area };
        Some(OptionList::new(self.theme, self.options.clone(), anchor).selected(selected).chosen(self.chosen))
    }
}

impl Widget for Select<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let behind = under(self.theme, buf, area.x, area.y.saturating_add(u16::from(self.size != Size::Sm)));
        let lines = self.lines(area.width, behind);
        draw_open(buf, area, &lines, self.list(area));
    }
}

/// A [`Select`] the person types into: the text filters the options, the
/// list shows the ones that hold it, and enter takes the selected one.
/// While nothing is typed, the field shows the chosen option with the
/// cursor on its first cell. An empty result is one muted row.
#[derive(Clone, Debug)]
pub struct Combobox<'a> {
    theme: &'a Theme,
    options: Vec<String>,
    chosen: Option<usize>,
    query: &'a str,
    cursor: Option<usize>,
    open: Option<usize>,
    empty: &'a str,
    placeholder: &'a str,
    size: Size,
    flags: Flags,
}

impl<'a> Combobox<'a> {
    pub fn new(theme: &'a Theme, options: impl IntoIterator<Item = impl Into<String>>, chosen: Option<usize>) -> Self {
        let options = options.into_iter().map(Into::into).collect();
        let (query, cursor, open, empty) = ("", None, None, "No matches");
        Self { theme, options, chosen, query, cursor, open, empty, placeholder: "", size: Size::Md, flags: Flags::default() }
    }

    choice_builders!();

    /// The typed filter, and the cursor in it as a count of graphemes, at
    /// its end unless set.
    #[must_use]
    pub fn query(mut self, query: &'a str, cursor: Option<usize>) -> Self {
        self.query = query;
        self.cursor = cursor;
        self
    }

    /// The list is open, on this one of [`Combobox::matches`].
    #[must_use]
    pub fn open(mut self, selected: Option<usize>) -> Self {
        self.open = selected;
        self
    }

    /// The row of an empty list. "No matches" by default.
    #[must_use]
    pub fn empty(mut self, text: &'a str) -> Self {
        self.empty = text;
        self
    }

    /// The options that hold the typed text, as indexes of the options.
    pub fn matches(&self) -> Vec<usize> {
        matches(&self.options, self.query)
    }

    /// The rows the field takes, without the list.
    pub fn height(&self) -> u16 {
        if self.size != Size::Sm { 3 } else { 1 }
    }

    pub(crate) fn lines(&self, width: u16, behind: Rgb) -> Vec<Line<'static>> {
        let paint = Paint::new(self.theme, self.flags, behind);
        let inner = usize::from(width.saturating_sub(2));
        let room = inner.saturating_sub(2).max(1);
        let text = if self.query.is_empty() {
            match self.chosen.and_then(|i| self.options.get(i)) {
                Some(option) => placeholder(option, paint.cursor, room, paint.text),
                None => placeholder(self.placeholder, paint.cursor, room, paint.faint),
            }
        } else {
            let graphemes: Vec<&str> = self.query.graphemes(true).collect();
            let at = self.cursor.unwrap_or(graphemes.len()).min(graphemes.len());
            one_row(&graphemes, paint.cursor.map(|style| (at, style)), room, paint.text, paint.faint)
        };
        frame(&paint, self.size, width, vec![with_arrow(&paint, text, inner)])
    }

    fn list(&self, area: Rect) -> Option<OptionList<'a>> {
        let selected = self.open.filter(|_| !self.flags.disabled)?;
        let shown = self.matches();
        let chosen = self.chosen.and_then(|c| shown.iter().position(|i| *i == c));
        let options = shown.into_iter().map(|i| self.options[i].clone()).collect();
        let anchor = Rect { height: self.height(), ..area };
        Some(OptionList::new(self.theme, options, anchor).selected(selected).chosen(chosen).empty(self.empty))
    }
}

impl Widget for Combobox<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let behind = under(self.theme, buf, area.x, area.y.saturating_add(u16::from(self.size != Size::Sm)));
        let lines = self.lines(area.width, behind);
        draw_open(buf, area, &lines, self.list(area));
    }
}

/// The open list of a [`Select`] or a [`Combobox`]: the options on the
/// overlay surface, as wide as the field with its bars, the selected one filled with
/// `primary`, the chosen one marked `✓`. It shows eight options at most
/// and keeps the selected one in view.
///
/// It opens under `anchor`, the field on screen, or above it when there is
/// no room below. Render it with the whole screen as its area, after the
/// page under it.
#[derive(Clone, Debug)]
pub struct OptionList<'a> {
    theme: &'a Theme,
    options: Vec<String>,
    selected: usize,
    chosen: Option<usize>,
    empty: &'a str,
    anchor: Rect,
}

impl<'a> OptionList<'a> {
    pub fn new(theme: &'a Theme, options: Vec<String>, anchor: Rect) -> Self {
        Self { theme, options, selected: 0, chosen: None, empty: "No options", anchor }
    }

    #[must_use]
    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }

    /// The option the field holds, marked `✓`.
    #[must_use]
    pub fn chosen(mut self, index: Option<usize>) -> Self {
        self.chosen = index;
        self
    }

    /// The muted row of a list with no options.
    #[must_use]
    pub fn empty(mut self, text: &'a str) -> Self {
        self.empty = text;
        self
    }

    /// The area the list takes on `screen`: under the anchor, or above it,
    /// or on the side with more room, cut to fit. It takes one more column
    /// on each side than the field, so it covers the field's bars.
    pub fn area(&self, screen: Rect) -> Rect {
        let height = self.options.len().clamp(1, ROWS) as u16 + 2;
        let anchor = Rect { x: self.anchor.x.saturating_sub(1), ..self.anchor };
        let width = self.anchor.width.saturating_add(self.anchor.x - anchor.x).saturating_add(1);
        place(screen, anchor, width, height)
    }
}

impl Widget for OptionList<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let area = self.area(screen.intersection(buf.area));
        if area.height < 3 || area.width < 3 {
            return;
        }
        // The list owns its cells: nothing of the field under it shows.
        surface(t, buf, area);
        let rows = usize::from(area.height - 2);
        let (x, right) = (area.x.saturating_add(2), area.right().saturating_sub(2));
        let inner = usize::from(right.saturating_sub(x));
        if self.options.is_empty() {
            write(buf, x, area.y + 1, take_cells(self.empty, inner).0, t.muted());
            return;
        }
        let selected = self.selected.min(self.options.len() - 1);
        let start = selected.saturating_sub(rows - 1);
        for (row, i) in (start..self.options.len()).take(rows).enumerate() {
            let y = area.y + 1 + row as u16;
            let option = &self.options[i];
            // The mark of the chosen option takes three cells with its gap.
            let room = inner.saturating_sub(if self.chosen == Some(i) { 3 } else { 0 });
            let shown = match cells(option) > room {
                true if room > 0 => format!("{}…", take_cells(option, room - 1).0),
                true => String::new(),
                false => option.clone(),
            };
            write(buf, x, y, &shown, t.text());
            if self.chosen == Some(i) {
                write(buf, right.saturating_sub(1), y, "✓", t.fg(t.tokens().primary));
            }
            if i == selected {
                t.select_fill(buf, Rect::new(area.x, y, area.width, 1));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    const REGIONS: [&str; 3] = ["eu-west", "us-east", "ap-south"];

    #[test]
    fn a_closed_select_shows_the_value_and_an_arrow() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 16, 3));
        Select::new(&theme, REGIONS, Some(1)).focused(true).render(Rect::new(1, 0, 14, 3), &mut buf);
        assert_eq!(row(&buf, 1), "▐ us-east    ▾ ▌");
        let mut buf = Buffer::empty(Rect::new(0, 0, 16, 1));
        Select::new(&theme, REGIONS, None).placeholder("Region").size(Size::Sm).render(Rect::new(1, 0, 14, 1), &mut buf);
        assert_eq!(row(&buf, 0), "  Region     ▾");
    }

    #[test]
    fn the_list_opens_below_or_above() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let screen = Rect::new(0, 0, 40, 12);
        let list = |y| OptionList::new(&theme, REGIONS.map(String::from).to_vec(), Rect::new(2, y, 20, 3));
        assert_eq!(list(1).area(screen), Rect::new(1, 4, 22, 5));
        assert_eq!(list(8).area(screen), Rect::new(1, 3, 22, 5));
        let mut buf = Buffer::empty(screen);
        Select::new(&theme, REGIONS, Some(0)).open(Some(1)).render(Rect::new(2, 1, 20, 3), &mut buf);
        assert_eq!(row(&buf, 5), "   eu-west          ✓");
        assert_eq!(row(&buf, 6), "   us-east");
        assert_eq!(buf[(4, 6)].bg, theme.color(theme.tokens().primary));
    }

    #[test]
    fn a_combobox_filters_and_shows_an_empty_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let combo = Combobox::new(&theme, REGIONS, None).query("EAST", None);
        assert_eq!(combo.matches(), vec![1]);
        let screen = Rect::new(0, 0, 30, 10);
        let mut buf = Buffer::empty(screen);
        Combobox::new(&theme, REGIONS, None).query("zz", None).open(Some(0)).focused(true).render(Rect::new(1, 0, 20, 3), &mut buf);
        assert_eq!(row(&buf, 1), "▐ zz               ▾ ▌");
        assert_eq!(row(&buf, 4), "  No matches");
        assert_eq!(buf[(2, 4)].fg, theme.muted().fg.unwrap());
    }

    #[test]
    fn choice_fields_past_the_buffer_do_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        for size in 0..8 {
            let screen = Rect::new(0, 0, size, size);
            let mut buf = Buffer::empty(screen);
            Select::new(&theme, REGIONS, Some(9)).open(Some(9)).render(Rect::new(size / 2, size / 2, 30, 3), &mut buf);
            let combo = Combobox::new(&theme, REGIONS, Some(2)).query("中文", Some(9)).open(Some(4)).focused(true);
            combo.render(Rect::new(0, size, size, 1), &mut buf);
            OptionList::new(&theme, Vec::new(), Rect::new(0, 0, size, 1)).render(screen, &mut buf);
        }
    }
}
