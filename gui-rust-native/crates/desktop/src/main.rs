//! The desktop service: a native egui window that calls the api over HTTPS.

mod api;
mod app;
mod cards;
mod config;
mod menu;
mod surfaces;
mod theme;
mod views;

use std::error::Error;
use std::fs;

use eframe::egui;

use crate::api::ApiClient;
use crate::app::DesktopApp;
use crate::config::Config;

fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::from_env()?;
    let api = ApiClient::new(&config.api_url)?;
    fs::create_dir_all(&config.state_dir)?;
    let title = app::title(&config);
    let options = eframe::NativeOptions {
        renderer: eframe::Renderer::Glow,
        viewport: egui::ViewportBuilder::default()
            .with_title(&title)
            .with_app_id(&config.project)
            .with_inner_size([1000.0, 720.0]),
        // The note, the picked file and the window's size and position, per lane.
        persistence_path: Some(config.state_dir.join("desktop.ron")),
        ..Default::default()
    };
    eframe::run_native(
        &title,
        options,
        Box::new(|cc| Ok(Box::new(DesktopApp::new(cc, config, api)))),
    )?;
    Ok(())
}
