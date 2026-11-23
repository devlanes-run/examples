//! The lane card and the card with the api's answer.

use eframe::egui::{RichText, Ui};

use crate::api::ApiCall;
use crate::config::Config;
use crate::theme;
use crate::views::{self, out, tinted};

/// The lane values devlanes gave this service. `url` is where the proxy says the window
/// reached the api, since a window has no URL of its own.
pub fn lane(ui: &mut Ui, config: &Config, call: Option<&ApiCall>) {
    let bar = format!("{}@{}:{}", config.project, config.lane, config.service);
    let url = match call.map(|call| &call.result) {
        None => tinted("waiting for the api", theme::TERM_DIM),
        Some(Ok(answer)) => match &answer.proxied_url {
            Some(url) => tinted(url, theme::URL),
            None => tinted("not through the proxy", theme::BAD),
        },
        Some(Err(_)) => tinted("the api did not answer", theme::BAD),
    };
    views::card(ui, config.lane, &bar, |ui| {
        views::rows(
            ui,
            "lane-card",
            vec![
                (
                    "lane",
                    vec![
                        out(config.lane.to_string()),
                        tinted(&config.lane_name, theme::KEY),
                    ],
                ),
                ("branch", vec![out(&config.branch)]),
                ("service", vec![out(&config.service)]),
                (
                    "port",
                    vec![
                        out(config.port.to_string()),
                        tinted("unused, a window does not listen", theme::TERM_DIM),
                    ],
                ),
                ("url", vec![url]),
            ],
        );
    });
}

/// The last call to the api: its URL, status, time and body.
pub fn api(ui: &mut Ui, lane: u32, call: Option<&ApiCall>) {
    views::card(ui, lane, "GET /", |ui| {
        let Some(call) = call else {
            ui.label(tinted("calling the api", theme::TERM_DIM).monospace());
            return;
        };
        let (status, body) = match &call.result {
            Ok(answer) if (200..300).contains(&answer.status) => {
                (tinted(answer.status.to_string(), theme::OK), &answer.body)
            }
            Ok(answer) => (tinted(answer.status.to_string(), theme::BAD), &answer.body),
            Err(error) => (tinted("request failed", theme::BAD), error),
        };
        views::rows(
            ui,
            "api-card",
            vec![
                ("url", vec![tinted(&call.url, theme::URL)]),
                ("status", vec![status]),
                (
                    "time",
                    vec![out(format!("{} ms", call.elapsed.as_millis()))],
                ),
            ],
        );
        ui.separator();
        ui.label(RichText::new(body).monospace().color(theme::TERM_OUT));
    });
}
