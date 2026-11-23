use std::sync::mpsc::Receiver;
use std::time::Duration;

use eframe::egui::{self, CentralPanel, Panel, ScrollArea, Ui};

use crate::api::{ApiCall, ApiClient};
use crate::config::Config;
use crate::menu::{self, MenuAction};
use crate::surfaces::Surfaces;
use crate::{cards, theme, views};

/// The window: the lane card, the api's answer and the surfaces.
pub struct DesktopApp {
    config: Config,
    api: ApiClient,
    pending: Option<Receiver<ApiCall>>,
    last_call: Option<ApiCall>,
    surfaces: Surfaces,
}

/// The window title, which names the lane so two lanes' windows tell apart.
pub fn title(config: &Config) -> String {
    format!("Lane {} of {}", config.lane, config.project)
}

impl DesktopApp {
    /// Restores the saved surfaces and makes the first call to the api.
    pub fn new(cc: &eframe::CreationContext<'_>, config: Config, api: ApiClient) -> Self {
        theme::apply(&cc.egui_ctx);
        egui_extras::install_image_loaders(&cc.egui_ctx);
        let surfaces = cc
            .storage
            .and_then(|storage| eframe::get_value(storage, eframe::APP_KEY))
            .unwrap_or_default();
        // The ready check in devlanes.yaml waits for this line.
        println!("window open: {}", title(&config));
        let pending = Some(api.fetch(&cc.egui_ctx, 30));
        Self {
            config,
            api,
            pending,
            last_call: None,
            surfaces,
        }
    }

    fn call_api(&mut self, ctx: &egui::Context) {
        self.pending = Some(self.api.fetch(ctx, 1));
    }

    fn receive(&mut self) {
        if let Some(call) = self.pending.as_ref().and_then(|rx| rx.try_recv().ok()) {
            self.last_call = Some(call);
            self.pending = None;
        }
    }

    fn page(&mut self, ui: &mut Ui, frame: &eframe::Frame) {
        views::header(ui);
        ui.vertical_centered(|ui| {
            ui.set_max_width(680.0);
            let config = &self.config;
            views::title(
                ui,
                &format!("This is lane {} of {}.", config.lane, config.project),
            );
            views::lede(
                ui,
                &format!(
                    "The {} service drew this window from the worktree on {}.",
                    config.service, config.branch
                ),
            );
            cards::lane(ui, config, self.last_call.as_ref());

            views::h2(ui, "The api's answer");
            cards::api(ui, config.lane, self.last_call.as_ref());
            let label = if self.pending.is_some() {
                "Calling..."
            } else {
                "Call the api again"
            };
            if views::button(ui, label).clicked() && self.pending.is_none() {
                self.call_api(ui.ctx());
            }

            views::h2(ui, "Surfaces");
            self.surfaces.controls(ui, frame);
        });
        ui.add_space(40.0);
    }
}

impl eframe::App for DesktopApp {
    fn ui(&mut self, ui: &mut Ui, frame: &mut eframe::Frame) {
        self.receive();
        let action = Panel::top("menu")
            .show(ui, |ui| menu::bar(ui, frame, &mut self.surfaces))
            .inner;
        if let Some(MenuAction::CallApi) = action {
            self.call_api(ui.ctx());
        }
        Panel::bottom("status").show(ui, |ui| self.surfaces.status(ui));
        Panel::right("rows")
            .default_size(220.0)
            .show(ui, |ui| self.surfaces.list(ui));
        CentralPanel::default().show(ui, |ui| {
            ScrollArea::vertical().show(ui, |ui| self.page(ui, frame));
        });
        self.surfaces.show_second_window(ui.ctx(), self.config.lane);
    }

    fn save(&mut self, storage: &mut dyn eframe::Storage) {
        eframe::set_value(storage, eframe::APP_KEY, &self.surfaces);
    }

    // On macOS and Linux, devlanes stops the window with a signal, which skips the save on
    // exit, so save often instead.
    fn auto_save_interval(&self) -> Duration {
        Duration::from_secs(2)
    }
}
