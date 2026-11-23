import { dialog, type BrowserWindow } from "electron";

/** Shows the native open-file dialog on `win` and resolves with the chosen path, or null. */
export async function chooseFile(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    title: "Open a file",
    properties: ["openFile"],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
}
