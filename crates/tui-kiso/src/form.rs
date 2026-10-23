use std::ops::Range;

#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};

use unicode_segmentation::UnicodeSegmentation;

use crate::text::{cells, cut, first_grapheme, take_cells};
use crate::{wrap, Page, Press, Theme};

/// What a form field holds.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Input {
    /// Text, and the cursor as a count of graphemes, what a person sees as
    /// one character. A secret shows dots until it is shown.
    Text { value: String, cursor: usize, secret: bool, shown: bool },
    Check(bool),
    /// One of a few options, changed with ←/→, and the chosen one.
    Select(Vec<String>, usize),
}

/// One field of a form: the label in a column on the left, the value on
/// the same row, as a list.
#[derive(Clone, Debug)]
pub struct Field {
    pub label: String,
    pub input: Input,
    /// Shown in `subtle` while the field is empty.
    pub placeholder: String,
    /// A line under the field while it has focus.
    pub hint: String,
    /// A line in `danger` under the field, until its value changes.
    pub error: Option<String>,
    /// Left out of the form, as a field that applies only after a choice.
    pub hidden: bool,
}

impl Field {
    fn new(label: impl Into<String>, input: Input, placeholder: impl Into<String>) -> Self {
        Self { label: label.into(), input, placeholder: placeholder.into(), hint: String::new(), error: None, hidden: false }
    }

    pub fn text(label: impl Into<String>, placeholder: impl Into<String>) -> Self {
        Self::new(label, Input::Text { value: String::new(), cursor: 0, secret: false, shown: false }, placeholder)
    }

    pub fn check(label: impl Into<String>) -> Self {
        Self::new(label, Input::Check(false), "")
    }

    /// A select over `options`, on the first one.
    pub fn select(label: impl Into<String>, options: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self::new(label, Input::Select(options.into_iter().map(Into::into).collect(), 0), "")
    }

    #[must_use]
    pub fn hint(mut self, hint: impl Into<String>) -> Self {
        self.hint = hint.into();
        self
    }

    #[must_use]
    pub fn secret(mut self) -> Self {
        if let Input::Text { secret, .. } = &mut self.input {
            *secret = true;
        }
        self
    }

    #[must_use]
    pub fn hidden(mut self) -> Self {
        self.hidden = true;
        self
    }

    /// Starts a text field with `text`, the cursor at its end.
    #[must_use]
    pub fn filled(mut self, text: &str) -> Self {
        if let Input::Text { value, cursor, .. } = &mut self.input {
            *value = text.to_owned();
            *cursor = text.graphemes(true).count();
        }
        self
    }

    /// The text of a text field, or "".
    pub fn value(&self) -> &str {
        match &self.input {
            Input::Text { value, .. } => value,
            _ => "",
        }
    }

    pub fn checked(&self) -> bool {
        self.input == Input::Check(true)
    }

    /// The index of the chosen option of a select, or 0.
    pub fn chosen(&self) -> usize {
        match self.input {
            Input::Select(_, chosen) => chosen,
            _ => 0,
        }
    }

    /// The text of the chosen option of a select, if there is one.
    pub fn option(&self) -> Option<&str> {
        match &self.input {
            Input::Select(options, chosen) => options.get(*chosen).map(String::as_str),
            _ => None,
        }
    }

    /// Shows or hides the value of a secret.
    pub fn show(&mut self, on: bool) {
        if let Input::Text { shown, .. } = &mut self.input {
            *shown = on;
        }
    }

