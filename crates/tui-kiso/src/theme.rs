use kiso_tokens::Rgb;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};

use crate::Look;

/// Kiso semantic roles as ratatui styles, for one accent, and the [`Look`]
/// of titles and rules.
///
/// Colors are 24-bit only when `COLORTERM` is `truecolor` or `24bit`.
/// Otherwise each color maps to the nearest xterm-256 color, and `selected`
/// keeps the accent's hue.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Theme {
    tokens: kiso_tokens::Theme,
    truecolor: bool,
    look: Look,
}

/// Glyphs that are marks, not text. On a selected row they need 3:1.
const MARKS: &str = "●◐○◉▲▼✓✕▁▂▃▄▅▆▇█━╱│─▌";

impl Theme {
    /// A theme from a dark accent, such as `kiso_tokens::GOLD_DARK`. Reads
    /// `COLORTERM` to pick the color depth.
    pub fn new(tokens: kiso_tokens::Theme) -> Self {
        let truecolor = std::env::var("COLORTERM")
            .map(|v| matches!(v.to_ascii_lowercase().as_str(), "truecolor" | "24bit"))
            .unwrap_or(false);
        Self { tokens, truecolor, look: Look::DEFAULT }
    }

    /// A theme that sends 24-bit colors.
    pub fn truecolor(tokens: kiso_tokens::Theme) -> Self {
        Self { tokens, truecolor: true, look: Look::DEFAULT }
    }

    /// A theme that sends xterm-256 colors.
    pub fn xterm_256(tokens: kiso_tokens::Theme) -> Self {
        Self { tokens, truecolor: false, look: Look::DEFAULT }
    }

    /// The same theme with other tokens, at the same color depth and look,
    /// as when the person picks another accent. For a light theme, take the
    /// tokens from [`Accent::tokens`](crate::Accent::tokens).
    #[must_use]
    pub fn with_tokens(self, tokens: kiso_tokens::Theme) -> Self {
        Self { tokens, ..self }
    }

    /// The same theme with another look for titles and rules.
    #[must_use]
    pub fn with_look(self, look: Look) -> Self {
        Self { look, ..self }
    }

    /// How titles and section rules are drawn.
    pub fn look(&self) -> Look {
        self.look
    }

    /// The token values this theme draws with.
    pub fn tokens(&self) -> &kiso_tokens::Theme {
        &self.tokens
    }

    /// True when the theme sends 24-bit colors.
    pub fn is_truecolor(&self) -> bool {
        self.truecolor
    }

    /// A token color at this theme's color depth.
    pub fn color(&self, rgb: Rgb) -> Color {
        if self.truecolor {
            Color::Rgb(rgb[0], rgb[1], rgb[2])
        } else {
            Color::Indexed(xterm_256(rgb))
        }
    }

    /// The `selected` fill. In 256 colors, a cube color near the accent's hue.
    pub fn selected_color(&self) -> Color {
        if self.truecolor {
            self.color(self.tokens.selected)
        } else {
            Color::Indexed(selected_256(self.tokens.selected, self.tokens.background))
        }
    }

    /// A token color as the text color.
    pub fn fg(&self, rgb: Rgb) -> Style {
        Style::new().fg(self.color(rgb))
    }

    /// The gradient of titles, rules and the spinner: `primary` to
    /// `chart-1`. Blend along it with [`blend`](crate::blend).
    pub fn stops(&self) -> [Rgb; 2] {
        [self.tokens.primary, self.tokens.chart_1]
    }

    /// The screen: `foreground` on `background`.
    pub fn base(&self) -> Style {
        self.text().bg(self.color(self.tokens.background))
    }
    /// Body text: `foreground`.
    pub fn text(&self) -> Style {
        self.fg(self.tokens.foreground)
    }
    /// Emphasis: bold `foreground`.
    pub fn strong(&self) -> Style {
        self.text().add_modifier(Modifier::BOLD)
    }
    /// Secondary text: `muted-foreground`.
    pub fn muted(&self) -> Style {
        self.fg(self.tokens.muted_foreground)
    }
    /// Rules, rails and other marks that are not text: `subtle-foreground`.
    pub fn subtle(&self) -> Style {
        self.fg(self.tokens.subtle_foreground)
    }
    /// Keys and links: `link`.
    pub fn link(&self) -> Style {
        self.fg(self.tokens.link)
    }
    /// Focus marks: `focus`.
    pub fn focus(&self) -> Style {
        self.fg(self.tokens.focus)
    }
    /// Unavailable items: `disabled`.
    pub fn disabled(&self) -> Style {
        self.fg(self.tokens.disabled)
    }
    /// Brand: bold `primary-foreground` on `primary`.
    pub fn brand(&self) -> Style {
        self.fill(self.tokens.primary_foreground, self.tokens.primary).add_modifier(Modifier::BOLD)
    }

