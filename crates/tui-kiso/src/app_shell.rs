use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;
use ratatui::style::Style;

use crate::text::cells;
use crate::{Side, Theme};

/// Where each part of a screen goes. See [`AppShell::areas`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ShellAreas {
    /// The app bar, one row across the screen, when the shell has one.
    pub header: Option<Rect>,
    /// The sidebar, beside the page. `None` when there is none, or when it
    /// is collapsed.
    pub sidebar: Option<Rect>,
    /// The collapsed sidebar, opened over the page. Draw it last, with
    /// [`AppShell::paint_overlay`].
    pub overlay: Option<Rect>,
    /// The page, less the columns for its scrollbar.
    pub page: Rect,
    /// The footer row, for [`KeyHints`](crate::KeyHints).
    pub footer: Rect,
    /// True when the screen has a sidebar that is too narrow to show. Offer
    /// a key that opens it.
    pub collapsed: bool,
}

/// The layout of a whole screen: the app bar, the sidebar, the page and the
/// footer. It draws nothing, like [`Grid`](crate::Grid): the app draws a
/// widget in each area.
///
/// The screen keeps two columns on each side, and the footer is the last
/// row. With a header, it takes the first row and an empty row follows it.
/// The sidebar is as wide as the app asks, four columns from the page, on
/// the [`Side`] the product picks. Three sizes change the layout:
///
/// - Under 80 by 24 the screen is [`too_small`](AppShell::too_small). Draw
///   [`message`](AppShell::message) and nothing else.
/// - Under 100 columns, or when the page would get fewer than 60, the
///   sidebar collapses: there is no `sidebar` area. A key opens it as an
///   overlay on its side; pass `.open(true)` and draw the `overlay` area.
/// - From 100 columns the sidebar sits beside the page.
#[derive(Clone, Copy, Debug)]
pub struct AppShell {
    screen: Rect,
    side: Side,
    sidebar: u16,
    header: bool,
    open: bool,
}

impl AppShell {
    /// The least width of a screen.
    pub const MIN_WIDTH: u16 = 80;
    /// The least height of a screen.
    pub const MIN_HEIGHT: u16 = 24;
    /// From this width, the sidebar sits beside the page.
    pub const WIDE: u16 = 100;
    /// The fewest columns of a page that has a sidebar beside it.
    pub const PAGE: u16 = 60;
    /// The columns kept on each side of the screen.
    pub const MARGIN: u16 = 2;

    /// The layout of `screen`, with no header and no sidebar.
    pub fn new(screen: Rect) -> Self {
        Self { screen, side: Side::Left, sidebar: 0, header: false, open: false }
    }

    /// The side of the sidebar. [`Side::Left`] by default.
    #[must_use]
    pub fn side(mut self, side: Side) -> Self {
        self.side = side;
        self
    }

    /// A sidebar `width` columns wide, such as [`Sidebar::width`](crate::Sidebar::width).
    #[must_use]
    pub fn sidebar(mut self, width: u16) -> Self {
        self.sidebar = width;
        self
    }

    /// Takes the first row for the app bar, and an empty row after it.
    #[must_use]
    pub fn header(mut self, header: bool) -> Self {
        self.header = header;
        self
    }

    /// True while the person has the collapsed sidebar open.
    #[must_use]
    pub fn open(mut self, open: bool) -> Self {
        self.open = open;
        self
    }

    /// True when the screen is under 80 by 24.
    pub fn too_small(&self) -> bool {
        self.screen.width < Self::MIN_WIDTH || self.screen.height < Self::MIN_HEIGHT
    }

    /// The areas of the screen. Every one is inside the screen, whatever
    /// its size.
    pub fn areas(&self) -> ShellAreas {
        let screen = self.screen;
        let body = Rect::new(
            screen.x.saturating_add(Self::MARGIN),
            screen.y,
            screen.width.saturating_sub(2 * Self::MARGIN),
            screen.height.saturating_sub(1),
        );
        let footer = Rect { y: screen.bottom().saturating_sub(1).max(screen.y), height: screen.height.min(1), ..body };
        let header = (self.header && body.height >= 2).then_some(Rect { height: 1, ..body });
        let top = if header.is_some() { 2 } else { 0 };
        let content = Rect { y: body.y.saturating_add(top), height: body.height - top, ..body };
        let width = self.sidebar;
        // The page loses the sidebar, the gap, and two columns for its
        // scrollbar on the side of the sidebar.
        let taken = match self.side {
            Side::Left => width.saturating_add(6),
            Side::Right => width.saturating_add(4),
        };
        let beside = width > 0 && screen.width >= Self::WIDE && content.width >= taken.saturating_add(Self::PAGE);
        let collapsed = width > 0 && !beside;
        if !beside {
            let page = Rect { width: content.width.saturating_sub(2), ..content };
            let overlay = (collapsed && self.open).then(|| {
                let wide = width.saturating_add(4).min(screen.width);
                let x = match self.side {
                    Side::Left => screen.x,
                    Side::Right => screen.right() - wide,
                };
                Rect { x, width: wide, ..content }
            });
            return ShellAreas { header, sidebar: None, overlay, page, footer, collapsed };
        }
        let (sidebar, page) = match self.side {
            Side::Left => (
                Rect { width, ..content },
                Rect { x: content.x + width + 4, width: content.width - width - 6, ..content },
            ),
            Side::Right => (
                Rect { x: content.right() - width, width, ..content },
                Rect { width: content.width - width - 4, ..content },
            ),
        };
        ShellAreas { header, sidebar: Some(sidebar), overlay: None, page, footer, collapsed }
    }