    /// Edits the field with a key: typing, ←→, home, end and ctrl+u on
    /// text, ctrl+r to show a secret, space on a checkbox, ←→ on a select.
    /// Returns true when the value changed, which clears the error.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, key: KeyEvent) -> bool {
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        let changed = match &mut self.input {
            Input::Text { value, cursor, secret, shown } => {
                // Where each grapheme starts, then the end.
                let bounds: Vec<usize> = value.grapheme_indices(true).map(|(i, _)| i).chain([value.len()]).collect();
                let n = bounds.len() - 1;
                // The value is public, so the cursor may be past its end.
                *cursor = (*cursor).min(n);
                match key.code {
                    KeyCode::Char('u') if ctrl => {
                        let had = !value.is_empty();
                        value.clear();
                        *cursor = 0;
                        had
                    }
                    KeyCode::Char('r') if ctrl && *secret => {
                        *shown = !*shown;
                        false
                    }
                    KeyCode::Char(c) if !ctrl => {
                        let at = bounds[*cursor] + c.len_utf8();
                        value.insert(bounds[*cursor], c);
                        // A combining mark joins the grapheme before it.
                        *cursor = value[..at].graphemes(true).count();
                        true
                    }
                    KeyCode::Backspace if *cursor > 0 => {
                        value.replace_range(bounds[*cursor - 1]..bounds[*cursor], "");
                        *cursor -= 1;
                        true
                    }
                    KeyCode::Delete if *cursor < n => {
                        value.replace_range(bounds[*cursor]..bounds[*cursor + 1], "");
                        true
                    }
                    KeyCode::Left => {
                        *cursor = cursor.saturating_sub(1);
                        false
                    }
                    KeyCode::Right => {
                        *cursor = (*cursor + 1).min(n);
                        false
                    }
                    KeyCode::Home => {
                        *cursor = 0;
                        false
                    }
                    KeyCode::End => {
                        *cursor = n;
                        false
                    }
                    _ => false,
                }
            }
            Input::Check(on) => {
                let hit = key.code == KeyCode::Char(' ');
                *on ^= hit;
                hit
            }
            Input::Select(options, _) if options.is_empty() => false,
            Input::Select(options, chosen) => {
                let before = *chosen;
                match key.code {
                    KeyCode::Left | KeyCode::Char('h') => *chosen = (before + options.len() - 1) % options.len(),
                    KeyCode::Right | KeyCode::Char('l' | ' ') => *chosen = (before + 1) % options.len(),
                    _ => {}
                }
                *chosen != before
            }
        };
        if changed {
            self.error = None;
        }
        changed
    }

    /// The value at most `width` cells wide, with a block cursor while
    /// focused. A long value keeps the cursor in view.
    pub fn spans(&self, t: &Theme, width: usize, focused: bool) -> Vec<Span<'static>> {
        let r = t.tokens();
        let cursor = t.fill(r.primary_foreground, r.primary);
        let width = width.max(1);
        match &self.input {
            Input::Text { value, cursor: at, secret, shown } => {
                if value.is_empty() {
                    let (placeholder, _) = take_cells(&self.placeholder, width);
                    if !focused {
                        return vec![Span::styled(placeholder.to_owned(), t.subtle())];
                    }
                    let (first, rest) = first_grapheme(placeholder);
                    let first = if first.is_empty() { " " } else { first };
                    return vec![Span::styled(first.to_owned(), cursor), Span::styled(rest.to_owned(), t.subtle())];
                }
                let graphemes: Vec<&str> =
                    if *secret && !*shown { vec!["•"; value.graphemes(true).count()] } else { value.graphemes(true).collect() };
                let cell = |g: &&str| cells(g);
                if !focused {
                    let text = graphemes.concat();
                    if cells(&text) <= width {
                        return vec![Span::styled(text, t.text())];
                    }
                    let (head, _) = take_cells(&text, width - 1);
                    return vec![Span::styled(format!("{head}…"), t.text())];
                }
                // The cell under the cursor, as much before it as fits, then
                // as much after it. A grapheme wider than the room shows as
                // a one-cell cursor.
                let at = (*at).min(graphemes.len());
                let under = graphemes.get(at).copied().filter(|g| cells(g) <= width).unwrap_or(" ");
                let mut used = cells(under).max(1);
                let mut start = at;
                while start > 0 && used + cell(&graphemes[start - 1]) <= width {
                    start -= 1;
                    used += cell(&graphemes[start]);
                }
                let after = (at + 1).min(graphemes.len());
                let mut end = after;
                while end < graphemes.len() && used + cell(&graphemes[end]) <= width {
                    used += cell(&graphemes[end]);
                    end += 1;
                }
                vec![
                    Span::styled(graphemes[start..at].concat(), t.text()),
                    Span::styled(under.to_owned(), cursor),
                    Span::styled(graphemes[after..end].concat(), t.text()),
                ]
            }
            Input::Check(on) => cut(
                vec![
                    Span::styled("[", t.subtle()),
                    if *on { Span::styled("✓", t.fg(r.primary).add_modifier(Modifier::BOLD)) } else { Span::raw(" ") },
                    Span::styled("]", t.subtle()),
                ],
                width,
            )
            .0,
            Input::Select(options, chosen) => {
                let arrow = if focused { t.fg(r.primary) } else { t.subtle() };
                let Some(option) = options.get(*chosen) else {
                    return cut(vec![Span::styled("No options", t.subtle())], width).0;
                };
                let mut spans =
                    vec![Span::styled("‹ ", arrow), Span::styled(option.clone(), t.text()), Span::styled(" ›", arrow)];
                // The count goes first when the row is narrow, then the
                // option is cut.
                let count = format!("  {} of {}", chosen + 1, options.len());
                if spans.iter().map(Span::width).sum::<usize>() + cells(&count) <= width {
                    spans.push(Span::styled(count, t.subtle()));
                }
                cut(spans, width).0
            }
        }
    }

    /// The field as rows: the label in a column `label` wide, then the
    /// value, as a row of a list. A checkbox puts its label after the box.
    /// Under them, the error, or the hint while the field has focus.
    pub fn lines(&self, t: &Theme, width: usize, label: usize, focused: bool) -> Vec<Line<'static>> {
        let mut first = vec![Span::raw("  ")];
        let indent = if let Input::Check(_) = self.input {
            first.extend(self.spans(t, 3, focused));
            first.push(Span::styled(format!(" {}", self.label), if focused { t.strong() } else { t.text() }));
            6
        } else {
            let name = match (&self.error, focused) {
                (Some(_), _) => t.danger(),
                (None, true) => t.strong(),
                (None, false) => t.muted(),
            };
            let (text, used) = take_cells(&self.label, label);
            first.push(Span::styled(format!("{text}{}", " ".repeat(label - used)), name));
            first.extend(self.spans(t, width.saturating_sub(label + 3), focused));
            label + 2
        };
        let mut lines = vec![Line::from(first)];
        let under = match &self.error {
            Some(error) => Some((format!("× {error}"), t.danger())),
            None if focused && !self.hint.is_empty() => Some((self.hint.clone(), t.subtle())),
            None => None,
        };
        if let Some((text, style)) = under {
            for line in wrap(&text, width.saturating_sub(indent + 1)) {
                lines.push(Line::from(vec![Span::raw(" ".repeat(indent)), Span::styled(line, style)]));
            }
        }
        lines
    }
}

