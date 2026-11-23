// A sandboxed preload runs as CommonJS and can require only "electron", hence a .cts file
// and the channel names repeated from ipc.ts.
import electron = require("electron");

const { contextBridge, ipcRenderer } = electron;

contextBridge.exposeInMainWorld("desktop", {
  info: () => ipcRenderer.invoke("desktop:info"),
  openFile: () => ipcRenderer.invoke("desktop:open-file"),
  newWindow: () => ipcRenderer.invoke("desktop:new-window"),
  // Returns the unsubscribe function a React effect cleans up with.
  onFileOpened: (listener: (path: string) => void) => {
    const handler = (_event: electron.IpcRendererEvent, path: string) => listener(path);
    ipcRenderer.on("desktop:file-opened", handler);
    return () => {
      ipcRenderer.off("desktop:file-opened", handler);
    };
  },
});