    /// Text in `text` on a `fill`, such as a button or the focused row.
    /// In 256 colors, where the nearest colors can lose contrast, the fill
    /// moves to the nearest cube color of its hue that keeps 4.5:1 with
    /// the text. It never takes the `selected` or `background` color, so a
    /// cursor stays visible on a selected row.
    pub fn fill(&self, text: Rgb, fill: Rgb) -> Style {
        let fg = self.color(text);
        if self.truecolor {
            return Style::new().fg(fg).bg(self.color(fill));
        }
        let ink = drawn_rgb(fg).unwrap_or(text);
        let taken = [xterm_256(self.tokens.background), selected_256(self.tokens.selected, self.tokens.background)];
        let plain = xterm_256(fill);
        if contrast(xterm_rgb(plain), ink) >= 4.5 && !taken.contains(&plain) {
            return Style::new().fg(fg).bg(Color::Indexed(plain));
        }
        let readable = |i: &u8| contrast(xterm_rgb(*i), ink) >= 4.5 && !taken.contains(i);
        let near_hue = |i: &u8| match (hue(fill), hue(xterm_rgb(*i))) {
            (Some(want), Some(got)) => {
                let diff = (want - got).abs();
                diff.min(360.0 - diff) <= 25.0
            }
            (None, None) => true,
            _ => false,
        };
        let nearest = |colors: &mut dyn Iterator<Item = u8>| colors.min_by_key(|i| distance(xterm_rgb(*i), fill));
        let bg = nearest(&mut (16..=255u8).filter(readable).filter(near_hue))
            .or_else(|| nearest(&mut (16..=255u8).filter(readable)))
            .unwrap_or(plain);
        Style::new().fg(fg).bg(Color::Indexed(bg))
    }
    /// Table header row and section bar: bold `foreground` on `muted`.
    pub fn bar(&self) -> Style {
        self.strong().bg(self.color(self.tokens.muted))
    }
    /// A selected row: the `selected` background only.
    pub fn selected(&self) -> Style {
        Style::new().bg(self.selected_color())
    }
    /// An inline panel: `foreground` on `surface`.
    pub fn surface(&self) -> Style {
        self.text().bg(self.color(self.tokens.surface))
    }
    /// A popup: `foreground` on `elevated-surface`.
    pub fn elevated(&self) -> Style {
        self.text().bg(self.color(self.tokens.elevated_surface))
    }
    /// Panel and popup frames: `border`.
    pub fn border(&self) -> Style {
        self.fg(self.tokens.border)
    }
    /// `success-on-dark`.
    pub fn success(&self) -> Style {
        self.fg(self.tokens.success_on_dark)
    }
    /// `warning-on-dark`.
    pub fn warning(&self) -> Style {
        self.fg(self.tokens.warning_on_dark)
    }
    /// `danger-on-dark`.
    pub fn danger(&self) -> Style {
        self.fg(self.tokens.danger_on_dark)
    }
    /// `info-on-dark`.
    pub fn info(&self) -> Style {
        self.fg(self.tokens.info_on_dark)
    }

    /// Paints `area` as a selected row. Only the background changes, except
    /// on cells filled with `primary`, such as a text cursor, which keep
    /// theirs. A cell below its minimum on `selected` (4.5:1 for text, 3:1
    /// for a mark) takes `foreground`, and a status word in a state color
    /// (`success`, `warning`, `danger`, `info`) that loses it turns bold.
    /// A neutral status, in `muted-foreground`, stays plain.
    pub fn select(&self, buf: &mut Buffer, area: Rect) {
        let fill = self.selected_color();
        let fill_rgb = drawn_rgb(fill).unwrap_or(self.tokens.selected);
        let t = &self.tokens;
        // A cell on `primary`, as the theme draws it, keeps its fill.
        let primary = [self.color(t.primary), self.fill(t.primary_foreground, t.primary).bg.unwrap_or(Color::Reset)];
        let status = [t.success_on_dark, t.warning_on_dark, t.danger_on_dark, t.info_on_dark]
            .map(|rgb| self.color(rgb));
        let area = area.intersection(buf.area);
        for y in area.top()..area.bottom() {
            for x in area.left()..area.right() {
                let cell = &mut buf[(x, y)];
                if primary.contains(&cell.bg) {
                    continue;
                }
                cell.bg = fill;
                if cell.symbol().trim().is_empty() {
                    continue;
                }
                let Some(rgb) = drawn_rgb(cell.fg) else { continue };
                let mark = MARKS.contains(cell.symbol());
                if contrast(rgb, fill_rgb) < if mark { 3.0 } else { 4.5 } {
                    if !mark && status.contains(&cell.fg) {
                        cell.modifier.insert(Modifier::BOLD);
                    }
                    cell.fg = self.color(t.foreground);
                }
            }
        }
    }
}

