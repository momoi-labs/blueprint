//! The gallery as JSON for the Kiso site. Each state is drawn in every
//! theme, and each color is written as the token it comes from, so the site
//! shows the state in its own accent, dark or light.

use std::collections::HashMap;

use kiso_tokens::Rgb;
use ratatui::buffer::{Buffer, Cell};
use ratatui::style::{Color, Modifier};
use tui_kiso::blend;

macro_rules! named {
    ($tokens:expr, $($field:ident)*) => {
        vec![$((stringify!($field), $tokens.$field)),*]
    };
}

/// Every token, in the order `kiso_tokens::Theme` declares them. When two
/// tokens match a color, the first one names it.
fn tokens(t: &kiso_tokens::Theme) -> Vec<(&'static str, Rgb)> {
    named!(t,
        background surface elevated_surface foreground muted_foreground subtle_foreground border primary accent
        success warning danger info focus disabled card card_foreground popover popover_foreground muted sidebar
        sidebar_border border_strong input primary_foreground primary_hover link accent_surface accent_surface_hover
        selected selected_foreground secondary secondary_foreground secondary_hover ring disabled_surface skeleton
        hatch corner_mark danger_foreground success_on_dark warning_on_dark danger_on_dark info_on_dark chart_1
        chart_2 chart_3 chart_4 chart_5
    )
}

