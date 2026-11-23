use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Runtime};

/// Builds the native application menu: File, Edit and Help.
pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let open_file = MenuItemBuilder::with_id("open-file", "Open file...")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let second_window = MenuItemBuilder::with_id("second-window", "New window")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let about = MenuItemBuilder::with_id("about", "About this example").build(app)?;

    let file = SubmenuBuilder::new(app, "File")
        .item(&open_file)
        .item(&second_window)
        .separator()
        .quit()
        .build()?;
    // Cut, copy and paste in the text input go through these items on macOS.
    let edit = SubmenuBuilder::new(app, "Edit")
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let help = SubmenuBuilder::new(app, "Help").item(&about).build()?;

    MenuBuilder::new(app).items(&[&file, &edit, &help]).build()
}

/// Sends the id of a custom menu item to the pages, which act on it as on their own buttons.
pub fn forward<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    if let Err(err) = app.emit("menu", event.id().as_ref()) {
        eprintln!("could not forward menu item {}: {err}", event.id().as_ref());
    }
}
