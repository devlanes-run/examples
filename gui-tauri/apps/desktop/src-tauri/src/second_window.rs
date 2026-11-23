use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const SECOND: &str = "second";

/// Opens the frameless second window, or focuses it when it is already open.
///
/// Async because creating a window from a synchronous command deadlocks on Windows.
#[tauri::command]
pub async fn open_second_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SECOND) {
        return window.set_focus().map_err(|err| err.to_string());
    }
    let window = WebviewWindowBuilder::new(&app, SECOND, WebviewUrl::App("second.html".into()))
        .title("example-tauri second window")
        .inner_size(460.0, 340.0)
        .decorations(false)
        .build()
        .map_err(|err| err.to_string())?;
    // Windows and Linux attach the app menu to every window; this one has a title bar of its own.
    window.remove_menu().map_err(|err| err.to_string())?;
    Ok(())
}
