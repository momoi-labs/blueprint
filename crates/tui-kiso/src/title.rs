use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Modifier;
use ratatui::text::{Line, Span};
use ratatui::widgets::Widget;

use crate::text::{cells, cut};
use crate::Theme;

/// Where the person is: a label in bold `foreground` in the middle of the
/// look's title line, across the width. By default the line is a heavy
/// `━` in `primary`.
#[derive(Clone, Debug)]
pub struct Title<'a> {
    theme: &'a Theme,
    label: String,
}

impl<'a> Title<'a> {
    pub fn new(theme: &'a Theme, label: impl Into<String>) -> Self {
        Self { theme, label: label.into() }
    }

    /// The title `width` cells wide, to put in a line of your own.
    pub fn spans(&self, width: usize) -> Vec<Span<'static>> {
        let label = format!(" {} ", self.label);
        let room = width.saturating_sub(cells(&label));
        let left = room / 2;
        let line = glyphs(self.theme.look().title.spans(self.theme, width));
        let mut spans: Vec<Span<'static>> = line[..left.min(line.len())].to_vec();
        spans.push(Span::styled(label, self.theme.strong()));
        spans.extend(line[(width - (room - left)).min(line.len())..].iter().cloned());
        spans
    }
}

impl Widget for Title<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        buf.set_line(area.x, area.y, &Line::from(self.spans(usize::from(area.width))), area.width);
    }
}

/// One span per character, so a stroke can be cut anywhere.
fn glyphs(spans: Vec<Span<'static>>) -> Vec<Span<'static>> {
    spans
        .into_iter()
        .flat_map(|span| span.content.chars().map(move |ch| Span::styled(ch.to_string(), span.style)).collect::<Vec<_>>())
        .collect()
}

/// The views of a screen, side by side, as the web's Tabs: the current one
/// is `link` text and bold with a heavy `━` in `primary` under it; the
/// others are `muted-foreground`, with their number in `subtle-foreground`
/// as their key, over a faint `─` rule across the width. There is no fill,
/// so it does not read as the time range control.
///
/// It takes two rows: [`Tabs::line`] is the labels and [`Tabs::rule`] is the
/// underline. As a widget it draws both when the area is two rows tall, and
/// the labels alone when it is one: the current tab is still marked by its
/// color and weight.
#[derive(Clone, Debug)]
pub struct Tabs<'a> {
    theme: &'a Theme,
    labels: Vec<String>,
    current: usize,
    numbered: bool,
    disabled: Vec<usize>,
}

impl<'a> Tabs<'a> {
    /// Views by label, such as "Waiting 3", and the current one.
    pub fn new(theme: &'a Theme, labels: impl IntoIterator<Item = impl Into<String>>, current: usize) -> Self {
        Self { theme, labels: labels.into_iter().map(Into::into).collect(), current, numbered: true, disabled: Vec::new() }
    }

    /// Hides the numbers, for a screen where number keys mean something
    /// else, such as the tabs of a detail page moved with `[` and `]`.
    #[must_use]
    pub fn numbered(mut self, numbered: bool) -> Self {
        self.numbered = numbered;
        self
    }

    /// Views that cannot be chosen, by index. They are `disabled` text.
    #[must_use]
    pub fn disabled(mut self, views: impl IntoIterator<Item = usize>) -> Self {
        self.disabled = views.into_iter().collect();
        self
    }

    /// The rows it takes: the labels and the underline.
    pub const fn height(&self) -> u16 {
        2
    }

    /// The text of a tab: its number, its label, and a cell on each side.
    fn tab(&self, i: usize) -> String {
        if self.numbered {
            format!(" {} {} ", i + 1, self.labels[i])
        } else {
            format!(" {} ", self.labels[i])
        }
    }

    /// The tabs that fit in `width`, in order, with their widths. When the
    /// views do not fit, the ones farthest from the current one drop; the
    /// current one always shows, cut with `…` if it must.
    fn place(&self, width: usize) -> Vec<(usize, usize)> {
        let cost = |i: usize| cells(&self.tab(i));
        let mut shown: Vec<usize> = (0..self.labels.len()).collect();
        while shown.iter().map(|&i| cost(i)).sum::<usize>() > width && shown.len() > 1 {
            let far = shown.iter().copied().filter(|&i| i != self.current).max_by_key(|&i| i.abs_diff(self.current));
            match far {
                Some(far) => shown.retain(|&i| i != far),
                None => break,
            }
        }
        let mut left = width;
        shown
            .into_iter()
            .map(|i| {
                let w = cost(i).min(left);
                left -= w;
                (i, w)
            })
            .collect()
    }