/// What a key on a form asks for.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Act {
    None,
    /// ctrl+s, or enter on the last field.
    Submit,
    Cancel,
    /// Enter on a button.
    Press(usize),
}

/// Fields, then buttons. tab and ↑↓ move between them, typing edits the
/// focused field, enter goes to the next one and submits from the last,
/// ctrl+s submits from anywhere and esc cancels. Draw it with
/// [`Form::rows`] into a [`Page`], in a [`Modal`](crate::Modal) or in place
/// of a page.
#[derive(Clone, Debug, Default)]
pub struct Form {
    pub fields: Vec<Field>,
    /// The focused field, or a button counted after the fields.
    pub focus: usize,
    pub buttons: usize,
    /// True once a value changed, to ask before throwing it away.
    pub changed: bool,
}

impl Form {
    /// A form on its first field that is not hidden, or on its first
    /// button.
    pub fn new(fields: Vec<Field>, buttons: usize) -> Self {
        let mut form = Self { fields, focus: 0, buttons, changed: false };
        form.settle();
        form
    }

    /// The focused button, when a button has focus.
    pub fn button(&self) -> Option<usize> {
        self.focus.checked_sub(self.fields.len()).filter(|b| *b < self.buttons)
    }

    /// Moves focus off a hidden field, or a place that does not exist, to
    /// the next place, or the first.
    fn settle(&mut self) {
        let places = self.places();
        if !places.contains(&self.focus) {
            self.focus = places.iter().copied().find(|&i| i > self.focus).or(places.first().copied()).unwrap_or(0);
        }
    }

    /// The focused field, unless a button has focus or every field is
    /// hidden.
    pub fn focused(&self) -> Option<&Field> {
        self.fields.get(self.focus).filter(|field| !field.hidden)
    }

