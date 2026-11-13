use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::text::cells;
use crate::Theme;

/// What the keys do to a [`Disclosure`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum DisclosureState {
    #[default]
    Rest,
    Focus,
    Disabled,
}

/// A title that opens and closes the content under it: `▸` when closed,
/// `▾` when open, then the title.
///
/// The widget draws the title row only. The app keeps `open` and flips it
/// on `Enter` or `Space`, then draws the content in [`Disclosure::content`],
/// which is indented two columns, under the mark's text. Focus is the
/// selection of the crate, as on [`Link`](crate::Link): bold
/// `primary-foreground` on `primary`, over the mark and the title. A
/// disabled disclosure is `disabled` and stays closed.
#[derive(Clone, Copy, Debug)]
pub struct Disclosure<'a> {
    theme: &'a Theme,
    title: &'a str,
    open: bool,
    state: DisclosureState,
}

impl<'a> Disclosure<'a> {
    pub fn new(theme: &'a Theme, title: &'a str) -> Self {
        Self { theme, title, open: false, state: DisclosureState::Rest }
    }

    /// Shows the content. A disabled disclosure ignores it.
    #[must_use]
    pub fn open(mut self, open: bool) -> Self {
        self.open = open;
        self
    }

    #[must_use]
    pub fn state(mut self, state: DisclosureState) -> Self {
        self.state = state;
        self
    }

    /// Whether the content shows.
    pub fn is_open(&self) -> bool {
        self.open && self.state != DisclosureState::Disabled
    }

    /// The columns of the title row, without the focus fill.
    pub fn width(&self) -> u16 {
        (cells(self.title) as u16).saturating_add(2)
    }

    /// The rows it takes for content of `rows` rows: one when closed.
    pub fn height(&self, rows: u16) -> u16 {
        if self.is_open() {
            rows.saturating_add(1)
        } else {
            1
        }
    }

    /// Where the content goes: under the title row, two columns in.
    pub fn content(area: Rect) -> Rect {
        Rect::new(area.x.saturating_add(2), area.y.saturating_add(1), area.width.saturating_sub(2), area.height.saturating_sub(1))
    }
}

impl Widget for Disclosure<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.width == 0 || area.height == 0 {
            return;
        }
        let t = self.theme;
        let r = t.tokens();
        let mark = if self.is_open() { "▾" } else { "▸" };
        let (mark_style, title_style) = match self.state {
            DisclosureState::Rest => (t.muted(), t.strong()),
            DisclosureState::Focus => {
                let focus = t.fill(r.primary_foreground, r.primary).add_modifier(Modifier::BOLD);
                (focus, focus)
            }
            DisclosureState::Disabled => (t.disabled(), t.disabled()),
        };
        // Cut at the right edge of the area, not only of the buffer.
        let right = area.right().min(buf.area.right());
        if area.x < right && buf.area.contains(ratatui::layout::Position { x: area.x, y: area.y }) {
            write(buf, area.x, area.y, mark, mark_style);
            buf.set_stringn(area.x + 1, area.y, format!(" {}", self.title), usize::from(right - area.x - 1), title_style);
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
    fn the_mark_says_open_or_closed() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        Disclosure::new(&theme, "Details").render(Rect::new(0, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▸ Details   ");
        Disclosure::new(&theme, "Details").open(true).render(Rect::new(0, 0, 12, 1), &mut buf);
        assert_eq!(row(&buf, 0), "▾ Details   ");
    }

    #[test]
    fn content_sits_two_columns_in_and_a_disabled_one_stays_closed() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(Disclosure::content(Rect::new(4, 2, 30, 6)), Rect::new(6, 3, 28, 5));
        assert_eq!(Disclosure::content(Rect::new(4, 2, 1, 0)), Rect::new(6, 3, 0, 0));
        let disclosure = Disclosure::new(&theme, "More").open(true);
        assert_eq!(disclosure.height(3), 4);
        let disabled = disclosure.state(DisclosureState::Disabled);
        assert_eq!((disabled.height(3), disabled.is_open()), (1, false));
    }

    #[test]
    fn focus_fills_the_mark_and_title_and_the_title_is_cut_to_the_area() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 1));
        Disclosure::new(&theme, "A long title").state(DisclosureState::Focus).render(Rect::new(1, 0, 6, 1), &mut buf);
        assert_eq!(buf[(1, 0)].bg, theme.color(theme.tokens().primary));
        assert_eq!(buf[(0, 0)].bg, ratatui::style::Color::Reset);
        assert_eq!(buf[(7, 0)].symbol(), " ", "nothing is drawn past the area");
    }
}
