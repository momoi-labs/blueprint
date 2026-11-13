use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::form_actions::rows_of;
use crate::input::{draw, frame, Flags, Paint};
use crate::surface::{put, under, write};
use crate::text::{cells, take_cells};
use crate::{
    wrap, Checkbox, ChipInput, Combobox, Control, Field, Grid, Input, PasswordInput, RadioGroup, Scroll, Select, Size, Switch,
    SwitchState, Textarea, Theme,
};

/// The name of a field, in `foreground`. A required field adds `*` in
/// `danger`; an optional one adds the word `optional` in
/// `subtle-foreground`. Mark the fewer of the two in a form.
#[derive(Clone, Copy, Debug)]
pub struct Label<'a> {
    theme: &'a Theme,
    text: &'a str,
    required: bool,
    optional: bool,
    disabled: bool,
}

impl<'a> Label<'a> {
    pub fn new(theme: &'a Theme, text: &'a str) -> Self {
        Self { theme, text, required: false, optional: false, disabled: false }
    }

    /// The label of a disabled control: text and mark in
    /// `subtle-foreground`.
    #[must_use]
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    #[must_use]
    pub fn required(mut self, required: bool) -> Self {
        self.required = required;
        self
    }

    #[must_use]
    pub fn optional(mut self, optional: bool) -> Self {
        self.optional = optional;
        self
    }

    /// The columns the label takes, with its mark.
    pub fn width(&self) -> u16 {
        (cells(self.text) + cells(self.mark())) as u16
    }

    fn mark(&self) -> &'static str {
        match (self.required, self.optional) {
            (true, _) => " *",
            (false, true) => " optional",
            (false, false) => "",
        }
    }

    /// The label in `width` cells. The text is cut before the mark is.
    pub(crate) fn spans(&self, width: usize, style: Style) -> Vec<Span<'static>> {
        let t = self.theme;
        let mark = self.mark();
        let room = width.saturating_sub(cells(mark));
        let (text, used) = take_cells(self.text, room);
        let text = if used < cells(self.text) && room > 0 {
            format!("{}…", take_cells(self.text, room - 1).0)
        } else {
            text.to_owned()
        };
        let style = if self.disabled { t.subtle() } else { style };
        let mark_style = if self.required && !self.disabled { t.danger() } else { t.subtle() };
        let mut spans = vec![Span::styled(text, style)];
        if cells(mark) <= width {
            spans.push(Span::styled(mark, mark_style));
        }
        spans
    }
}

impl Widget for Label<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 {
            return;
        }
        let mut x = area.x;
        for span in self.spans(usize::from(area.width), self.theme.text()) {
            x = x.saturating_add(write(buf, x, area.y, &span.content, span.style));
        }
    }
}

/// A line under a control that helps fill it in, in `muted-foreground`,
/// wrapped to the width of the control.
#[derive(Clone, Copy, Debug)]
pub struct HelperText<'a> {
    theme: &'a Theme,
    text: &'a str,
}

impl<'a> HelperText<'a> {
    pub fn new(theme: &'a Theme, text: &'a str) -> Self {
        Self { theme, text }
    }

    /// The text as lines `width` cells wide.
    pub fn lines(&self, width: u16) -> Vec<Line<'static>> {
        wrap(self.text, usize::from(width).max(1)).into_iter().map(|line| Line::from(Span::styled(line, self.theme.muted()))).collect()
    }

    /// The rows the text takes at `width`.
    pub fn height(&self, width: u16) -> u16 {
        self.lines(width).len() as u16
    }
}

impl Widget for HelperText<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        put_lines(buf, area, &self.lines(area.width));
    }
}

/// Why the value of a field is wrong, in `danger` after a `×`, in place of
/// the [`HelperText`] while the field is invalid. Say what to do, as
/// "Use a port from 1 to 65535."
#[derive(Clone, Copy, Debug)]
pub struct ValidationMessage<'a> {
    theme: &'a Theme,
    text: &'a str,
}

impl<'a> ValidationMessage<'a> {
    pub fn new(theme: &'a Theme, text: &'a str) -> Self {
        Self { theme, text }
    }

    /// The message as lines `width` cells wide. Lines after the first
    /// start under the text, not under the mark.
    pub fn lines(&self, width: u16) -> Vec<Line<'static>> {
        let danger = self.theme.danger();
        wrap(self.text, usize::from(width.saturating_sub(2)).max(1))
            .into_iter()
            .enumerate()
            .map(|(i, line)| Line::from(Span::styled(format!("{}{line}", if i == 0 { "× " } else { "  " }), danger)))
            .collect()
    }

    /// The rows the message takes at `width`.
    pub fn height(&self, width: u16) -> u16 {
        self.lines(width).len() as u16
    }
}

