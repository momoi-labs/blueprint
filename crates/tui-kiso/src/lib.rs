//! Kiso components for [ratatui](https://ratatui.rs).
//!
//! A thin layer: a [`Theme`] built from one `kiso-tokens` accent, and the
//! widgets that follow Kiso's terminal contract. The app owns its event
//! loop and layout.
//!
//! ```
//! use tui_kiso::{StatusBadge, Theme};
//! use ratatui::text::Line;
//!
//! let theme = Theme::new(kiso_tokens::GOLD_DARK);
//! let cell: Line = StatusBadge::success(&theme, "Running").into();
//! assert_eq!(cell.to_string(), "● Running");
//! ```

mod header;
mod key_hints;
mod modal;
mod status_badge;
mod table;
mod theme;

pub use header::Header;
pub use key_hints::KeyHints;
pub use modal::Modal;
pub use status_badge::StatusBadge;
pub use table::Table;
pub use theme::Theme;
