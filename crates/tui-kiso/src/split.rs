use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::Span;

use crate::surface::put;
use crate::{Grid, Theme};

/// Which way a [`Split`] lays its panes.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Axis {
    /// Panes side by side, with a vertical divider (`│`) between them.
    #[default]
    Horizontal,
    /// Panes one above the other, with a horizontal divider (`─`).
    Vertical,
}

/// Two or more panes in one area, sized by ratios and parted by one
/// divider cell. The web `Split`, `Pane` and `Splitter` in one type.
///
/// A pane is an [`Rect`] from [`Split::areas`]; the app draws into it. The
/// divider is a rule in `border`, not a frame around a pane. The dividers
/// next to the active pane are `┃` or `━` in the `focus` color, so the
/// shape says it as well as the color. [`Split::title`] gives the title of
/// a pane: the accent when it is the active one.
///
/// The app owns the keys: it calls [`Split::focus_next`], [`Split::grow`]
/// and [`Split::shrink`]. A pane never gets smaller than `min`, and a
/// resize moves one step (a track of [`Grid`] across, one row down), which
/// `step` changes. Resizing turns the ratios into the sizes now on screen,
/// so the panes stay where the person put them when the area changes.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Split {
    axis: Axis,
    weights: Vec<u16>,
    active: usize,
    min: u16,
    step: u16,
}

impl Split {
    /// A split of panes with these ratios, such as `[1, 2]` for a pane and
    /// another twice as wide. A ratio of 0 counts as 1, and no ratios
    /// make one pane.
    pub fn new(axis: Axis, ratios: impl IntoIterator<Item = u16>) -> Self {
        let mut weights: Vec<u16> = ratios.into_iter().map(|w| w.max(1)).collect();
        if weights.is_empty() {
            weights.push(1);
        }
        let (min, step) = match axis {
            Axis::Horizontal => (Grid::TRACK, Grid::TRACK + Grid::GAP),
            Axis::Vertical => (3, 1),
        };
        Self { axis, weights, active: 0, min, step }
    }

    /// Panes side by side.
    pub fn horizontal(ratios: impl IntoIterator<Item = u16>) -> Self {
        Self::new(Axis::Horizontal, ratios)
    }

    /// Panes one above the other.
    pub fn vertical(ratios: impl IntoIterator<Item = u16>) -> Self {
        Self::new(Axis::Vertical, ratios)
    }

    /// The active pane. Past the last pane it is the last one.
    #[must_use]
    pub fn active(mut self, pane: usize) -> Self {
        self.set_active(pane);
        self
    }

    /// The least size of a pane: 13 columns across (a track), 3 rows down.
    #[must_use]
    pub fn min(mut self, min: u16) -> Self {
        self.min = min.max(1);
        self
    }

    /// How much one [`Split::grow`] or [`Split::shrink`] moves: 15 columns
    /// across (a track and its gap), one row down.
    #[must_use]
    pub fn step(mut self, step: u16) -> Self {
        self.step = step.max(1);
        self
    }

    /// The number of panes.
    pub fn len(&self) -> usize {
        self.weights.len()
    }

    /// A split always has a pane.
    pub fn is_empty(&self) -> bool {
        false
    }

    /// The pane that has the focus.
    pub fn active_pane(&self) -> usize {
        self.active
    }

    pub fn set_active(&mut self, pane: usize) {
        self.active = pane.min(self.weights.len() - 1);
    }

    /// Moves the focus to the next pane, and wraps after the last.
    pub fn focus_next(&mut self) {
        self.active = (self.active + 1) % self.weights.len();
    }

    /// Moves the focus to the previous pane, and wraps before the first.
    pub fn focus_prev(&mut self) {
        self.active = (self.active + self.weights.len() - 1) % self.weights.len();
    }

