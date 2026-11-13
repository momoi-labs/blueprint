use std::collections::HashMap;

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::widgets::Widget;

use crate::surface::{put, write};
use crate::text::{cells, take_cells};
use crate::Theme;

/// Cells between two layers, where the edges run.
const GAP: usize = 6;

const NORTH: u8 = 1;
const EAST: u8 = 2;
const SOUTH: u8 = 4;
const WEST: u8 = 8;

/// A box in a [`Diagram`], placed by the caller in a layer (a column, from
/// the left) and a row.
#[derive(Clone, Debug)]
pub struct DiagramNode {
    id: String,
    label: String,
    detail: String,
    layer: usize,
    row: usize,
}

impl DiagramNode {
    /// A node named `label` that edges reach by `id`.
    pub fn new(id: impl Into<String>, label: impl Into<String>, layer: usize, row: usize) -> Self {
        Self { id: id.into(), label: label.into(), detail: String::new(), layer, row }
    }

    /// A second line in `muted-foreground`, such as "primary" or "2 replicas".
    #[must_use]
    pub fn detail(mut self, detail: impl Into<String>) -> Self {
        self.detail = detail.into();
        self
    }
}

/// A small graph of boxes and arrows, such as the path from a client to a
/// database. The caller places each node in a layer and a row; nothing is
/// laid out, zoomed or dragged.
///
/// A node is a `secondary` box with half rows above and below, as a
/// [`Card`](crate::Card): its label in `foreground` and its detail in
/// `muted-foreground`. The selected node takes the `selected` fill, bold
/// text and a `›` mark, so it reads in few colors. An edge leaves the
/// right side of a node, turns once in the gap before its target and ends
/// in a `▸`. Edges are light box-drawing lines in `border-strong`, and the
/// ones that touch the selected node are `link`.
///
/// Edges run to a node in a later layer. One that points back or sideways
/// is left out, and so is a node that does not fit whole in the area, with
/// its edges. A long edge passes behind the nodes in the layers between, so
/// give those nodes another row. Read [`Diagram::size`] for the area a
/// diagram needs. For many nodes or edges, a [`Table`](crate::Table) of
/// nodes and a key-value list of edges read better.
#[derive(Clone, Debug)]
pub struct Diagram<'a> {
    theme: &'a Theme,
    nodes: Vec<DiagramNode>,
    edges: Vec<(String, String)>,
    selected: Option<String>,
}

/// Where each layer starts and how wide it is, and how tall a node is.
struct Layout {
    starts: Vec<usize>,
    widths: Vec<usize>,
    node_height: usize,
}

impl<'a> Diagram<'a> {
    pub fn new(theme: &'a Theme) -> Self {
        Self { theme, nodes: Vec::new(), edges: Vec::new(), selected: None }
    }

    /// Adds a node.
    #[must_use]
    pub fn node(mut self, node: DiagramNode) -> Self {
        self.nodes.push(node);
        self
    }

    /// Adds an edge from the node with id `from` to the one with id `to`.
    /// An unknown id leaves the edge out.
    #[must_use]
    pub fn edge(mut self, from: impl Into<String>, to: impl Into<String>) -> Self {
        self.edges.push((from.into(), to.into()));
        self
    }

    /// The node with this id is the selected one.
    #[must_use]
    pub fn selected(mut self, id: impl Into<String>) -> Self {
        self.selected = Some(id.into());
        self
    }

    fn layout(&self) -> Layout {
        let layers = self.nodes.iter().map(|n| n.layer + 1).max().unwrap_or(0);
        let mut widths = vec![0; layers];
        for node in &self.nodes {
            let inner = cells(&node.label).max(cells(&node.detail));
            widths[node.layer] = widths[node.layer].max(inner + 4);
        }
        let mut starts = Vec::with_capacity(layers);
        let mut x = 0;
        for width in &widths {
            starts.push(x);
            x += width + GAP;
        }
        let node_height = if self.nodes.iter().any(|n| !n.detail.is_empty()) { 4 } else { 3 };
        Layout { starts, widths, node_height }
    }

