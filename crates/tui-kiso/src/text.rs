use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use unicode_segmentation::UnicodeSegmentation;
use unicode_width::UnicodeWidthStr;

use crate::Theme;

/// The cells `text` takes on screen. A CJK character or an emoji takes
/// two.
pub(crate) fn cells(text: &str) -> usize {
    UnicodeWidthStr::width(text)
}

/// The longest start of `text` that fits in `width` cells, and its width.
/// It never splits a grapheme, such as an emoji with its variation
/// selector.
pub(crate) fn take_cells(text: &str, width: usize) -> (&str, usize) {
    let mut used = 0;
    for (i, grapheme) in text.grapheme_indices(true) {
        let w = cells(grapheme);
        if used + w > width {
            return (&text[..i], used);
        }
        used += w;
    }
    (text, used)
}

/// The longest end of `text` that fits in `width` cells, and its width,
/// such as what shows of a long filter before the cursor.
pub(crate) fn tail_cells(text: &str, width: usize) -> (&str, usize) {
    let mut used = 0;
    let mut start = text.len();
    for (i, grapheme) in text.grapheme_indices(true).rev() {
        let w = cells(grapheme);
        if used + w > width {
            break;
        }
        used += w;
        start = i;
    }
    (&text[start..], used)
}

/// `text` split after its first grapheme, such as a button's hotkey.
pub(crate) fn first_grapheme(text: &str) -> (&str, &str) {
    let end = text.graphemes(true).next().map_or(0, str::len);
    text.split_at(end)
}

/// Spans cut to `width` cells, ending with `…` when something is left out,
/// and the cells they take.
pub(crate) fn cut<'a>(spans: Vec<Span<'a>>, width: usize) -> (Vec<Span<'a>>, usize) {
    let total: usize = spans.iter().map(|span| cells(&span.content)).sum();
    if total <= width {
        return (spans, total);
    }
    if width == 0 {
        return (Vec::new(), 0);
    }
    // The last cell is the ellipsis.
    let room = width - 1;
    let (mut out, mut used, mut style) = (Vec::new(), 0, Style::default());
    for span in spans {
        style = span.style;
        let (head, w) = take_cells(&span.content, room - used);
        if !head.is_empty() {
            out.push(Span::styled(head.to_owned(), span.style));
        }
        used += w;
        if head.len() < span.content.len() {
            break;
        }
    }
    out.push(Span::styled("…", style));
    (out, used + 1)
}