    /// Where focus can go: the fields that are not hidden, then the
    /// buttons.
    fn places(&self) -> Vec<usize> {
        (0..self.fields.len() + self.buttons).filter(|&i| self.fields.get(i).is_none_or(|f| !f.hidden)).collect()
    }

    /// Moves focus one place. tab wraps around, ↑↓ stop at the ends.
    pub fn step(&mut self, forward: bool, wrap: bool) {
        self.settle();
        let places = self.places();
        let n = places.len();
        let Some(at) = places.iter().position(|&i| i == self.focus) else {
            self.focus = places.first().copied().unwrap_or(0);
            return;
        };
        let next = match (forward, wrap) {
            (true, true) => (at + 1) % n,
            (false, true) => (at + n - 1) % n,
            (true, false) => (at + 1).min(n - 1),
            (false, false) => at.saturating_sub(1),
        };
        self.focus = places[next];
    }

    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, key: KeyEvent) -> Act {
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        self.settle();
        match key.code {
            KeyCode::Char('s') if ctrl => return Act::Submit,
            KeyCode::Esc => return Act::Cancel,
            KeyCode::Tab => self.step(true, true),
            KeyCode::BackTab => self.step(false, true),
            KeyCode::Down => self.step(true, false),
            KeyCode::Up => self.step(false, false),
            KeyCode::Enter => {
                if let Some(button) = self.button() {
                    return Act::Press(button);
                }
                let last = self.places().into_iter().rev().find(|&i| i < self.fields.len());
                if last == Some(self.focus) {
                    return Act::Submit;
                }
                self.step(true, false);
            }
            KeyCode::Left if self.button().is_some_and(|b| b > 0) => self.focus -= 1,
            KeyCode::Right if self.button().is_some_and(|b| b + 1 < self.buttons) => self.focus += 1,
            _ => {
                if let Some(field) = self.fields.get_mut(self.focus).filter(|field| !field.hidden) {
                    self.changed |= field.key(key);
                }
            }
        }
        Act::None
    }

    /// The fields in `range` that are not hidden, as items of `page`, with
    /// the labels in a column `label` wide. Returns the focused field's
    /// item on the page, when it is among them, for
    /// [`PageView::selected`](crate::PageView::selected).
    pub fn rows(&self, page: &mut Page, t: &Theme, width: usize, label: usize, range: Range<usize>) -> Option<usize> {
        let mut focused = None;
        for (i, field) in self.fields.iter().enumerate().take(range.end).skip(range.start) {
            if !field.hidden {
                if i == self.focus {
                    focused = Some(page.items());
                }
                page.item(field.lines(t, width, label, i == self.focus));
            }
        }
        focused
    }

    /// The focused field as an item of a page whose only items are all the
    /// fields, from `rows` over the whole form, or None while a button has
    /// focus.
    pub fn item(&self) -> Option<usize> {
        self.focused()?;
        Some(self.fields[..self.focus].iter().filter(|f| !f.hidden).count())
    }

    /// How button `i` looks: focused, on `danger` for a destructive one,
    /// or plain.
    pub fn press(&self, i: usize, danger: bool) -> Press {
        match self.button() == Some(i) {
            true if danger => Press::Danger,
            true => Press::Focused,
            false => Press::Plain,
        }
    }
}

#[cfg(all(test, feature = "crossterm"))]
mod tests {
    use super::*;

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    fn form() -> Form {
        let fields = vec![Field::check("Also delete"), Field::text("Name", "").hidden(), Field::text("Note", "")];
        Form::new(fields, 2)
    }

    #[test]
    fn focus_skips_hidden_fields_and_wraps() {
        let mut form = form();
        form.key(key(KeyCode::Tab));
        assert_eq!(form.focus, 2);
        form.key(key(KeyCode::Tab));
        form.key(key(KeyCode::Tab));
        assert_eq!(form.button(), Some(1));
        form.key(key(KeyCode::Tab));
        assert_eq!(form.focus, 0);
    }