    /// The size of each pane along the axis, for `length` cells in all.
    /// The dividers take one cell each. When `length` cannot give every
    /// pane its minimum, the panes share it evenly.
    pub fn sizes(&self, length: u16) -> Vec<u16> {
        let n = self.weights.len() as u32;
        let room = u32::from(length).saturating_sub(n - 1);
        let min = u32::from(self.min);
        if room < n * min {
            let even = room / n;
            let mut sizes = vec![even as u16; n as usize];
            for size in sizes.iter_mut().take((room % n) as usize) {
                *size += 1;
            }
            return sizes;
        }
        let total: u32 = self.weights.iter().map(|w| u32::from(*w)).sum();
        // Floor of each share, then the cells left go to the largest
        // remainders, so the sizes always add up to `room`.
        let mut sizes: Vec<u32> = self.weights.iter().map(|w| room * u32::from(*w) / total).collect();
        let mut order: Vec<usize> = (0..sizes.len()).collect();
        order.sort_by_key(|i| std::cmp::Reverse(room * u32::from(self.weights[*i]) % total));
        let left = room - sizes.iter().sum::<u32>();
        for i in order.into_iter().take(left as usize) {
            sizes[i] += 1;
        }
        // A pane under its minimum takes cells from the largest pane.
        for i in 0..sizes.len() {
            while sizes[i] < min {
                let Some(big) = (0..sizes.len()).filter(|j| sizes[*j] > min).max_by_key(|j| sizes[*j]) else { break };
                sizes[big] -= 1;
                sizes[i] += 1;
            }
        }
        sizes.into_iter().map(|s| s as u16).collect()
    }

    /// The area of each pane inside `area`, in order. The dividers sit in
    /// the cells between the areas.
    pub fn areas(&self, area: Rect) -> Vec<Rect> {
        let length = match self.axis {
            Axis::Horizontal => area.width,
            Axis::Vertical => area.height,
        };
        let mut at = 0u16;
        self.sizes(length)
            .into_iter()
            .map(|size| {
                let pane = match self.axis {
                    Axis::Horizontal => Rect::new(area.x.saturating_add(at), area.y, size, area.height),
                    Axis::Vertical => Rect::new(area.x, area.y.saturating_add(at), area.width, size),
                };
                at = at.saturating_add(size).saturating_add(1);
                pane
            })
            .collect()
    }

    /// Makes `pane` one step larger. The next pane gives the cells, or the
    /// previous one for the last pane. Returns false when nothing moved,
    /// such as when the neighbor is at its minimum.
    pub fn grow(&mut self, area: Rect, pane: usize) -> bool {
        self.resize(area, pane, true)
    }

    /// Makes `pane` one step smaller, down to its minimum. The next pane
    /// takes the cells, or the previous one for the last pane.
    pub fn shrink(&mut self, area: Rect, pane: usize) -> bool {
        self.resize(area, pane, false)
    }

    fn resize(&mut self, area: Rect, pane: usize, grow: bool) -> bool {
        if pane >= self.weights.len() || self.weights.len() < 2 {
            return false;
        }
        let length = match self.axis {
            Axis::Horizontal => area.width,
            Axis::Vertical => area.height,
        };
        let mut sizes = self.sizes(length);
        let neighbor = if pane + 1 < sizes.len() { pane + 1 } else { pane - 1 };
        let (from, to) = if grow { (neighbor, pane) } else { (pane, neighbor) };
        let moved = self.step.min(sizes[from].saturating_sub(self.min));
        if moved == 0 {
            return false;
        }
        sizes[from] -= moved;
        sizes[to] += moved;
        self.weights = sizes.into_iter().map(|s| s.max(1)).collect();
        true
    }

    /// Draws the dividers into `buf`. A divider keeps the fill under it.
    pub fn render(&self, theme: &Theme, area: Rect, buf: &mut Buffer) {
        let r = theme.tokens();
        let (border, focus) = (theme.color(r.border), theme.color(r.focus));
        // The areas come from the whole `area`, as the app got them; only
        // the writes stop at the edge of the buffer.
        let (bottom, right) = (area.bottom().min(buf.area.bottom()), area.right().min(buf.area.right()));
        for (i, pane) in self.areas(area).windows(2).enumerate() {
            let on = i == self.active || i + 1 == self.active;
            let color = if on { focus } else { border };
            match self.axis {
                Axis::Horizontal => {
                    let x = pane[0].right();
                    for y in area.top()..bottom {
                        put(buf, x, y, if on { "┃" } else { "│" }, color);
                    }
                }
                Axis::Vertical => {
                    let y = pane[0].bottom();
                    for x in area.left()..right {
                        put(buf, x, y, if on { "━" } else { "─" }, color);
                    }
                }
            }
        }
    }

