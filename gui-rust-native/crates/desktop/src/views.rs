//! The parts of a devlanes page, drawn with egui: header, title, cards and their rows.

use eframe::egui::{self, Align, Layout, RichText, Ui, vec2};

use crate::theme;

const EXAMPLE: &str = "gui-rust-native";

/// The logo and `devlanes` wordmark, with a link to this example on GitHub.
pub fn header(ui: &mut Ui) {
    ui.horizontal(|ui| {
        ui.add(
            egui::Image::from_bytes("bytes://devlanes-logo.svg", theme::LOGO)
                .fit_to_exact_size(vec2(32.0, 32.0)),
        );
        ui.hyperlink_to(
            RichText::new("devlanes")
                .monospace()
                .size(19.0)
                .color(theme::INK),
            "https://devlanes.run",
        );
        ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
            ui.hyperlink_to(
                format!("{EXAMPLE} on GitHub"),
                format!("https://github.com/devlanes-run/examples/tree/main/{EXAMPLE}"),
            );
        });
    });
}

/// The large centred title, as `.dl-title`.
pub fn title(ui: &mut Ui, text: &str) {
    ui.add_space(24.0);
    ui.label(RichText::new(text).heading().color(theme::INK));
    ui.add_space(12.0);
}

/// A centred paragraph under the title, as `.dl-lede`.
pub fn lede(ui: &mut Ui, text: &str) {
    ui.label(RichText::new(text).color(theme::LEDE));
    ui.add_space(20.0);
}

/// A section heading, as `.dl-h2`.
pub fn h2(ui: &mut Ui, text: &str) {
    ui.add_space(28.0);
    ui.label(RichText::new(text).size(26.0).color(theme::INK));
    ui.add_space(10.0);
}

/// The dark terminal-style card, as `.dl-card`, with its bar and dots.
pub fn card(ui: &mut Ui, lane: u32, bar: &str, contents: impl FnOnce(&mut Ui)) {
    egui::Frame::new()
        .fill(theme::TERM_BG)
        .corner_radius(12)
        .inner_margin(egui::Margin::symmetric(22, 14))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.with_layout(Layout::top_down(Align::Min), |ui| {
                ui.horizontal(|ui| {
                    dots(ui, lane);
                    ui.label(
                        RichText::new(bar)
                            .monospace()
                            .size(11.5)
                            .color(theme::TERM_DIM),
                    );
                });
                ui.separator();
                contents(ui);
            });
        });
    ui.add_space(16.0);
}

fn dots(ui: &mut Ui, lane: u32) {
    for colour in [theme::lane_colour(lane), theme::DOT, theme::DOT] {
        let (rect, _) = ui.allocate_exact_size(vec2(11.0, 11.0), egui::Sense::hover());
        ui.painter().circle_filled(rect.center(), 5.5, colour);
    }
    ui.add_space(8.0);
}

/// Key and value rows, as `.dl-rows`; a value is one or more pieces of coloured text.
pub fn rows(ui: &mut Ui, id: &str, rows: Vec<(&str, Vec<RichText>)>) {
    egui::Grid::new(id)
        .num_columns(2)
        .spacing(vec2(24.0, 4.0))
        .show(ui, |ui| {
            for (key, value) in rows {
                ui.label(RichText::new(key).monospace().color(theme::TERM_DIM));
                ui.horizontal_wrapped(|ui| {
                    for piece in value {
                        ui.label(piece.monospace());
                    }
                });
                ui.end_row();
            }
        });
}

/// Text in a card in one of the brand's terminal colours, as `.dl-ok` or `.dl-bad`.
pub fn tinted(text: impl Into<String>, colour: egui::Color32) -> RichText {
    RichText::new(text).color(colour)
}

/// A value in a card, in the colour of `.dl-rows dd`.
pub fn out(text: impl Into<String>) -> RichText {
    tinted(text, theme::TERM_OUT)
}

/// An ink button with paint text, as `.dl-button`.
pub fn button(ui: &mut Ui, text: &str) -> egui::Response {
    ui.add(egui::Button::new(RichText::new(text).color(theme::PAINT)).fill(theme::INK))
}
