use eframe::egui::{self, Ui, ViewportCommand};

use crate::surfaces::Surfaces;

/// What a menu item asks of the app, beyond the surfaces.
pub enum MenuAction {
    CallApi,
}

/// The in-window File, Edit and View menus.
pub fn bar(ui: &mut Ui, frame: &eframe::Frame, surfaces: &mut Surfaces) -> Option<MenuAction> {
    let mut action = None;
    egui::MenuBar::new().ui(ui, |ui| {
        ui.menu_button("File", |ui| {
            if ui.button("Open a file...").clicked() {
                surfaces.pick_file(frame);
            }
            if ui.button("Second window").clicked() {
                surfaces.toggle_second_window();
            }
            ui.separator();
            if ui.button("Quit").clicked() {
                ui.send_viewport_cmd(ViewportCommand::Close);
            }
        });
        ui.menu_button("Edit", |ui| {
            if ui.button("Copy the note").clicked() {
                ui.ctx().copy_text(surfaces.note.clone());
                surfaces.did("copied the note");
            }
            if ui.button("Clear the note").clicked() {
                surfaces.note.clear();
                surfaces.did("cleared the note");
            }
        });
        ui.menu_button("View", |ui| {
            if ui.button("Call the api again").clicked() {
                action = Some(MenuAction::CallApi);
            }
            ui.separator();
            for (label, zoom) in [("Zoom in", 1.25), ("Actual size", 1.0), ("Zoom out", 0.8)] {
                if ui.button(label).clicked() {
                    zoom_by(ui.ctx(), zoom, surfaces);
                }
            }
        });
    });
    action
}

/// Multiplies the zoom by `factor`; a factor of 1 resets it.
fn zoom_by(ctx: &egui::Context, factor: f32, surfaces: &mut Surfaces) {
    let zoom = if factor == 1.0 {
        1.0
    } else {
        ctx.zoom_factor() * factor
    };
    ctx.set_zoom_factor(zoom);
    surfaces.did(format!("zoom {:.0}%", zoom * 100.0));
}
