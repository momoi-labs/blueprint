//! Gallery pages of wave 8: the overlays and the menus. On each overlay
//! page, enter opens the overlay over the whole screen.

use ratatui::buffer::Buffer;
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::Widget;
use tui_kiso::{
    Button, ButtonState, ButtonVariant, CommandPalette, DetailOption, DetailSelect, Drawer, DropdownMenu, Header, Modal, Page,
    Popover, Question, ScopeSwitcher, Scroll, Size, Theme,
};

use super::{caption, machine_page, put};

/// The pages whose overlay enter opens.
pub(super) fn opens(name: &str) -> bool {
    matches!(name, "Modal" | "Question" | "CommandPalette" | "DropdownMenu" | "Drawer" | "Popover" | "ScopeSwitcher")
}

/// True when the open overlay takes typed text.
pub(super) fn types(name: &str) -> bool {
    matches!(name, "CommandPalette" | "ScopeSwitcher")
}

/// The row or the button the overlay opens on: Save, or the current scope.
pub(super) fn first(name: &str) -> usize {
    match name {
        "Modal" => 1,
        "ScopeSwitcher" => CURRENT,
        _ => 0,
    }
}

/// The rows or buttons ↑↓ and ←→ move through.
pub(super) fn rows(t: &Theme, name: &str, query: &str) -> usize {
    match name {
        "Modal" | "Question" => 2,
        "CommandPalette" => commands(query).iter().map(|(_, c)| c.len()).sum(),
        "DropdownMenu" => 5,
        "ScopeSwitcher" => switcher(t, query).shown().len(),
        _ => 0,
    }
}

const COMMANDS: [(&str, &[(&str, &str)]); 3] = [
    ("Go to", &[("Machines", "1"), ("Logs", "2"), ("Settings", "3")]),
    ("Machine", &[("Restart machine", "r"), ("Copy URL", "c"), ("Delete machine", "x")]),
    ("App", &[("Theme", "t"), ("Help", "?"), ("Quit", "q")]),
];

/// The commands that hold `query`, in their groups.
fn commands(query: &str) -> Vec<(&'static str, Vec<(&'static str, &'static str)>)> {
    let query = query.to_lowercase();
    COMMANDS
        .iter()
        .map(|(group, commands)| (*group, commands.iter().copied().filter(|(name, _)| name.to_lowercase().contains(&query)).collect()))
        .collect()
}

const SCOPES: [&str; 10] = ["acme", "acme-staging", "laya", "momoi", "pg-main", "pg-replica", "probe", "sandbox", "studio", "web"];

/// The current scope, pg-main.
const CURRENT: usize = 4;

fn switcher<'a>(t: &'a Theme, query: &'a str) -> ScopeSwitcher<'a> {
    ScopeSwitcher::new(t, SCOPES, CURRENT).query(query)
}

/// The page under an overlay: the machines, two rows down.
fn behind(t: &Theme, area: Rect) -> (Page, Rect) {
    (machine_page(t, usize::from(area.width)), Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area })
}

/// A page with a caption, then the machines under it.
pub(super) fn backdrop_page(t: &Theme, buf: &mut Buffer, area: Rect, text: &str) {
    caption(t, buf, area, 0, text);
    let (page, rest) = behind(t, area);
    page.view(t, &Scroll::default()).selected(Some(1)).render(rest, buf);
}

/// The facts of the Popover page, and the cells of the region value.
fn facts(t: &Theme, buf: &mut Buffer, area: Rect) -> Rect {
    for (dy, (key, value)) in [(2, ("Machine", "pg-main-2")), (3, ("Region", "eu-west")), (4, ("Plan", "shared-2x"))] {
        put(buf, area, dy, Line::from(vec![Span::styled(format!("{key:<10}"), t.muted()), Span::styled(value, t.text())]));
    }
    Rect::new(area.x + 10, area.y + 3, 7, 1)
}

pub(super) fn popover_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Enter opens the details of the region under it. The page stays lit.");
    facts(t, buf, area);
}

pub(super) fn scope_page(t: &Theme, buf: &mut Buffer, area: Rect, focused: bool) {
    let switcher = switcher(t, "").focused(focused);
    let label = switcher.label();
    let header = Header::new(t, "pg-probe", "0.4.0").scope(&label).title("Machines");
    let row = Rect { height: 1, ..area };
    if let Some(scope) = header.scope_area(row) {
        header.render(row, buf);
        switcher.render(scope, buf);
    }
    caption(t, buf, area, 2, "Enter opens the scopes; past eight, typing filters them.");
    let (page, rest) = behind(t, Rect { y: area.y + 2, height: area.height.saturating_sub(2), ..area });
    page.view(t, &Scroll::default()).render(rest, buf);
}

