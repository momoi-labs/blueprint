use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::escape_html;

/// Green is alive, red is failed, neutral is what is not happening. No
/// fourth color: a status reads like a light on a device.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export, export_to = "../../../packages/kiso-react/src/generated/status-badge.ts")]
pub enum StatusTone {
    Success,
    Danger,
    Neutral,
}

impl StatusTone {
    /// The tone's name in CSS classes and `data-variant`.
    pub fn as_str(self) -> &'static str {
        match self {
            StatusTone::Success => "success",
            StatusTone::Danger => "danger",
            StatusTone::Neutral => "neutral",
        }
    }
}

/// The state of one record: a mark and a label. The label always names the
/// state, so color never carries it alone.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(rename = "StatusBadgeSpec")]
#[ts(export, export_to = "../../../packages/kiso-react/src/generated/status-badge.ts")]
pub struct StatusBadge {
    pub tone: StatusTone,
    /// Work is going, such as a build. A thing that is merely up holds
    /// still.
    #[serde(default)]
    #[ts(as = "Option<bool>", optional)]
    pub pulse: bool,
    pub label: String,
}

impl StatusBadge {
    pub fn new(tone: StatusTone, label: impl Into<String>) -> Self {
        Self { tone, pulse: false, label: label.into() }
    }

    pub fn pulse(mut self, pulse: bool) -> Self {
        self.pulse = pulse;
        self
    }

    /// The glyph before the label in text and terminal output.
    pub fn mark(&self) -> &'static str {
        match (self.pulse, self.tone) {
            (true, _) => "◐",
            (false, StatusTone::Neutral) => "○",
            (false, _) => "●",
        }
    }

    /// The markup `<StatusBadge>` renders, for pages without React.
    pub fn to_html(&self) -> String {
        let tone = self.tone.as_str();
        let badge_class = match self.tone {
            StatusTone::Neutral => "badge".to_string(),
            _ => format!("badge badge-{tone}"),
        };
        let dot_class = if self.pulse { "dot dot-pulse" } else { "dot" };
        format!(
            r#"<span data-slot="badge" data-variant="{tone}" class="{badge_class}"><span data-slot="dot" data-variant="neutral" class="{dot_class}" aria-hidden="true"></span>{}</span>"#,
            escape_html(&self.label)
        )
    }

    /// Plain text for output that is not a terminal, such as a pipe, a log
    /// or Markdown.
    pub fn to_text(&self) -> String {
        format!("{} {}", self.mark(), self.label)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every tone and pulse state with its outputs. The React package
    /// renders the same props and compares the markup.
    #[test]
    fn fixtures() {
        let tones = [StatusTone::Success, StatusTone::Danger, StatusTone::Neutral];
        let fixtures: Vec<_> = tones
            .iter()
            .flat_map(|&tone| [false, true].map(|pulse| StatusBadge::new(tone, "Ready <now>").pulse(pulse)))
            .map(|badge| {
                serde_json::json!({ "props": badge, "html": badge.to_html(), "text": badge.to_text() })
            })
            .collect();
        let json = serde_json::to_string_pretty(&fixtures).unwrap() + "\n";
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/fixtures/status-badge.json");
        std::fs::create_dir_all(std::path::Path::new(path).parent().unwrap()).unwrap();
        std::fs::write(path, json).unwrap();
    }

    #[test]
    fn text_names_the_state() {
        assert_eq!(StatusBadge::new(StatusTone::Neutral, "Stopped").to_text(), "○ Stopped");
        assert_eq!(StatusBadge::new(StatusTone::Success, "Building").pulse(true).to_text(), "◐ Building");
    }
}
