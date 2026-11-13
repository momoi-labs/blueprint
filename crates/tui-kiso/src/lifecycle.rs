use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::put;
use crate::{Button, Size, StatusBadge, Theme};

/// The header row of a detail screen: what the record is, what you can do
/// to it, and the one action you do not want to hit by accident.
///
/// It takes slots, as the web `Lifecycle` does: [`StatusBadge`]s for the
/// status, [`Button`]s for the verbs and one more for the destructive action.
/// The widget sets every button to `Sm` so the row is one line. Status badges
/// are pills with one space between them. Verbs touch and a `│` in `border`
/// parts them, so they read as one choice among several. The destructive
/// action stands apart, four columns after the verbs, so a slip on a verb
/// cannot land on it.
///
/// ```text
///  ● Running   HTTP 200     Start │ Stop │ Restart        Remove
/// ```
///
/// It draws from the left of its area, in one row. Place it with
/// [`Lifecycle::width`]. A piece that does not fit is left out whole, from
/// the end; below the width of the status the app shows a
/// [`Menu`](crate::Menu) instead, as the web moves the verbs to a sheet.
#[derive(Clone, Debug)]
pub struct Lifecycle<'a> {
    theme: &'a Theme,
    status: Vec<StatusBadge<'a>>,
    actions: Vec<Button<'a>>,
    destructive: Option<Button<'a>>,
}

impl<'a> Lifecycle<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, status: Vec::new(), actions: Vec::new(), destructive: None }
    }

    /// Adds a status badge. Several badges are separate readings.
    #[must_use]
    pub fn status(mut self, badge: StatusBadge<'a>) -> Self {
        self.status.push(badge.pill(true));
        self
    }

    /// Adds a verb. With none, the verbs part is not drawn.
    #[must_use]
    pub fn action(mut self, button: Button<'a>) -> Self {
        self.actions.push(button.size(Size::Sm));
        self
    }

    /// The destructive action, such as Remove. It should open a
    /// confirmation.
    #[must_use]
    pub fn destructive(mut self, button: Button<'a>) -> Self {
        self.destructive = Some(button.size(Size::Sm));
        self
    }

    fn status_width(&self) -> u16 {
        let badges: u16 = self.status.iter().map(StatusBadge::width).sum();
        badges.saturating_add(self.status.len().saturating_sub(1) as u16)
    }

    fn actions_width(&self) -> u16 {
        let buttons: u16 = self.actions.iter().map(Button::width).sum();
        buttons.saturating_add(self.actions.len().saturating_sub(1) as u16)
    }

    /// The columns it takes with everything drawn.
    pub fn width(&self) -> u16 {
        let mut width = self.status_width();
        if !self.actions.is_empty() {
            width = width.saturating_add(if width > 0 { 3 } else { 0 }).saturating_add(self.actions_width());
        }
        if let Some(destructive) = &self.destructive {
            width = width.saturating_add(if width > 0 { 4 } else { 0 }).saturating_add(destructive.width());
        }
        width
    }
}

impl Widget for Lifecycle<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 {
            return;
        }
        let (t, actions_width) = (self.theme, self.actions_width());
        let divider = t.color(t.tokens().border);
        let right = area.right();
        let mut x = area.x;
        // A piece is drawn only when all of it fits.
        let fits = |x: u16, width: u16| u32::from(x) + u32::from(width) <= u32::from(right);
        for (i, badge) in self.status.into_iter().enumerate() {
            let width = badge.width();
            if i > 0 {
                x = x.saturating_add(1);
            }
            if !fits(x, width) {
                return;
            }
            badge.render(Rect::new(x, area.y, width, 1), buf);
            x = x.saturating_add(width);
        }
        let gap = |x: &mut u16, gap: u16| {
            if *x > area.x {
                *x = x.saturating_add(gap);
            }
        };
        if !self.actions.is_empty() {
            gap(&mut x, 3);
            if !fits(x, actions_width) {
                return;
            }
            for (i, button) in self.actions.into_iter().enumerate() {
                if i > 0 {
                    put(buf, x, area.y, "│", divider);
                    x = x.saturating_add(1);
                }
                let width = button.width();
                button.render(Rect::new(x, area.y, width, 1), buf);
                x = x.saturating_add(width);
            }
        }
        if let Some(button) = self.destructive {
            gap(&mut x, 4);
            let width = button.width();
            if fits(x, width) {
                button.render(Rect::new(x, area.y, width, 1), buf);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ButtonVariant;

    fn row(buf: &Buffer) -> String {
        (0..buf.area.width).map(|x| buf[(x, 0)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    fn lifecycle(t: &Theme) -> Lifecycle<'_> {
        Lifecycle::new(t)
            .status(StatusBadge::success(t, "Running"))
            .action(Button::new(t, "Stop"))
            .action(Button::new(t, "Restart"))
            .destructive(Button::new(t, "Remove").variant(ButtonVariant::Ghost))
    }

    #[test]
    fn status_verbs_and_the_destructive_action_stand_apart() {
        let t = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let l = lifecycle(&t);
        let width = l.width();
        let mut buf = Buffer::empty(Rect::new(0, 0, width + 2, 1));
        l.render(Rect::new(0, 0, width + 2, 1), &mut buf);
        let text = row(&buf);
        assert!(text.contains("Running") && text.contains("Stop") && text.contains("│") && text.ends_with("Remove"), "{text}");
        assert!(text.contains("Restart   "), "the verbs and Remove are parted: {text}");
    }

    #[test]
    fn a_piece_that_does_not_fit_is_left_out_whole() {
        let t = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let l = lifecycle(&t);
        let width = l.width();
        let mut buf = Buffer::empty(Rect::new(0, 0, width, 1));
        l.clone().render(Rect::new(0, 0, width - 1, 1), &mut buf);
        assert!(!row(&buf).contains("Remove") && row(&buf).contains("Restart"), "{}", row(&buf));
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 1));
        l.render(Rect::new(0, 0, 4, 1), &mut buf);
        assert_eq!(row(&buf), "");
    }

    #[test]
    fn no_verbs_leave_no_empty_part() {
        let t = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let only = Lifecycle::new(&t).status(StatusBadge::danger(&t, "Failed"));
        assert_eq!(only.width(), StatusBadge::danger(&t, "Failed").pill(true).width());
        let none = Lifecycle::new(&t).destructive(Button::new(&t, "Remove"));
        assert_eq!(none.width(), Button::new(&t, "Remove").size(Size::Sm).width());
    }
}