    /// The labels, `width` cells wide at most.
    pub fn line(&self, width: usize) -> Line<'static> {
        let t = self.theme;
        let mut spans = Vec::new();
        for (i, w) in self.place(width) {
            let style = if self.disabled.contains(&i) {
                t.disabled()
            } else if i == self.current {
                t.link().add_modifier(Modifier::BOLD)
            } else {
                t.muted()
            };
            let text = self.tab(i);
            let (mut tab, used) = cut(vec![Span::styled(text, style)], w);
            if self.numbered && i != self.current && !self.disabled.contains(&i) && used > 3 {
                // The number is the key: it stays quiet beside the label.
                let number = format!(" {} ", i + 1);
                if let Some(first) = tab.first_mut() {
                    let rest = first.content.chars().skip(number.chars().count()).collect::<String>();
                    first.content = rest.into();
                }
                tab.insert(0, Span::styled(number, t.subtle()));
            }
            spans.extend(tab);
        }
        Line::from(spans)
    }

    /// The rule under the labels: a faint `─` across `width`, and a heavy
    /// `━` in `primary` under the current tab.
    pub fn rule(&self, width: usize) -> Line<'static> {
        let t = self.theme;
        let mut spans = Vec::new();
        let mut used = 0;
        for (i, w) in self.place(width) {
            let (glyph, style) = if i == self.current { ("━", t.fg(t.tokens().primary)) } else { ("─", t.fg(t.tokens().border)) };
            spans.push(Span::styled(glyph.repeat(w), style));
            used += w;
        }
        spans.push(Span::styled("─".repeat(width.saturating_sub(used)), t.fg(t.tokens().border)));
        Line::from(spans)
    }
}

impl Widget for Tabs<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() {
            return;
        }
        let width = usize::from(area.width);
        buf.set_line(area.x, area.y, &self.line(width), area.width);
        if area.height >= 2 {
            buf.set_line(area.x, area.y + 1, &self.rule(width), area.width);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_label_sits_in_the_middle() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let line = Line::from(Title::new(&theme, "Logs").spans(16));
        assert_eq!(line.to_string(), "━━━━━ Logs ━━━━━");
    }

    #[test]
    fn an_empty_area_draws_nothing() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 10, 1));
        Title::new(&theme, "Logs").render(Rect::new(0, 0, 10, 0), &mut buf);
        Tabs::new(&theme, ["A"], 0).render(Rect::new(0, 1, 10, 1), &mut buf);
        assert_eq!(buf[(0, 0)].symbol(), " ");
    }

    #[test]
    fn tabs_can_hide_their_numbers() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let tabs = Tabs::new(&theme, ["laya · Summary", "Routes", "Logs"], 0).numbered(false);
        assert_eq!(tabs.line(50).to_string(), " laya · Summary  Routes  Logs ");
    }

    #[test]
    fn the_current_tab_always_shows() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let labels = ["Overview", "Applications", "Databases", "Routes", "Certificates", "Settings", "Selected"];
        let tabs = Tabs::new(&theme, labels, 6);
        let line = tabs.line(30);
        assert!(line.to_string().contains(" 7 Selected "), "{line}");
        assert!(line.width() <= 30);
        assert_eq!(tabs.rule(30).width(), 30);
        // Not even the current one fits: it is cut, not dropped.
        assert_eq!(tabs.line(6).to_string(), " 7 Se…");
    }

    #[test]
    fn the_current_tab_is_accent_text_over_a_heavy_underline() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let tabs = Tabs::new(&theme, ["Running 4", "Waiting 1"], 0);
        let mut buf = Buffer::empty(Rect::new(0, 0, 40, 2));
        tabs.render(buf.area, &mut buf);
        let row = |y| (0..40).map(|x| buf[(x, y)].symbol().to_owned()).collect::<String>();
        assert_eq!(row(0), " 1 Running 4  2 Waiting 1               ");
        assert_eq!(row(1), format!("{}{}", "━".repeat(13), "─".repeat(27)));
        assert_eq!(buf[(5, 0)].fg, theme.color(theme.tokens().link));
        assert!(buf[(5, 0)].modifier.contains(Modifier::BOLD));
        assert_eq!(buf[(0, 1)].fg, theme.color(theme.tokens().primary));
        assert_eq!(buf[(20, 0)].fg, theme.color(theme.tokens().muted_foreground));
        assert_eq!(buf[(1, 0)].bg, ratatui::style::Color::Reset, "no fill");
        assert_eq!(buf[(20, 1)].fg, theme.color(theme.tokens().border));
    }

    #[test]
    fn one_row_draws_the_labels_only_and_a_disabled_tab_is_dim() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 30, 2));
        Tabs::new(&theme, ["A", "B"], 0).disabled([1]).render(Rect::new(0, 0, 30, 1), &mut buf);
        assert_eq!(buf[(0, 1)].symbol(), " ");
        assert_eq!(buf[(6, 0)].fg, theme.color(theme.tokens().disabled));
    }
}
