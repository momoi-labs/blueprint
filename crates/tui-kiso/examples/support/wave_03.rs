//! The pages of the form choices and actions: FormActions, Checkbox,
//! RadioGroup, Select, Combobox, ChipInput and the icon button.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;
use tui_kiso::{
    Button, ButtonState, ButtonVariant, Checkbox, ChipInput, Combobox, FormActions, Grid, RadioGroup, Select, Size, Theme,
    Tone,
};

/// Where the widgets start, after the captions.
const X: u16 = 30;
/// A field is two tracks wide.
const WIDTH: u16 = Grid::TRACK * 2 + Grid::GAP;

const REGIONS: [&str; 6] = ["eu-west-1", "eu-west-2", "eu-central-1", "us-east-1", "us-west-2", "ap-south-1"];
const SIZES: [&str; 3] = ["Small", "Medium", "Large"];

/// A caption on row `dy`, and the widget in the column after it, when it
/// fits.
fn row(t: &Theme, buf: &mut Buffer, area: Rect, dy: u16, name: &str, (width, height): (u16, u16), draw: impl FnOnce(Rect, &mut Buffer)) {
    super::caption(t, buf, area, dy + height / 2, name);
    if let Some(rect) = super::inside(area, X, dy, width.min(area.width.saturating_sub(X + 1)), height) {
        draw(rect, buf);
    }
}

pub fn form_actions_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    // The captions are short so the row keeps three tracks or more.
    const AT: u16 = 18;
    let width = area.width.saturating_sub(AT + 1).min(Grid::span(4));
    let cancel = || Button::new(t, "Cancel");
    let save = || Button::new(t, "Save").variant(ButtonVariant::Primary);
    let narrow = Grid::span(Grid::MIN) - 4;
    let rows = [
        ("Primary last", FormActions::new(t, [cancel(), save()]), width),
        ("Focus", FormActions::new(t, [cancel(), save().state(ButtonState::Focus)]), width),
        (
            "With a message",
            FormActions::new(t, [Button::new(t, "Discard").variant(ButtonVariant::Ghost), save()])
                .message("Unsaved changes.", Tone::Warning),
            width,
        ),
        ("Destructive", FormActions::new(t, [cancel(), Button::new(t, "Remove").variant(ButtonVariant::Destructive)]), width),
        ("Under 3 tracks", FormActions::new(t, [cancel(), save().state(ButtonState::Focus)]), narrow.min(width)),
    ];
    let mut dy = 0;
    for (name, actions, width) in rows {
        let height = actions.height(width);
        super::caption(t, buf, area, dy + 1, name);
        if let Some(rect) = super::inside(area, AT, dy, width, height) {
            actions.render(rect, buf);
        }
        dy += height + 1;
    }
}

pub fn checkbox_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let boxes = [
        ("Unchecked", Checkbox::new(t, "Start on boot", false)),
        ("Checked", Checkbox::new(t, "Start on boot", true)),
        ("Indeterminate", Checkbox::new(t, "All regions", false).indeterminate(true)),
        ("Focus", Checkbox::new(t, "Start on boot", false).focused(true)),
        ("Focus, checked", Checkbox::new(t, "Start on boot", true).focused(true)),
        ("Invalid", Checkbox::new(t, "I accept the terms", false).invalid(true)),
        ("Disabled", Checkbox::new(t, "Start on boot", false).disabled(true)),
        ("Disabled, checked", Checkbox::new(t, "Start on boot", true).disabled(true)),
    ];
    for (i, (name, checkbox)) in boxes.into_iter().enumerate() {
        row(t, buf, area, i as u16 * 2, name, (WIDTH, 1), |rect, buf| checkbox.render(rect, buf));
    }
    row(t, buf, area, 17, "A parent and its choices", (WIDTH, 3), |rect, buf| {
        Checkbox::new(t, "All regions", false).indeterminate(true).render(Rect { height: 1, ..rect }, buf);
        let child = |dy: u16| Rect { x: rect.x + 4, y: rect.y + dy, width: rect.width.saturating_sub(4), height: 1 };
        Checkbox::new(t, "eu-west-1", true).render(child(1), buf);
        Checkbox::new(t, "us-east-1", false).render(child(2), buf);
    });
}

pub fn radio_group_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let groups = [
        ("Focus on the chosen one", RadioGroup::new(t, SIZES, Some(1)).focused(true), WIDTH),
        ("Nothing chosen yet", RadioGroup::new(t, SIZES, None), WIDTH),
        ("In a row", RadioGroup::new(t, SIZES, Some(0)).horizontal(true), WIDTH),
        ("Invalid", RadioGroup::new(t, SIZES, None).horizontal(true).invalid(true), WIDTH),
        ("A row that wraps", RadioGroup::new(t, SIZES, Some(2)).horizontal(true).focused(true), 18),
        ("Disabled", RadioGroup::new(t, SIZES, Some(1)).disabled(true), WIDTH),
    ];
    let mut dy = 0;
    for (name, group, width) in groups {
        let height = group.height(width);
        row(t, buf, area, dy, name, (width, height), |rect, buf| group.render(rect, buf));
        dy += height + 1;
    }
}

