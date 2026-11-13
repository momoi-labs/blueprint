//! The pages of the field components: Label, Input, PasswordInput,
//! Textarea and FormField.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;
use tui_kiso::{
    Field, FieldLayout, FormField, Grid, HelperText, Input, Label, PasswordInput, Scroll, Size, Textarea, Theme, ValidationMessage,
};

/// A field is two tracks wide. It starts one column in, so the focus bar
/// on its left has room.
const WIDTH: u16 = Grid::TRACK * 2 + Grid::GAP;

/// Where demo `i` of `rows` per column goes: two columns when the area is
/// wide enough, else one. None when it does not fit.
fn slot(area: Rect, i: u16, rows: u16, height: u16) -> Option<Rect> {
    let columns = if area.width >= 2 * (WIDTH + 4) { 2 } else { 1 };
    let per = area.height.max(1) / height;
    let per = if columns == 2 { per.min(rows) } else { per };
    let (column, row) = (i / per.max(1), i % per.max(1));
    if column >= columns {
        return None;
    }
    let rect = Rect::new(area.x + 1 + column * (WIDTH + 4), area.y + row * height, WIDTH, height);
    (rect.right() < area.right() && rect.bottom() <= area.bottom().min(area.y + area.height)).then_some(rect)
}

/// Draws a widget `height` rows tall under a caption, in slot `i` of
/// `rows` per column. Each slot is as tall as the tallest widget, with a
/// blank row after it.
fn show(t: &Theme, buf: &mut Buffer, area: Rect, (i, rows, tallest): (u16, u16, u16), height: u16, name: &str, draw: impl FnOnce(Rect, &mut Buffer)) {
    let Some(rect) = slot(area, i, rows, tallest + 2) else { return };
    buf.set_stringn(rect.x, rect.y, name, usize::from(rect.width), t.muted());
    draw(Rect { y: rect.y + 1, height, ..rect }, buf);
}

pub fn label_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    const X: u16 = 20;
    let labels = [
        ("A label", Label::new(t, "Name")),
        ("Required", Label::new(t, "Name").required(true)),
        ("Optional", Label::new(t, "Notes").optional(true)),
        ("Cut to 8 columns", Label::new(t, "Container image").required(true)),
    ];
    for (i, (name, label)) in labels.into_iter().enumerate() {
        let dy = i as u16 * 2;
        super::caption(t, buf, area, dy, name);
        let width = if i == 3 { 8 } else { WIDTH };
        if let Some(rect) = super::inside(area, X, dy, width, 1) {
            label.render(rect, buf);
        }
    }
    super::caption(t, buf, area, 9, "HelperText");
    if let Some(rect) = super::inside(area, X, 9, WIDTH, 3) {
        HelperText::new(t, "An image that is already published, such as nginx:alpine.").render(rect, buf);
    }
    super::caption(t, buf, area, 13, "ValidationMessage");
    if let Some(rect) = super::inside(area, X, 13, WIDTH, 3) {
        ValidationMessage::new(t, "Another application is called this. Pick a new name.").render(rect, buf);
    }
}

pub fn input_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let image = "ghcr.io/momoi-labs/kiso/app:latest";
    let inputs = [
        ("Rest, with a placeholder", Input::new(t, "").placeholder("nginx:alpine")),
        ("Focus", Input::new(t, "").placeholder("nginx:alpine").focused(true)),
        ("Filled", Input::new(t, "nginx:alpine")),
        ("Long text, cursor in view", Input::new(t, image).focused(true).cursor(20)),
        ("Disabled", Input::new(t, "nginx:alpine").disabled(true)),
        ("Read-only", Input::new(t, "nginx:alpine").read_only(true)),
        ("Invalid", Input::new(t, "nginx:").invalid(true)),
        ("Size sm, one row", Input::new(t, "nginx:alpine").size(Size::Sm)),
    ];
    for (i, (name, input)) in inputs.into_iter().enumerate() {
        show(t, buf, area, (i as u16, 4, 3), input.height(), name, |rect, buf| input.render(rect, buf));
    }
}

pub fn password_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let inputs = [
        ("Rest, with a placeholder", PasswordInput::new(t, "").placeholder("Leave empty to keep it")),
        ("Hidden", PasswordInput::new(t, "correct horse")),
        ("Shown with ctrl+r", PasswordInput::new(t, "correct horse").shown(true)),
        ("Focus", PasswordInput::new(t, "correct horse").focused(true)),
        ("Disabled", PasswordInput::new(t, "correct horse").disabled(true)),
        ("Read-only", PasswordInput::new(t, "correct horse").read_only(true)),
        ("Invalid", PasswordInput::new(t, "abc").invalid(true)),
        ("Size sm", PasswordInput::new(t, "correct horse").size(Size::Sm)),
    ];
    for (i, (name, input)) in inputs.into_iter().enumerate() {
        show(t, buf, area, (i as u16, 4, 3), input.height(), name, |rect, buf| input.render(rect, buf));
    }
}

pub fn textarea_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let notes = "Moved the database to the new volume.\nRestart the worker after the upgrade, then check the logs for a minute.";
    let scroll = Scroll::default();
    let areas = [
        ("Rest, with a placeholder", Textarea::new(t, "").placeholder("What changed in this release")),
        ("Focus, follows the cursor", Textarea::new(t, notes).focused(true).scroll(&scroll)),
        ("Filled, longer than the view", Textarea::new(t, notes)),
        ("Disabled", Textarea::new(t, "Moved the database.").disabled(true)),
        ("Read-only", Textarea::new(t, "Moved the database.").read_only(true)),
        ("Invalid", Textarea::new(t, "").placeholder("What changed").invalid(true)),
    ];
    for (i, (name, textarea)) in areas.into_iter().enumerate() {
        show(t, buf, area, (i as u16, 3, 5), textarea.height(), name, |rect, buf| textarea.render(rect, buf));
    }
}

pub fn form_field_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let mut name = Field::text("Name", "My app").filled("laya");
    name.error = Some("Another application is called this.".into());
    let image = Field::text("Image", "nginx:alpine").hint("An image that is already published.");
    let token = Field::text("Token", "Leave empty to keep it").secret();
    let notes = Field::area("Notes", "What changed").hint("Markdown works.");
    let fields = [(&name, true, false, false), (&image, false, false, true), (&token, false, false, false)];
    let label = 6;
    super::caption(t, buf, area, 0, "Labels in a column, three tracks");
    let mut y = area.y + 2;
    for (field, required, optional, focused) in fields {
        let field = FormField::new(t, field).label_width(label).required(required).optional(optional).focused(focused);
        let width = (Grid::TRACK * 3 + Grid::GAP * 2).min(area.width.saturating_sub(2));
        let height = field.height(width);
        if y + height > area.bottom() {
            break;
        }
        field.render(Rect::new(area.x + 1, y, width, height), buf);
        y += height + 1;
    }
    // Stacked, beside the column when it fits, else under it.
    let wide = area.width >= Grid::TRACK * 5 + Grid::GAP * 4 + 3;
    let (x, top) = if wide { (area.x + 1 + Grid::TRACK * 3 + Grid::GAP * 3, area.y) } else { (area.x + 1, y) };
    let stacked = FormField::new(t, &notes).layout(FieldLayout::Stacked).optional(true);
    let height = stacked.height(WIDTH);
    if top + 2 + height <= area.bottom() && x + WIDTH < area.right() {
        buf.set_stringn(x, top, "Stacked, two tracks", usize::from(WIDTH), t.muted());
        stacked.render(Rect::new(x, top + 2, WIDTH, height), buf);
    }
}
