//! Kiso components for [ratatui](https://ratatui.rs), in the style of
//! Charm's Crush: no frames around parts of a page, a section is a title
//! and a rule, and only the selection, code, cards, badges, buttons and
//! dialogs get a fill or a frame.
//!
//! A [`Theme`] built from one `kiso-tokens` accent, with the [`Look`] of
//! titles, rules and surfaces, and the widgets that follow Kiso's terminal contract.
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
mod app_shell;
mod backdrop;
mod badge;
mod breadcrumb;
mod button;
mod buttons;
mod card;
mod chart;
mod color;
mod dot;
mod filters;
mod form;
mod grid;
mod header;
mod key_hints;
mod look;
mod menu;
mod meter;
mod modal;
mod notice;
mod page;
mod page_header;
mod palette;
mod picker;
mod question;
mod search;
mod sidebar;
mod sparkline;
mod stat;
mod status_badge;
mod surface;
mod switch;
mod table;
mod text;
mod theme;
mod title;
mod tone;
mod alert;
mod empty_state;
mod link;
mod separator;
mod skeleton;
mod spinner;

pub use accent::{Accent, ACCENTS};
pub use app_shell::{AppShell, ShellAreas};
pub use backdrop::{Backdrop, Canvas};
pub use badge::Badge;
pub use breadcrumb::Breadcrumb;
pub use button::{Button, ButtonState, ButtonVariant};
pub use buttons::{Buttons, Press};
pub use card::{Card, CardVariant, Size};
pub use chart::{Chart, ChartLegend, Series};
pub use color::blend;
pub use dot::Dot;
pub use filters::{FilterEdit, Filters, FiltersView};
pub use form::{Act, Field, Form, Input};
pub use grid::Grid;
pub use header::Header;
pub use key_hints::KeyHints;
pub use look::{Border, Ink, Look, PanelFill, Pattern, Stroke};
pub use menu::Menu;
pub use meter::{BarGauge, Meter};
pub use modal::Modal;
pub use notice::{braille, scramble, set_background, set_clipboard, set_foreground, set_progress, step, StepState, Toast};
pub use page::{Mark, Page, PageView, Scroll};
pub use page_header::PageHeader;
pub use palette::Palette;
pub use picker::{PickerView, ThemePicker};
pub use question::Question;
pub use search::{Found, Search};
pub use sidebar::{Side, SideItem, Sidebar};
pub use sparkline::Sparkline;
pub use stat::Stat;
pub use status_badge::StatusBadge;
pub use switch::{Switch, SwitchState};
pub use table::Table;
pub use text::{fact, fit, highlight, wrap, Columns};
pub use theme::Theme;
pub use title::{Tabs, Title};
pub use tone::Tone;
pub use alert::Alert;
pub use empty_state::EmptyState;
pub use link::{Link, LinkState};
pub use separator::Separator;
pub use skeleton::Skeleton;
pub use spinner::Spinner;