/// Spans cut to `width` cells with `…` when something is left out, or
/// padded to it with spaces.
pub fn fit(spans: Vec<Span<'static>>, width: usize) -> Vec<Span<'static>> {
    let (mut out, used) = cut(spans, width);
    out.push(Span::raw(" ".repeat(width.saturating_sub(used))));
    out
}

/// The words of `text` in lines at most `width` cells wide. A word wider
/// than that gets a line of its own.
pub fn wrap(text: &str, width: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut line = String::new();
    for word in text.split_whitespace() {
        if !line.is_empty() && cells(&line) + 1 + cells(word) > width {
            lines.push(std::mem::take(&mut line));
        }
        if !line.is_empty() {
            line.push(' ');
        }
        line.push_str(word);
    }
    if !line.is_empty() {
        lines.push(line);
    }
    lines
}

/// A fact of a record, two columns in: the key in `muted-foreground` in a
/// column `key_width` wide, then the value, which keeps its own styles.
pub fn fact(theme: &Theme, key_width: usize, key: &str, value: impl IntoIterator<Item = Span<'static>>) -> Line<'static> {
    let (key, used) = take_cells(key, key_width);
    let mut spans = vec![Span::styled(format!("  {key}{}", " ".repeat(key_width - used)), theme.muted())];
    spans.extend(value);
    Line::from(spans)
}

/// Marks each match of `query` in `line` in `primary`, bold and
/// underlined, as a search does. Case is ignored for ASCII letters. A match
/// that runs across two spans is not marked.
pub fn highlight(theme: &Theme, line: Line<'static>, query: &str) -> Line<'static> {
    if query.is_empty() {
        return line;
    }
    let query = query.to_ascii_lowercase();
    let mark = theme.fg(theme.tokens().primary).add_modifier(Modifier::BOLD | Modifier::UNDERLINED);
    let mut spans = Vec::new();
    for span in line.spans {
        let text = span.content.to_string();
        let lower = text.to_ascii_lowercase();
        // Where each grapheme starts, then the end.
        let bounds: Vec<usize> = text.grapheme_indices(true).map(|(i, _)| i).chain([text.len()]).collect();
        let mut at = 0;
        while let Some(found) = lower[at..].find(&query) {
            let start = bounds.iter().copied().filter(|b| *b <= at + found).max().unwrap_or(at + found).max(at);
            let end = bounds.iter().copied().find(|b| *b >= at + found + query.len()).unwrap_or(text.len());
            if start > at {
                spans.push(Span::styled(text[at..start].to_owned(), span.style));
            }
            spans.push(Span::styled(text[start..end].to_owned(), span.style.patch(mark)));
            at = end;
        }
        if at < text.len() {
            spans.push(Span::styled(text[at..].to_owned(), span.style));
        }
    }
    Line { spans, ..line }
}

/// Column widths for rows of a [`Page`](crate::Page). Rows start two
/// columns in, with `gap` columns between cells. Each cell is cut with `…`
/// or padded to its width.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Columns {
    widths: Vec<usize>,
    gap: usize,
}

impl Columns {
    /// Widths for rows `width` wide, two columns apart. A fixed width
    /// stays, and each 0 takes an equal share of what is left, at least 4.
    pub fn new(width: usize, spec: &[usize]) -> Self {
        Self::with_gap(width, spec, 2)
    }

    /// `new` with `gap` columns between cells.
    pub fn with_gap(width: usize, spec: &[usize], gap: usize) -> Self {
        let fixed = spec.iter().sum::<usize>() + 2 + gap * spec.len().saturating_sub(1);
        let flex = spec.iter().filter(|w| **w == 0).count().max(1);
        let share = width.saturating_sub(fixed) / flex;
        Self { widths: spec.iter().map(|w| if *w == 0 { share.max(4) } else { *w }).collect(), gap }
    }

    /// The width of each column.
    pub fn widths(&self) -> &[usize] {
        &self.widths
    }

    /// One row of cells.
    pub fn row(&self, cells: Vec<Vec<Span<'static>>>) -> Line<'static> {
        let mut spans = vec![Span::raw("  ")];
        for (i, (cell, width)) in cells.into_iter().zip(&self.widths).enumerate() {
            if i > 0 {
                spans.push(Span::raw(" ".repeat(self.gap)));
            }
            spans.extend(fit(cell, *width));
        }
        Line::from(spans)
    }

    /// Column titles in `subtle-foreground`.
    pub fn head(&self, theme: &Theme, titles: &[&str]) -> Line<'static> {
        self.row(titles.iter().map(|title| vec![Span::styled(title.to_string(), theme.subtle())]).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn graphemes_stay_whole_at_both_ends() {
        let coder = "\u{1f469}\u{200d}\u{1f4bb}";
        assert_eq!(first_grapheme(&format!("{coder}Save")), (coder, "Save"));
        assert_eq!(tail_cells(&format!("abc{coder}"), 3), (&format!("c{coder}")[..], 3));
        assert_eq!(tail_cells("abcdef", 2), ("ef", 2));
    }

    #[test]
    fn flexible_columns_share_the_rest() {
        let columns = Columns::new(40, &[10, 0, 0]);
        // 40 - (10 + 2 indent + 2 gaps of 2) = 24, so 12 each.
        assert_eq!(columns.widths(), &[10, 12, 12]);
    }

    #[test]
    fn a_long_cell_ends_with_an_ellipsis() {
        let columns = Columns::new(20, &[6, 4]);
        let line = columns.row(vec![vec![Span::raw("pg-main-1")], vec![Span::raw("up")]]);
        assert_eq!(line.to_string(), "  pg-ma…  up  ");
    }

    #[test]
    fn highlight_keeps_a_combining_mark_with_its_letter() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = highlight(&theme, Line::raw("Cafe\u{301} au lait"), "e");
        assert_eq!(line.to_string(), "Cafe\u{301} au lait");
        let marked: Vec<&str> =
            line.spans.iter().filter(|s| s.style.add_modifier.contains(Modifier::UNDERLINED)).map(|s| s.content.as_ref()).collect();
        assert_eq!(marked, ["e\u{301}"]);
        let mut buf = ratatui::buffer::Buffer::empty(ratatui::layout::Rect::new(0, 0, 16, 1));
        buf.set_line(0, 0, &line, 16);
        assert_eq!(buf[(3, 0)].symbol(), "e\u{301}");
    }

    #[test]
    fn highlight_ignores_ascii_case() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = highlight(&theme, Line::raw("Failed to fail"), "fail");
        let marked: Vec<&str> =
            line.spans.iter().filter(|s| s.style.add_modifier.contains(Modifier::UNDERLINED)).map(|s| s.content.as_ref()).collect();
        assert_eq!(marked, ["Fail", "fail"]);
    }

    #[test]
    fn widths_count_cells_not_characters() {
        let text = |spans: Vec<Span<'static>>| spans.iter().map(|s| s.content.to_string()).collect::<String>();
        assert_eq!(text(fit(vec![Span::raw("中文")], 3)), "中…");
        assert_eq!(text(fit(vec![Span::raw("abc"), Span::raw("def")], 3)), "ab…");
        assert_eq!(text(fit(vec![Span::raw("abc")], 3)), "abc");
        assert_eq!(wrap("中 文", 3), ["中", "文"]);
        let heart: usize = fit(vec![Span::raw("\u{2764}\u{fe0f}xyz")], 4).iter().map(Span::width).sum();
        assert_eq!(heart, 4);
    }

    #[test]
    fn a_fact_keeps_its_column() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert_eq!(fact(&theme, 8, "Status", [Span::raw("Failed")]).to_string(), "  Status  Failed");
        assert_eq!(fact(&theme, 4, "Started", [Span::raw("x")]).to_string(), "  Starx");
    }

    #[test]
    fn wrap_keeps_words_whole() {
        assert_eq!(wrap("one two three four", 9), ["one two", "three", "four"]);
    }
}
