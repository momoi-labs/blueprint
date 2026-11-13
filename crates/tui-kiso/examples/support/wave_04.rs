//! The pages of the feedback components: alert, toast, spinner, skeleton,
//! empty state, link and separator.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{
    Alert, Badge, Button, Card, CardVariant, EmptyState, Link, LinkState, Separator, Size, Skeleton, Spinner, Stat, Theme, Toast,
    Tone,
};

use super::{caption, inside, put};

/// The width of one of two columns on a page 70 columns wide.
const COL: u16 = 34;
/// Where the second column starts.
const SECOND: u16 = COL + 2;

fn column(area: Rect) -> u16 {
    COL.min(area.width)
}

/// The spans of a spinner, to sit in a line.
fn spans(spinner: Spinner) -> Vec<Span<'static>> {
    Line::from(spinner).spans
}

pub fn alert_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Each tone has a tint, a glyph of its own and a title in its color");
    let width = column(area);
    let retry = Button::new(t, "Retry");
    let full = |tone: Tone, title, text| Alert::new(t, tone, title).text(text).action(retry);
    let places = [
        (0, 2, full(Tone::Neutral, "Heads up", "Backups run at 02:00 UTC.")),
        (0, 9, full(Tone::Info, "Update available", "Version 0.5.0 is out.")),
        (0, 16, full(Tone::Success, "Machine restarted", "laya is back in 1.6 s.")),
        (SECOND, 2, full(Tone::Warning, "Disk almost full", "The volume is at 91%.")),
        (SECOND, 9, full(Tone::Danger, "Replica down", "The replica did not answer in time. Writes are safe.")),
    ];
    for (x, dy, alert) in places {
        if let Some(rect) = inside(area, x, dy, width, alert.height(width)) {
            alert.render(rect, buf);
        }
    }
    let title_only = Alert::new(t, Tone::Info, "Syncing 3 of 8 machines");
    if let Some(rect) = inside(area, SECOND, 17, width, title_only.height(width)) {
        title_only.render(rect, buf);
    }
    let no_action = Alert::new(t, Tone::Warning, "Read only").text("This account cannot change machines.");
    if let Some(rect) = inside(area, SECOND, 21, width, no_action.height(width)) {
        no_action.render(rect, buf);
    }
}

/// The toast cards, below the footer toast of the Toast page: one of each
/// tone on the left, a stack of four (the oldest drops) on the right.
pub fn toast_cards(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "One of each tone, and a stack: newest on top, three at most");
    for (i, tone) in Tone::ALL.into_iter().enumerate() {
        let toast = Toast::new(t, tone.name()).tone(tone);
        let (x, dy) = if i < 3 { (0, 2 + i as u16 * 4) } else { (24, 2 + (i as u16 - 3) * 4) };
        if let Some(rect) = inside(area, x, dy, toast.width(), toast.height()) {
            toast.render(rect, buf);
        }
    }
    let toasts = [
        (Tone::Info, "Backup started"),
        (Tone::Success, "laya restarted"),
        (Tone::Warning, "Disk at 91%"),
        (Tone::Danger, "Route taken"),
    ]
    .map(|(tone, text)| Toast::new(t, text).tone(tone));
    let rows = area.intersection(buf.area);
    let below = Rect { x: rows.x.saturating_add(50.min(rows.width / 2)), y: rows.y.saturating_add(1), width: rows.width.saturating_sub(50.min(rows.width / 2)), height: rows.height.saturating_sub(1) };
    Toast::stack(below, buf, &toasts);
}

pub fn spinner_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "A braille frame in primary; the app counts about 8 ticks a second");
    let mut frames = vec![Span::styled(format!("{:<16}", "frames 0 to 9"), t.muted())];
    for tick in 0..10 {
        frames.extend(spans(Spinner::new(t, tick)));
        frames.push(Span::raw(" "));
    }
    put(buf, area, 2, Line::from(frames));
    let row = |label: &str, spinner: Spinner| {
        let mut line = vec![Span::styled(format!("{label:<16}"), t.muted())];
        line.extend(spans(spinner));
        Line::from(line)
    };
    put(buf, area, 4, row("no label", Spinner::new(t, 3)));
    put(buf, area, 5, row("with a label", Spinner::new(t, 3).label("Restarting laya")));
    put(buf, area, 6, row("another frame", Spinner::new(t, 7).label("Restarting laya")));
    caption(t, buf, area, 8, "In a line of text");
    let mut line = vec![Span::styled("Deploying ", t.text()), Span::styled("laya-apple", t.strong()), Span::raw("  ")];
    line.extend(spans(Spinner::new(t, 5).label("step 3 of 5")));
    put(buf, area, 9, Line::from(line));
    caption(t, buf, area, 11, "The width is the same in every frame, so a line does not jump");
    let (a, b) = (Spinner::new(t, 0).label("Loading"), Spinner::new(t, 4).label("Loading"));
    put(buf, area, 12, Line::styled(format!("{} and {} cells", a.width(), b.width()), t.muted()));
}

