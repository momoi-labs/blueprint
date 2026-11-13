use std::ops::Range;

#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};

use unicode_segmentation::UnicodeSegmentation;

use crate::form_field::control_lines;
use crate::input::{one_row, placeholder, Flags};
use crate::select::matches;
use crate::text::{cells, cut};
use crate::{
    Button, ButtonState, ButtonVariant, Checkbox, FormActions, Grid, HelperText, Label, OptionList, Page, Size, Theme,
    ValidationMessage,
};

/// What a form field holds.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Control {
    /// Text, and the cursor as a count of graphemes, what a person sees as
    /// one character. A secret shows dots until it is shown.
    Text { value: String, cursor: usize, secret: bool, shown: bool },
    /// A [`Checkbox`]: a choice the form submits. space toggles it.
    Check(bool),
    /// A [`Switch`](crate::Switch): a setting that applies at once. space
    /// toggles it.
    Switch(bool),
    /// One of a few options, changed with ←/→, and the chosen one. enter
    /// opens the list of a [`Select`](crate::Select).
    Select(Vec<String>, usize),
    /// One of a few options that all show, as a [`RadioGroup`](crate::RadioGroup)
    /// in a row, and the chosen one. ←/→ change it.
    Radio(Vec<String>, usize),
    /// A [`Combobox`](crate::Combobox): the options, the chosen one, and the
    /// typed filter with its cursor. Typing opens the list.
    Combo { options: Vec<String>, chosen: Option<usize>, query: String, cursor: usize },
    /// A [`ChipInput`](crate::ChipInput): the chips, the text being typed
    /// and its cursor, and the chip the keys act on.
    Chips { chips: Vec<String>, text: String, cursor: usize, chip: Option<usize> },
    /// Several lines of text, drawn as a [`Textarea`](crate::Textarea).
    /// enter starts a line and ↑↓ move between lines.
    Area { value: String, cursor: usize },
}

/// One field of a form: the label in a column on the left, the value on
/// the same row, as a list.
#[derive(Clone, Debug)]
pub struct Field {
    pub label: String,
    pub input: Control,
    /// Shown in `subtle` while the field is empty.
    pub placeholder: String,
    /// A line under the field while it has focus.
    pub hint: String,
    /// A line in `danger` under the field, until its value changes.
    pub error: Option<String>,
    /// Left out of the form, as a field that applies only after a choice.
    pub hidden: bool,
    /// The selected row while the list of a select or a combobox is open.
    /// For a combobox, it counts the options that match the typed text.
    pub list: Option<usize>,
}

impl Field {
    fn new(label: impl Into<String>, input: Control, placeholder: impl Into<String>) -> Self {
        Self { label: label.into(), input, placeholder: placeholder.into(), hint: String::new(), error: None, hidden: false, list: None }
    }

    pub fn text(label: impl Into<String>, placeholder: impl Into<String>) -> Self {
        Self::new(label, Control::Text { value: String::new(), cursor: 0, secret: false, shown: false }, placeholder)
    }

    /// A field of several lines of text.
    pub fn area(label: impl Into<String>, placeholder: impl Into<String>) -> Self {
        Self::new(label, Control::Area { value: String::new(), cursor: 0 }, placeholder)
    }

    /// A [`Checkbox`], off. Same as [`Field::checkbox`].
    pub fn check(label: impl Into<String>) -> Self {
        Self::checkbox(label)
    }

    /// A [`Checkbox`], off, with its label after the box.
    pub fn checkbox(label: impl Into<String>) -> Self {
        Self::new(label, Control::Check(false), "")
    }

    /// A [`Switch`](crate::Switch), off, with `On` or `Off` after it.
    pub fn switch(label: impl Into<String>) -> Self {
        Self::new(label, Control::Switch(false), "")
    }

    /// A radio group over `options`, in a row, on the first one.
    pub fn radio(label: impl Into<String>, options: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self::new(label, Control::Radio(options.into_iter().map(Into::into).collect(), 0), "")
    }

    /// A combobox over `options`, with none chosen.
    pub fn combobox(
        label: impl Into<String>,
        options: impl IntoIterator<Item = impl Into<String>>,
        placeholder: impl Into<String>,
    ) -> Self {
        let options = options.into_iter().map(Into::into).collect();
        Self::new(label, Control::Combo { options, chosen: None, query: String::new(), cursor: 0 }, placeholder)
    }

