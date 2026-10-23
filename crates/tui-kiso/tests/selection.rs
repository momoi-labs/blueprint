//! A selected row stays readable in every accent, dark and light, at both
//! color depths: text on it keeps 4.5:1 and marks 3:1, as the contract asks.

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;
use tui_kiso::{Page, Scroll, StatusBadge, Theme, ACCENTS};

const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

/// The RGB a terminal draws for a color.
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
fn a_selected_row_keeps_its_contrast() {
    for accent in ACCENTS {
        for light in [false, true] {
            let tokens = accent.tokens(light);
            for theme in [Theme::truecolor(tokens), Theme::xterm_256(tokens)] {
                let mut page = Page::default();
                let mut spans = vec![Span::raw("  pg-main-2  "), Span::styled("eu-west  ", theme.muted())];
                spans.extend(Line::from(StatusBadge::danger(&theme, "Failed")).spans);
                page.item([Line::from(spans)]);
                let area = Rect::new(0, 0, 40, 1);
                let mut buf = Buffer::empty(Rect::new(0, 0, 42, 1));
                page.view(&theme, &Scroll::default()).selected(Some(0)).render(area, &mut buf);

                let fill = rgb(theme.selected_color());
                let name = format!("{} {}", accent.name, if light { "light" } else { "dark" });
                assert_eq!(buf[(0, 0)].symbol(), "▌", "{name}");
                for x in 0..area.width {
                    let cell = &buf[(x, 0)];
                    if cell.symbol().trim().is_empty() {
                        continue;
                    }
                    let mark = ["●", "▌"].contains(&cell.symbol());
                    // Text without a color of its own shows `foreground`,
                    // which the app sets with OSC 10.
                    let fg = if cell.fg == Color::Reset { theme.color(tokens.foreground) } else { cell.fg };
                    let ratio = contrast(rgb(fg), fill);
                    let minimum = if mark { 3.0 } else { 4.5 };
                    assert!(ratio >= minimum, "{name}: {:?} at {x} is {ratio:.2}:1", cell.symbol());
                }
            }
        }
    }
}
