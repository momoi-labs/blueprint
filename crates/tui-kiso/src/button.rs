use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::widgets::Widget;

use crate::surface::{cap, put, write};
use crate::text::cells;
use crate::{blend, braille, Size, Theme};

/// What the action of a [`Button`] is.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonVariant {
    /// `secondary-foreground` on `secondary`.
    #[default]
    Default,
    /// The main action: bold `primary-foreground` on `primary`.
    Primary,
    /// Bold `danger-foreground` on `danger`.
    Destructive,
    /// `muted-foreground` with no fill.
    Ghost,
}

/// What the pointer and the keys do to a [`Button`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonState {
    #[default]
    Rest,
    Hover,
    Focus,
    Disabled,
    /// The action runs. A spinner goes before the label, at this tick.
    Loading(u32),
}

/// Starts an action. The variant says what the action is and the state
/// says what the pointer and the keys do, so a primary button does not
/// need focus to look primary.
///
/// `Md` takes three rows: the label with two columns of padding and half a
/// row of fill above and below. `Sm` takes one row. Focus is a half-cell
/// bar of the `focus` color on each side: `Md` draws it in the cell before
/// and the cell after the button, so keep those free. The first letter of
/// the label is underlined as the hotkey. It draws [`Button::width`]
/// columns from the top left of its area.
#[derive(Clone, Copy, Debug)]
pub struct Button<'a> {
    theme: &'a Theme,
    label: &'a str,
    variant: ButtonVariant,
    state: ButtonState,
    size: Size,
}

impl<'a> Button<'a> {
    pub fn new(theme: &'a Theme, label: &'a str) -> Self {
        Self { theme, label, variant: ButtonVariant::Default, state: ButtonState::Rest, size: Size::Md }
    }

    #[must_use]
    pub fn variant(mut self, variant: ButtonVariant) -> Self {
        self.variant = variant;
        self
    }

    #[must_use]
    pub fn state(mut self, state: ButtonState) -> Self {
        self.state = state;
        self
    }

    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    fn shown(&self) -> String {
        match self.state {
            ButtonState::Loading(tick) => format!("{} {}", braille(tick), self.label),
            _ => self.label.to_owned(),
        }
    }

    /// The columns the button takes, without the focus bars of `Md`.
    pub fn width(&self) -> u16 {
        cells(&self.shown()) as u16 + 4
    }

    /// The rows the button takes: three for `Md` and one for `Sm`.
    pub fn height(&self) -> u16 {
        match self.size {
            Size::Sm => 1,
            Size::Md => 3,
        }
    }

    /// The hotkey: the first letter or digit of the label, in lowercase.
    /// An icon before the label is not the hotkey.
    pub fn hotkey(&self) -> Option<char> {
        self.label.chars().find(|c| c.is_alphanumeric()).and_then(|c| c.to_lowercase().next())
    }
}

