//! Every dialog fits an 80 by 24 terminal, and none panics on a screen too
//! small for it.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Line;
use ratatui::widgets::Widget;
use tui_kiso::{Modal, Palette, Question, Theme, ThemePicker};

type Draw = Box<dyn Fn(&Theme, Rect, &mut Buffer)>;

/// Each dialog, at about the size an app gives it.
fn dialogs() -> Vec<(&'static str, Draw)> {
    vec![
        (
            "modal",
            Box::new(|t, screen, buf| {
                let body: Vec<Line> = (0..16).map(|i| Line::raw(format!("key {i}   what it does"))).collect();
                Modal::new(t, "Help").width(64).body(body).hints([("any key", "close")]).render(screen, buf);
            }),
        ),
        (
            "question",
            Box::new(|t, screen, buf| {
                let question = Question::new(t, "Remove laya?").facts([("Name", "laya")]).block(["It goes for good."]);
                question.buttons(["Cancel", "Remove"]).focused(1).danger(true).render(screen, buf);
            }),
        ),
        (
            "palette",
            Box::new(|t, screen, buf| Palette::new(t, (0..20).map(|_| ("Go somewhere", "g"))).selected(3).render(screen, buf)),
        ),
        ("picker", Box::new(|t, screen, buf| ThemePicker::new(7, false).view(t).render(screen, buf))),
    ]
}

#[test]
fn every_dialog_fits_80_by_24() {
    let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
    let screen = Rect::new(0, 0, 80, 24);
    for (name, draw) in dialogs() {
        let mut buf = Buffer::empty(screen);
        draw(&theme, screen, &mut buf);
        let text: String = buf.content.iter().map(|c| c.symbol()).collect();
        for corner in ["╭", "╮", "╰", "╯"] {
            assert!(text.contains(corner), "{name}: no {corner} at 80 by 24");
        }
    }
}

#[test]
fn no_dialog_panics_on_a_tiny_screen() {
    let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
    for width in 0..12 {
        for height in 0..12 {
            let screen = Rect::new(0, 0, width, height);
            for (_, draw) in dialogs() {
                draw(&theme, screen, &mut Buffer::empty(screen));
            }
        }
    }
}
