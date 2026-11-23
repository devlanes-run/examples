import { fileURLToPath } from "node:url";
import { BrowserWindow } from "electron";
import { contextMenu } from "./context-menu.js";
import { env } from "./env.js";

const preload = fileURLToPath(new URL("./preload.cjs", import.meta.url));

let opened = 0;

/** Opens a window on this lane's renderer and resolves with its number once the page loaded. */
export async function openWindow(): Promise<number> {
  const number = ++opened;
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    title: `${env.project}@${env.lane} (${env.branch}) window ${number}`,
    webPreferences: { preload, contextIsolation: true, sandbox: true },
  });
  // Keep the lane in the title, so two lanes' windows tell apart in the taskbar.
  win.on("page-title-updated", (event) => event.preventDefault());
  win.webContents.on("context-menu", (_event, params) => {
    contextMenu(win, params).popup({ window: win });
  });

  const url = new URL(env.rendererUrl);
  url.searchParams.set("window", String(number));
  await win.loadURL(url.toString());
  console.log(`window ${number} loaded ${url}`);
  return number;
}
