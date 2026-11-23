import { Menu, type BrowserWindow, type ContextMenuParams } from "electron";

/** The native right-click menu, with the edit items the clicked spot allows. */
export function contextMenu(win: BrowserWindow, params: ContextMenuParams): Menu {
  const flags = params.editFlags;
  return Menu.buildFromTemplate([
    { role: "cut", enabled: flags.canCut },
    { role: "copy", enabled: flags.canCopy },
    { role: "paste", enabled: flags.canPaste },
    { type: "separator" },
    { role: "selectAll", enabled: flags.canSelectAll },
    { type: "separator" },
    {
      label: "Inspect element",
      click: () => win.webContents.inspectElement(params.x, params.y),
    },
  ]);
}
