use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::{blend, Modal, Theme, ACCENTS};

/// The theme picker: dark or light on top, then each accent with its fill
/// and its gradient. The app redraws in the theme under the cursor as the
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
        let height = ACCENTS.len() as u16 + 4;
        let area = Modal::new(t, "Theme").width(60).height(height).hints(keys).draw(screen, buf);
        if area.height < 3 || area.width < 2 {
            return;
        }
        let mode = |label: &'static str, on: bool| {
            if on {
                vec![Span::styled("◉ ", t.fg(r.primary)), Span::styled(label, t.strong())]
            } else {
                vec![Span::styled("○ ", t.subtle()), Span::styled(label, t.muted())]
            }
        };
        let mut spans = vec![Span::styled("  Mode      ", t.muted())];
        spans.extend(mode("Dark", !picker.light));
        spans.push(Span::raw("    "));
        spans.extend(mode("Light", picker.light));
        buf.set_line(area.x, area.y, &Line::from(spans), area.width);

        for (i, accent) in ACCENTS.iter().enumerate() {
            let y = area.y + 2 + i as u16;
            if y >= area.bottom() {
                break;
            }
            let tokens = accent.tokens(picker.light);
            let mut spans = vec![Span::raw("  "), Span::styled("  ", Style::new().bg(t.color(tokens.primary))), Span::raw("  ")];
            spans.extend((0..12).map(|n| Span::styled("━", t.fg(blend(&[tokens.primary, tokens.chart_1], n as f32 / 11.0)))));
            let style = if i == picker.accent { t.strong() } else { t.text() };
            spans.extend([Span::raw("  "), Span::styled(accent.name, style)]);
            buf.set_line(area.x, y, &Line::from(spans), area.width);
            if i == picker.accent {
                let row = Rect::new(area.x.saturating_sub(1), y, area.width + 2, 1).intersection(buf.area);
                if !row.is_empty() {
                    buf[(row.x, row.y)].set_symbol("▌").set_fg(t.color(r.primary));
                    t.select(buf, row);
                }
            }
        }
    }
}
