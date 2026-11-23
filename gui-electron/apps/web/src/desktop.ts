/** What the Electron shell reports about itself, as `DesktopInfo` in `apps/desktop/src/ipc.ts`. */
export type DesktopInfo = {
  service: string;
  electron: string;
  chrome: string;
  pid: number;
  userData: string;
};

/** The calls `apps/desktop/src/preload.cts` exposes to this page. */
export type DesktopApi = {
  info(): Promise<DesktopInfo>;
  openFile(): Promise<string | null>;
  newWindow(): Promise<number>;
  onFileOpened(listener: (path: string) => void): () => void;
};

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}

/** The Electron shell's API, or undefined when the page is open in a browser. */
export const desktop = window.desktop;

/** The shell's number for this window, from the `?window=` it loads the page with. */
export const windowNumber = new URLSearchParams(window.location.search).get("window");