/// How the site paints a color.
#[derive(Clone)]
enum Paint {
    /// The terminal's own color, which the site sets to `foreground` on
    /// `background`.
    Terminal,
    /// A token of the theme, by name.
    Token(&'static str),
    /// A share of the way from `primary` to `chart-1`: the gradient.
    Mix(f32),
    /// A color for each theme, in the order of `themes`. Theme decides some
    /// colors itself, such as text that keeps its contrast on a fill.
    Each(Vec<Option<Rgb>>),
    /// One color, in a row drawn for one theme only, such as another
    /// accent in the theme picker.
    Hex(Rgb),
}

impl Paint {
    fn json(&self) -> String {
        let hex = |c: &Option<Rgb>| c.map_or("null".into(), |[r, g, b]| format!("\"#{r:02x}{g:02x}{b:02x}\""));
        match self {
            Paint::Terminal => "null".into(),
            Paint::Token(name) => format!("\"{}\"", name.replace('_', "-")),
            Paint::Mix(share) => format!("{{\"mix\":{share}}}"),
            Paint::Each(colors) => format!("[{}]", colors.iter().map(hex).collect::<Vec<_>>().join(",")),
            Paint::Hex(color) => hex(&Some(*color)),
        }
    }
}

pub struct Gallery {
    /// Each theme's name, such as "gold-dark", and its tokens.
    themes: Vec<(String, Vec<(&'static str, Rgb)>)>,
    /// The theme whose text the site shows.
    base: usize,
    paints: HashMap<(Vec<usize>, Vec<Option<Rgb>>), Paint>,
    styles: Vec<String>,
    style_index: HashMap<String, usize>,
    pages: Vec<String>,
}

impl Gallery {
    pub fn new(themes: impl IntoIterator<Item = (String, kiso_tokens::Theme)>, base: usize) -> Self {
        let themes = themes.into_iter().map(|(name, t)| (name, tokens(&t))).collect();
        Self { themes, base, paints: HashMap::new(), styles: Vec::new(), style_index: HashMap::new(), pages: Vec::new() }
    }

    /// The paint of `colors`, the color of one cell in each of `themes`.
    fn paint(&mut self, themes: &[usize], colors: Vec<Option<Rgb>>) -> Paint {
        let key = (themes.to_vec(), colors);
        if let Some(paint) = self.paints.get(&key) {
            return paint.clone();
        }
        let paint = self.name(themes, &key.1);
        self.paints.insert(key, paint.clone());
        paint
    }

    fn name(&self, themes: &[usize], colors: &[Option<Rgb>]) -> Paint {
        let each = || {
            if let ([_], [Some(color)]) = (themes, colors) {
                return Paint::Hex(*color);
            }
            let mut all = vec![None; self.themes.len()];
            for (&t, c) in themes.iter().zip(colors) {
                all[t] = *c;
            }
            Paint::Each(all)
        };
        if colors.iter().all(Option::is_none) {
            return Paint::Terminal;
        }
        let Some(rgb) = colors.iter().copied().collect::<Option<Vec<Rgb>>>() else {
            return each();
        };
        let table = |t: usize| &self.themes[t].1;
        let count = table(0).len();
        if let Some(i) = (0..count).find(|&i| themes.iter().zip(&rgb).all(|(&t, c)| table(t)[i].1 == *c)) {
            return Paint::Token(table(0)[i].0);
        }
        // The same share of the gradient in every theme. Rounding to whole
        // channels can move a color by one.
        let get = |t: usize, name: &str| table(t).iter().find(|(n, _)| *n == name).map_or([0; 3], |(_, c)| *c);
        let close = |a: Rgb, b: Rgb| a.iter().zip(b).all(|(x, y)| x.abs_diff(y) <= 1);
        let share = (0..=1000).map(|k| k as f32 / 1000.0).find(|&share| {
            themes.iter().zip(&rgb).all(|(&t, c)| close(blend(&[get(t, "primary"), get(t, "chart_1")], share), *c))
        });
        share.map_or_else(each, Paint::Mix)
    }

    /// The style of a cell, given as it is in each of `themes`.
    fn style(&mut self, themes: &[usize], cells: &[&Cell]) -> usize {
        let rgb = |color: Color| match color {
            Color::Rgb(r, g, b) => Some([r, g, b]),
            _ => None,
        };
        let fg = self.paint(themes, cells.iter().map(|c| rgb(c.fg)).collect());
        let bg = self.paint(themes, cells.iter().map(|c| rgb(c.bg)).collect());
        let mut style = format!("{{\"fg\":{},\"bg\":{}", fg.json(), bg.json());
        // Theme can turn bold on in one theme only, such as a status word
        // on a selected row; then it is one value per theme.
        let total = self.themes.len();
        let flag = |modifier: Modifier| {
            let on: Vec<bool> = cells.iter().map(|c| c.modifier.contains(modifier)).collect();
            if on.iter().all(|&b| !b) {
                None
            } else if on.iter().all(|&b| b) {
                Some("true".to_owned())
            } else {
                let mut all = vec![false; total];
                for (&t, &b) in themes.iter().zip(&on) {
                    all[t] = b;
                }
                Some(format!("[{}]", all.iter().map(bool::to_string).collect::<Vec<_>>().join(",")))
            }
        };
        if let Some(bold) = flag(Modifier::BOLD) {
            style += &format!(",\"bold\":{bold}");
        }
        if let Some(underline) = flag(Modifier::UNDERLINED) {
            style += &format!(",\"underline\":{underline}");
        }
        style += "}";
        if let Some(&i) = self.style_index.get(&style) {
            return i;
        }
        self.styles.push(style.clone());
        self.style_index.insert(style, self.styles.len() - 1);
        self.styles.len() - 1
    }

    /// Row `y` of `buffer` as runs of text in one style: `[text, style,
    /// cells]`.
    fn row(buffer: &Buffer, y: u16, styles: &[usize]) -> String {
        let mut runs: Vec<(String, usize, usize)> = Vec::new();
        // A wide character, such as 中, takes two cells; the second is a
        // blank the terminal draws over, so it is not written again.
        let mut covered = 0;
        for x in 0..buffer.area.width {
            if covered > 0 {
                covered -= 1;
                continue;
            }
            let symbol = buffer[(x, y)].symbol();
            let width = unicode_width::UnicodeWidthStr::width(symbol).max(1);
            covered = width - 1;
            let style = styles[usize::from(x)];
            match runs.last_mut() {
                Some((text, s, w)) if *s == style => {
                    text.push_str(symbol);
                    *w += width;
                }
                _ => runs.push((symbol.to_owned(), style, width)),
            }
        }
        let runs: Vec<String> = runs.iter().map(|(text, style, width)| format!("[{},{style},{width}]", string(text))).collect();
        format!("[{}]", runs.join(","))
    }

    /// Each row of a screen drawn once in each theme, as each theme shows
    /// it: `[theme][row]`. A row whose text is the same in every theme is
    /// one string, its colors named across themes. A row whose text
    /// differs, such as one that names the accent, is the theme's own, in
    /// its own colors.
    fn resolve(&mut self, buffers: &[Buffer]) -> Vec<Vec<String>> {
        let base = &buffers[self.base];
        let area = base.area;
        let all: Vec<usize> = (0..buffers.len()).collect();
        // The base theme's cell first, for the order of `themes` in `style`.
        let order: Vec<usize> = std::iter::once(self.base).chain(all.iter().copied().filter(|&t| t != self.base)).collect();
        let text = |b: &Buffer, y: u16| (0..area.width).map(|x| b[(x, y)].symbol()).collect::<String>();
        let mut resolved = vec![Vec::new(); buffers.len()];
        for y in 0..area.height {
            if buffers.iter().all(|b| text(b, y) == text(base, y)) {
                let styles: Vec<usize> = (0..area.width)
                    .map(|x| self.style(&order, &order.iter().map(|&t| &buffers[t][(x, y)]).collect::<Vec<_>>()))
                    .collect();
                let row = Self::row(base, y, &styles);
                for rows in &mut resolved {
                    rows.push(row.clone());
                }
            } else {
                for (t, buffer) in buffers.iter().enumerate() {
                    let styles: Vec<usize> = (0..area.width).map(|x| self.style(&[t], &[&buffer[(x, y)]])).collect();
                    resolved[t].push(Self::row(buffer, y, &styles));
                }
            }
        }
        resolved
    }

    /// The rows of `resolved` in `wanted`, as JSON: `"rows"` with the base
    /// theme's, and `"variants"` with each other theme's where they differ.
    /// Rows outside `wanted` are left out, as a list or by row number.
    fn rows(&self, resolved: &[Vec<String>], wanted: &[bool], list: bool) -> String {
        let base = &resolved[self.base];
        let rows: Vec<String> = (0..base.len())
            .filter(|&y| wanted[y])
            .map(|y| if list { base[y].clone() } else { format!("\"{y}\":{}", base[y]) })
            .collect();
        let rows = if list { format!("\"rows\":[\n{}\n]", rows.join(",\n")) } else { format!("\"rows\":{{\n{}\n}}", rows.join(",\n")) };
        let mut variants = Vec::new();
        for (t, theme) in resolved.iter().enumerate().filter(|(t, _)| *t != self.base) {
            let changed: Vec<String> =
                (0..base.len()).filter(|&y| wanted[y] && theme[y] != base[y]).map(|y| format!("\"{y}\":{}", theme[y])).collect();
            if !changed.is_empty() {
                variants.push(format!("{}:{{\n{}\n}}", string(&self.themes[t].0), changed.join(",\n")));
            }
        }
        if variants.is_empty() {
            rows
        } else {
            format!("{rows},\"variants\":{{\n{}\n}}", variants.join(",\n"))
        }
    }

    /// One state, drawn once in each theme, in the order of `themes`, with
    /// the terminal's own colors then. `scrolled` is the same state after
    /// each `j` that moves the page, until it stops; each is written as the
    /// rows that change from the state. `links` are the sidebar's names, by
    /// row, column, width and page, which the site makes links.
    pub fn state(
        &mut self,
        id: &str,
        label: &str,
        buffers: &[Buffer],
        terminal: &[Cell],
        scrolled: &[Vec<Buffer>],
        links: &[(u16, u16, u16, usize)],
    ) -> String {
        let area = buffers[self.base].area;
        let all: Vec<usize> = (0..buffers.len()).collect();
        let screen = self.style(&all, &terminal.iter().collect::<Vec<_>>());
        let first = self.resolve(buffers);
        let height = usize::from(area.height);
        let rows = self.rows(&first, &vec![true; height], true);
        let mut frames = Vec::new();
        for frame in scrolled {
            let resolved = self.resolve(frame);
            let changed: Vec<bool> = (0..height).map(|y| resolved.iter().zip(&first).any(|(a, b)| a[y] != b[y])).collect();
            frames.push(format!("{{{}}}", self.rows(&resolved, &changed, false)));
        }
        let scroll = if frames.is_empty() { String::new() } else { format!(",\"scroll\":[\n{}\n]", frames.join(",\n")) };
        let links: Vec<String> = links.iter().map(|(y, x, width, page)| format!("[{y},{x},{width},{page}]")).collect();
        let links = if links.is_empty() { String::new() } else { format!(",\"links\":[{}]", links.join(",")) };
        format!(
            "{{\"id\":{},\"label\":{},\"size\":[{},{}],\"screen\":{screen}{links},{rows}{scroll}}}",
            string(id),
            string(label),
            area.width,
            area.height,
        )
    }

    pub fn page(&mut self, id: &str, name: &str, about: &str, states: Vec<String>) {
        self.pages.push(format!(
            "{{\"id\":{},\"name\":{},\"about\":{},\"states\":[\n{}\n]}}",
            string(id),
            string(name),
            string(about),
            states.join(",\n")
        ));
    }

    pub fn finish(self) -> String {
        let themes: Vec<String> = self.themes.iter().map(|(name, _)| string(name)).collect();
        // Each theme's tokens, so the site draws the terminal in exactly
        // these colors.
        let tokens: Vec<String> = self
            .themes
            .iter()
            .map(|(name, table)| {
                let colors: Vec<String> =
                    table.iter().map(|(n, [r, g, b])| format!("\"{}\":\"#{r:02x}{g:02x}{b:02x}\"", n.replace('_', "-"))).collect();
                format!("{}:{{{}}}", string(name), colors.join(","))
            })
            .collect();
        format!(
            "{{\"themes\":[{}],\n\"tokens\":{{\n{}\n}},\n\"styles\":[\n{}\n],\n\"pages\":[\n{}\n]}}\n",
            themes.join(","),
            tokens.join(",\n"),
            self.styles.join(",\n"),
            self.pages.join(",\n")
        )
    }
}

fn string(text: &str) -> String {
    let mut out = String::from("\"");
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if u32::from(c) < 0x20 => out.push_str(&format!("\\u{:04x}", u32::from(c))),
            c => out.push(c),
        }
    }
    out + "\""
}
