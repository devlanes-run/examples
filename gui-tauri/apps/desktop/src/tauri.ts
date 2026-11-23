import { getIdentifier } from "@tauri-apps/api/app";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";

/** True inside the desktop window, false when the page is opened in a browser. */
export const inTauri = isTauri();

/** The bundle identifier, which the tauri preset sets per lane and replica. */
export const appIdentifier = () => getIdentifier();

/** The label of the window this page runs in: `main` or `second`. */
export const windowLabel = () => getCurrentWindow().label;

/** Sets the native title of the window this page runs in. */
export const setWindowTitle = (title: string) => getCurrentWindow().setTitle(title);

/** Closes the window this page runs in. */
export const closeWindow = () => getCurrentWindow().close();

/** Shows the native open-file dialog; resolves to the chosen path, or null when cancelled. */
export const pickFile = () => open({ multiple: false, directory: false });

/** Opens the frameless second window, or focuses it when it is already open. */
export const openSecondWindow = () => invoke<void>("open_second_window");

/** Calls `handler` with the id of each native menu item picked; the app emits them as `menu`. */
export const onMenu = (handler: (id: string) => void): Promise<UnlistenFn> =>
  listen<string>("menu", (event) => handler(event.payload));
