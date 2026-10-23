use ratatui::buffer::Buffer;
#[cfg(feature = "crossterm")]
use ratatui::crossterm::event::{KeyCode, KeyEvent};
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

#[cfg(feature = "crossterm")]
use crate::Act;
use crate::{Field, Form, Modal, Page, Scroll, Theme};

/// Faceted filters: one select per facet, each starting on "All". The
/// terminal form of the filtering pattern; it composes selects, not a
/// FilterInput expression. A row shows when it passes the search and every
/// facet.
///
/// `f` opens the editor in a [`Modal`]. The page follows each change, enter
/// keeps the filters and esc puts back the ones from before. While filters
/// are active, [`Filters::line`] goes under the page's description.
#[derive(Clone, Debug, Default)]
pub struct Filters {
    form: Form,
    /// The chosen options from before the editor opened, while it is open.
    before: Option<Vec<usize>>,
}

/// What a key did in the filter editor.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FilterEdit {
    /// Nothing that changes the page.
    None,
    /// A facet changed: filter the page again and go back to its top.
    Changed,
    /// Enter: the editor closed with these filters.
    Kept,
    /// Esc: the editor closed with the filters from before. Put back the
    /// selection from before too.
    Cancelled,
}

impl Filters {
    /// A facet and its options. "All" comes first, added here.
    #[must_use]
    pub fn facet(mut self, label: impl Into<String>, options: impl IntoIterator<Item = impl Into<String>>) -> Self {
        let options = std::iter::once("All".to_owned()).chain(options.into_iter().map(Into::into));
        self.form.fields.push(Field::select(label, options));
        self
    }

    /// True when there is no facet, as on a page that has nothing to
    /// filter.
    pub fn is_empty(&self) -> bool {
        self.form.fields.is_empty()
    }

    /// True when a facet is on something else than "All".
    pub fn is_active(&self) -> bool {
        self.form.fields.iter().any(|field| field.chosen() != 0)
    }

    /// The option chosen for `facet`, or None for "All".
    pub fn chosen(&self, facet: usize) -> Option<&str> {
        self.form.fields.get(facet).filter(|field| field.chosen() != 0).and_then(Field::option)
    }

    /// True when `facet` lets `value` through: it is on "All", or on the
    /// option with exactly this text.
    pub fn allows(&self, facet: usize, value: &str) -> bool {
        self.chosen(facet).is_none_or(|chosen| chosen == value)
    }

    /// Every facet back to "All".
    pub fn clear(&mut self) {
        self.set(&vec![0; self.form.fields.len()]);
    }

    fn values(&self) -> Vec<usize> {
        self.form.fields.iter().map(Field::chosen).collect()
    }

    fn set(&mut self, values: &[usize]) {
        for (field, value) in self.form.fields.iter_mut().zip(values) {
            if let crate::Input::Select(_, chosen) = &mut field.input {
                *chosen = *value;
            }
        }
    }

    /// True while the editor is open.
    pub fn is_open(&self) -> bool {
        self.before.is_some()
    }

    /// Opens the editor on the first facet.
    pub fn open(&mut self) {
        self.before = Some(self.values());
        self.form.focus = 0;
    }

    /// A key in the editor: ↑↓ and tab move between facets, ←→ change one,
    /// enter keeps the filters and esc puts back the ones from before.
    #[cfg(feature = "crossterm")]
    pub fn key(&mut self, key: KeyEvent) -> FilterEdit {
        match key.code {
            KeyCode::Enter => {
                self.before = None;
                FilterEdit::Kept
            }
            KeyCode::Esc => {
                if let Some(before) = self.before.take() {
                    self.set(&before);
                }
                FilterEdit::Cancelled
            }
            _ => {
                let before = self.values();
                match self.form.key(key) {
                    Act::None if self.values() != before => FilterEdit::Changed,
                    _ => FilterEdit::None,
                }
            }
        }
    }

    /// The summary under the page's description, `width` cells at most:
    /// "Filtered by", each facet that is not on "All", and the keys to
    /// change them. The facets are cut first; the keys stay.
    pub fn line(&self, theme: &Theme, width: usize) -> Line<'static> {
        let mut facets = vec![Span::styled("Filtered by  ", theme.subtle())];
        let active = self.form.fields.iter().filter(|field| field.chosen() != 0);
        for (i, field) in active.enumerate() {
            if i > 0 {
                facets.push(Span::styled(" · ", theme.subtle()));
            }
            facets.push(Span::styled(format!("{} ", field.label), theme.muted()));
            facets.push(Span::styled(field.option().unwrap_or_default().to_owned(), theme.text()));
        }
        let keys = vec![
            Span::raw("   "),
            Span::styled("f", theme.text()),
            Span::styled(" edit", theme.muted()),
            Span::styled(" • ", theme.fg(theme.tokens().border)),
            Span::styled("esc", theme.text()),
            Span::styled(" clear filters", theme.muted()),
        ];
        let room = width.saturating_sub(keys.iter().map(Span::width).sum());
        let (mut spans, _) = crate::text::cut(facets, room);
        spans.extend(keys);
        Line::from(spans)
    }

    /// The editor, titled such as "Filter events", over `screen`.
    pub fn view<'a>(&'a self, theme: &'a Theme, title: &'a str) -> FiltersView<'a> {
        FiltersView { filters: self, theme, title }
    }
}