    /// The title of `pane`: bold in the accent when it is the active pane,
    /// `muted-foreground` when it is not.
    pub fn title<'a>(&self, theme: &Theme, pane: usize, text: &'a str) -> Span<'a> {
        if pane == self.active {
            Span::styled(text, theme.link().add_modifier(Modifier::BOLD))
        } else {
            Span::styled(text, theme.muted())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cols(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    #[test]
    fn the_panes_and_dividers_add_up_to_the_area() {
        for length in [41, 61, 100, 101, 237] {
            let split = Split::horizontal([1, 2, 3]);
            let sizes = split.sizes(length);
            assert_eq!(sizes.iter().sum::<u16>() + 2, length, "length {length}");
            assert!(sizes.iter().all(|s| *s >= Grid::TRACK));
        }
        let areas = Split::horizontal([1, 1]).areas(Rect::new(3, 1, 21, 4));
        assert_eq!((areas[0], areas[1]), (Rect::new(3, 1, 10, 4), Rect::new(14, 1, 10, 4)));
    }

    #[test]
    fn a_short_area_shares_evenly_and_never_underflows() {
        assert_eq!(Split::horizontal([1, 5]).sizes(10), [5, 4]);
        assert_eq!(Split::horizontal([1, 1, 1]).sizes(0), [0, 0, 0]);
        assert_eq!(Split::horizontal([]).len(), 1);
    }

    #[test]
    fn grow_and_shrink_move_one_step_and_stop_at_the_minimum() {
        let area = Rect::new(0, 0, 61, 5);
        let mut split = Split::horizontal([1, 1]);
        assert_eq!(split.sizes(61), [30, 30]);
        assert!(split.grow(area, 0));
        assert_eq!(split.sizes(61), [45, 15]);
        assert!(split.grow(area, 0), "the neighbor gives what is above its minimum");
        assert_eq!(split.sizes(61), [47, 13]);
        assert!(!split.grow(area, 0));
        assert!(split.shrink(area, 0));
        assert_eq!(split.sizes(61), [32, 28]);
        assert!(split.grow(area, 1), "the last pane takes from the one before");
        assert_eq!(split.sizes(61)[1], 43);
        assert!(!Split::vertical([1]).grow(area, 0));
    }

    #[test]
    fn dividers_beside_the_active_pane_have_the_focus_color_and_shape() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let area = Rect::new(0, 0, 41, 2);
        let mut buf = Buffer::empty(area);
        Split::horizontal([1, 1, 1]).active(0).render(&theme, area, &mut buf);
        let at = |buf: &Buffer, x| buf[(x, 0)].clone();
        assert_eq!((at(&buf, 13).symbol(), at(&buf, 27).symbol()), ("┃", "│"));
        assert_eq!(at(&buf, 13).fg, theme.color(theme.tokens().focus));
        assert_eq!(at(&buf, 27).fg, theme.color(theme.tokens().border));
        let mut buf = Buffer::empty(area);
        Split::horizontal([1, 1, 1]).active(1).render(&theme, area, &mut buf);
        assert_eq!((at(&buf, 13).symbol(), at(&buf, 27).symbol()), ("┃", "┃"));
    }

    #[test]
    fn a_vertical_split_draws_rows_and_stays_inside_a_small_buffer() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 4, 7));
        Split::vertical([1, 1]).render(&theme, Rect::new(0, 0, 4, 7), &mut buf);
        assert_eq!(cols(&buf, 3), "━━━━", "the divider beside the active pane is heavy");
        // An area taller than the buffer must not panic.
        let mut small = Buffer::empty(Rect::new(0, 0, 4, 3));
        Split::vertical([1, 1]).render(&theme, Rect::new(0, 0, 4, 20), &mut small);
    }

    #[test]
    fn the_active_pane_title_is_bold_in_the_accent() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let split = Split::horizontal([1, 1]).active(1);
        assert_eq!(split.title(&theme, 1, "Logs").style.fg, Some(theme.color(theme.tokens().link)));
        assert_eq!(split.title(&theme, 0, "Files").style, theme.muted());
        let mut split = split;
        split.focus_next();
        assert_eq!(split.active_pane(), 0);
    }
}