    #[test]
    fn typing_edits_and_enter_submits_from_the_last_field() {
        let mut form = form();
        form.focus = 2;
        for c in "hi".chars() {
            form.key(key(KeyCode::Char(c)));
        }
        form.key(key(KeyCode::Left));
        form.key(key(KeyCode::Char('!')));
        assert_eq!(form.fields[2].value(), "h!i");
        assert!(form.changed);
        assert_eq!(form.key(key(KeyCode::Enter)), Act::Submit);
    }

    #[test]
    fn focus_starts_on_a_field_that_shows() {
        let mut form = Form::new(vec![Field::text("Name", "").hidden(), Field::text("Note", "")], 0);
        assert_eq!(form.focus, 1);
        form.key(key(KeyCode::Char('a')));
        assert_eq!((form.fields[0].value(), form.fields[1].value()), ("", "a"));
        let mut empty = Form::new(vec![], 0);
        assert_eq!(empty.key(key(KeyCode::Enter)), Act::None);
    }

    #[test]
    fn an_empty_select_neither_panics_nor_changes() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut field = Field::select("Choice", Vec::<String>::new());
        assert!(!field.key(key(KeyCode::Right)));
        assert_eq!(field.lines(&theme, 40, 10, true)[0].to_string().trim_end(), "  Choice    No options");
    }

    #[test]
    fn wide_characters_keep_the_cursor_in_view() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let field = Field::text("Name", "").filled("中文字");
        let spans = field.spans(&theme, 4, true);
        let width: usize = spans.iter().map(Span::width).sum();
        assert!(width <= 4, "{spans:?}");
        assert_eq!(spans[1].content, " ", "the cursor sits after the text");
    }

    #[test]
    fn rows_report_the_focused_item_of_their_range() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut form = Form::new(vec![Field::text("A", ""), Field::text("B", ""), Field::text("C", "")], 0);
        form.focus = 2;
        let mut page = Page::default();
        assert_eq!(form.rows(&mut page, &theme, 40, 4, 1..3), Some(1));
    }

    #[test]
    fn a_stale_cursor_and_hidden_fields_are_safe() {
        let mut field = Field::text("Name", "").filled("hello");
        if let Input::Text { value, .. } = &mut field.input {
            value.clear();
        }
        assert!(!field.key(key(KeyCode::Backspace)));
        let mut form = Form::new(vec![Field::text("X", "").hidden()], 0);
        form.key(key(KeyCode::Char('x')));
        assert_eq!(form.fields[0].value(), "");
        assert!(form.focused().is_none() && form.item().is_none());
    }

    #[test]
    fn keys_that_change_nothing_keep_the_error() {
        let mut field = Field::select("Status", ["All"]);
        field.error = Some("Pick one.".into());
        assert!(!field.key(key(KeyCode::Right)));
        assert!(field.error.is_some());
        let mut empty = Field::text("Name", "");
        assert!(!empty.key(KeyEvent::new(KeyCode::Char('u'), KeyModifiers::CONTROL)));
    }

    #[test]
    fn graphemes_edit_as_one_character() {
        let mut field = Field::text("Name", "").filled("a\u{2764}\u{fe0f}");
        assert!(field.key(key(KeyCode::Backspace)));
        assert_eq!(field.value(), "a");
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let wide = Field::text("Name", "").filled("中");
        let spans = wide.spans(&theme, 1, true);
        assert_eq!(spans.iter().map(Span::width).sum::<usize>(), 1, "{spans:?}");
    }

    #[test]
    fn every_input_fits_its_width() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let fields = [
            Field::select("Region", ["eu-west"]),
            Field::select("Empty", Vec::<String>::new()),
            Field::check("Start on boot"),
            Field::text("Name", "My app").filled("Paperless"),
            Field::text("Name", "My app"),
        ];
        for field in &fields {
            for width in 1..24 {
                for focused in [false, true] {
                    let spans = field.spans(&theme, width, focused);
                    let used: usize = spans.iter().map(Span::width).sum();
                    assert!(used <= width, "{} at {width}: {used} cells", field.label);
                }
            }
        }
    }

    #[test]
    fn a_change_clears_the_error() {
        let mut field = Field::text("Port", "80");
        field.error = Some("Use a port from 1 to 65535.".into());
        assert!(!field.key(key(KeyCode::Left)));
        assert!(field.error.is_some());
        assert!(field.key(key(KeyCode::Char('8'))));
        assert_eq!(field.error, None);
    }
}