pub fn skeleton_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "A loading card: no tick is still, a tick pulses slowly");
    let cards: [(&str, Option<u32>); 3] = [("static", None), ("tick 0, faint", Some(0)), ("tick 2, strong", Some(2))];
    for (i, (name, tick)) in cards.into_iter().enumerate() {
        let Some(rect) = inside(area, i as u16 * 24, 3, 22, 8) else { continue };
        buf.set_string(rect.x, rect.y - 1, name, t.muted());
        let card = Card::new(t).loading(true);
        let card = tick.map_or(card, |tick| card.tick(tick));
        card.render(rect, buf);
    }
    caption(t, buf, area, 12, "Alone, on the page: a block of any size");
    let block = |tick: Option<u32>| tick.map_or(Skeleton::new(t), |tick| Skeleton::new(t).tick(tick));
    if let Some(rect) = inside(area, 0, 14, 8, 4) {
        block(None).render(rect, buf);
    }
    for (i, width) in [32u16, 22, 12].into_iter().enumerate() {
        if let Some(rect) = inside(area, 10, 14 + i as u16 * 2, width, 1) {
            block(Some(1)).render(rect, buf);
        }
    }
    caption(t, buf, area, 19, "A loading stat keeps its label and its height");
    let stats = [Stat::new(t, "Tasks", "").note("").loading(true), Stat::new(t, "Tasks", "").note("").loading(true).tick(2)];
    for (i, stat) in stats.into_iter().enumerate() {
        if let Some(rect) = inside(area, i as u16 * SECOND, 21, column(area), stat.height()) {
            stat.render(rect, buf);
        }
    }
}

pub fn empty_state_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "A glyph, a title, a text and the next step, centered");
    let action = Button::new(t, "Create machine");
    let full = EmptyState::new(t, "No machines yet").text("Machines you create show up here with their region and state.").action(action);
    let custom = EmptyState::new(t, "No results").glyph("⌕").text("Nothing matches that filter. Clear it to see all machines.");
    let bare = EmptyState::new(t, "Nothing to show");
    let width = column(area);
    let cells = [(0, 2, 10, full, "title, text and action"), (SECOND, 2, 10, custom, "own glyph, no action"), (0, 14, 9, bare, "title only")];
    for (x, dy, height, state, name) in cells {
        let Some(rect) = inside(area, x, dy + 1, width, height) else { continue };
        buf.set_string(rect.x, rect.y - 1, name, t.muted());
        state.render(rect, buf);
    }
    let in_card = EmptyState::new(t, "No backups").text("The first one runs tonight at 02:00 UTC.");
    if let Some(rect) = inside(area, SECOND, 15, width, 9) {
        buf.set_string(rect.x, rect.y - 1, "inside a card", t.muted());
        let card = Card::new(t).variant(CardVariant::Plain).size(Size::Md);
        card.render(rect, buf);
        in_card.render(card.inner(rect), buf);
    }
}

pub fn link_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    caption(t, buf, area, 0, "Underlined, so color is not the only cue. Enter follows it.");
    let states = [
        ("rest", LinkState::Rest),
        ("hover", LinkState::Hover),
        ("focus", LinkState::Focus),
        ("disabled", LinkState::Disabled),
    ];
    for (i, (name, state)) in states.into_iter().enumerate() {
        let link = Link::new(t, "Read the docs").state(state);
        put(buf, area, 2 + i as u16 * 2, Line::from(vec![Span::styled(format!("{name:<16}"), t.muted()), Span::from(link)]));
    }
    let external = Link::new(t, "Open the changelog").external(true);
    put(buf, area, 10, Line::from(vec![Span::styled(format!("{:<16}", "external"), t.muted()), Span::from(external)]));
    let focused = Link::new(t, "Open the changelog").external(true).state(LinkState::Focus);
    put(buf, area, 12, Line::from(vec![Span::styled(format!("{:<16}", "external, focus"), t.muted()), Span::from(focused)]));
    caption(t, buf, area, 14, "In running text");
    let line = Line::from(vec![
        Span::styled("Backups run every night. See ", t.text()),
        Span::from(Link::new(t, "the backup guide")),
        Span::styled(" or ", t.text()),
        Span::from(Link::new(t, "change the schedule").state(LinkState::Focus)),
        Span::styled(".", t.text()),
    ]);
    put(buf, area, 15, line);
    caption(t, buf, area, 17, "Limit: no OSC 8 link. A ratatui cell holds one symbol only.");
    put(buf, area, 18, Line::styled("The label is plain text. The app opens the address on Enter.", t.muted()));
}

pub fn separator_page(t: &Theme, buf: &mut Buffer, area: Rect) {
    let width = area.width.min(60);
    caption(t, buf, area, 0, "Horizontal: the rule of the look, no label");
    if let Some(rect) = inside(area, 0, 2, width, 1) {
        Separator::horizontal(t).render(rect, buf);
    }
    caption(t, buf, area, 4, "Horizontal, with a label");
    if let Some(rect) = inside(area, 0, 6, width, 1) {
        Separator::horizontal(t).label("Network").render(rect, buf);
    }
    caption(t, buf, area, 8, "Vertical: a column of border color between two parts");
    let columns = [("Machines", 0u16), ("Logs", 24)];
    for (name, x) in columns {
        if let Some(rect) = inside(area, x, 10, 18, 1) {
            buf.set_string(rect.x, rect.y, name, t.strong());
            buf.set_string(rect.x, rect.y + 1, "3 running, 1 stopped", t.muted());
        }
    }
    if let Some(rect) = inside(area, 22, 10, 1, 5) {
        Separator::vertical(t).render(rect, buf);
    }
    caption(t, buf, area, 16, "On a card, over its fill");
    if let Some(rect) = inside(area, 0, 18, width.min(46), 6) {
        let card = Card::new(t);
        card.render(rect, buf);
        let inner = card.inner(rect);
        buf.set_stringn(inner.x, inner.y, "Backups", usize::from(inner.width), t.strong());
        Separator::horizontal(t).render(Rect { y: inner.y + 1, height: 1, ..inner }, buf);
        let badge = Badge::new(t, Tone::Success, "healthy");
        let width = badge.width();
        if inner.height > 2 && width <= inner.width {
            badge.render(Rect::new(inner.x, inner.y + 2, width, 1), buf);
        }
    }
}
