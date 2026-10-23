//! A ratatui buffer as HTML: one span per run of equal style.

use ratatui::buffer::Buffer;
use ratatui::style::{Color, Modifier};

const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

fn css(color: Color) -> Option<String> {
    let [r, g, b] = match color {
        Color::Rgb(r, g, b) => [r, g, b],
        Color::Indexed(i @ 16..=231) => {
            let i = i - 16;
            [LEVELS[usize::from(i / 36)], LEVELS[usize::from(i / 6 % 6)], LEVELS[usize::from(i % 6)]]
        }
        Color::Indexed(i @ 232..=255) => [8 + 10 * (i - 232); 3],
        Color::Reset => return None,
        // Kiso never sends the 16 named colors. Show one loudly.
        _ => [255, 0, 255],
    };
    Some(format!("#{r:02x}{g:02x}{b:02x}"))
}

fn escape(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
}

pub fn buffer(buffer: &Buffer) -> String {
    let area = buffer.area;
    let mut out = String::from("<div class=\"term\">");
    for y in 0..area.height {
        out.push_str("<div class=\"row\">");
        let mut run: Option<(String, String)> = None;
        // A wide character, such as 中, takes two cells; the second is a
        // blank the terminal draws over, so it is not written again.
        let mut covered = 0;
        for x in 0..area.width {
            if covered > 0 {
                covered -= 1;
                continue;
            }
            let cell = &buffer[(x, y)];
            covered = unicode_width::UnicodeWidthStr::width(cell.symbol()).saturating_sub(1);
            let mut style = String::new();
            if let Some(c) = css(cell.fg) {
                style += &format!("color:{c};");
            }
            if let Some(c) = css(cell.bg) {
                style += &format!("background:{c};");
            }
            if cell.modifier.contains(Modifier::BOLD) {
                style += "font-weight:700;";
            }
            if cell.modifier.contains(Modifier::UNDERLINED) {
                style += "text-decoration:underline;";
            }
            match &mut run {
                Some((s, text)) if *s == style => text.push_str(cell.symbol()),
                _ => {
                    if let Some((s, text)) = run.take() {
                        out += &format!("<span style=\"{s}\">{}</span>", escape(&text));
                    }
                    run = Some((style, cell.symbol().to_owned()));
                }
            }
        }
        if let Some((s, text)) = run {
            out += &format!("<span style=\"{s}\">{}</span>", escape(&text));
        }
        out.push_str("</div>");
    }
    out + "</div>"
}

pub fn page(title: &str, body: &str) -> String {
    format!(
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>{}</title><style>{STYLE}</style></head><body>{body}</body></html>",
        escape(title)
    )
}

const STYLE: &str = "body{margin:0;padding:8px;background:#151411;color:#eeece9;font:14px/1.5 system-ui,sans-serif}\
h2{font-size:15px;margin:16px 0 6px}\
.term{font-family:\"JetBrains Mono\",\"DejaVu Sans Mono\",ui-monospace,monospace;font-size:13px;line-height:17px;white-space:pre;display:inline-block;border:1px solid #494744;font-variant-ligatures:none}\
.row{height:17px}.row span{display:inline-block;height:17px;vertical-align:top}";

/// Gives cells left to the terminal's background the theme's colors, as
/// OSC 11 does on a real terminal.
#[allow(dead_code)]
pub fn opaque(buf: &mut Buffer, theme: &tui_kiso::Theme) {
    let r = theme.tokens();
    for cell in &mut buf.content {
        if cell.bg == Color::Reset {
            cell.bg = theme.color(r.background);
        }
        if cell.fg == Color::Reset {
            cell.fg = theme.color(r.foreground);
        }
    }
}
