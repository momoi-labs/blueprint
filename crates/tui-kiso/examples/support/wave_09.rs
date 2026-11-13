//! The pages of the layout and flow components: split, disclosure, steps,
//! step bar, step list and lifecycle.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{
    Button, ButtonState, ButtonVariant, Disclosure, DisclosureState, Lifecycle, Split, StatusBadge, StepBar, StepList, StepState,
    Steps, Theme,
};

use super::{caption, put};

/// A strip of `area` that starts `dy` rows down, `height` rows tall and at
/// most `width` wide. It stays inside `area`.
fn strip(area: Rect, dy: u16, height: u16, width: u16) -> Rect {
    Rect::new(area.x, area.y.saturating_add(dy), width.min(area.width), height).intersection(area)
}

/// Fills each pane of `split` with its title and a line, then draws the
/// dividers.
fn panes(t: &Theme, buf: &mut Buffer, split: &Split, region: Rect, names: &[&str]) {
    for (i, (pane, name)) in split.areas(region).into_iter().zip(names).enumerate() {
        let pane = pane.intersection(buf.area);
        put(buf, pane, 0, Line::from(vec![Span::raw(" "), split.title(t, i, name)]));
        put(buf, pane, 1, Line::styled(format!(" {} wide, {} tall", pane.width, pane.height), t.muted()));
    }
    split.render(t, region, buf);
}

pub fn split_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Ratios, a one cell divider, a minimum size. The app owns the keys.");
    let width = area.width.min(76);
    let two = strip(area, 3, 3, width);
    let three = strip(area, 8, 3, width);
    let grown = strip(area, 13, 3, width);
    let stacked = strip(area, 18, 5, width);
    put(buf, area, 2, Line::styled("Two panes, 1 to 2, the first active", t.text()));
    panes(t, buf, &Split::horizontal([1, 2]).active(0), two, &["Files", "Preview"]);
    put(buf, area, 7, Line::styled("Three panes, the middle one active: both dividers take the focus", t.text()));
    panes(t, buf, &Split::horizontal([1, 1, 1]).active(1), three, &["Machines", "Queries", "Logs"]);
    put(buf, area, 12, Line::styled("The first pane grown once, as the app does on a key", t.text()));
    let mut split = Split::horizontal([1, 1]).active(0);
    split.grow(grown, 0);
    panes(t, buf, &split, grown, &["Files", "Preview"]);
    put(buf, area, 17, Line::styled("One above the other, the last active, a minimum of 2 rows", t.text()));
    panes(t, buf, &Split::vertical([2, 1]).min(2).active(1), stacked, &["Output", "Input"]);
}

pub fn disclosure_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Focus fills the mark and the title. A disabled one stays closed.");
    let items = [
        ("Closed", DisclosureState::Rest, false),
        ("Open", DisclosureState::Rest, true),
        ("Focus, closed", DisclosureState::Focus, false),
        ("Focus, open", DisclosureState::Focus, true),
        ("Disabled", DisclosureState::Disabled, true),
    ];
    let mut dy = 2u16;
    for (title, state, open) in items {
        let disclosure = Disclosure::new(t, title).open(open).state(state);
        let region = strip(area, dy, disclosure.height(2), 40);
        disclosure.render(region, buf);
        if disclosure.is_open() {
            let content = Disclosure::content(region);
            put(buf, content, 0, Line::styled("Replicas follow the primary.", t.text()));
            put(buf, content, 1, Line::styled("Lag stays under one second.", t.muted()));
        }
        dy += disclosure.height(2) + 1;
    }
}

/// The steps of a setup, the second one current.
fn setup<'a>(t: &'a Theme, second: StepState) -> Steps<'a> {
    Steps::new(t)
        .described("Source", "Where the data comes from", StepState::Done)
        .described("Options", "Pick the version and size", second)
        .described("Review", "Check, then create", StepState::Pending)
        .described("Done", "", StepState::Pending)
        .current(1)
}

pub fn steps_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Current is independent of state, so the current step can have failed.");
    let rows = [
        (2, "Current", setup(t, StepState::Pending)),
        (5, "Running, with a spinner frame", setup(t, StepState::Running(3))),
        (8, "The current step failed", setup(t, StepState::Failed)),
        (11, "A step skipped", setup(t, StepState::Skipped)),
    ];
    for (dy, label, steps) in rows {
        put(buf, area, dy, Line::styled(label, t.muted()));
        steps.render(strip(area, dy + 1, 1, 80), buf);
    }
    put(buf, area, 14, Line::styled("Too narrow for one row, with rows to spare: the vertical form", t.muted()));
    let narrow = setup(t, StepState::Pending);
    narrow.render(strip(area, 15, narrow_rows(t), 30), buf);
    put(buf, area, 15 + narrow_rows(t) + 1, Line::styled("Too narrow, one row: the count", t.muted()));
    setup(t, StepState::Pending).render(strip(area, 15 + narrow_rows(t) + 2, 1, 30), buf);
}

