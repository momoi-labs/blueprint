use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::{Constraint, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::Line;
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::{Card, CardVariant, KeyHints, Theme, ACCENTS};

/// The theme picker, on an elevated card: dark or light on top, then each
/// accent with a swatch of its color before its name. The app redraws in the theme under the cursor as the
/// person moves, from [`ThemePicker::tokens`]; esc puts the one before back.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ThemePicker {
    /// The accent under the cursor, an index in [`ACCENTS`].
    pub accent: usize,
    pub light: bool,
    before: (usize, bool),
}

impl ThemePicker {
    pub fn new(accent: usize, light: bool) -> Self {
        Self { accent, light, before: (accent, light) }
    }

    /// The tokens of the theme under the cursor.
    pub fn tokens(&self) -> kiso_tokens::Theme {
        ACCENTS[self.accent.min(ACCENTS.len() - 1)].tokens(self.light)
    }

    /// ↑↓ pick the accent, ←→ dark or light. Returns false once the picker
    /// closes: enter keeps the theme, esc puts the one before back.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, code: KeyCode) -> bool {
        match code {
            KeyCode::Up | KeyCode::Char('k') => self.accent = self.accent.saturating_sub(1),
            KeyCode::Down | KeyCode::Char('j') => self.accent = (self.accent + 1).min(ACCENTS.len() - 1),
            KeyCode::Left | KeyCode::Right | KeyCode::Tab | KeyCode::Char('h' | 'l') => self.light = !self.light,
            KeyCode::Enter => return false,
            KeyCode::Esc | KeyCode::Char('q' | 't') => {
                (self.accent, self.light) = self.before;
                return false;
            }
            _ => {}
        }
        true
    }

    /// Draws the picker in `theme` over `screen`.
    pub fn view<'a>(&'a self, theme: &'a Theme) -> PickerView<'a> {
        PickerView { picker: self, theme }
    }
}

/// A [`ThemePicker`] on screen.
#[derive(Clone, Copy, Debug)]
pub struct PickerView<'a> {
    picker: &'a ThemePicker,
    theme: &'a Theme,
}

impl Widget for PickerView<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let (t, picker) = (self.theme, self.picker);
        let r = t.tokens();
        let keys = [("↑/↓", "accent"), ("←/→", "dark or light"), ("enter", "keep"), ("esc", "cancel")];
        // Half rows, a title and a gap, the mode and a gap, the accents, a gap, the keys.
        let height = ACCENTS.len() as u16 + 8;
        let area = screen.centered(Constraint::Length(60.min(screen.width)), Constraint::Length(height.min(screen.height)));
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let card = Card::new(t).variant(CardVariant::Elevated);
        card.render(area, buf);
        let inner = card.inner(area);
        if inner.height == 0 || inner.width < 2 {
            return;
        }
        let at = |dy: u16| Rect { y: inner.y.saturating_add(dy), height: 1, ..inner };
        let on_screen = |dy: u16| dy < inner.height;

        buf.set_line(inner.x, inner.y, &Line::styled("Theme", t.strong().add_modifier(Modifier::BOLD)), inner.width);

        if on_screen(2) {
            let mut x = inner.x;
            x += write(buf, x, at(2).y, "Mode", t.muted()) + 6;
            for (label, on) in [("Dark", !picker.light), ("Light", picker.light)] {
                let chip = format!(" {label} ");
                let width = chip.chars().count() as u16;
                write(buf, x, at(2).y, &chip, if on { t.fill(r.primary_foreground, r.primary) } else { t.muted() });
                x += width + 2;
            }
        }

        for (i, accent) in ACCENTS.iter().enumerate() {
            let dy = 4 + i as u16;
            if !on_screen(dy) {
                break;
            }
            let (y, selected) = (at(dy).y, i == picker.accent);
            let style = if selected { t.strong() } else { t.text() };
            write(buf, inner.x + 4, y, accent.name, style);
            if selected {
                t.select(buf, Rect::new(area.x + 1, y, area.width.saturating_sub(2), 1));
            }
            // The swatch comes last: the selection fill must not cover it.
            let swatch = Style::new().bg(t.color(accent.tokens(picker.light).primary));
            write(buf, inner.x, y, "  ", swatch);
        }

        let hints_dy = 5 + ACCENTS.len() as u16;
        if on_screen(hints_dy) {
            let spans = KeyHints::new(t, keys).spans(usize::from(inner.width));
            buf.set_line(inner.x, at(hints_dy).y, &Line::from(spans), inner.width);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn screen(picker: &ThemePicker, theme: &Theme, size: (u16, u16)) -> Buffer {
        let mut buf = Buffer::empty(Rect::new(0, 0, size.0, size.1));
        picker.view(theme).render(buf.area, &mut buf);
        buf
    }

    fn text(buf: &Buffer) -> String {
        (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol()).collect::<String>() + "\n").collect()
    }

    #[test]
    fn each_accent_has_a_swatch_in_its_color_before_its_name() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let buf = screen(&ThemePicker::new(0, false), &theme, (100, 30));
        let row = (0..30).find(|&y| (0..100).map(|x| buf[(x, y)].symbol()).collect::<String>().contains("terracotta")).unwrap();
        let x = (0..100).find(|&x| buf[(x, row)].bg == theme.color(ACCENTS[1].dark.primary)).unwrap();
        assert_eq!(buf[(x + 1, row)].bg, theme.color(ACCENTS[1].dark.primary));
    }

    #[test]
    fn only_the_accent_under_the_cursor_is_filled_as_selected() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let buf = screen(&ThemePicker::new(2, false), &theme, (100, 30));
        let row = |name: &str| (0..30).find(|&y| (0..100).map(|x| buf[(x, y)].symbol()).collect::<String>().contains(name)).unwrap();
        let (teal, cobalt) = (row("teal"), row("cobalt"));
        assert_eq!(buf[(45, teal)].bg, theme.selected_color());
        assert_ne!(buf[(45, cobalt)].bg, theme.selected_color());
    }

    #[test]
    fn it_lists_the_title_modes_and_keys_and_fits_80_by_24() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let shown = text(&screen(&ThemePicker::new(0, true), &theme, (80, 24)));
        for word in ["Theme", "Dark", "Light", "violet", "steel", "esc"] {
            assert!(shown.contains(word), "{word} is missing:\n{shown}");
        }
    }

    #[test]
    fn it_survives_a_tiny_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for size in [(1, 1), (10, 3), (60, 5)] {
            screen(&ThemePicker::new(11, false), &theme, size);
        }
    }
}