impl Widget for Button<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let (x, y) = (area.x, area.y);
        let hover = self.state == ButtonState::Hover;
        let (mut fill, mut text) = match (self.variant, hover) {
            (ButtonVariant::Default, false) => (Some(r.secondary), r.secondary_foreground),
            (ButtonVariant::Default, true) => (Some(r.secondary_hover), r.secondary_foreground),
            (ButtonVariant::Primary, false) => (Some(r.primary), r.primary_foreground),
            (ButtonVariant::Primary, true) => (Some(r.primary_hover), r.primary_foreground),
            (ButtonVariant::Destructive, false) => (Some(r.danger), r.danger_foreground),
            (ButtonVariant::Destructive, true) => (Some(blend(&[r.danger, r.foreground], 0.18)), r.danger_foreground),
            (ButtonVariant::Ghost, false) => (None, r.muted_foreground),
            (ButtonVariant::Ghost, true) => (Some(r.accent_surface_hover), r.foreground),
        };
        let off = self.state == ButtonState::Disabled;
        if off {
            fill = fill.map(|_| r.disabled_surface);
            text = r.disabled;
        }
        let mut style = match fill {
            // Disabled text is exempt from contrast, so the fill keeps its
            // own color in 256 colors too.
            Some(fill) if off => t.fg(text).bg(t.color(fill)),
            Some(fill) => t.fill(text, fill),
            None => t.fg(text),
        };
        if matches!(self.variant, ButtonVariant::Primary | ButtonVariant::Destructive) && !off {
            style = style.add_modifier(Modifier::BOLD);
        }
        let focus = (self.state == ButtonState::Focus).then(|| t.color(r.focus));
        let shown = self.shown();
        let width = self.width();
        let last = x.saturating_add(width - 1);
        let row = match self.size {
            Size::Sm => {
                write(buf, x.saturating_add(1), y, &format!(" {shown} "), style);
                if let Some(bg) = style.bg {
                    let end = focus.unwrap_or(bg);
                    cap(t, buf, x, y, true, end);
                    cap(t, buf, last, y, false, end);
                } else if let Some(ring) = focus {
                    put(buf, x, y, "▐", ring);
                    put(buf, last, y, "▌", ring);
                }
                y
            }
            Size::Md => {
                let below = y.saturating_add(2);
                if let Some(bg) = style.bg {
                    for at in x..=last {
                        put(buf, at, y, "▄", bg);
                        put(buf, at, below, "▀", bg);
                    }
                }
                write(buf, x, y.saturating_add(1), &format!("  {shown}  "), style);
                if let Some(ring) = focus {
                    for (dy, left, right) in [(0, "▗", "▖"), (1, "▐", "▌"), (2, "▝", "▘")] {
                        if x > 0 {
                            put(buf, x - 1, y.saturating_add(dy), left, ring);
                        }
                        put(buf, last.saturating_add(1), y.saturating_add(dy), right, ring);
                    }
                }
                y.saturating_add(1)
            }
        };
        if matches!(self.state, ButtonState::Disabled | ButtonState::Loading(_)) {
            return;
        }
        if let Some((at, _)) = self.label.char_indices().find(|(_, c)| c.is_alphanumeric()) {
            let column = x.saturating_add(2 + cells(&self.label[..at]) as u16);
            if let Some(cell) = buf.cell_mut((column, row)) {
                cell.modifier.insert(Modifier::UNDERLINED);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn md_takes_three_rows_and_focus_goes_outside() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let button = Button::new(&theme, "Save").variant(ButtonVariant::Primary).state(ButtonState::Focus);
        assert_eq!((button.width(), button.height()), (8, 3));
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 3));
        button.render(Rect::new(1, 0, 8, 3), &mut buf);
        assert_eq!(row(&buf, 0), "▗▄▄▄▄▄▄▄▄▖");
        assert_eq!(row(&buf, 1), "▐  Save  ▌");
        assert_eq!(row(&buf, 2), "▝▀▀▀▀▀▀▀▀▘");
        assert!(buf[(3, 1)].modifier.contains(Modifier::UNDERLINED));
    }

    #[test]
    fn a_disabled_button_keeps_its_fill_in_256_colors() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Button::new(&theme, "Save").state(ButtonState::Disabled).size(Size::Sm).render(buf.area, &mut buf);
        assert_eq!(buf[(2, 0)].bg, theme.color(theme.tokens().disabled_surface));
    }

    #[test]
    fn the_hotkey_is_the_first_letter_and_not_the_icon() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let button = Button::new(&theme, "+ New project").size(Size::Sm);
        assert_eq!(button.hotkey(), Some('n'));
        let mut buf = Buffer::empty(Rect::new(0, 0, 17, 1));
        button.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "  + New project  ");
        assert!(!buf[(2, 0)].modifier.contains(Modifier::UNDERLINED));
        assert!(buf[(4, 0)].modifier.contains(Modifier::UNDERLINED));
    }

    #[test]
    fn a_loading_or_disabled_button_has_no_hotkey_mark() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for state in [ButtonState::Loading(0), ButtonState::Disabled] {
            let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
            Button::new(&theme, "Save").state(state).size(Size::Sm).render(buf.area, &mut buf);
            assert!(buf.content.iter().all(|cell| !cell.modifier.contains(Modifier::UNDERLINED)));
        }
    }
}