impl Widget for ValidationMessage<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        put_lines(buf, area, &self.lines(area.width));
    }
}

/// Lines from the top left of `area`, as many as fit. They keep the fill
/// under them.
fn put_lines(buf: &mut Buffer, area: Rect, lines: &[Line<'static>]) {
    for (dy, line) in lines.iter().enumerate().take(usize::from(area.height)) {
        let y = area.y.saturating_add(dy as u16);
        let mut x = area.x;
        for span in &line.spans {
            let room = usize::from(area.right().saturating_sub(x));
            let (text, _) = take_cells(&span.content, room);
            x = x.saturating_add(write(buf, x, y, text, span.style));
        }
    }
}

/// Where a [`FormField`] puts its label.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum FieldLayout {
    /// In a column on the left, on the row of the value, as a [`Form`](crate::Form)
    /// does.
    #[default]
    Column,
    /// Above the control, for a narrow area or a field alone.
    Stacked,
}

/// One field: a [`Label`], the control for the [`Field`]'s value, and under
/// the control its [`HelperText`], or its [`ValidationMessage`] while it has
/// an error.
///
/// The control is an [`Input`], a [`PasswordInput`] for a secret, a
/// [`Textarea`] for an area, or a select on the same surface. A field takes
/// whole grid tracks, [`FormField::tracks`]: the control two, and the label
/// column one more. The label column is as wide as the label, at most one
/// track; give fields in a group the same [`FormField::label_width`].
#[derive(Clone, Copy, Debug)]
pub struct FormField<'a> {
    theme: &'a Theme,
    field: &'a Field,
    layout: FieldLayout,
    size: Size,
    label_width: Option<u16>,
    flags: Flags,
    required: bool,
    optional: bool,
    scroll: Option<&'a Scroll>,
}

impl<'a> FormField<'a> {
    pub fn new(theme: &'a Theme, field: &'a Field) -> Self {
        let flags = Flags { invalid: field.error.is_some(), ..Flags::default() };
        Self { theme, field, layout: FieldLayout::Column, size: Size::Md, label_width: None, flags, required: false, optional: false, scroll: None }
    }

    #[must_use]
    pub fn layout(mut self, layout: FieldLayout) -> Self {
        self.layout = layout;
        self
    }

    /// The size of the control. `Md` by default.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// The width of the label column, to line up the controls of several
    /// fields. By default the label's own width, at most one track.
    #[must_use]
    pub fn label_width(mut self, width: u16) -> Self {
        self.label_width = Some(width);
        self
    }

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

    #[must_use]
    pub fn read_only(mut self, read_only: bool) -> Self {
        self.flags.read_only = read_only;
        self
    }

    /// `*` after the label.
    #[must_use]
    pub fn required(mut self, required: bool) -> Self {
        self.required = required;
        self
    }

    /// `optional` after the label.
    #[must_use]
    pub fn optional(mut self, optional: bool) -> Self {
        self.optional = optional;
        self
    }

    /// Where a textarea keeps its view between draws.
    #[must_use]
    pub fn scroll(mut self, scroll: &'a Scroll) -> Self {
        self.scroll = Some(scroll);
        self
    }

    /// The grid tracks the field takes: two for the control, and one more
    /// for the label column.
    pub fn tracks(&self) -> u16 {
        match self.layout {
            FieldLayout::Column => 3,
            FieldLayout::Stacked => 2,
        }
    }

    fn label(&self) -> Label<'a> {
        Label::new(self.theme, &self.field.label).required(self.required).optional(self.optional).disabled(self.flags.disabled)
    }

    /// The width of the label column: none when stacked or for a checkbox,
    /// whose label goes after the box.
    fn column(&self) -> u16 {
        match (self.layout, &self.field.input) {
            (FieldLayout::Stacked, _) | (_, Control::Check(_)) => 0,
            (FieldLayout::Column, _) => self.label_width.unwrap_or_else(|| self.label().width().min(Grid::TRACK)),
        }
    }

    /// The control's area in `area`: after the label column and its gap,
    /// or under the label.
    fn control(&self, area: Rect) -> Rect {
        let (dx, dy) = match (self.layout, &self.field.input) {
            (_, Control::Check(_)) => (0, 0),
            (FieldLayout::Column, _) => (self.column().saturating_add(Grid::GAP), 0),
            (FieldLayout::Stacked, _) => (0, 1),
        };
        let height = control_height(self.theme, self.field, self.size, area.width.saturating_sub(dx));
        Rect::new(area.x.saturating_add(dx), area.y.saturating_add(dy), area.width.saturating_sub(dx), height)
    }

    /// The help or the error under the control, `width` cells wide.
    fn under(&self, width: u16) -> Vec<Line<'static>> {
        match &self.field.error {
            Some(error) => ValidationMessage::new(self.theme, error).lines(width),
            None if self.field.hint.is_empty() => Vec::new(),
            None => HelperText::new(self.theme, &self.field.hint).lines(width),
        }
    }

    /// The rows the field takes in an area `width` columns wide.
    pub fn height(&self, width: u16) -> u16 {
        let control = self.control(Rect::new(0, 0, width, 0));
        control.bottom().saturating_add(self.under(control.width).len() as u16)
    }
}

