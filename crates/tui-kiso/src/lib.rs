//! Kiso components for [ratatui](https://ratatui.rs), in the style of
//! Charm's Crush: no frames around parts of a page, a section is a title
//! and a rule, and only the selection, code, buttons and dialogs get a
//! fill or a frame.
//!
//! A [`Theme`] built from one `kiso-tokens` accent, with the [`Look`] of
//! titles and rules, and the widgets that follow Kiso's terminal contract.
//! The app owns its event loop and layout. Key handling for forms, filters,
//! the search and the theme picker needs the `crossterm` feature, on by
//! default.
//!
//! ```
//! use tui_kiso::{StatusBadge, Theme};
//! use ratatui::text::Line;
//!
//! let theme = Theme::new(kiso_tokens::GOLD_DARK);
//! let cell: Line = StatusBadge::success(&theme, "Running").into();
//! assert_eq!(cell.to_string(), "● Running");
//! ```

mod accent;
mod buttons;
mod color;
mod filters;
mod form;
mod header;
mod key_hints;
mod look;
mod menu;
mod modal;
mod notice;
mod page;
mod palette;
mod picker;
mod question;
mod search;
mod sidebar;
mod status_badge;
mod table;
mod text;
mod theme;
mod title;

pub use accent::{Accent, ACCENTS};
pub use buttons::{Buttons, Press};
pub use color::blend;
pub use filters::{FilterEdit, Filters, FiltersView};
pub use form::{Act, Field, Form, Input};
pub use header::Header;
pub use key_hints::KeyHints;
pub use look::{Ink, Look, Pattern, Stroke};
pub use menu::Menu;
pub use modal::Modal;
pub use notice::{braille, scramble, set_background, set_clipboard, set_foreground, set_progress, step, StepState, Toast};
pub use page::{Mark, Page, PageView, Scroll};
pub use palette::Palette;
pub use picker::{PickerView, ThemePicker};
pub use question::Question;
pub use search::{Found, Search};
pub use sidebar::{Side, SideItem, Sidebar};
pub use status_badge::StatusBadge;
pub use table::Table;
pub use text::{fact, fit, highlight, wrap, Columns};
pub use theme::Theme;
pub use title::{Tabs, Title};
