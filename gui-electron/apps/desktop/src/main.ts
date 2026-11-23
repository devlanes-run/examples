import { app } from "electron";
import { env } from "./env.js";
import { registerIpc } from "./ipc.js";
import { installMenu } from "./menu.js";
import { waitForRenderer } from "./renderer.js";
import { openWindow } from "./windows.js";

// Before ready: Electron locks its user data folder, and a second lane on the default
// folder would share the first lane's cookies, storage and cache.
app.setPath("userData", env.userData);

// DevTools Protocol on 127.0.0.1:<port>, so tools such as Playwright can drive this lane's
// windows without touching the mouse or keyboard.
app.commandLine.appendSwitch("remote-debugging-port", String(env.port));

app.on("certificate-error", (_event, _contents, url, error) => {
  console.error(`certificate error for ${url}: ${error}`);
});

// The service is the app: once the last window closes, it exits on every OS.
app.on("window-all-closed", () => app.quit());

async function start(): Promise<void> {
  await app.whenReady();
  installMenu();
  registerIpc();
  console.log(`waiting for ${env.rendererUrl}`);
  await waitForRenderer(env.rendererUrl);
  await openWindow();
}

start().catch((error: unknown) => {
  console.error(error);
  app.exit(1);
});