fn details(t: &Theme, selected: usize, size: Size) -> DetailSelect<'_> {
    let options = [
        DetailOption::new("Daily", "One backup a day, kept for a week."),
        DetailOption::new("Hourly", "One an hour, kept two days. Needs the Pro plan.").disabled(true),
        DetailOption::new("Off", "No backups. Restore from a snapshot only."),
    ];
    DetailSelect::new(t, options, selected).size(size)
}

/// ↑↓ move the choice of the DetailSelect page.
pub(super) fn detail_key(t: &Theme, selected: usize, code: KeyCode) -> usize {
    let mut list = details(t, selected, Size::Md);
    list.key(code);
    list.selected()
}

pub(super) fn detail_select_page(t: &Theme, buf: &mut Buffer, area: Rect, selected: usize, focused: bool) {
    caption(t, buf, area, 0, "Each option says what it does. ↑/↓ move the choice past disabled ones.");
    let width = area.width.min(58);
    let md = details(t, selected, Size::Md).focused(focused);
    md.clone().render(Rect { y: area.y + 2, height: md.height().min(area.height.saturating_sub(2)), width, ..area }, buf);
    caption(t, buf, area, 11, "Sm: no empty row between two options.");
    let sm = details(t, selected, Size::Sm);
    sm.clone().render(Rect { y: area.y + 13, height: sm.height().min(area.height.saturating_sub(13)), width, ..area }, buf);
}

/// Draws the open overlay of page `name` over `screen`. `area` is where
/// the page drew, for the anchors.
pub(super) fn overlay(t: &Theme, buf: &mut Buffer, screen: Rect, area: Rect, name: &str, pick: usize, query: &str) {
    let focus = |i: usize| if i == pick { ButtonState::Focus } else { ButtonState::Rest };
    match name {
        "Modal" => {
            let body = Text::from(vec![
                Line::styled("The URL and the lists show the new name.", t.muted()),
                Line::default(),
                Line::styled("pg-main-2", t.text()),
            ]);
            let buttons = [Button::new(t, "Cancel").state(focus(0)), Button::new(t, "Save").variant(ButtonVariant::Primary).state(focus(1))];
            Modal::new(t, "Rename machine").size(Size::Md).body(body).actions(buttons).hints([("esc", "cancel")]).render(screen, buf);
        }
        "Question" => Question::new(t, "Delete pg-main-2?")
            .facts([("Machine", "pg-main-2"), ("Region", "eu-west")])
            .block(["This deletes the machine and its disk.", "Backups stay for 7 days."])
            .buttons(["Cancel", "Delete"])
            .focused(pick)
            .danger(true)
            .render(screen, buf),
        "CommandPalette" => {
            let groups = commands(query);
            let mut palette = CommandPalette::new(t, []).title("Type a command").filter(query).selected(pick);
            for (group, commands) in groups {
                palette = palette.group(group, commands);
            }
            palette.render(screen, buf);
        }
        "DropdownMenu" => {
            let (page, rest) = behind(t, area);
            if let Some(row) = page.item_area(1, rest, &Scroll::default()) {
                let menu = DropdownMenu::new(t, "pg-main-2", row).action("Open", "enter").action("Restart", "r").action("Copy URL", "c");
                menu.separator().disabled("Move", "m").danger("Delete", "x").selected(pick).render(screen, buf);
            }
        }
        "Drawer" => {
            let row = |key: &str, value: &str| Line::from(vec![Span::styled(format!("{key:<10}"), t.muted()), Span::styled(value.to_owned(), t.text())]);
            let body = Text::from(vec![
                row("Status", "running"),
                row("Region", "eu-west"),
                row("Plan", "shared-2x"),
                row("Image", "ghcr.io/kiso/app:1.4"),
                Line::default(),
                Line::styled("Started 3 days ago.", t.muted()),
            ]);
            let buttons = [Button::new(t, "Restart"), Button::new(t, "Open").variant(ButtonVariant::Primary).state(ButtonState::Focus)];
            Drawer::new(t, "pg-main-2").body(body).actions(buttons).hints([("esc", "close")]).render(screen, buf);
        }
        "Popover" => {
            let anchor = facts(t, &mut Buffer::empty(buf.area), area);
            let body = Text::from(vec![
                Line::styled("Frankfurt, Germany.", t.text()),
                Line::styled("18 ms from here.", t.muted()),
                Line::styled("3 machines run here.", t.muted()),
            ]);
            Popover::new(t, anchor).title("eu-west").body(body).render(screen, buf);
        }
        "ScopeSwitcher" => {
            let switcher = switcher(t, query).focused(true).open(Some(pick));
            let label = switcher.label();
            let row = Rect { height: 1, ..area };
            if let Some(scope) = Header::new(t, "pg-probe", "0.4.0").scope(&label).scope_area(row) {
                switcher.render(scope, buf);
            }
        }
        _ => {}
    }
}
