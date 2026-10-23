/// One of Kiso's accents, with its dark and light tokens.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Accent {
    pub name: &'static str,
    pub dark: kiso_tokens::Theme,
    pub light: kiso_tokens::Theme,
}

/// Every accent, in the order the [`ThemePicker`](crate::ThemePicker)
/// lists them.
pub const ACCENTS: [Accent; 9] = [
    Accent { name: "violet", dark: kiso_tokens::VIOLET_DARK, light: kiso_tokens::VIOLET_LIGHT },
    Accent { name: "terracotta", dark: kiso_tokens::TERRACOTTA_DARK, light: kiso_tokens::TERRACOTTA_LIGHT },
    Accent { name: "teal", dark: kiso_tokens::TEAL_DARK, light: kiso_tokens::TEAL_LIGHT },
    Accent { name: "cobalt", dark: kiso_tokens::COBALT_DARK, light: kiso_tokens::COBALT_LIGHT },
    Accent { name: "nocturne", dark: kiso_tokens::NOCTURNE_DARK, light: kiso_tokens::NOCTURNE_LIGHT },
    Accent { name: "tangerine", dark: kiso_tokens::TANGERINE_DARK, light: kiso_tokens::TANGERINE_LIGHT },
    Accent { name: "red", dark: kiso_tokens::RED_DARK, light: kiso_tokens::RED_LIGHT },
    Accent { name: "gold", dark: kiso_tokens::GOLD_DARK, light: kiso_tokens::GOLD_LIGHT },
    Accent { name: "lime", dark: kiso_tokens::LIME_DARK, light: kiso_tokens::LIME_LIGHT },
];

impl Accent {
    /// The accent called `name`, such as `tangerine`.
    pub fn by_name(name: &str) -> Option<Accent> {
        ACCENTS.into_iter().find(|a| a.name == name)
    }

    /// The tokens to draw with. tui-kiso draws states with the `*-on-dark`
    /// tones, so a light theme puts its own state colors in their place.
    pub fn tokens(self, light: bool) -> kiso_tokens::Theme {
        if !light {
            return self.dark;
        }
        kiso_tokens::Theme {
            success_on_dark: self.light.success,
            warning_on_dark: self.light.warning,
            danger_on_dark: self.light.danger,
            info_on_dark: self.light.info,
            ..self.light
        }
    }
}
