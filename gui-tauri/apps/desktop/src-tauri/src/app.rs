use tauri::webview::PageLoadEvent;

use crate::{menu, second_window};

/// Builds the app with its menu, the dialog plugin and the second-window command, and runs it.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .menu(menu::build)
        .on_menu_event(menu::forward)
        .invoke_handler(tauri::generate_handler![second_window::open_second_window])
        // devlanes.yaml waits for this line: the window is open and its page has loaded.
        .on_page_load(|webview, payload| {
            if payload.event() == PageLoadEvent::Finished {
                println!("{} window loaded {}", webview.label(), payload.url());
            }
        })
        .run(tauri::generate_context!())
        .expect("the Tauri app failed to start");
}
