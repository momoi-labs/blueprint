use ratatui::layout::Rect;

/// The layout grid of a page: tracks of 13 columns, 2 apart, three or more
/// of them by the width of the area. A contained page
/// ([`PageWidth::Contained`](crate::PageWidth::Contained)) has six at most.
///
/// Each thing on the page is a cell of whole tracks. A cell that does not
/// fit in the open row starts the next row, so a narrow terminal gets a
/// longer page and not a cut one. One empty row parts the rows of cells.
/// The grid draws nothing: it gives areas. An area can end below the
/// screen, so draw into a taller buffer or skip what does not fit.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Grid {
    x: u16,
    y: u16,
    tracks: u16,
    /// The tracks taken in the open row, and the height of that row.
    taken: u16,
    rows: u16,
}

impl Grid {
    /// The columns of a track.
    pub const TRACK: u16 = 13;
    /// The columns between two tracks.
    pub const GAP: u16 = 2;
    /// The fewest tracks of a page.
    pub const MIN: u16 = 3;
    /// The most tracks of a contained page.
    pub const CONTAINED: u16 = 6;

    /// A grid from the top left of `area`, with the tracks its width holds.
    pub fn new(area: Rect) -> Self {
        let tracks = ((area.width.saturating_add(Self::GAP)) / (Self::TRACK + Self::GAP)).max(Self::MIN);
        Self { x: area.x, y: area.y, tracks, taken: 0, rows: 0 }
    }

    /// The width of a number of tracks, with the gaps between them.
    pub const fn span(tracks: u16) -> u16 {
        tracks.saturating_mul(Self::TRACK + Self::GAP).saturating_sub(Self::GAP)
    }

    /// The tracks of this grid.
    pub fn tracks(&self) -> u16 {
        self.tracks
    }

    /// The width of the grid.
    pub fn width(&self) -> u16 {
        Self::span(self.tracks)
    }

    /// The row the next thing starts on. After [`Grid::wrap`], it is the
    /// first row below the finished row and its empty row.
    pub fn y(&self) -> u16 {
        self.y
    }

    /// A cell of `tracks` tracks and `rows` rows, in the open row when it
    /// fits and in the next row when it does not.
    pub fn cell(&mut self, tracks: u16, rows: u16) -> Rect {
        let tracks = tracks.clamp(1, self.tracks);
        if self.taken + tracks > self.tracks {
            self.wrap();
        }
        let area = Rect::new(self.x.saturating_add(self.taken * (Self::TRACK + Self::GAP)), self.y, Self::span(tracks), rows);
        self.taken += tracks;
        self.rows = self.rows.max(rows);
        area
    }

    /// Ends the open row, and leaves one empty row after it.
    pub fn wrap(&mut self) {
        if self.taken > 0 {
            self.y = self.y.saturating_add(self.rows).saturating_add(1);
            self.taken = 0;
            self.rows = 0;
        }
    }

    /// An area across the grid, such as a heading. It ends the open row,
    /// and no empty row follows it.
    pub fn line(&mut self, rows: u16) -> Rect {
        self.wrap();
        let area = Rect::new(self.x, self.y, self.width(), rows);
        self.y = self.y.saturating_add(rows);
        area
    }

    /// Ends the open row and leaves `rows` more empty rows.
    pub fn skip(&mut self, rows: u16) {
        self.wrap();
        self.y = self.y.saturating_add(rows);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_width_gives_three_tracks_or_more() {
        for (width, tracks) in [(10, 3), (43, 3), (58, 4), (88, 6), (200, 13)] {
            assert_eq!(Grid::new(Rect::new(0, 0, width, 10)).tracks(), tracks);
        }
        assert_eq!(Grid::span(3), 43);
    }

    #[test]
    fn a_grid_at_the_end_of_the_screen_does_not_overflow() {
        let mut grid = Grid::new(Rect::new(65520, 65530, 15, 10));
        for _ in 0..4 {
            grid.cell(1, u16::MAX);
        }
        grid.wrap();
        assert_eq!(grid.y(), u16::MAX);
        assert_eq!(Grid::span(u16::MAX), u16::MAX - Grid::GAP);
    }

    #[test]
    fn a_cell_that_does_not_fit_starts_the_next_row() {
        let mut grid = Grid::new(Rect::new(2, 1, 58, 40));
        assert_eq!(grid.cell(3, 5), Rect::new(2, 1, 43, 5));
        assert_eq!(grid.cell(1, 2), Rect::new(47, 1, 13, 2));
        // The row was five rows tall, and one empty row follows it.
        assert_eq!(grid.cell(2, 1), Rect::new(2, 7, 28, 1));
        assert_eq!(grid.line(1), Rect::new(2, 9, 58, 1));
        assert_eq!(grid.y(), 10);
    }
}
