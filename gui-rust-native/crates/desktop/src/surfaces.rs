//! The parts of the window that streaming a window has to carry: a text input, a long list
//! with a context menu, the native file dialog and a second window.

use std::path::PathBuf;

use eframe::egui::{self, RichText, ScrollArea, Ui, ViewportBuilder, ViewportId};
use serde::{Deserialize, Serialize};

use crate::theme;
use crate::views;

const ROWS: usize = 500;

/// The state of the surfaces. The note and the picked file are saved in the lane's data folder.
#[derive(Default, Deserialize, Serialize)]
#[serde(default)]
pub struct Surfaces {
    pub note: String,
    pub picked: Option<PathBuf>,
    #[serde(skip)]
    pub second_window: bool,
    #[serde(skip)]
    selected: Option<usize>,
    #[serde(skip)]
    last_action: String,
}

impl Surfaces {
    /// Records what the person just did, for the status line.
    pub fn did(&mut self, action: impl Into<String>) {
        self.last_action = action.into();
        println!("{}", self.last_action);
    }

    /// The note input and the buttons for the file dialog and the second window.
    pub fn controls(&mut self, ui: &mut Ui, frame: &eframe::Frame) {
        egui::Grid::new("surfaces")
            .num_columns(2)
            .spacing([16.0, 10.0])
            .show(ui, |ui| {
                ui.label("note");
                ui.add(egui::TextEdit::singleline(&mut self.note).hint_text("type here"));
                ui.end_row();

                ui.label("file");
                ui.horizontal(|ui| {
                    if views::button(ui, "Open a file...").clicked() {
                        self.pick_file(frame);
                    }
                    let picked = self.picked.as_ref().map(|path| path.display().to_string());
                    ui.label(picked.unwrap_or_else(|| "none picked".to_owned()));
                });
                ui.end_row();

                ui.label("window");
                let label = if self.second_window { "Close" } else { "Open" };
                if views::button(ui, &format!("{label} the second window")).clicked() {
                    self.toggle_second_window();
                }
                ui.end_row();
            });
    }

    /// Opens the native open-file dialog over the window, which blocks until it closes.
    pub fn pick_file(&mut self, frame: &eframe::Frame) {
        let picked = rfd::FileDialog::new()
            .set_title("Pick a file")
            .set_parent(frame)
            .pick_file();
        match picked {
            Some(path) => {
                self.did(format!("picked {}", path.display()));
                self.picked = Some(path);
            }
            None => self.did("closed the file dialog"),
        }
    }

    /// Opens the second window, or closes it when it is open.
    pub fn toggle_second_window(&mut self) {
        self.second_window = !self.second_window;
        let state = if self.second_window {
            "opened"
        } else {
            "closed"
        };
        self.did(format!("{state} the second window"));
    }

    /// 500 rows in a scroll area, each with a right-click menu.
    pub fn list(&mut self, ui: &mut Ui) {
        ui.label(RichText::new(format!("{ROWS} rows")).color(theme::LEDE));
        // show_rows lays out only the visible rows, so it needs their height up front.
        let row_height =
            ui.text_style_height(&egui::TextStyle::Body) + 2.0 * ui.spacing().button_padding.y;
        ScrollArea::vertical().show_rows(ui, row_height, ROWS, |ui, range| {
            for index in range {
                let text = format!("Row {}", index + 1);
                let selected = self.selected == Some(index);
                let response = ui.selectable_label(selected, &text);
                if response.clicked() {
                    self.selected = Some(index);
                    self.did(format!("selected {text}"));
                }
                response.context_menu(|ui| self.row_menu(ui, index, &text));
            }
        });
    }

    fn row_menu(&mut self, ui: &mut Ui, index: usize, text: &str) {
        if ui.button("Select").clicked() {
            self.selected = Some(index);
            self.did(format!("selected {text} from its menu"));
        }
        if ui.button("Copy text").clicked() {
            ui.ctx().copy_text(text.to_owned());
            self.did(format!("copied {text:?}"));
        }
        if ui.button("Put in the note").clicked() {
            self.note = text.to_owned();
            self.did(format!("put {text:?} in the note"));
        }
    }

    /// The last action, at the bottom of the window.
    pub fn status(&self, ui: &mut Ui) {
        let text = if self.last_action.is_empty() {
            "nothing done yet"
        } else {
            &self.last_action
        };
        ui.label(RichText::new(text).monospace().color(theme::LEDE));
    }

    /// A second native window, shown while `second_window` is set.
    pub fn show_second_window(&mut self, ctx: &egui::Context, lane: u32) {
        if !self.second_window {
            return;
        }
        let builder = ViewportBuilder::default()
            .with_title(format!("Second window of lane {lane}"))
            .with_inner_size([380.0, 180.0]);
        ctx.show_viewport_immediate(ViewportId::from_hash_of("second"), builder, |ui, _| {
            egui::CentralPanel::default().show(ui, |ui| {
                views::title(ui, &format!("Lane {lane}, window 2"));
                if views::button(ui, "Close").clicked()
                    || ui.input(|input| input.viewport().close_requested())
                {
                    self.toggle_second_window();
                }
            });
        });
    }
}
