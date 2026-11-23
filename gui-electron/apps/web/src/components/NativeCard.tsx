import { useEffect, useState } from "react";
import type { DesktopApi } from "../desktop";
import { Card } from "./Card";

/** Buttons that open the native file dialog and a second window, with what they returned. */
export function NativeCard({ desktop }: { desktop: DesktopApi }) {
  const [file, setFile] = useState<string | null>(null);
  const [opened, setOpened] = useState<number | null>(null);

  // File > Open file in the application menu sends its path here too.
  useEffect(() => desktop.onFileOpened(setFile), [desktop]);

  async function openFile() {
    const path = await desktop.openFile();
    if (path) setFile(path);
  }

  return (
    <>
      <Card title="native">
        <dl className="dl-rows">
          <dt>chosen file</dt>
          <dd>{file ?? "none yet"}</dd>
          <dt>new window</dt>
          <dd>{opened === null ? "none yet" : `window ${opened} loaded`}</dd>
          <dt>menu</dt>
          <dd>File, Edit and View in the menu bar</dd>
          <dt>right-click</dt>
          <dd>anywhere on the page for the context menu</dd>
        </dl>
      </Card>
      <p className="actions">
        <button className="dl-button" type="button" onClick={() => void openFile()}>
          Open file...
        </button>
        <button
          className="dl-button"
          type="button"
          onClick={() => void desktop.newWindow().then(setOpened)}
        >
          New window
        </button>
      </p>
    </>
  );
}
