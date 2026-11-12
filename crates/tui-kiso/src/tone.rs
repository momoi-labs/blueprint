use kiso_tokens::Rgb;

use crate::Theme;

/// What a [`Badge`](crate::Badge) or a [`Dot`](crate::Dot) says about the
/// thing beside it. The tone is a judgment, not a direction: lower latency
/// can be `Success`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Tone {
    #[default]
    Neutral,
    Info,
    Success,
    Warning,
    Danger,
}

impl Tone {
    /// Every tone, in the order of the web variants.
    pub const ALL: [Tone; 5] = [Tone::Neutral, Tone::Info, Tone::Success, Tone::Warning, Tone::Danger];

    /// The name in lowercase, as the web variant.
    pub fn name(self) -> &'static str {
        match self {
            Tone::Neutral => "neutral",
            Tone::Info => "info",
            Tone::Success => "success",
            Tone::Warning => "warning",
            Tone::Danger => "danger",
        }
    }

    /// The text color of the tone: `foreground`, or the `*-on-dark` tone.
    pub(crate) fn rgb(self, theme: &Theme) -> Rgb {
        let r = theme.tokens();
        match self {
            Tone::Neutral => r.foreground,
            Tone::Info => r.info_on_dark,
            Tone::Success => r.success_on_dark,
            Tone::Warning => r.warning_on_dark,
            Tone::Danger => r.danger_on_dark,
        }
    }
}