pub fn select_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let selects = [
        ("Rest, with a placeholder", Select::new(t, REGIONS, None).placeholder("Pick a region")),
        ("Chosen, focus", Select::new(t, REGIONS, Some(2)).focused(true)),
        ("Invalid", Select::new(t, REGIONS, None).placeholder("Pick a region").invalid(true)),
    ];
    for (i, (name, select)) in selects.into_iter().enumerate() {
        row(t, buf, area, i as u16 * 4, name, (WIDTH, 3), |rect, buf| select.render(rect, buf));
    }
    let disabled = Select::new(t, REGIONS, Some(0)).size(Size::Sm).disabled(true);
    row(t, buf, area, 12, "Disabled, size sm", (WIDTH, 1), |rect, buf| disabled.render(rect, buf));
    let open = Select::new(t, REGIONS, Some(2)).size(Size::Sm).focused(true).open(Some(3));
    row(t, buf, area, 14, "Open: the list under it", (WIDTH, 1), |rect, buf| open.render(rect, buf));
}

pub fn combobox_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rest = Combobox::new(t, REGIONS, None).placeholder("Type a region");
    row(t, buf, area, 0, "Rest, with a placeholder", (WIDTH, 3), |rect, buf| rest.render(rect, buf));
    let chosen = Combobox::new(t, REGIONS, Some(3)).focused(true);
    row(t, buf, area, 4, "Chosen, focus", (WIDTH, 3), |rect, buf| chosen.render(rect, buf));
    let typing = Combobox::new(t, REGIONS, Some(0)).size(Size::Sm).focused(true).query("eu", None).open(Some(1));
    row(t, buf, area, 8, "Typing filters the list", (WIDTH, 1), |rect, buf| typing.render(rect, buf));
    let none = Combobox::new(t, REGIONS, None).size(Size::Sm).focused(true).query("mars", None).open(Some(0));
    row(t, buf, area, 15, "No match: one muted row", (WIDTH, 1), |rect, buf| none.render(rect, buf));
}

pub fn chip_input_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let hosts = ["web-1", "web-2", "db-main"];
    let inputs = [
        ("Rest, with a placeholder", ChipInput::new(t, Vec::<String>::new(), "").placeholder("Add a host")),
        ("Chips, then the text", ChipInput::new(t, hosts, "cache").focused(true)),
        ("A chip chosen with ←", ChipInput::new(t, hosts, "").focused(true).chip(Some(2))),
        ("Chips wrap to more rows", ChipInput::new(t, ["web-1", "web-2", "db-main", "cache-1", "queue"], "").focused(true)),
    ];
    let mut dy = 0;
    for (name, input) in inputs {
        let height = input.height(WIDTH);
        row(t, buf, area, dy, name, (WIDTH, height), |rect, buf| input.render(rect, buf));
        dy += height + 1;
    }
    let invalid = ChipInput::new(t, ["web-1"], "db main").size(Size::Sm).invalid(true);
    row(t, buf, area, dy, "Invalid, size sm", (WIDTH, 1), |rect, buf| invalid.render(rect, buf));
    let disabled = ChipInput::new(t, hosts, "").size(Size::Sm).disabled(true);
    row(t, buf, area, dy + 2, "Disabled", (WIDTH, 1), |rect, buf| disabled.render(rect, buf));
}

pub fn icon_button_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let rows: [(&str, Size, Vec<Button>); 5] = [
        (
            "Variants",
            Size::Md,
            vec![
                Button::icon(t, "⟳", "Restart"),
                Button::icon(t, "+", "Add").variant(ButtonVariant::Primary),
                Button::icon(t, "⋯", "More").variant(ButtonVariant::Ghost),
                Button::icon(t, "✕", "Remove").variant(ButtonVariant::Destructive),
            ],
        ),
        (
            "Rest, focus, disabled",
            Size::Md,
            vec![
                Button::icon(t, "⟳", "Restart"),
                Button::icon(t, "⟳", "Restart").state(ButtonState::Focus),
                Button::icon(t, "⟳", "Restart").state(ButtonState::Disabled),
            ],
        ),
        ("Size sm", Size::Sm, vec![Button::icon(t, "⟳", "Restart"), Button::icon(t, "⋯", "More").variant(ButtonVariant::Ghost)]),
        (
            "Nerd Font glyph, or its name",
            Size::Md,
            vec![Button::icon(t, "\u{f013}", "Settings"), Button::icon(t, "\u{f1f8}", "Delete").variant(ButtonVariant::Destructive)],
        ),
        (
            "Beside a labelled button",
            Size::Md,
            vec![Button::new(t, "Deploy").variant(ButtonVariant::Primary), Button::icon(t, "⋯", "More actions")],
        ),
    ];
    let mut dy = 0;
    for (name, size, buttons) in rows {
        let height = if size == Size::Md { 3 } else { 1 };
        row(t, buf, area, dy, name, (area.width, height), |rect, buf| {
            let mut x = rect.x;
            for button in buttons {
                let button = button.size(size);
                let width = button.width();
                if x + width >= rect.right() {
                    break;
                }
                button.render(Rect::new(x, rect.y, width, height), buf);
                x += width + 2;
            }
        });
        dy += height + 1;
    }
    super::caption(t, buf, area, dy + 1, "The name shows where the glyph cannot.");
}
