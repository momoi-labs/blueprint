//! Text on a fill keeps 4.5:1 in every accent, dark and light, at both
//! color depths: the brand, buttons, the focused row, the toast.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::widgets::Widget;
use tui_kiso::{Field, Form, Page, Scroll, Theme, ACCENTS};

const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

fn rgb(color: Color) -> [u8; 3] {
    match color {
        Color::Rgb(r, g, b) => [r, g, b],
        Color::Indexed(i @ 16..=231) => {
            let i = i - 16;
            [LEVELS[usize::from(i / 36)], LEVELS[usize::from(i / 6 % 6)], LEVELS[usize::from(i % 6)]]
        }
        Color::Indexed(i @ 232..=255) => [8 + 10 * (i - 232); 3],
        other => panic!("Kiso never sends {other:?}"),
    }
}

fn contrast(a: [u8; 3], b: [u8; 3]) -> f64 {
    let luminance = |c: [u8; 3]| {
        let channel = |v: u8| {
            let v = f64::from(v) / 255.0;
            if v <= 0.04045 {
                v / 12.92
            } else {
                ((v + 0.055) / 1.055).powf(2.4)
            }
        };
        0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])
    };
    let (x, y) = (luminance(a), luminance(b));
    (x.max(y) + 0.05) / (x.min(y) + 0.05)
}

#[test]
fn text_on_a_fill_keeps_its_contrast() {
    for accent in ACCENTS {
        for light in [false, true] {
            let t = accent.tokens(light);
            for theme in [Theme::truecolor(t), Theme::xterm_256(t)] {
                let pairs = [
                    ("primary", t.primary_foreground, t.primary),
                    ("danger", t.danger_foreground, t.danger),
                    ("muted", t.foreground, t.muted),
                    ("toast", t.background, t.success_on_dark),
                ];
                for (name, text, fill) in pairs {
                    let style = theme.fill(text, fill);
                    let ratio = contrast(rgb(style.fg.unwrap()), rgb(style.bg.unwrap()));
                    let depth = if theme.is_truecolor() { "truecolor" } else { "256" };
                    assert!(ratio >= 4.5, "{} {} {depth} {name}: {ratio:.2}:1", accent.name, if light { "light" } else { "dark" });
                }
            }
        }
    }
}

#[test]
fn a_cursor_shows_on_a_selected_row() {
    for accent in ACCENTS {
        for light in [false, true] {
            let t = accent.tokens(light);
            for theme in [Theme::truecolor(t), Theme::xterm_256(t)] {
                let form = Form::new(vec![Field::text("Name", "").filled("hi")], 0);
                let mut page = Page::default();
                let selected = form.rows(&mut page, &theme, 40, 8, 0..1);
                let mut buf = Buffer::empty(Rect::new(0, 0, 42, 2));
                page.view(&theme, &Scroll::default()).selected(selected).render(Rect::new(0, 0, 40, 2), &mut buf);
                // "  Name    hi" then the cursor, at column 12.
                let (cursor, row) = (&buf[(12, 0)], &buf[(5, 0)]);
                let name = format!("{} {}", accent.name, if light { "light" } else { "dark" });
                assert_ne!(cursor.bg, row.bg, "{name}: the cursor has the row's color");
                assert!(contrast(rgb(cursor.fg), rgb(cursor.bg)) >= 4.5, "{name}: the cursor's text is not readable");
            }
        }
    }
}
