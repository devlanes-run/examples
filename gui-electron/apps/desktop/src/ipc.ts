import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { env } from "./env.js";
import { chooseFile } from "./files.js";
import { openWindow } from "./windows.js";

// The same names are in preload.cts, which a sandboxed preload cannot import.
export const channels = {
  info: "desktop:info",
  openFile: "desktop:open-file",
  newWindow: "desktop:new-window",
  fileOpened: "desktop:file-opened",
} as const;

/** What the renderer shows about the Electron shell around it. */
export type DesktopInfo = {
  service: string;
  electron: string;
  chrome: string;
  pid: number;
  userData: string;
};

function senderWindow(event: IpcMainInvokeEvent): BrowserWindow {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) throw new Error("the request came from a page without a window");
  return win;
}

/** Answers the calls the preload exposes to the renderer as `window.desktop`. */
export function registerIpc(): void {
  ipcMain.handle(channels.info, (): DesktopInfo => ({
    service: env.service,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    pid: process.pid,
    userData: app.getPath("userData"),
  }));
  ipcMain.handle(channels.openFile, (event) => chooseFile(senderWindow(event)));
  ipcMain.handle(channels.newWindow, () => openWindow());
}
