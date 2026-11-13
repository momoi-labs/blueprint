use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::KeyCode;
use ratatui::layout::Rect;
use ratatui::widgets::Widget;

use crate::surface::write;
use crate::text::{cells, take_cells};
use crate::{Size, Theme};

/// One choice of a [`DetailSelect`]: a title and a line that says what it
/// does.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DetailOption<'a> {
    title: &'a str,
    description: &'a str,
    disabled: bool,
}

impl<'a> DetailOption<'a> {
    pub fn new(title: &'a str, description: &'a str) -> Self {
        Self { title, description, disabled: false }
    }

    /// A choice that does not apply now. It keeps its place, and ↑↓ skip
    /// it.
    #[must_use]
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }
}

/// A choice between a few options that each need a line of explanation,
/// such as a plan or a backup policy. Use a [`RadioGroup`](crate::RadioGroup)
/// when the names say enough.
///
/// Each option takes two rows: its title in `foreground` and its
/// description in `muted-foreground`, after a `○`. The chosen option is
/// marked `●` and filled with `selected` across both rows, with a `▌` in the
/// first column, `primary` while the list has focus and
/// `subtle-foreground` without it. A disabled option is `disabled`. At `Md`
/// an empty row separates two options; at `Sm` none does.
///
/// ↑↓ (or k and j) move the choice with [`DetailSelect::key`].
#[derive(Clone, Debug)]
pub struct DetailSelect<'a> {
    theme: &'a Theme,
    options: Vec<DetailOption<'a>>,
    selected: usize,
    size: Size,
    focused: bool,
}

impl<'a> DetailSelect<'a> {
    pub fn new(theme: &'a Theme, options: impl IntoIterator<Item = DetailOption<'a>>, selected: usize) -> Self {
        Self { theme, options: options.into_iter().collect(), selected, size: Size::Md, focused: false }
    }

    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    #[must_use]
    pub fn focused(mut self, focused: bool) -> Self {
        self.focused = focused;
        self
    }

    /// The chosen option.
    pub fn selected(&self) -> usize {
        self.selected
    }

    /// The rows between two options.
    fn gap(&self) -> u16 {
        u16::from(self.size != Size::Sm)
    }

    /// The rows the list takes.
    pub fn height(&self) -> u16 {
        let n = self.options.len().min(usize::from(u16::MAX / 3)) as u16;
        (n * 2).saturating_add(n.saturating_sub(1) * self.gap())
    }

    /// ↑ and ↓ (or k and j) choose the option before or after, skipping
    /// the disabled ones. Returns true when the choice moved.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, code: KeyCode) -> bool {
        let enabled = |i: &usize| self.options.get(*i).is_some_and(|o| !o.disabled);
        let next = match code {
            KeyCode::Up | KeyCode::Char('k') => (0..self.selected).rev().find(enabled),
            KeyCode::Down | KeyCode::Char('j') => (self.selected + 1..self.options.len()).find(enabled),
            _ => None,
        };
        next.inspect(|i| self.selected = *i).is_some()
    }
}

impl Widget for DetailSelect<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let t = self.theme;
        let r = t.tokens();
        let area = area.intersection(buf.area);
        if area.width < 5 || area.height == 0 {
            return;
        }
        // The bar, a gap, the radio mark and a gap, then the text.
        let x = area.x + 4;
        let room = usize::from(area.right() - x);
        let fit = |text: &str| match cells(text) > room {
            true if room > 1 => format!("{}…", take_cells(text, room - 1).0),
            true => String::new(),
            false => text.to_owned(),
        };
        let step = 2 + self.gap();
        for (i, option) in self.options.iter().enumerate() {
            let y = area.y.saturating_add((i as u16).saturating_mul(step));
            if y >= area.bottom() {
                break;
            }
            let chosen = i == self.selected;
            let (title, description) = if option.disabled { (t.disabled(), t.disabled()) } else { (t.text(), t.muted()) };
            let mark = if chosen { t.fg(r.primary) } else { t.muted() };
            write(buf, area.x + 2, y, if chosen { "●" } else { "○" }, if option.disabled { t.disabled() } else { mark });
            write(buf, x, y, &fit(option.title), title);
            if y + 1 < area.bottom() {
                write(buf, x, y + 1, &fit(option.description), description);
            }
            if chosen {
                let rows = Rect::new(area.x, y, area.width, 2).intersection(area);
                let bar = if self.focused { r.primary } else { r.subtle_foreground };
                for row in rows.rows() {
                    // The bar goes on first, so the selection checks its
                    // contrast as a mark.
                    buf[(area.x, row.y)].set_symbol("▌").set_fg(t.color(bar));
                    t.select(buf, row);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>().trim_end().to_owned()
    }

    fn options() -> Vec<DetailOption<'static>> {
        vec![
            DetailOption::new("Daily", "One backup a day, kept a week."),
            DetailOption::new("Hourly", "Kept two days.").disabled(true),
            DetailOption::new("Off", "No backups."),
        ]
    }

    #[test]
    fn each_option_takes_two_rows_and_the_chosen_one_is_filled() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let list = DetailSelect::new(&theme, options(), 0).focused(true);
        assert_eq!(list.height(), 8);
        assert_eq!(list.clone().size(Size::Sm).height(), 6);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 8));
        list.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 0), "▌ ● Daily");
        assert_eq!(row(&buf, 1), "▌   One backup a day, kept a week.");
        assert_eq!(row(&buf, 3), "  ○ Hourly");
        assert_eq!(buf[(4, 3)].fg, theme.disabled().fg.unwrap());
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().primary));
        assert_eq!(buf[(10, 1)].bg, buf[(10, 0)].bg);
        assert_ne!(buf[(10, 2)].bg, buf[(10, 0)].bg);
    }

    #[test]
    fn keys_skip_disabled_options_and_any_size_draws() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut list = DetailSelect::new(&theme, options(), 0);
        assert!(list.key(KeyCode::Down));
        assert_eq!(list.selected(), 2);
        assert!(!list.key(KeyCode::Char('j')));
        assert!(list.key(KeyCode::Up) && list.selected() == 0);
        for (w, h) in [(0, 0), (4, 1), (6, 1), (12, 3)] {
            let area = Rect::new(0, 0, w, h);
            list.clone().render(area, &mut Buffer::empty(area));
        }
    }
}