impl Widget for FormField<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let control = self.control(area);
        if !matches!(self.field.input, Control::Check(_)) {
            let text_row = match self.layout {
                FieldLayout::Column => control.y.saturating_add(u16::from(self.size != Size::Sm)),
                FieldLayout::Stacked => area.y,
            };
            let width = match self.layout {
                FieldLayout::Column => self.column(),
                FieldLayout::Stacked => area.width,
            };
            if text_row < area.bottom() {
                self.label().render(Rect::new(area.x, text_row, width, 1), buf);
            }
        }
        let behind = under(t, buf, control.x, control.y.saturating_add(u16::from(self.size != Size::Sm)));
        let lines = control_lines(t, self.field, control.width, self.size, self.flags, behind, self.scroll);
        draw(buf, control.intersection(area), &lines);
        let below = Rect { y: control.bottom(), height: area.bottom().saturating_sub(control.bottom()), ..control };
        put_lines(buf, below, &self.under(control.width));
    }
}

/// The rows a field's control takes `width` columns wide.
pub(crate) fn control_height(t: &Theme, field: &Field, size: Size, width: u16) -> u16 {
    let half = if size != Size::Sm { 2 } else { 0 };
    match &field.input {
        Control::Check(_) => 1,
        Control::Area { .. } => 3 + half,
        Control::Radio(options, _) => RadioGroup::new(t, options.clone(), None)
            .horizontal(true)
            .height(width)
            .saturating_add(half),
        Control::Chips { chips, text, .. } => ChipInput::new(t, chips.clone(), text).size(size).height(width),
        _ => 1 + half,
    }
}

