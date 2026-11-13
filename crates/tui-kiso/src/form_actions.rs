use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::text::{cells, take_cells};
use crate::{Button, Grid, Size, Theme, Tone};

/// The actions at the end of a form: a row of [`Button`]s against the
/// right edge, the primary action last, with an optional message on the
/// left in its tone. Each button keeps one free cell on each side for its
/// focus bars.
///
/// Under three grid tracks wide ([`Grid::span`] of [`Grid::MIN`]), the
/// buttons stack, each as wide as the area, the primary action first, and
/// the message goes above them. The buttons are `Md`, three rows each.
/// Give them their variant and state: one `Primary`, the rest `Default`
/// or `Ghost`, and `Focus` on the one with focus.
#[derive(Clone, Debug)]
pub struct FormActions<'a> {
    theme: &'a Theme,
    buttons: Vec<Button<'a>>,
    message: Option<(&'a str, Tone)>,
}

impl<'a> FormActions<'a> {
    /// The buttons in reading order, the primary action last.
    pub fn new(theme: &'a Theme, buttons: impl IntoIterator<Item = Button<'a>>) -> Self {
        Self { theme, buttons: buttons.into_iter().map(|b| b.size(Size::Md)).collect(), message: None }
    }

    /// A message about the form, as "Unsaved changes.", in `muted` for
    /// `Neutral` and in the tone's color for the others.
    #[must_use]
    pub fn message(mut self, text: &'a str, tone: Tone) -> Self {
        self.message = Some((text, tone));
        self
    }

    /// True when the buttons stack at `width`: under three grid tracks, or
    /// too narrow for the row.
    pub fn stacked(&self, width: u16) -> bool {
        width < Grid::span(Grid::MIN) || self.row_width().saturating_add(2) > width
    }

    /// The columns of the row of buttons, with a free cell between two.
    fn row_width(&self) -> u16 {
        let gaps = self.buttons.len().saturating_sub(1) as u16 * 2;
        self.buttons.iter().map(Button::width).fold(gaps, u16::saturating_add)
    }

    /// The rows the actions take at `width`.
    pub fn height(&self, width: u16) -> u16 {
        let n = self.buttons.len() as u16;
        if self.stacked(width) {
            n.saturating_mul(3).saturating_add(u16::from(self.message.is_some()))
        } else {
            3
        }
    }

    /// The actions as rows `width` wide, for a [`Page`](crate::Page): they
    /// scroll with it.
    pub fn lines(&self, width: u16) -> Vec<Line<'static>> {
        rows_of(width, self.height(width), |buf, area| self.clone().render(area, buf))
    }

    fn message_style(&self, tone: Tone) -> Style {
        match tone {
            Tone::Neutral => self.theme.muted(),
            tone => self.theme.fg(tone.rgb(self.theme)),
        }
    }
}

impl Widget for FormActions<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.is_empty() {
            return;
        }
        let (x, y) = (area.x, area.y);
        if self.stacked(area.width) {
            let mut top = y;
            if let Some((text, tone)) = self.message {
                let (text, _) = take_cells(text, usize::from(area.width.saturating_sub(1)));
                write(buf, x.saturating_add(1), top, text, self.message_style(tone));
                top = top.saturating_add(1);
            }
            // The primary action is last in reading order and first on top.
            let width = area.width.saturating_sub(2).max(1);
            for (i, button) in self.buttons.iter().rev().enumerate() {
                let at = top.saturating_add(i as u16 * 3);
                // A button takes 3 rows; one that does not fit is left out.
                if at.saturating_add(3) > area.bottom() {
                    break;
                }
                button.stretch(width).render(Rect::new(x.saturating_add(1), at, width, 3), buf);
            }
            return;
        }
        // The last button's focus bar keeps the last cell.
        let right = area.right().saturating_sub(1);
        let mut at = right.saturating_sub(self.row_width());
        if let Some((text, tone)) = self.message {
            let room = usize::from(at.saturating_sub(x).saturating_sub(3));
            if room > 0 {
                let (text, used) = take_cells(text, room);
                let shown = if used < cells(text) { format!("{}…", take_cells(text, room - 1).0) } else { text.to_owned() };
                write(buf, x.saturating_add(1), y.saturating_add(1), &shown, self.message_style(tone));
            }
        }
        if area.height < 3 {
            return;
        }
        for button in self.buttons {
            let width = button.width();
            button.render(Rect::new(at, y, width, 3), buf);
            at = at.saturating_add(width).saturating_add(2);
        }
    }
}

