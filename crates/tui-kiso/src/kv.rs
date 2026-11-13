use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::{Grid, Size, Theme};

/// The columns between a key and its value.
const GAP: usize = 2;

/// A key cut with `…` or padded to `width`, in `muted-foreground`, then
/// the gap and the value. [`fact`](crate::fact) and [`KV`] share it.
pub(crate) fn pair<'a>(theme: &Theme, width: usize, key: &str, value: impl IntoIterator<Item = Span<'a>>) -> Vec<Span<'a>> {
    let (key, used) = cut(vec![Span::styled(key.to_owned(), theme.muted())], width);
    let mut spans = key;
    spans.push(Span::raw(" ".repeat(width - used + GAP)));
    spans.extend(value);
    spans
}

/// Named facts about one object, such as its region, image and restart
/// policy: a key column in `muted-foreground`, then the value, which keeps
/// its own styles, one row per pair.
///
/// The key column is as wide as the longest key, at most half the width
/// (and never less than 12 columns); a longer key is cut with `…`, and so
/// is a long value. `Size::Sm`, the default, is one row per pair; `Size::Md`
/// leaves a blank row between pairs. [`KV::columns`] puts the pairs in
/// columns on the tracks of a [`Grid`], top to bottom, then left to right.
/// It has no keys. Keep a pair whose value is missing and say so in the
/// value, so the reader knows which fact is absent.
#[derive(Clone, Debug)]
pub struct KV<'a> {
    theme: &'a Theme,
    pairs: Vec<(&'a str, Line<'a>)>,
    size: Size,
    columns: u16,
}

impl<'a> KV<'a> {
    pub fn new<V: Into<Line<'a>>>(theme: &'a Theme, pairs: impl IntoIterator<Item = (&'a str, V)>) -> Self {
        Self { theme, pairs: pairs.into_iter().map(|(key, value)| (key, value.into())).collect(), size: Size::Sm, columns: 1 }
    }

    /// `Sm`, the default, is one row per pair. `Md` leaves a blank row
    /// between pairs.
    #[must_use]
    pub fn size(mut self, size: Size) -> Self {
        self.size = size;
        self
    }

    /// The pairs in `columns` columns, each on whole tracks of a [`Grid`].
    /// A grid with fewer tracks gets fewer columns.
    #[must_use]
    pub fn columns(mut self, columns: u16) -> Self {
        self.columns = columns.max(1);
        self
    }

    /// The areas of the columns in `area`, and the pairs in each.
    fn layout(&self, area: Rect) -> (Vec<Rect>, usize) {
        if self.columns == 1 {
            return (vec![area], self.pairs.len());
        }
        let mut grid = Grid::new(area);
        let columns = self.columns.min(grid.tracks());
        let tracks = grid.tracks() / columns;
        let per = self.pairs.len().div_ceil(usize::from(columns)).max(1);
        let areas = (0..columns).map(|_| Rect { height: area.height, ..grid.cell(tracks, area.height) }).collect();
        (areas, per)
    }

    /// The rows the pairs take at `width` columns.
    pub fn height(&self, width: u16) -> u16 {
        let (_, per) = self.layout(Rect::new(0, 0, width, 1));
        let rows = match self.size {
            Size::Sm => per,
            Size::Md | Size::Lg => (per * 2).saturating_sub(1),
        };
        u16::try_from(rows).unwrap_or(u16::MAX)
    }
}

impl Widget for KV<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let pitch = match self.size {
            Size::Sm => 1,
            Size::Md | Size::Lg => 2,
        };
        let (areas, per) = self.layout(area);
        for (column, chunk) in areas.iter().zip(self.pairs.chunks(per)) {
            let column = column.intersection(area);
            let width = usize::from(column.width);
            let longest = chunk.iter().map(|(key, _)| cells(key)).max().unwrap_or(0);
            let key_width = longest.min((width / 2).max(12)).min(width.saturating_sub(GAP));
            for (i, (key, value)) in chunk.iter().enumerate() {
                let y = column.y.saturating_add((i * pitch) as u16);
                if y >= column.bottom() {
                    break;
                }
                let value = value.spans.iter().map(|span| Span::styled(span.content.clone(), value.style.patch(span.style)));
                let (spans, _) = cut(pair(self.theme, key_width, key, value), width);
                buf.set_line(column.x, y, &Line::from(spans), column.width);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rows(buf: &Buffer) -> Vec<String> {
        (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol()).collect::<String>().trim_end().to_owned()).collect()
    }

    #[test]
    fn keys_share_a_column() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let kv = KV::new(&theme, [("Region", "eu-west"), ("Restart policy", "always")]);
        assert_eq!(kv.height(40), 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 2));
        kv.render(buf.area, &mut buf);
        assert_eq!(rows(&buf), ["Region          eu-west", "Restart policy  always"]);
        assert_eq!(buf[(0, 0)].fg, theme.color(theme.tokens().muted_foreground));
    }

    #[test]
    fn a_long_key_is_cut_and_md_leaves_a_row() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let kv = KV::new(&theme, [("A very long key name", "x"), ("B", "y")]).size(Size::Md);
        assert_eq!(kv.height(30), 3);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 3));
        kv.render(buf.area, &mut buf);
        assert_eq!(rows(&buf), ["A very long ke…  x", "", "B                y"]);
    }

    #[test]
    fn columns_sit_on_tracks() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let pairs = [("One", "1"), ("Two", "2"), ("Three", "3"), ("Four", "4")];
        let kv = KV::new(&theme, pairs).columns(2);
        // 60 columns hold four tracks: two per column.
        assert_eq!(kv.height(60), 2);
        let mut buf = Buffer::empty(Rect::new(0, 0, 60, 2));
        kv.render(buf.area, &mut buf);
        assert!(rows(&buf)[0].starts_with("One  ") && buf[(30, 0)].symbol() == "T", "{:?}", rows(&buf));
        for width in 0..20 {
            let mut buf = Buffer::empty(Rect::new(0, 0, width, 3));
            KV::new(&theme, pairs).columns(3).render(buf.area, &mut buf);
        }
    }
}