/// `lines` with a blank row above and below at `Md`, in line with a field
/// that has half rows of fill.
fn padded(mut lines: Vec<Line<'static>>, size: Size) -> Vec<Line<'static>> {
    if size != Size::Sm {
        lines.insert(0, Line::default());
        lines.push(Line::default());
    }
    lines
}

/// The rows of a field's control `width` columns wide, from [`frame`]: a
/// cell for the focus bar on each side of the fill.
pub(crate) fn control_lines(
    t: &Theme,
    field: &Field,
    width: u16,
    size: Size,
    flags: Flags,
    behind: Rgb,
    scroll: Option<&Scroll>,
) -> Vec<Line<'static>> {
    let placeholder = field.placeholder.as_str();
    match &field.input {
        Control::Text { value, cursor, secret: false, .. } => {
            Input::new(t, value).placeholder(placeholder).cursor(*cursor).size(size).flags(flags).lines(width, behind)
        }
        Control::Text { value, cursor, secret: true, shown } => PasswordInput::new(t, value)
            .placeholder(placeholder)
            .cursor(*cursor)
            .shown(*shown)
            .size(size)
            .flags(flags)
            .lines(width, behind),
        Control::Area { value, cursor } => {
            let area = Textarea::new(t, value).placeholder(placeholder).cursor(*cursor).size(size).flags(flags);
            match scroll {
                Some(scroll) => area.scroll(scroll).lines(width, behind),
                None => area.lines(width, behind),
            }
        }
        // Out of a form, the closed select with its arrow. In a form, the
        // compact "‹ value ›" that ←→ change.
        Control::Select(options, chosen) if !flags.selection => {
            Select::new(t, options.clone(), Some(*chosen)).size(size).flags(flags).lines(width, behind)
        }
        Control::Select(..) => {
            let paint = Paint::new(t, flags, behind);
            let mut spans = field.spans(t, usize::from(width.saturating_sub(2)).max(1), flags.focused && !flags.disabled);
            for span in &mut spans {
                span.style = if flags.disabled { paint.text } else { span.style.bg(paint.bg) };
            }
            frame(&paint, size, width, vec![spans])
        }
        Control::Check(on) => {
            let strong = flags.focused && !flags.disabled;
            vec![Checkbox::new(t, &field.label, *on).flags(flags).strong(strong).line(width.saturating_add(1))]
        }
        Control::Switch(on) => {
            let paint = Paint::new(t, flags, behind);
            let state = if flags.disabled { SwitchState::Disabled } else { SwitchState::Rest };
            let line = rows_of(width.saturating_add(2), 1, |buf, area| {
                Switch::new(t, *on).state(state).word(true).render(Rect { x: 1, ..area }, buf);
                if let Some(color) = paint.bars {
                    put(buf, 0, 0, "▐", color);
                    put(buf, 5, 0, "▌", color);
                }
            });
            padded(line, size)
        }
        Control::Radio(options, chosen) => {
            let group = RadioGroup::new(t, options.clone(), Some(*chosen)).horizontal(true).flags(flags);
            padded(group.lines(width.saturating_add(1)), size)
        }
        Control::Combo { options, chosen, query, cursor } => Combobox::new(t, options.clone(), *chosen)
            .query(query, flags.focused.then_some(*cursor))
            .placeholder(placeholder)
            .size(size)
            .flags(flags)
            .lines(width, behind),
        Control::Chips { chips, text, cursor, chip } => ChipInput::new(t, chips.clone(), text)
            .cursor(*cursor)
            .chip(*chip)
            .placeholder(placeholder)
            .size(size)
            .flags(flags)
            .lines(width, behind),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    #[test]
    fn a_label_keeps_its_mark_when_cut() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let label = Label::new(&theme, "Container image").required(true);
        assert_eq!(label.width(), 17);
        let text: String = label.spans(8, theme.text()).iter().map(|s| s.content.to_string()).collect();
        assert_eq!(text, "Conta… *");
        let optional = Label::new(&theme, "Notes").optional(true);
        assert_eq!(optional.spans(20, theme.text())[1].content, " optional");
    }

    #[test]
    fn a_message_wraps_under_its_text() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let lines = ValidationMessage::new(&theme, "Use a port from 1 to 65535.").lines(16);
        let lines: Vec<String> = lines.iter().map(ToString::to_string).collect();
        assert_eq!(lines, ["× Use a port", "  from 1 to", "  65535."]);
        assert_eq!(HelperText::new(&theme, "One container serving HTTP.").height(12), 4);
    }

    #[test]
    fn a_field_puts_the_label_in_a_column_and_the_error_under_the_control() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut field = Field::text("Port", "80").filled("99999");
        field.error = Some("Too high.".into());
        let form_field = FormField::new(&theme, &field).size(Size::Sm).required(true);
        assert_eq!(form_field.height(30), 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 31, 2));
        form_field.render(Rect::new(0, 0, 30, 2), &mut buf);
        assert_eq!(row(&buf, 0), "Port * ▐ 99999                ▌");
        assert_eq!(row(&buf, 1), "        × Too high.");
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().foreground));
        assert_eq!(buf[(10, 1)].fg, theme.danger().fg.unwrap());
    }

    #[test]
    fn a_stacked_field_puts_the_label_above() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let field = Field::area("Notes", "What changed").hint("Markdown works.");
        let form_field = FormField::new(&theme, &field).layout(FieldLayout::Stacked).optional(true);
        assert_eq!((form_field.tracks(), form_field.height(28)), (2, 7));
        let mut buf = Buffer::empty(Rect::new(0, 0, 28, 8));
        form_field.render(Rect::new(1, 0, 26, 8), &mut buf);
        assert_eq!(row(&buf, 0), " Notes optional");
        assert_eq!(row(&buf, 2), "  What changed");
        assert_eq!(row(&buf, 6), " Markdown works.");
    }

    #[test]
    fn a_field_past_the_buffer_does_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let fields = [
            Field::text("Name", "My app").filled("Paperless"),
            Field::text("Token", "").secret(),
            Field::area("Notes", "").filled("a\nb\nc\nd"),
            Field::select("Region", ["eu-west"]),
            Field::check("Start on boot"),
        ];
        for field in &fields {
            let mut buf = Buffer::empty(Rect::new(0, 0, 6, 2));
            FormField::new(&theme, field).focused(true).render(Rect::new(2, 1, 40, 9), &mut buf);
            FormField::new(&theme, field).layout(FieldLayout::Stacked).render(Rect::new(0, 0, 0, 0), &mut buf);
        }
    }
}
