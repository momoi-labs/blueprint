use kiso_tokens::Rgb;

/// A color `p` of the way along `stops`, from 0 to 1, blended in Oklab so
/// the middle does not go grey. Titles, rules and the spinner use it with
/// [`Theme::stops`](crate::Theme::stops).
pub fn blend(stops: &[Rgb], p: f32) -> Rgb {
    match stops {
        [] => [0, 0, 0],
        [only] => *only,
        _ => {
            let at = p.clamp(0.0, 1.0) * (stops.len() - 1) as f32;
            // The segment: the last one at the end, so i + 1 stays a stop.
            let i = (at.floor() as usize).min(stops.len() - 2);
            let f = at - i as f32;
            let (a, b) = (oklab(stops[i]), oklab(stops[i + 1]));
            srgb([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f])
        }
    }
}

fn oklab([r, g, b]: Rgb) -> [f32; 3] {
    let linear = |v: u8| {
        let v = f32::from(v) / 255.0;
        if v <= 0.04045 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    };
    let (r, g, b) = (linear(r), linear(g), linear(b));
    let l = (0.412_221_46 * r + 0.536_332_55 * g + 0.051_445_995 * b).cbrt();
    let m = (0.211_903_5 * r + 0.680_699_5 * g + 0.107_396_96 * b).cbrt();
    let s = (0.088_302_46 * r + 0.281_718_85 * g + 0.629_978_7 * b).cbrt();
    [
        0.210_454_26 * l + 0.793_617_8 * m - 0.004_072_047 * s,
        1.977_998_5 * l - 2.428_592_2 * m + 0.450_593_7 * s,
        0.025_904_037 * l + 0.782_771_77 * m - 0.808_675_77 * s,
    ]
}

fn srgb([l, a, b]: [f32; 3]) -> Rgb {
    let l_ = (l + 0.396_337_78 * a + 0.215_803_76 * b).powi(3);
    let m_ = (l - 0.105_561_346 * a - 0.063_854_17 * b).powi(3);
    let s_ = (l - 0.089_484_18 * a - 1.291_485_5 * b).powi(3);
    let encode = |v: f32| {
        let v = v.clamp(0.0, 1.0);
        let v = if v <= 0.003_130_8 { 12.92 * v } else { 1.055 * v.powf(1.0 / 2.4) - 0.055 };
        (v * 255.0).round() as u8
    };
    [
        encode(4.076_741_7 * l_ - 3.307_711_6 * m_ + 0.230_969_94 * s_),
        encode(-1.268_438 * l_ + 2.609_757_4 * m_ - 0.341_319_38 * s_),
        encode(-0.004_196_086_3 * l_ - 0.703_418_6 * m_ + 1.707_614_7 * s_),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ends_are_the_stops() {
        let stops = [[0xff, 0x8a, 0x1f], [0xa7, 0x93, 0xf4]];
        assert_eq!(blend(&stops, 0.0), stops[0]);
        let end = blend(&stops, 1.0);
        assert!(end.iter().zip(stops[1]).all(|(a, b)| a.abs_diff(b) <= 1), "{end:?}");
    }

    #[test]
    fn the_end_of_many_stops_is_the_last() {
        let stops = [[0, 0, 0], [10, 10, 10], [20, 20, 20], [255, 255, 255]];
        assert_eq!(blend(&stops, 1.0), [255, 255, 255]);
        assert_eq!(blend(&stops, 2.0), [255, 255, 255]);
    }
}