    /// The width and height the diagram needs, to size its area.
    pub fn size(&self) -> (u16, u16) {
        let layout = self.layout();
        let width = layout.starts.last().map_or(0, |s| s + layout.widths[layout.widths.len() - 1]);
        let rows = self.nodes.iter().map(|n| n.row + 1).max().unwrap_or(0);
        let height = (rows * (layout.node_height + 1)).saturating_sub(1);
        (u16::try_from(width).unwrap_or(u16::MAX), u16::try_from(height).unwrap_or(u16::MAX))
    }

    /// The glyph for the sides a cell joins.
    fn glyph(flags: u8) -> &'static str {
        match flags {
            f if f & (NORTH | SOUTH) == (NORTH | SOUTH) && f & EAST != 0 && f & WEST != 0 => "┼",
            f if f & (NORTH | SOUTH) == (NORTH | SOUTH) && f & EAST != 0 => "├",
            f if f & (NORTH | SOUTH) == (NORTH | SOUTH) && f & WEST != 0 => "┤",
            f if f & (EAST | WEST) == (EAST | WEST) && f & SOUTH != 0 => "┬",
            f if f & (EAST | WEST) == (EAST | WEST) && f & NORTH != 0 => "┴",
            f if f & (EAST | SOUTH) == (EAST | SOUTH) => "┌",
            f if f & (WEST | SOUTH) == (WEST | SOUTH) => "┐",
            f if f & (EAST | NORTH) == (EAST | NORTH) => "└",
            f if f & (WEST | NORTH) == (WEST | NORTH) => "┘",
            f if f & (NORTH | SOUTH) != 0 => "│",
            _ => "─",
        }
    }
}

/// One cell of an edge: the sides it joins and whether it is an accent.
#[derive(Clone, Copy, Default)]
struct Joint {
    flags: u8,
    accent: bool,
}