    /// A chip input with no chips.
    pub fn chips(label: impl Into<String>, placeholder: impl Into<String>) -> Self {
        let input = Control::Chips { chips: Vec::new(), text: String::new(), cursor: 0, chip: None };
        Self::new(label, input, placeholder)
    }

    /// Starts a checkbox or a switch on.
    #[must_use]
    pub fn on(mut self, on: bool) -> Self {
        if let Control::Check(value) | Control::Switch(value) = &mut self.input {
            *value = on;
        }
        self
    }

    /// Starts a select or a radio group on option `index`, or a combobox
    /// with it chosen.
    #[must_use]
    pub fn choose(mut self, index: usize) -> Self {
        match &mut self.input {
            Control::Select(options, chosen) | Control::Radio(options, chosen) => *chosen = index.min(options.len().saturating_sub(1)),
            Control::Combo { options, chosen, .. } => *chosen = (index < options.len()).then_some(index),
            _ => {}
        }
        self
    }

    /// Starts a chip input with `chips`.
    #[must_use]
    pub fn with_chips(mut self, list: impl IntoIterator<Item = impl Into<String>>) -> Self {
        if let Control::Chips { chips, .. } = &mut self.input {
            *chips = list.into_iter().map(Into::into).collect();
        }
        self
    }

    /// A select over `options`, on the first one.
    pub fn select(label: impl Into<String>, options: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self::new(label, Control::Select(options.into_iter().map(Into::into).collect(), 0), "")
    }

    #[must_use]
    pub fn hint(mut self, hint: impl Into<String>) -> Self {
        self.hint = hint.into();
        self
    }

    #[must_use]
    pub fn secret(mut self) -> Self {
        if let Control::Text { secret, .. } = &mut self.input {
            *secret = true;
        }
        self
    }

    #[must_use]
    pub fn hidden(mut self) -> Self {
        self.hidden = true;
        self
    }

    /// Starts a text field or an area with `text`, the cursor at its end.
    #[must_use]
    pub fn filled(mut self, text: &str) -> Self {
        if let Control::Text { value, cursor, .. } | Control::Area { value, cursor } = &mut self.input {
            *value = text.to_owned();
            *cursor = text.graphemes(true).count();
        }
        self
    }

    /// The text of a text field or an area, or "".
    pub fn value(&self) -> &str {
        match &self.input {
            Control::Text { value, .. } | Control::Area { value, .. } => value,
            _ => "",
        }
    }

    /// True for a checkbox or a switch that is on.
    pub fn checked(&self) -> bool {
        matches!(self.input, Control::Check(true) | Control::Switch(true))
    }

    /// The index of the chosen option of a select, a radio group or a
    /// combobox, or 0.
    pub fn chosen(&self) -> usize {
        match self.input {
            Control::Select(_, chosen) | Control::Radio(_, chosen) => chosen,
            Control::Combo { chosen, .. } => chosen.unwrap_or(0),
            _ => 0,
        }
    }

    /// The text of the chosen option of a select, a radio group or a
    /// combobox, if there is one.
    pub fn option(&self) -> Option<&str> {
        match &self.input {
            Control::Select(options, chosen) | Control::Radio(options, chosen) => options.get(*chosen).map(String::as_str),
            Control::Combo { options, chosen, .. } => chosen.and_then(|i| options.get(i)).map(String::as_str),
            _ => None,
        }
    }

    /// The chips of a chip input, or none.
    pub fn chip_list(&self) -> &[String] {
        match &self.input {
            Control::Chips { chips, .. } => chips,
            _ => &[],
        }
    }

    /// Closes the list of a select or a combobox, and drops the typed
    /// filter of a combobox.
    pub fn close(&mut self) {
        self.list = None;
        if let Control::Combo { query, cursor, .. } = &mut self.input {
            query.clear();
            *cursor = 0;
        }
    }

    /// The list a select or a combobox shows while open: the options, and
    /// the chosen one among them.
    fn shown(&self) -> (Vec<String>, Option<usize>) {
        match &self.input {
            Control::Select(options, chosen) => (options.clone(), Some(*chosen)),
            Control::Combo { options, chosen, query, .. } => {
                let shown = matches(options, query);
                let at = chosen.and_then(|c| shown.iter().position(|i| *i == c));
                (shown.into_iter().map(|i| options[i].clone()).collect(), at)
            }
            _ => (Vec::new(), None),
        }
    }

