use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::Span;
use ratatui::widgets::Widget;

use crate::text::cells;
use crate::Theme;

/// What the pointer and the keys do to a [`Link`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum LinkState {
    #[default]
    Rest,
    Hover,
    Focus,
    Disabled,
}

/// A destination: the label in `link`, underlined, so color is not the only
/// cue. Converts into a [`Span`], to sit in a line of running text.
///
/// Focus is the list selection of the crate: `primary-foreground` on
/// `primary`, bold. Hover turns the label bold. A disabled link is
/// `disabled`, with no underline. `external` adds `↗` after the label.
///
/// It sets no OSC 8 hyperlink: the escape sequence does not fit inside a
/// ratatui buffer, where each cell holds one symbol. The label stays text,
/// and the app follows the link on `Enter`.
#[derive(Clone, Copy, Debug)]
pub struct Link<'a> {
    theme: &'a Theme,
    label: &'a str,
    state: LinkState,
    external: bool,
}

impl<'a> Link<'a> {
    pub fn new(theme: &'a Theme, label: &'a str) -> Self {
        Self { theme, label, state: LinkState::Rest, external: false }
    }

    #[must_use]
    pub fn state(mut self, state: LinkState) -> Self {
        self.state = state;
        self
    }

    /// The destination leaves the product: `↗` after the label.
    #[must_use]
    pub fn external(mut self, external: bool) -> Self {
        self.external = external;
        self
    }

    fn text(&self) -> String {
        if self.external {
            format!("{} ↗", self.label)
        } else {
            self.label.to_owned()
        }
    }

    /// The columns the link takes.
    pub fn width(&self) -> u16 {
        cells(&self.text()) as u16
    }
}

impl From<Link<'_>> for Span<'static> {
    fn from(link: Link<'_>) -> Self {
        let t = link.theme;
        let r = t.tokens();
        let underlined = Modifier::UNDERLINED;
        let style = match link.state {
            LinkState::Rest => t.link().add_modifier(underlined),
            LinkState::Hover => t.link().add_modifier(underlined | Modifier::BOLD),
            LinkState::Focus => t.fill(r.primary_foreground, r.primary).add_modifier(underlined | Modifier::BOLD),
            LinkState::Disabled => t.disabled(),
        };
        Span::styled(link.text(), style)
    }
}

impl Widget for Link<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        Span::from(self).render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_link_is_underlined_and_a_disabled_one_is_not() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let rest = Span::from(Link::new(&theme, "Docs"));
        assert!(rest.style.add_modifier.contains(Modifier::UNDERLINED));
        assert_eq!(rest.style.fg, theme.link().fg);
        let off = Span::from(Link::new(&theme, "Docs").state(LinkState::Disabled));
        assert!(!off.style.add_modifier.contains(Modifier::UNDERLINED));
    }

    #[test]
    fn focus_fills_the_label_and_external_adds_an_arrow() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let link = Link::new(&theme, "Docs").external(true).state(LinkState::Focus);
        assert_eq!(link.width(), 6);
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 1));
        link.render(Rect::new(1, 0, 6, 1), &mut buf);
        assert_eq!((0..8).map(|x| buf[(x, 0)].symbol().to_owned()).collect::<String>(), " Docs ↗ ");
        assert_eq!(buf[(1, 0)].bg, theme.color(theme.tokens().primary));
        assert_eq!(buf[(0, 0)].bg, ratatui::style::Color::Reset);
    }
}
