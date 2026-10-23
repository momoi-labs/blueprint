#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};

#[cfg(feature = "crossterm")]
use unicode_segmentation::UnicodeSegmentation;

use crate::text::{cells, cut, tail_cells};
use crate::{highlight, Theme};

/// A live search on the lists of a page: `/` starts it, each letter
/// filters, enter keeps it and esc clears it. The matches are marked, a
/// section's count becomes "3 of 5", and the footer starts with the query.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Search {
    pub query: String,
    /// True while the person types the query.
    pub typing: bool,
}

/// What a key did to a [`Search`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Found {
    /// The query changed, or was kept or cleared: go back to the top.
    Changed,
    /// ↑ or ↓: move the selection by one.
    Up,
    Down,
    /// A key the search does not use.
    Ignored,
}

impl Search {
    /// Starts typing a query.
    pub fn start(&mut self) {
        self.typing = true;
    }

    pub fn clear(&mut self) {
        self.query.clear();
        self.typing = false;
    }

    /// True while typing or while a kept query filters the page.
    pub fn is_active(&self) -> bool {
        self.typing || !self.query.is_empty()
    }

    /// True when the query is empty or one of `texts` contains it. Case is
    /// ignored for ASCII letters.
    pub fn hit(&self, texts: &[&str]) -> bool {
        if self.query.is_empty() {
            return true;
        }
        let query = self.query.to_ascii_lowercase();
        texts.iter().any(|text| text.to_ascii_lowercase().contains(&query))
    }

    /// `line` with the matches marked.
    pub fn mark(&self, theme: &Theme, line: Line<'static>) -> Line<'static> {
        highlight(theme, line, &self.query)
    }

    /// A section's count: `total`, or "`shown` of `total`" while a query
    /// filters.
    pub fn count(&self, shown: usize, total: usize) -> String {
        if self.query.is_empty() {
            total.to_string()
        } else {
            format!("{shown} of {total}")
        }
    }

    /// The line for a page where nothing matches.
    pub fn nothing(&self, theme: &Theme) -> Line<'static> {
        Line::styled(format!("  Nothing matches \"{}\".", self.query), theme.muted())
    }

    /// The start of the footer, at most `width` cells: `/`, the query, a
    /// cursor while typing, and how many of `matches` there are. A long
    /// query shows its end, next to the cursor. Put the key hints after it
    /// with [`KeyHints::prefix`](crate::KeyHints::prefix).
    pub fn prompt(&self, theme: &Theme, matches: usize, width: usize) -> Vec<Span<'static>> {
        let r = theme.tokens();
        let count = if matches == 1 { "1 match".to_owned() } else { format!("{matches} matches") };
        let mut count = format!("  {count}  ");
        let fixed = 2 + usize::from(self.typing);
        // On a narrow row the count goes first, then the start of the query.
        if fixed + cells(&count) + 2 > width {
            count = " ".to_owned();
        }
        let room = width.saturating_sub(fixed + cells(&count));
        let query = match room {
            _ if cells(&self.query) <= room => self.query.clone(),
            0 | 1 => String::new(),
            _ => format!("…{}", tail_cells(&self.query, room - 1).0),
        };
        let mut spans =
            vec![Span::styled("/ ", theme.fg(r.primary).add_modifier(Modifier::BOLD)), Span::styled(query, theme.text())];
        if self.typing {
            spans.push(Span::styled(" ", Style::new().bg(theme.color(r.primary))));
        }
        spans.push(Span::styled(count, theme.subtle()));
        cut(spans, width).0
    }

    /// A key while typing: letters and backspace edit, enter keeps the
    /// query, esc clears it, ↑↓ move.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, key: KeyEvent) -> Found {
        if key.modifiers.contains(KeyModifiers::CONTROL) {
            return Found::Ignored;
        }
        match key.code {
            KeyCode::Enter => self.typing = false,
            KeyCode::Esc => self.clear(),
            KeyCode::Up => return Found::Up,
            KeyCode::Down => return Found::Down,
            KeyCode::Backspace => {
                // The last grapheme, such as an emoji, goes as one.
                let last = self.query.graphemes(true).next_back().map_or(0, str::len);
                self.query.truncate(self.query.len() - last);
            }
            KeyCode::Char(c) => self.query.push(c),
            _ => return Found::Ignored,
        }
        Found::Changed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(feature = "crossterm")]
    #[test]
    fn backspace_removes_a_whole_grapheme() {
        use ratatui::crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
        let mut search = Search { query: "a\u{1f469}\u{200d}\u{1f4bb}".into(), typing: true };
        search.key(KeyEvent::new(KeyCode::Backspace, KeyModifiers::NONE));
        assert_eq!(search.query, "a");
    }

    #[test]
    fn a_long_query_shows_its_end_and_the_cursor() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let search = Search { query: format!("{}tail", "a".repeat(100)), typing: true };
        let line = Line::from(search.prompt(&theme, 3, 40));
        assert!(line.width() <= 40, "{line}");
        let text = line.to_string();
        assert!(text.starts_with("/ …a") && text.contains("aaatail   3 matches"), "{line}");
    }

    #[test]
    fn the_prompt_never_passes_its_width() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let search = Search { query: "abcdef".into(), typing: true };
        for width in 0..40 {
            let line = Line::from(search.prompt(&theme, 3, width));
            assert!(line.width() <= width, "{width}: {line}");
        }
        assert!(Line::from(search.prompt(&theme, 3, 16)).to_string().contains("abcdef"));
    }

    #[test]
    fn counts_show_what_is_left() {
        let search = Search { query: "FAIL".into(), typing: false };
        assert!(search.hit(&["mochi-cut", "failed to deploy"]));
        assert!(!search.hit(&["laya"]));
        assert_eq!(search.count(3, 5), "3 of 5");
        assert_eq!(Search::default().count(3, 5), "5");
    }
}