    /// Shows or hides the value of a secret.
    pub fn show(&mut self, on: bool) {
        if let Control::Text { shown, .. } = &mut self.input {
            *shown = on;
        }
    }

    /// Edits the field with a key: typing, ←→, home, end and ctrl+u on
    /// text, ctrl+r to show a secret, space on a checkbox or a switch, ←→
    /// on a select or a radio group, and on an area also enter for a new
    /// line and ↑↓ between lines. enter opens the list of a select or a
    /// combobox, ↑↓ move in it, enter takes an option and esc closes it.
    /// On a chip input, enter or a comma makes a chip, and ← from the
    /// start of the text and backspace choose and remove one. Returns true
    /// when the value changed, which clears the error.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, key: KeyEvent) -> bool {
        self.grab(key).or_else(|| self.edit(key)).unwrap_or(false)
    }

    /// Takes a key a form would use to move or to close, when the field
    /// has a use for it: enter, ↑↓ and esc on an area, an open list, a
    /// select or a combobox to open, and text to make a chip of. None
    /// leaves the key to the form.
    #[cfg(feature = "crossterm")]
    pub(crate) fn grab(&mut self, key: KeyEvent) -> Option<bool> {
        if !matches!(key.code, KeyCode::Enter | KeyCode::Up | KeyCode::Down | KeyCode::Esc) {
            return None;
        }
        let n = self.shown().0.len();
        let changed = match (&mut self.input, self.list) {
            (Control::Area { .. }, _) => return self.edit(key),
            (Control::Select(..) | Control::Combo { .. }, Some(at)) => match key.code {
                KeyCode::Up => {
                    self.list = Some(at.saturating_sub(1));
                    false
                }
                KeyCode::Down => {
                    self.list = Some((at + 1).min(n.saturating_sub(1)));
                    false
                }
                KeyCode::Esc => {
                    self.close();
                    false
                }
                _ => {
                    self.list = None;
                    match &mut self.input {
                        Control::Select(options, chosen) if at < options.len() => std::mem::replace(chosen, at) != at,
                        Control::Combo { options, chosen, query, cursor } => {
                            let hit = matches(options, query).get(at).copied();
                            query.clear();
                            *cursor = 0;
                            hit.is_some_and(|hit| chosen.replace(hit) != Some(hit))
                        }
                        _ => false,
                    }
                }
            },
            (Control::Select(..) | Control::Combo { .. }, None) if key.code == KeyCode::Enter => {
                self.list = Some(self.shown().1.unwrap_or(0));
                false
            }
            (Control::Chips { chips, text, cursor, chip }, _) if key.code == KeyCode::Enter && !text.trim().is_empty() => {
                chips.push(text.trim().to_owned());
                text.clear();
                (*cursor, *chip) = (0, None);
                true
            }
            _ => return None,
        };
        if changed {
            self.error = None;
        }
        Some(changed)
    }

    /// [`Field::key`], or None when the field has no use for the key, as
    /// ↑ on the first line of an area.
    #[cfg(feature = "crossterm")]
    pub(crate) fn edit(&mut self, key: KeyEvent) -> Option<bool> {
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        let changed = match &mut self.input {
            Control::Text { secret: true, shown, .. } if ctrl && key.code == KeyCode::Char('r') => {
                *shown = !*shown;
                Some(false)
            }
            Control::Text { value, cursor, .. } => edit_text(value, cursor, key, false),
            Control::Area { value, cursor } => edit_text(value, cursor, key, true),
            Control::Check(on) | Control::Switch(on) => {
                let hit = key.code == KeyCode::Char(' ');
                *on ^= hit;
                Some(hit)
            }
            Control::Combo { query, cursor, .. } => {
                let before = query.clone();
                let edited = edit_text(query, cursor, key, false);
                if *query != before {
                    self.list = Some(0);
                }
                edited.map(|_| false)
            }
            Control::Chips { chips, text, cursor, chip } => edit_chips(chips, text, cursor, chip, key),
            Control::Select(options, _) | Control::Radio(options, _) if options.is_empty() => Some(false),
            Control::Select(options, chosen) | Control::Radio(options, chosen) => {
                let before = *chosen;
                match key.code {
                    KeyCode::Left | KeyCode::Char('h') => *chosen = (before + options.len() - 1) % options.len(),
                    KeyCode::Right | KeyCode::Char('l' | ' ') => *chosen = (before + 1) % options.len(),
                    _ => {}
                }
                Some(*chosen != before)
            }
        };
        if changed == Some(true) {
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
            Control::Text { value, cursor: at, .. } | Control::Area { value, cursor: at } => {
                if value.is_empty() {
                    return placeholder(&self.placeholder, focused.then_some(cursor), width, t.subtle());
                }
                let graphemes: Vec<&str> = match &self.input {
                    Control::Text { secret: true, shown: false, .. } => vec!["•"; value.graphemes(true).count()],
                    _ => value.graphemes(true).map(|g| if g == "\n" { " " } else { g }).collect(),
                };
                one_row(&graphemes, focused.then_some((*at, cursor)), width, t.text(), t.subtle())
            }
            Control::Check(on) => cut(
                vec![
                    Span::styled("[", t.subtle()),
                    if *on { Span::styled("✓", t.fg(r.primary).add_modifier(Modifier::BOLD)) } else { Span::raw(" ") },
                    Span::styled("]", t.subtle()),
                ],
                width,
            )
            .0,
            Control::Switch(on) => match on {
                true => vec![Span::styled("On", t.text())],
                false => vec![Span::styled("Off", t.muted())],
            },
            Control::Radio(options, chosen) => {
                cut(vec![Span::styled(options.get(*chosen).cloned().unwrap_or_default(), t.text())], width).0
            }
            Control::Combo { query, cursor: at, .. } if !query.is_empty() => {
                let graphemes: Vec<&str> = query.graphemes(true).collect();
                one_row(&graphemes, focused.then_some((*at, cursor)), width, t.text(), t.subtle())
            }
            Control::Combo { .. } => match self.option() {
                Some(option) => cut(vec![Span::styled(option.to_owned(), t.text())], width).0,
                None => placeholder(&self.placeholder, focused.then_some(cursor), width, t.subtle()),
            },
            Control::Chips { chips, text, .. } => {
                let mut all = chips.clone();
                all.extend((!text.is_empty()).then(|| text.clone()));
                match all.is_empty() {
                    true => placeholder(&self.placeholder, focused.then_some(cursor), width, t.subtle()),
                    false => cut(vec![Span::styled(all.join(", "), t.text())], width).0,
                }
            }
            Control::Select(options, chosen) => {
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
    /// value on the field surface at `Sm`, as a row of a list. A checkbox
    /// puts its label after the box. Under the value, the error, or the
    /// hint while the field has focus. The row selection of the list shows
    /// the focus, so the surface draws no focus bars.
    pub fn lines(&self, t: &Theme, width: usize, label: usize, focused: bool) -> Vec<Line<'static>> {
        if let Control::Check(on) = self.input {
            let flags = Flags { focused, invalid: self.error.is_some(), selection: true, ..Flags::default() };
            let checkbox = Checkbox::new(t, &self.label, on).flags(flags).strong(focused);
            let mut first = vec![Span::raw(" ")];
            first.extend(checkbox.line(width.saturating_sub(1) as u16).spans);
            let mut lines = vec![Line::from(first)];
            if let Some(error) = &self.error {
                for line in ValidationMessage::new(t, error).lines(width.saturating_sub(6) as u16) {
                    lines.push(Line::from([vec![Span::raw("     ")], line.spans].concat()));
                }
            }
            return lines;
        }
        // The fill starts after the label and a gap of two, and is two
        // tracks wide at most.
        let indent = label + 4;
        let fill = (usize::from(Grid::TRACK) * 2 + usize::from(Grid::GAP)).min(width.saturating_sub(indent + 1)).max(2);
        let flags = Flags { focused, invalid: self.error.is_some(), selection: true, ..Flags::default() };
        let behind = t.tokens().background;
        let control = control_lines(t, self, fill as u16, Size::Sm, flags, behind, None);
        let style = if focused { t.strong() } else { t.text() };
        let mut lines = Vec::new();
        for (i, line) in control.into_iter().enumerate() {
            let mut spans = vec![Span::raw("  ")];
            if i == 0 {
                spans.extend(Label::new(t, &self.label).spans(label, style));
                let used: usize = spans.iter().map(Span::width).sum();
                spans.push(Span::raw(" ".repeat((label + 3).saturating_sub(used))));
            } else {
                spans.push(Span::raw(" ".repeat(label + 1)));
            }
            spans.extend(line.spans);
            lines.push(Line::from(spans));
        }
        let under = match &self.error {
            Some(error) => ValidationMessage::new(t, error).lines(fill as u16),
            None if focused && !self.hint.is_empty() => HelperText::new(t, &self.hint).lines(fill as u16),
            None => Vec::new(),
        };
        for line in under {
            lines.push(Line::from([vec![Span::raw(" ".repeat(indent))], line.spans].concat()));
        }
        lines
    }
}

/// Edits a chip input with a key, as [`Field::key`]: ←→ and backspace act
/// on the chosen chip, ← or backspace at the start of the text choose the
/// last chip, and a comma makes the text a chip.
#[cfg(feature = "crossterm")]
fn edit_chips(
    chips: &mut Vec<String>,
    text: &mut String,
    cursor: &mut usize,
    chip: &mut Option<usize>,
    key: KeyEvent,
) -> Option<bool> {
    if let Some(at) = *chip {
        match key.code {
            KeyCode::Left => {
                *chip = Some(at.saturating_sub(1));
                return Some(false);
            }
            KeyCode::Right => {
                *chip = (at + 1 < chips.len()).then_some(at + 1);
                return Some(false);
            }
            KeyCode::Backspace | KeyCode::Delete => {
                let removed = at < chips.len();
                if removed {
                    chips.remove(at);
                }
                *chip = None;
                return Some(removed);
            }
            _ => *chip = None,
        }
    }
    match key.code {
        KeyCode::Left | KeyCode::Backspace if *cursor == 0 && !chips.is_empty() => {
            *chip = Some(chips.len() - 1);
            Some(false)
        }
        KeyCode::Char(',') => {
            let word = text.trim().to_owned();
            if !word.is_empty() {
                chips.push(word);
                text.clear();
                *cursor = 0;
            }
            Some(true)
        }
        _ => edit_text(text, cursor, key, false),
    }
}

/// Edits text with a key, as [`Field::key`]. `multiline` adds enter for a
/// new line and ↑↓ between lines, and home and end go to the ends of the
/// line. Returns None for a key it has no use for.
#[cfg(feature = "crossterm")]
fn edit_text(value: &mut String, cursor: &mut usize, key: KeyEvent, multiline: bool) -> Option<bool> {
    let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
    // Where each grapheme starts, then the end.
    let bounds: Vec<usize> = value.grapheme_indices(true).map(|(i, _)| i).chain([value.len()]).collect();
    let n = bounds.len() - 1;
    // The value is public, so the cursor may be past its end.
    *cursor = (*cursor).min(n);
    let graphemes: Vec<&str> = value.graphemes(true).collect();
    // The start of the line the cursor is on, and its end.
    let line_start = |at: usize| graphemes[..at].iter().rposition(|g| *g == "\n").map_or(0, |i| i + 1);
    let line_end = |at: usize| graphemes[at..].iter().position(|g| *g == "\n").map_or(n, |i| at + i);
    let (start, end) = if multiline { (line_start(*cursor), line_end(*cursor)) } else { (0, n) };
    let insert = |value: &mut String, cursor: &mut usize, c: char| {
        let at = bounds[*cursor] + c.len_utf8();
        value.insert(bounds[*cursor], c);
        // A combining mark joins the grapheme before it.
        *cursor = value[..at].graphemes(true).count();
    };
    Some(match key.code {
        KeyCode::Char('u') if ctrl => {
            let had = !value.is_empty();
            value.clear();
            *cursor = 0;
            had
        }
        KeyCode::Char(c) if !ctrl => {
            insert(value, cursor, c);
            true
        }
        KeyCode::Enter if multiline => {
            insert(value, cursor, '\n');
            true
        }
        KeyCode::Up | KeyCode::Down if multiline => {
            let column = *cursor - start;
            *cursor = if key.code == KeyCode::Up {
                let previous = line_start(start.checked_sub(1)?);
                previous + column.min(start - 1 - previous)
            } else {
                let next = (end < n).then_some(end + 1)?;
                next + column.min(line_end(next) - next)
            };
            false
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
            *cursor = start;
            false
        }
        KeyCode::End => {
            *cursor = end;
            false
        }
        KeyCode::Enter | KeyCode::Up | KeyCode::Down => return None,
        _ => false,
    })
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
        let field = self.fields.get_mut(self.focus).filter(|f| !f.hidden);
        if let Some(changed) = field.and_then(|field| field.grab(key)) {
            self.changed |= changed;
            return Act::None;
        }
        if matches!(key.code, KeyCode::Tab | KeyCode::BackTab) {
            if let Some(field) = self.fields.get_mut(self.focus) {
                field.close();
            }
        }
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
        let mut first = true;
        for (i, field) in self.fields.iter().enumerate().take(range.end).skip(range.start) {
            if !field.hidden {
                if !std::mem::take(&mut first) {
                    page.blank();
                }
                if i == self.focus {
                    focused = Some(page.items());
                }
                page.item(field.lines(t, width, label, i == self.focus));
            }
        }
        focused
    }

    /// The width of the label column for [`Form::rows`]: the longest
    /// label, at most one grid track. A checkbox's label goes after the
    /// box, so it does not count.
    pub fn label_width(&self) -> usize {
        let labels = self.fields.iter().filter(|f| !matches!(f.input, Control::Check(_)));
        labels.map(|f| cells(&f.label)).max().unwrap_or(0).min(usize::from(Grid::TRACK))
    }

    /// The focused field as an item of a page whose only items are all the
    /// fields, from `rows` over the whole form, or None while a button has
    /// focus.
    pub fn item(&self) -> Option<usize> {
        self.focused()?;
        Some(self.fields[..self.focus].iter().filter(|f| !f.hidden).count())
    }

    /// The state of button `i`: `Focus` while it has focus.
    pub fn button_state(&self, i: usize) -> ButtonState {
        if self.button() == Some(i) { ButtonState::Focus } else { ButtonState::Rest }
    }

    /// The buttons as [`FormActions`], in order, the last one the primary
    /// action, or `Destructive` on `danger`.
    pub fn actions<'a>(&self, t: &'a Theme, labels: &[&'a str], danger: bool) -> FormActions<'a> {
        let last = labels.len().saturating_sub(1);
        let buttons = labels.iter().enumerate().map(|(i, label)| {
            let variant = match (i == last, danger) {
                (false, _) => ButtonVariant::Default,
                (true, false) => ButtonVariant::Primary,
                (true, true) => ButtonVariant::Destructive,
            };
            Button::new(t, label).variant(variant).state(self.button_state(i))
        });
        FormActions::new(t, buttons.collect::<Vec<_>>())
    }

    /// The open list of the focused select or combobox, if there is one,
    /// to render over the page with the whole screen as its area. `row` is
    /// the first row of the field on screen, as wide as the form, and
    /// `label` the label column of [`Form::rows`].
    pub fn list<'a>(&self, t: &'a Theme, row: Rect, label: usize) -> Option<OptionList<'a>> {
        let field = self.focused()?;
        let selected = field.list?;
        let (options, chosen) = field.shown();
        let indent = label + 4;
        let fill = (usize::from(Grid::TRACK) * 2 + usize::from(Grid::GAP)).min(usize::from(row.width).saturating_sub(indent + 1)).max(2);
        let anchor = Rect::new(row.x.saturating_add(indent as u16), row.y, fill as u16, 1);
        let list = OptionList::new(t, options, anchor).selected(selected).chosen(chosen);
        Some(if matches!(field.input, Control::Combo { .. }) { list.empty("No matches") } else { list })
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
        assert_eq!(field.lines(&theme, 40, 10, true)[0].to_string().trim_end(), "  Choice       No options");
    }

    #[test]
    fn wide_characters_keep_the_cursor_in_view() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let field = Field::text("Name", "").filled("中文字");
        let spans = field.spans(&theme, 4, true);
        let width: usize = spans.iter().map(Span::width).sum();
        assert!(width <= 4, "{spans:?}");
        assert_eq!(spans[2].content, " ", "the cursor sits after the text");
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
        if let Control::Text { value, .. } = &mut field.input {
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
    fn an_area_takes_enter_and_moves_between_lines() {
        let mut form = Form::new(vec![Field::text("Name", ""), Field::area("Notes", ""), Field::text("Tag", "")], 0);
        form.focus = 1;
        for c in "ab".chars() {
            form.key(key(KeyCode::Char(c)));
        }
        assert_eq!(form.key(key(KeyCode::Enter)), Act::None);
        form.key(key(KeyCode::Char('c')));
        assert_eq!(form.fields[1].value(), "ab\nc");
        // ↑ goes to the same column of the line above, then on to the field
        // above from the first line.
        form.key(key(KeyCode::Up));
        form.key(key(KeyCode::Char('!')));
        assert_eq!(form.fields[1].value(), "a!b\nc");
        form.key(key(KeyCode::End));
        form.key(key(KeyCode::Down));
        assert!(matches!(form.fields[1].input, Control::Area { cursor: 5, .. }) && form.focus == 1);
        form.key(key(KeyCode::Down));
        assert_eq!(form.focus, 2);
        form.key(key(KeyCode::Up));
        form.key(key(KeyCode::Up));
        form.key(key(KeyCode::Up));
        assert_eq!(form.focus, 0);
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

    #[test]
    fn enter_opens_the_list_of_a_select_and_takes_an_option() {
        let mut form = Form::new(vec![Field::select("Size", ["S", "M", "L"]), Field::text("Note", "")], 1);
        assert_eq!(form.key(key(KeyCode::Enter)), Act::None);
        assert_eq!((form.fields[0].list, form.focus), (Some(0), 0), "enter opens, focus stays");
        form.key(key(KeyCode::Down));
        form.key(key(KeyCode::Down));
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert!(form.list(&theme, Rect::new(0, 0, 60, 1), 4).is_some());
        form.key(key(KeyCode::Enter));
        assert_eq!((form.fields[0].option(), form.fields[0].list, form.changed), (Some("L"), None, true));
        form.key(key(KeyCode::Enter));
        form.key(key(KeyCode::Esc));
        assert_eq!((form.fields[0].list, form.focus), (None, 0), "esc closes the list first");
        form.key(key(KeyCode::Right));
        assert_eq!(form.fields[0].option(), Some("S"), "←→ still cycle");
    }

    #[test]
    fn a_combobox_filters_as_you_type() {
        let mut field = Field::combobox("Region", ["eu-west", "us-east", "eu-north"], "");
        for c in "nor".chars() {
            field.key(key(KeyCode::Char(c)));
        }
        assert_eq!(field.list, Some(0));
        assert!(field.key(key(KeyCode::Enter)));
        assert_eq!((field.option(), field.value()), (Some("eu-north"), ""));
        let mut form = Form::new(vec![field], 1);
        form.key(key(KeyCode::Char('x')));
        assert_eq!(form.key(key(KeyCode::Tab)), Act::None);
        assert_eq!((form.fields[0].list, form.focus), (None, 1), "tab closes the list");
    }

    #[test]
    fn chips_come_from_enter_or_a_comma_and_go_with_backspace() {
        let mut field = Field::chips("Hosts", "");
        for c in "web,db".chars() {
            field.key(key(KeyCode::Char(c)));
        }
        assert!(field.key(key(KeyCode::Enter)));
        assert_eq!(field.chip_list(), ["web", "db"]);
        assert!(!field.key(key(KeyCode::Left)), "← at the start chooses the last chip");
        assert!(matches!(field.input, Control::Chips { chip: Some(1), .. }));
        field.key(key(KeyCode::Left));
        assert!(field.key(key(KeyCode::Backspace)));
        assert_eq!(field.chip_list(), ["db"]);
        let mut form = Form::new(vec![Field::chips("Hosts", ""), Field::text("Note", "")], 1);
        form.key(key(KeyCode::Enter));
        assert_eq!(form.focus, 1, "enter with no text goes on");
    }

    #[test]
    fn space_toggles_a_switch_and_arrows_move_a_radio() {
        let mut form = Form::new(vec![Field::switch("Backups"), Field::radio("Size", ["S", "M"])], 0);
        form.key(key(KeyCode::Char(' ')));
        assert!(form.fields[0].checked());
        form.key(key(KeyCode::Down));
        form.key(key(KeyCode::Right));
        assert_eq!((form.focus, form.fields[1].option()), (1, Some("M")));
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for width in [0, 8, 40] {
            for field in &form.fields {
                assert!(!field.lines(&theme, width, 6, true).is_empty());
            }
        }
    }
}
