//! Kiso component specs.
//!
//! Each component is one struct: its props, variants and defaults. The
//! struct is the source for every output. TypeScript types for
//! `@momoi-labs/kiso-react` are generated from it, `tui-kiso` builds its
//! widgets from it, and the HTML and text renderers here are checked
//! against the React components in CI.
//!
//! ```
//! use kiso_core::{StatusBadge, StatusTone};
//!
//! let badge = StatusBadge::new(StatusTone::Success, "Running");
//! assert_eq!(badge.to_text(), "● Running");
//! ```

mod status_badge;

pub use status_badge::{StatusBadge, StatusTone};

/// Escapes text for an HTML text node or a quoted attribute.
fn escape_html(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#x27;"),
            c => out.push(c),
        }
    }
    out
}