/// The filter editor on screen: one row per facet, the label in a column,
/// as in a [`Form`].
#[derive(Clone, Copy, Debug)]
pub struct FiltersView<'a> {
    filters: &'a Filters,
    theme: &'a Theme,
    title: &'a str,
}

impl Widget for FiltersView<'_> {
    fn render(self, screen: Rect, buf: &mut Buffer) {
        let (t, form) = (self.theme, &self.filters.form);
        let label = form.fields.iter().map(|field| crate::text::cells(&field.label)).max().unwrap_or(0) + 2;
        let keys = [("↑/↓", "facet"), ("←/→", "choose"), ("enter", "keep"), ("esc", "cancel")];
        let height = form.fields.len() as u16 + 3;
        let area = Modal::new(t, self.title).width(60).height(height).hints(keys).draw(screen, buf);
        if area.is_empty() {
            return;
        }
        // A column on each side for the selection, as in the theme picker.
        let area = Rect { x: area.x.saturating_sub(1), width: area.width + 2, ..area }.intersection(buf.area);
        let mut page = Page::default();
        let selected = form.rows(&mut page, t, usize::from(area.width), label, 0..form.fields.len());
        // A fresh scroll each draw, told to follow, keeps the focused facet
        // on screen when there are more facets than rows.
        let scroll = Scroll::default();
        scroll.follow();
        page.view(t, &scroll).selected(selected).render(area, buf);
    }
}

#[cfg(all(test, feature = "crossterm"))]
mod tests {
    use super::*;
    use ratatui::crossterm::event::KeyModifiers;

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    fn filters() -> Filters {
        Filters::default().facet("Status", ["Succeeded", "Failed"]).facet("Kind", ["Application", "Database"])
    }

    #[test]
    fn all_lets_everything_through() {
        let mut filters = filters();
        assert!(!filters.is_active());
        assert!(filters.allows(0, "Failed") && filters.allows(1, "anything"));
        filters.open();
        assert_eq!(filters.key(key(KeyCode::Right)), FilterEdit::Changed);
        assert_eq!(filters.key(key(KeyCode::Enter)), FilterEdit::Kept);
        assert_eq!(filters.chosen(0), Some("Succeeded"));
        assert!(filters.allows(0, "Succeeded") && !filters.allows(0, "Failed"));
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        assert!(filters.line(&theme, 80).to_string().contains("Status Succeeded"));
        let narrow = filters.line(&theme, 40);
        assert!(narrow.to_string().ends_with("esc clear filters") && narrow.width() <= 40, "{narrow}");
        filters.clear();
        assert!(!filters.is_active());
    }

    #[test]
    fn esc_puts_back_the_filters_from_before() {
        let mut filters = filters();
        filters.open();
        filters.key(key(KeyCode::Down));
        filters.key(key(KeyCode::Right));
        assert_eq!(filters.chosen(1), Some("Application"));
        assert_eq!(filters.key(key(KeyCode::Esc)), FilterEdit::Cancelled);
        assert_eq!(filters.chosen(1), None);
        assert!(!filters.is_open());
    }

    #[test]
    fn moving_between_facets_changes_nothing() {
        let mut filters = filters();
        filters.open();
        assert_eq!(filters.key(key(KeyCode::Down)), FilterEdit::None);
    }

    #[test]
    fn the_focused_facet_stays_on_screen() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut filters = Filters::default();
        for i in 0..25 {
            filters = filters.facet(format!("Facet {i}"), ["One", "Two"]);
        }
        filters.open();
        for _ in 0..24 {
            filters.key(key(KeyCode::Down));
        }
        let screen = Rect::new(0, 0, 80, 24);
        let mut buf = Buffer::empty(screen);
        filters.view(&theme, "Filter").render(screen, &mut buf);
        let text: String = buf.content.iter().map(|c| c.symbol()).collect();
        assert!(text.contains("Facet 24"), "the focused facet is off screen");
    }

    #[test]
    fn the_editor_fits_and_never_panics() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let filters = filters();
        for (w, h) in [(80, 24), (0, 0), (5, 3), (20, 6)] {
            let screen = Rect::new(0, 0, w, h);
            filters.view(&theme, "Filter events").render(screen, &mut Buffer::empty(screen));
        }
    }
}
