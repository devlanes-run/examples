//! The devlanes look for a native window. A window cannot load a stylesheet, so these are the
//! values of the variables in `_internal/brand/devlanes.css`, by the same names.

use eframe::egui::{self, Color32, FontFamily, FontId, Stroke, TextStyle};

/// The devlanes logo, compiled in from the `brand` link to `_internal/brand`.
pub const LOGO: &[u8] = include_bytes!("../brand/logo.svg");

pub const PAINT: Color32 = Color32::from_rgb(0xf5, 0xc5, 0x42);
pub const INK: Color32 = Color32::from_rgb(0x0d, 0x0c, 0x0a);
pub const LEDE: Color32 = Color32::from_rgb(0x3a, 0x30, 0x00);
// --dl-term-bg is rgba(26, 25, 23, .92); over the paint it comes out as this.
pub const TERM_BG: Color32 = Color32::from_rgb(0x2b, 0x27, 0x1a);
pub const TERM_OUT: Color32 = Color32::from_rgb(0xb3, 0xad, 0xa0);
pub const TERM_DIM: Color32 = Color32::from_rgb(0xa3, 0x9e, 0x91);
pub const OK: Color32 = Color32::from_rgb(0x91, 0xc5, 0x9f);
pub const URL: Color32 = Color32::from_rgb(0xf5, 0xd4, 0x7a);
pub const BAD: Color32 = Color32::from_rgb(0xe3, 0x9a, 0x8f);
pub const KEY: Color32 = Color32::from_rgb(0xc0, 0xb8, 0xff);
/// The grey of the second and third dot in a card's bar.
pub const DOT: Color32 = Color32::from_rgb(0x4a, 0x46, 0x3f);

/// `--dl-lane-<index mod 4>`, so two lanes side by side look different.
pub fn lane_colour(lane: u32) -> Color32 {
    const LANES: [Color32; 4] = [
        Color32::from_rgb(0xc4, 0xa3, 0x50),
        Color32::from_rgb(0x7c, 0x9f, 0xc6),
        Color32::from_rgb(0xa4, 0x94, 0xbe),
        Color32::from_rgb(0x78, 0xaa, 0xa7),
    ];
    LANES[lane as usize % LANES.len()]
}

/// Paint background with ink text, and the brand's text sizes.
pub fn apply(ctx: &egui::Context) {
    ctx.set_theme(egui::Theme::Light);
    let mut visuals = egui::Visuals::light();
    visuals.panel_fill = PAINT;
    visuals.window_fill = PAINT;
    visuals.hyperlink_color = INK;
    visuals.selection.bg_fill = INK;
    visuals.selection.stroke = Stroke::new(1.0, PAINT);
    visuals.widgets.noninteractive.fg_stroke.color = INK;
    visuals.widgets.inactive.fg_stroke.color = INK;
    ctx.set_visuals(visuals);

    ctx.all_styles_mut(|style| {
        style.text_styles = [
            (
                TextStyle::Heading,
                FontId::new(34.0, FontFamily::Proportional),
            ),
            (TextStyle::Body, FontId::new(16.0, FontFamily::Proportional)),
            (
                TextStyle::Button,
                FontId::new(14.0, FontFamily::Proportional),
            ),
            (
                TextStyle::Small,
                FontId::new(12.0, FontFamily::Proportional),
            ),
            (
                TextStyle::Monospace,
                FontId::new(13.0, FontFamily::Monospace),
            ),
        ]
        .into();
    });
}
