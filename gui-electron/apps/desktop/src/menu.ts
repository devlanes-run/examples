import { BrowserWindow, Menu, type MenuItemConstructorOptions } from "electron";
import { chooseFile } from "./files.js";
import { channels } from "./ipc.js";
import { openWindow } from "./windows.js";

/** File > Open file: the same dialog as the page's button, with the path sent to that page. */
async function openFileFromMenu(win: BrowserWindow | undefined): Promise<void> {
  if (!win) return;
  const path = await chooseFile(win);
  if (path) win.webContents.send(channels.fileOpened, path);
}

const template: MenuItemConstructorOptions[] = [
  // On macOS the first menu is the app menu, named after the app.
  ...(process.platform === "darwin" ? [{ role: "appMenu" } as const] : []),
  {
    label: "File",
    submenu: [
      { label: "New window", accelerator: "CmdOrCtrl+N", click: () => void openWindow() },
      {
        label: "Open file...",
        accelerator: "CmdOrCtrl+O",
        click: (_item, win) => void openFileFromMenu(win as BrowserWindow | undefined),
      },
      { type: "separator" },
      { role: "close" },
      { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
];

/** Installs the native application menu: File, Edit and View. */
export function installMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