impl Theme {
    /// Paints `area` as the focused row of a plain list, as Crush does:
    /// `primary-foreground` on `primary`.
    pub fn select_fill(&self, buf: &mut Buffer, area: Rect) {
        let style = self.fill(self.tokens.primary_foreground, self.tokens.primary);
        buf.set_style(area.intersection(buf.area), style);
    }
}

/// The RGB a terminal draws for a color Kiso sends.
fn drawn_rgb(color: Color) -> Option<Rgb> {
    match color {
        Color::Rgb(r, g, b) => Some([r, g, b]),
        Color::Indexed(i) if i >= 16 => Some(xterm_rgb(i)),
        _ => None,
    }
}

/// WCAG 2 contrast ratio.
fn contrast(a: Rgb, b: Rgb) -> f64 {
    let luminance = |rgb: Rgb| {
        let channel = |v: u8| {
            let v = f64::from(v) / 255.0;
            if v <= 0.04045 {
                v / 12.92
            } else {
                ((v + 0.055) / 1.055).powf(2.4)
            }
        };
        0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
    };
    let (x, y) = (luminance(a), luminance(b));
    (x.max(y) + 0.05) / (x.min(y) + 0.05)
}

const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

/// The nearest xterm color: the 6x6x6 cube or the grey ramp.
fn xterm_256([r, g, b]: Rgb) -> u8 {
    let nearest = |value: u8| {
        (0..6)
            .min_by_key(|&i| (i32::from(LEVELS[i]) - i32::from(value)).abs())
            .unwrap_or(0)
    };
    let (ri, gi, bi) = (nearest(r), nearest(g), nearest(b));
    let cube = [LEVELS[ri], LEVELS[gi], LEVELS[bi]];
    let average = (u32::from(r) + u32::from(g) + u32::from(b)) / 3;
    let step = (average.saturating_sub(3) / 10).min(23) as u8;
    let grey = 8 + 10 * step;
    if distance([r, g, b], [grey, grey, grey]) < distance([r, g, b], cube) {
        232 + step
    } else {
        16 + 36 * ri as u8 + 6 * gi as u8 + bi as u8
    }
}

/// The RGB an xterm index draws.
pub(crate) fn xterm_rgb(index: u8) -> Rgb {
    match index {
        16..=231 => {
            let i = index - 16;
            [LEVELS[usize::from(i / 36)], LEVELS[usize::from(i / 6 % 6)], LEVELS[usize::from(i % 6)]]
        }
        232..=255 => {
            let v = 8 + 10 * (index - 232);
            [v, v, v]
        }
        _ => [0, 0, 0],
    }
}

fn distance(a: Rgb, b: Rgb) -> i32 {
    (0..3).map(|i| (i32::from(a[i]) - i32::from(b[i])).pow(2)).sum()
}

fn hue([r, g, b]: Rgb) -> Option<f64> {
    let (r, g, b) = (f64::from(r), f64::from(g), f64::from(b));
    let max = r.max(g).max(b);
    let d = max - r.min(g).min(b);
    if d < 1.0 {
        return None;
    }
    let h = if max == r {
        60.0 * (((g - b) / d) % 6.0)
    } else if max == g {
        60.0 * ((b - r) / d + 2.0)
    } else {
        60.0 * ((r - g) / d + 4.0)
    };
    Some((h + 360.0) % 360.0)
}

/// `selected` in 256 colors: the nearest cube color within 25 degrees of
/// its hue that differs from `background`. Distance alone can land on another
/// hue: for gold it is a dark red.
fn selected_256(selected: Rgb, background: Rgb) -> u8 {
    let plain = xterm_256(selected);
    let Some(target) = hue(selected) else { return plain };
    let background = xterm_256(background);
    (16..=231u8)
        .filter(|&i| i != background)
        .filter(|&i| {
            hue(xterm_rgb(i)).is_some_and(|h| {
                let diff = (h - target).abs();
                diff.min(360.0 - diff) <= 25.0
            })
        })
        .min_by_key(|&i| distance(xterm_rgb(i), selected))
        .unwrap_or(plain)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gold_selected_in_256_colors_is_gold() {
        let t = kiso_tokens::GOLD_DARK;
        let index = selected_256(t.selected, t.background);
        let [r, g, b] = xterm_rgb(index);
        assert!(index < 232 && !(r == g && g == b), "xterm {index} is grey");
        assert_ne!(index, xterm_256(t.background), "same as background");
        let h = hue([r, g, b]).unwrap();
        assert!((20.0..=70.0).contains(&h), "xterm {index} has hue {h}, red or off gold");
    }
}