    /// Draws the "too small" message, centered in the screen: what the
    /// screen needs and what it has. It writes nothing else.
    pub fn message(&self, theme: &Theme, buf: &mut Buffer) {
        let screen = self.screen.intersection(buf.area);
        if screen.is_empty() {
            return;
        }
        let needs = format!("Needs {} by {}, has {} by {}", Self::MIN_WIDTH, Self::MIN_HEIGHT, self.screen.width, self.screen.height);
        let lines: [(&str, Style); 2] = [("Terminal too small", theme.strong()), (&needs, theme.muted())];
        let top = screen.y.saturating_add(screen.height.saturating_sub(2) / 2);
        for (dy, (text, style)) in lines.into_iter().enumerate() {
            let y = top.saturating_add(dy as u16);
            if y >= screen.bottom() {
                break;
            }
            let x = screen.x.saturating_add(screen.width.saturating_sub(cells(text) as u16) / 2);
            buf.set_stringn(x, y, text, usize::from(screen.right() - x), style);
        }
    }

    /// Dims the page with a [`Scrim`](crate::Scrim) and draws the overlay
    /// surface over the collapsed sidebar's `overlay`, so it reads as a
    /// layer over the page. Returns the area to draw the
    /// [`Sidebar`](crate::Sidebar) in: two columns in from the sides and one
    /// row from the top and bottom.
    pub fn paint_overlay(theme: &Theme, buf: &mut Buffer, overlay: Rect) -> Rect {
        let screen = buf.area;
        crate::Scrim::new(theme).render(screen, buf);
        crate::overlay::surface(theme, buf, overlay);
        Rect::new(
            overlay.x.saturating_add(2),
            overlay.y.saturating_add(1),
            overlay.width.saturating_sub(4),
            overlay.height.saturating_sub(2),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_wide_screen_puts_the_sidebar_beside_the_page() {
        let shell = AppShell::new(Rect::new(0, 0, 120, 40)).sidebar(24).header(true);
        let areas = shell.areas();
        assert_eq!(areas.header, Some(Rect::new(2, 0, 116, 1)));
        assert_eq!(areas.sidebar, Some(Rect::new(2, 2, 24, 37)));
        assert_eq!((areas.page.x, areas.page.width), (30, 116 - 24 - 6));
        assert_eq!(areas.footer, Rect::new(2, 39, 116, 1));
        assert!(!areas.collapsed && areas.overlay.is_none());
    }

    #[test]
    fn the_right_side_puts_the_sidebar_at_the_right_edge() {
        let areas = AppShell::new(Rect::new(0, 0, 120, 40)).sidebar(24).side(Side::Right).areas();
        assert_eq!(areas.sidebar, Some(Rect::new(94, 0, 24, 39)));
        assert_eq!(areas.page, Rect::new(2, 0, 116 - 24 - 4, 39));
    }

    #[test]
    fn under_100_columns_the_sidebar_collapses() {
        let shell = AppShell::new(Rect::new(0, 0, 99, 30)).sidebar(20);
        let areas = shell.areas();
        assert!(areas.collapsed);
        assert_eq!((areas.sidebar, areas.overlay), (None, None));
        assert_eq!(areas.page, Rect::new(2, 0, 93, 29));
        let open = shell.open(true).areas();
        assert_eq!(open.overlay, Some(Rect::new(0, 0, 24, 29)));
        let right = shell.side(Side::Right).open(true).areas();
        assert_eq!(right.overlay, Some(Rect::new(75, 0, 24, 29)));
    }

    #[test]
    fn a_wide_sidebar_collapses_when_the_page_would_get_under_60() {
        let areas = AppShell::new(Rect::new(0, 0, 100, 30)).sidebar(32).areas();
        assert!(areas.collapsed && areas.sidebar.is_none());
        assert!(!AppShell::new(Rect::new(0, 0, 100, 30)).sidebar(30).areas().collapsed);
    }

    #[test]
    fn no_sidebar_is_not_collapsed() {
        assert!(!AppShell::new(Rect::new(0, 0, 90, 30)).areas().collapsed);
    }

    #[test]
    fn under_80_by_24_the_screen_is_too_small() {
        assert!(AppShell::new(Rect::new(0, 0, 79, 30)).too_small());
        assert!(AppShell::new(Rect::new(0, 0, 100, 23)).too_small());
        assert!(!AppShell::new(Rect::new(0, 0, 80, 24)).too_small());
        let shell = AppShell::new(Rect::new(0, 0, 40, 10));
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 10));
        shell.message(&theme, &mut buf);
        let row = |y| (0..40).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>();
        assert_eq!(row(4).trim(), "Terminal too small");
        assert_eq!(row(5).trim(), "Needs 80 by 24, has 40 by 10");
    }

    #[test]
    fn any_size_gives_areas_inside_the_screen_and_a_message_that_fits() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        for (w, h) in [(0, 0), (1, 1), (3, 2), (30, 6), (79, 23), (80, 24), (200, 3)] {
            let screen = Rect::new(0, 0, w, h);
            let areas = AppShell::new(screen).sidebar(32).header(true).open(true).areas();
            for area in [Some(areas.page), Some(areas.footer), areas.header, areas.sidebar, areas.overlay].into_iter().flatten() {
                assert_eq!(area.intersection(screen), area, "{w}x{h}: {area:?}");
            }
            let mut buf = Buffer::empty(screen);
            AppShell::new(screen).message(&theme, &mut buf);
            let overlay = areas.overlay.unwrap_or_default();
            AppShell::paint_overlay(&theme, &mut buf, overlay);
        }
    }

    #[test]
    fn a_screen_at_the_end_of_the_range_does_not_overflow() {
        let areas = AppShell::new(Rect::new(65500, 65500, 35, 35)).sidebar(u16::MAX).header(true).open(true).areas();
        assert!(areas.collapsed);
    }
}