fn narrow_rows(t: &Theme) -> u16 {
    setup(t, StepState::Pending).rows()
}

pub fn step_bar_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "No text of its own: the app writes the count beside it.");
    let run = |n_done: usize, current: StepState, rest: usize| {
        let mut states = vec![StepState::Done; n_done];
        states.push(current);
        states.extend(vec![StepState::Pending; rest]);
        states
    };
    let rows = [
        ("Running step 4 of 11, half done", StepBar::new(t, run(3, StepState::Running(0), 7)).progress(0.5)),
        ("Running, full", StepBar::new(t, run(3, StepState::Running(0), 7))),
        ("Failed at step 4 of 11", StepBar::new(t, run(3, StepState::Failed, 7))),
        ("All done, one skipped", StepBar::new(t, [StepState::Done, StepState::Skipped, StepState::Done, StepState::Done])),
    ];
    for (i, (label, bar)) in rows.into_iter().enumerate() {
        let dy = 2 + 3 * i as u16;
        put(buf, area, dy, Line::styled(label, t.muted()));
        bar.render(strip(area, dy + 1, 1, 44), buf);
    }
    put(buf, area, 15, Line::styled("In a table cell, 12 wide, with a badge", t.muted()));
    let cell = strip(area, 16, 1, 12);
    StepBar::new(t, run(3, StepState::Running(0), 7)).progress(0.5).render(cell, buf);
    let badge: Line = StatusBadge::success(t, "Running").into();
    put(buf, Rect::new(area.x + 14, area.y, area.width.saturating_sub(14), area.height), 16, badge);
}

pub fn step_list_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Same marks as Steps, with the names in a column.");
    let t_ = t;
    let list = |last: StepState, detail: &'static str| {
        StepList::new(t_)
            .step("Pull image", "1.2 s", StepState::Done)
            .step("Create volume", "Not needed", StepState::Skipped)
            .step("Run migrations", detail, last)
            .step("Start", "", StepState::Pending)
    };
    put(buf, area, 2, Line::styled("Running", t.muted()));
    let running = list(StepState::Running(5), "");
    running.render(strip(area, 3, 4, 50), buf);
    put(buf, area, 8, Line::styled("Failed", t.muted()));
    let failed = list(StepState::Failed, "permission denied for schema app");
    failed.render(strip(area, 9, 4, 60), buf);
}

pub fn lifecycle_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Slots for badges and buttons. Verbs touch, Remove stands apart.");
    let ghost = |label| Button::new(t, label).variant(ButtonVariant::Ghost);
    let off = |label| Button::new(t, label).state(ButtonState::Disabled);
    let rows = [
        (
            "Running",
            Lifecycle::new(t)
                .status(StatusBadge::success(t, "Running"))
                .status(StatusBadge::neutral(t, "HTTP 200"))
                .action(Button::new(t, "Stop"))
                .action(Button::new(t, "Restart"))
                .destructive(ghost("Remove")),
        ),
        (
            "Stopped: Start is the one verb that works",
            Lifecycle::new(t)
                .status(StatusBadge::neutral(t, "Stopped"))
                .action(Button::new(t, "Start"))
                .action(off("Stop"))
                .action(off("Restart"))
                .destructive(ghost("Remove")),
        ),
        ("Failed, no verbs", Lifecycle::new(t).status(StatusBadge::danger(t, "Failed")).destructive(ghost("Remove"))),
        ("Status only", Lifecycle::new(t).status(StatusBadge::success(t, "Running").pulse(true))),
    ];
    for (i, (label, lifecycle)) in rows.into_iter().enumerate() {
        let dy = 2 + 3 * i as u16;
        put(buf, area, dy, Line::styled(label, t.muted()));
        lifecycle.render(strip(area, dy + 1, 1, area.width), buf);
    }
    put(buf, area, 15, Line::styled("In 55 columns the destructive action is left out whole", t.muted()));
    Lifecycle::new(t)
        .status(StatusBadge::success(t, "Running"))
        .status(StatusBadge::neutral(t, "HTTP 200"))
        .action(Button::new(t, "Stop"))
        .action(Button::new(t, "Restart"))
        .destructive(ghost("Remove"))
        .render(strip(area, 16, 1, 55), buf);
}