/// Draws into a blank buffer `width` by `height` and returns its rows as
/// lines. A cell nothing drew on is a plain space, so a page or
/// [`draw`](crate::input::draw) leaves what is under it.
pub(crate) fn rows_of(width: u16, height: u16, paint: impl FnOnce(&mut Buffer, Rect)) -> Vec<Line<'static>> {
    let area = Rect::new(0, 0, width, height);
    let mut buf = Buffer::empty(area);
    paint(&mut buf, area);
    let blank = ratatui::buffer::Cell::EMPTY;
    (0..height)
        .map(|y| {
            let mut spans: Vec<Span<'static>> = Vec::new();
            let mut x = 0;
            while x < width {
                let cell = &buf[(x, y)];
                let (text, style) = if *cell == blank { (" ".to_owned(), Style::default()) } else { (cell.symbol().to_owned(), kept(cell.style())) };
                x = x.saturating_add(cells(&text).max(1) as u16);
                match spans.last_mut() {
                    Some(last) if last.style == style => last.content.to_mut().push_str(&text),
                    _ => spans.push(Span::styled(text, style)),
                }
            }
            Line::from(spans)
        })
        .collect()
}

/// A style without the colors a blank buffer starts with, so a cell keeps
/// the fill under it where nothing filled it.
fn kept(mut style: Style) -> Style {
    let reset = |color: Option<Color>| color.filter(|c| *c != Color::Reset);
    style.fg = reset(style.fg);
    style.bg = reset(style.bg);
    style.underline_color = reset(style.underline_color);
    style
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ButtonState, ButtonVariant};

    fn actions(theme: &Theme) -> FormActions<'_> {
        let cancel = Button::new(theme, "Cancel");
        let save = Button::new(theme, "Save").variant(ButtonVariant::Primary).state(ButtonState::Focus);
        FormActions::new(theme, [cancel, save])
    }

    #[test]
    fn a_button_that_does_not_fit_is_left_out() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for width in [60, 12] {
            let mut buf = Buffer::empty(Rect::new(0, 0, width, 6));
            actions(&theme).render(Rect::new(0, 0, width, 2), &mut buf);
            for y in 2..6 {
                for x in 0..width {
                    assert_eq!(buf[(x, y)], ratatui::buffer::Cell::EMPTY, "{width} wide, cell {x},{y}");
                }
            }
        }
    }

    #[test]
    fn the_row_sits_on_the_right_with_the_primary_last() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let lines = actions(&theme).message("Unsaved changes.", Tone::Warning).lines(44);
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[1].to_string(), " Unsaved changes.        Cancel   ▐  Save  ▌");
        assert_eq!(lines[0].to_string(), "                       ▄▄▄▄▄▄▄▄▄▄ ▗▄▄▄▄▄▄▄▄▖");
        assert_eq!(lines[1].spans[0].style, Style::default(), "blank cells stay plain");
    }

    #[test]
    fn a_narrow_area_stacks_the_buttons_primary_first() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let actions = actions(&theme);
        assert!(actions.stacked(42) && !actions.stacked(43));
        assert_eq!(actions.height(30), 6);
        let lines = actions.lines(30);
        assert_eq!(lines[1].to_string(), "▐            Save            ▌");
        assert_eq!(lines[4].to_string().trim(), "Cancel");
        let fill = lines[4].spans.iter().find(|s| s.content.contains("ancel")).unwrap().style.bg;
        assert_eq!(fill, Some(theme.color(theme.tokens().secondary)));
    }

    #[test]
    fn tiny_areas_do_not_panic() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        for width in 0..50 {
            for height in 0..8 {
                let mut buf = Buffer::empty(Rect::new(0, 0, width, height));
                actions(&theme).message("Saved.", Tone::Neutral).render(Rect::new(0, 0, width, 9), &mut buf);
            }
        }
    }
}
