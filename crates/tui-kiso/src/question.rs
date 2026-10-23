use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::{Buttons, Modal, Press, Theme};

/// A question in a [`Modal`], laid out as Crush's permission dialog: facts,
/// a block on `card` with what will happen, then the buttons. ←→ choose,
/// enter confirms the focused button and esc cancels.
#[derive(Clone, Debug)]
pub struct Question<'a> {
    theme: &'a Theme,
    title: String,
    facts: Vec<(&'a str, &'a str)>,
    block: Vec<String>,
    buttons: Vec<&'a str>,
    focused: usize,
    danger: bool,
}

impl<'a> Question<'a> {
    /// A question such as "Quit pg-probe?", with Cancel and OK.
    pub fn new(theme: &'a Theme, title: impl Into<String>) -> Self {
        Self {
            theme,
            title: title.into(),
            facts: Vec::new(),
            block: Vec::new(),
            buttons: vec!["Cancel", "OK"],
            focused: 0,
            danger: false,
        }
    }

    /// What the question is about, as `(name, value)` pairs.
    pub fn facts(mut self, facts: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        self.facts = facts.into_iter().collect();
        self
    }

    /// What will happen, one line per row, such as the command that runs.
    pub fn block(mut self, lines: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.block = lines.into_iter().map(Into::into).collect();
        self
    }

    /// The answers, Cancel first. Their first letters are their hotkeys.
    pub fn buttons(mut self, labels: impl IntoIterator<Item = &'a str>) -> Self {
        self.buttons = labels.into_iter().collect();
        self
    }

    /// The button with focus.
    pub fn focused(mut self, index: usize) -> Self {
        self.focused = index;
        self
    }

    /// True when the last answer destroys something: focused, it turns
    /// `danger`.
    pub fn danger(mut self, danger: bool) -> Self {
        self.danger = danger;
        self
    }
}

impl Widget for Question<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let content = self.block.iter().map(|line| cells(line) + 4).max().unwrap_or(0).max(44);
        let gap = usize::from(!self.facts.is_empty());
        let rows = self.facts.len() + gap + self.block.len() + 2 + 3;
        let clamp = |n: usize| n.min(usize::from(u16::MAX) - 2) as u16;
        let modal = Modal::new(t, self.title)
            .width(clamp(content + 6))
            .height(clamp(rows) + 2)
            .hints([("←/→", "choose"), ("enter", "confirm"), ("esc", "cancel")]);
        let area = modal.draw(screen, buf);
        if area.is_empty() {
            return;
        }
        // The buttons keep the last three rows, so they stay reachable when
        // the screen is too short for everything above them.
        let wanted = area.y.saturating_add(clamp(rows - 3));
        let buttons = wanted.min(area.bottom().saturating_sub(3)).max(area.y);
        let row = |y: usize| -> Option<u16> {
            let y = area.y.saturating_add(clamp(y));
            (y < buttons).then_some(y)
        };

        for (i, (key, value)) in self.facts.iter().enumerate() {
            if let Some(y) = row(i) {
                let line = Line::from(vec![Span::styled(format!("{key:<12}"), t.muted()), Span::raw(*value)]);
                buf.set_line(area.x, y, &line, area.width);
            }
        }
        let top = self.facts.len() + gap;
        for i in 0..self.block.len() + 2 {
            if let Some(y) = row(top + i) {
                buf.set_style(Rect::new(area.x, y, area.width, 1), Style::new().bg(t.color(t.tokens().card)));
                if let Some(line) = i.checked_sub(1).and_then(|i| self.block.get(i)) {
                    buf.set_stringn(area.x.saturating_add(2), y, line, area.width.saturating_sub(4).into(), t.text());
                }
            }
        }

        let last = self.buttons.len().saturating_sub(1);
        let presses = self.buttons.iter().enumerate().map(|(i, label)| {
            let press = match i == self.focused {
                true if self.danger && i == last => Press::Danger,
                true => Press::Focused,
                false => Press::Plain,
            };
            (*label, press)
        });
        Buttons::new(t, presses).render(Rect::new(area.x, buttons, area.width, 3).intersection(area), buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_short_screen_keeps_the_buttons() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for height in 0..12 {
            let screen = Rect::new(0, 0, 80, height);
            let mut buf = Buffer::empty(screen);
            let question = Question::new(&theme, "Remove laya?").facts([("Name", "laya")]).block(["It goes for good."]);
            question.buttons(["Cancel", "Remove"]).render(screen, &mut buf);
        }
        let screen = Rect::new(0, 0, 80, 7);
        let mut buf = Buffer::empty(screen);
        Question::new(&theme, "Remove laya?").block(["One", "Two", "Three"]).buttons(["Cancel", "Remove"]).render(screen, &mut buf);
        let text: String = (0..7).flat_map(|y| (0..80).map(move |x| (x, y))).map(|p| buf[p].symbol().to_owned()).collect();
        assert!(text.contains("Cancel") && text.contains("Remove"), "{text}");
    }
}