impl Widget for Diagram<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = area.intersection(buf.area);
        if area.is_empty() || self.nodes.is_empty() {
            return;
        }
        let t = self.theme;
        let r = t.tokens();
        let layout = self.layout();
        let (stride, height) = (layout.node_height + 1, layout.node_height);
        // A node is drawn only whole. Positions are relative to the area.
        let place = |n: &DiagramNode| {
            let (x, y, w) = (layout.starts[n.layer], n.row * stride, layout.widths[n.layer]);
            (x + w <= usize::from(area.width) && y + height <= usize::from(area.height)).then_some((x, y, w))
        };
        let shown: HashMap<&str, (&DiagramNode, (usize, usize, usize))> =
            self.nodes.iter().filter_map(|n| place(n).map(|p| (n.id.as_str(), (n, p)))).collect();

        // Edges first, as flags per cell, so crossings and forks join.
        let mut joints: HashMap<(usize, usize), Joint> = HashMap::new();
        let mut arrows: Vec<((usize, usize), bool)> = Vec::new();
        for (from, to) in &self.edges {
            let (Some(&(a, (ax, ay, aw))), Some(&(b, (bx, by, _)))) = (shown.get(from.as_str()), shown.get(to.as_str())) else {
                continue;
            };
            if b.layer <= a.layer {
                continue;
            }
            let accent = self.selected.as_deref().is_some_and(|s| s == a.id || s == b.id);
            let (start, end) = (ax + aw, bx - 1);
            let (row_a, row_b) = (ay + 1, by + 1);
            let bend = end - 2;
            let mut link = |from: (usize, usize), to: (usize, usize)| {
                let (side_from, side_to) = match (to.0.cmp(&from.0), to.1.cmp(&from.1)) {
                    (std::cmp::Ordering::Greater, _) => (EAST, WEST),
                    (_, std::cmp::Ordering::Greater) => (SOUTH, NORTH),
                    (_, std::cmp::Ordering::Less) => (NORTH, SOUTH),
                    _ => return,
                };
                for (at, side) in [(from, side_from), (to, side_to)] {
                    let joint = joints.entry(at).or_default();
                    joint.flags |= side;
                    joint.accent |= accent;
                }
            };
            for x in start..bend {
                link((x, row_a), (x + 1, row_a));
            }
            for y in row_a.min(row_b)..row_a.max(row_b) {
                link((bend, y), (bend, y + 1));
            }
            for x in bend..end - 1 {
                link((x, row_b), (x + 1, row_b));
            }
            arrows.push(((end, row_b), accent));
        }
        let edge = |accent: bool| if accent { r.link } else { r.border_strong };
        let inside = |x: usize, y: usize| (x < usize::from(area.width) && y < usize::from(area.height)).then(|| (area.x + x as u16, area.y + y as u16));
        for (&(x, y), joint) in &joints {
            if let Some((x, y)) = inside(x, y) {
                put(buf, x, y, Self::glyph(joint.flags), t.color(edge(joint.accent)));
            }
        }
        for &((x, y), accent) in &arrows {
            if let Some((x, y)) = inside(x, y) {
                put(buf, x, y, "▸", t.color(edge(accent)));
            }
        }

        // Nodes over the edges.
        for (node, (x, y, w)) in shown.values() {
            let Some((x, y)) = inside(*x, *y) else { continue };
            let chosen = self.selected.as_deref() == Some(node.id.as_str());
            let (body, label, detail): (Style, Style, Style) = if chosen {
                let bg = t.selected_color();
                (Style::new().bg(bg), t.strong().bg(bg), t.muted().bg(bg))
            } else {
                let fill = t.fill(r.foreground, r.secondary);
                (fill, fill, t.fill(r.muted_foreground, r.secondary))
            };
            let bg = body.bg.unwrap_or_default();
            for dx in 0..*w as u16 {
                put(buf, x + dx, y, "▄", bg);
                put(buf, x + dx, y + height as u16 - 1, "▀", bg);
                for dy in 1..height as u16 - 1 {
                    write(buf, x + dx, y + dy, " ", body);
                }
            }
            // Cut a label wider than its box, which only a detail can cause.
            let room = w.saturating_sub(4);
            let text = |s: &str| take_cells(s, room).0.to_owned();
            write(buf, x + 2, y + 1, &text(&node.label), label.add_modifier(if chosen { Modifier::BOLD } else { Modifier::empty() }));
            if chosen {
                write(buf, x + 1, y + 1, "›", t.link().bg(bg));
            }
            if height > 3 && !node.detail.is_empty() {
                write(buf, x + 2, y + 2, &text(&node.detail), detail);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use ratatui::style::Color;

    use super::*;
    use crate::ACCENTS;

    fn row(buf: &Buffer, y: u16) -> String {
        (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_owned()).collect()
    }

    /// Client to a pooler, then a primary and a replica.
    fn diagram(theme: &Theme) -> Diagram<'_> {
        Diagram::new(theme)
            .node(DiagramNode::new("app", "App", 0, 0))
            .node(DiagramNode::new("pool", "Pooler", 1, 0))
            .node(DiagramNode::new("pri", "Primary", 2, 0))
            .node(DiagramNode::new("rep", "Replica", 2, 1))
            .edge("app", "pool")
            .edge("pool", "pri")
            .edge("pool", "rep")
    }

    #[test]
    fn nodes_sit_in_layers_and_edges_turn_once_into_an_arrow() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let diagram = diagram(&theme);
        assert_eq!(diagram.size(), (7 + 6 + 10 + 6 + 11, 7));
        let (w, h) = diagram.size();
        let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
        diagram.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 1), "  App  ─────▸  Pooler  ───┬─▸  Primary  ");
        assert_eq!(row(&buf, 3), format!("{}│{}", " ".repeat(26), " ".repeat(13)));
        assert_eq!(row(&buf, 5), format!("{}└─▸  Replica  ", " ".repeat(26)));
        assert_eq!(buf[(0, 0)].symbol(), "▄");
        assert_eq!(buf[(0, 2)].symbol(), "▀");
        // The arrow and the edge use the border color, the box the secondary fill.
        let r = theme.tokens();
        assert_eq!(buf[(9, 1)].fg, theme.color(r.border_strong));
        assert_eq!(buf[(2, 1)].bg, theme.color(r.secondary));
    }

    #[test]
    fn the_selected_node_and_its_edges_take_the_accent() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let (w, h) = diagram(&theme).size();
        let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
        diagram(&theme).selected("pool").render(buf.area, &mut buf);
        let r = theme.tokens();
        // The pooler: selected fill, a mark, bold text. Its edges: link.
        assert_eq!(buf[(14, 1)].symbol(), "›");
        assert_eq!(buf[(15, 1)].bg, theme.selected_color());
        assert!(buf[(15, 1)].modifier.contains(Modifier::BOLD));
        assert_eq!(buf[(9, 1)].fg, theme.color(r.link));
        assert_eq!(buf[(24, 1)].fg, theme.color(r.link));
        assert_eq!(buf[(26, 3)].fg, theme.color(r.link));
        // The node that is not selected keeps the plain fill.
        assert_eq!(buf[(2, 1)].bg, theme.color(r.secondary));
    }

    #[test]
    fn a_detail_adds_a_row_and_a_node_that_does_not_fit_is_left_out() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let diagram = Diagram::new(&theme)
            .node(DiagramNode::new("a", "App", 0, 0).detail("v2"))
            .node(DiagramNode::new("b", "Db", 1, 0))
            .edge("a", "b");
        assert_eq!(diagram.size(), (7 + 6 + 6, 4));
        let mut buf = Buffer::empty(Rect::new(0, 0, 12, 4));
        diagram.render(buf.area, &mut buf);
        assert_eq!(row(&buf, 2), "  v2        ");
        // The second layer is cut off, so there is no edge and no arrow.
        assert!(!row(&buf, 1).contains('▸'));
        assert!(!row(&buf, 1).contains('─'));
    }

    #[test]
    fn edges_that_cannot_be_drawn_are_left_out() {
        let theme = Theme::truecolor(kiso_tokens::GOLD_DARK);
        let diagram = Diagram::new(&theme)
            .node(DiagramNode::new("a", "A", 0, 0))
            .node(DiagramNode::new("b", "B", 0, 1))
            .edge("a", "b")
            .edge("b", "a")
            .edge("a", "nope");
        let (w, h) = diagram.size();
        let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
        diagram.render(buf.area, &mut buf);
        assert!(!(0..h).any(|y| row(&buf, y).contains(['▸', '─', '│'])));
    }

    #[test]
    fn it_draws_only_inside_its_area_and_never_panics() {
        let theme = Theme::xterm_256(kiso_tokens::GOLD_DARK);
        let mut buf = Buffer::empty(Rect::new(0, 0, 60, 12));
        diagram(&theme).render(Rect::new(3, 2, 40, 8), &mut buf);
        assert_eq!(buf[(2, 3)].bg, Color::Reset);
        assert_eq!(buf[(3, 1)].symbol(), " ");
        assert!((43..60).all(|x| buf[(x, 3)].symbol() == " "));
        for (w, h) in [(1, 1), (5, 3), (12, 4), (30, 7), (60, 12)] {
            let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
            diagram(&theme).selected("rep").render(buf.area, &mut buf);
        }
        let mut edge = Buffer::empty(Rect::new(65500, 0, 30, 10));
        diagram(&theme).render(edge.area, &mut edge);
        Diagram::new(&theme).render(buf.area, &mut buf);
        assert_eq!(Diagram::new(&theme).size(), (0, 0));
    }

    #[test]
    fn the_selected_fill_stays_apart_from_the_plain_one_in_every_theme() {
        for accent in ACCENTS {
            for light in [false, true] {
                for theme in [Theme::truecolor(accent.tokens(light)), Theme::xterm_256(accent.tokens(light))] {
                    let (w, h) = diagram(&theme).size();
                    let mut buf = Buffer::empty(Rect::new(0, 0, w, h));
                    diagram(&theme).selected("pool").render(buf.area, &mut buf);
                    let (plain, chosen) = (buf[(2, 1)].bg, buf[(15, 1)].bg);
                    assert_ne!(plain, chosen, "{} light={light}", accent.name);
                    assert_ne!(plain, theme.color(theme.tokens().background), "{} light={light}", accent.name);
                    assert_ne!(buf[(9, 1)].fg, plain, "{} light={light}", accent.name);
                }
            }
        }
    }
}
