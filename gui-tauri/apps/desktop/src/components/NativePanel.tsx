import { useState } from "react";
import { inTauri, openSecondWindow, pickFile } from "../tauri";
import { useMenu } from "../useMenu";
import { Card } from "./Card";

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** The native open-file dialog, the second window, and the last native menu item picked. */
export function NativePanel() {
  const [path, setPath] = useState<string | null>(null);
  const [menuItem, setMenuItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(message(err));
    }
  }
  const chooseFile = () => run(async () => setPath((await pickFile()) ?? "(cancelled)"));
  const newWindow = () => run(openSecondWindow);

  // The File menu items do what the buttons below do.
  useMenu((id) => {
    setMenuItem(id);
    if (id === "open-file") void chooseFile();
    if (id === "second-window") void newWindow();
  });

  return (
    <>
      <Card title="native">
        <dl className="dl-rows">
          <dt>file</dt>
          <dd>{path ?? "none chosen"}</dd>
          <dt>menu</dt>
          <dd>{menuItem ?? "no item picked yet"}</dd>
          {error && (
            <>
              <dt>error</dt>
              <dd className="dl-bad">{error}</dd>
            </>
          )}
        </dl>
      </Card>
      <p className="actions">
        <button className="dl-button" type="button" disabled={!inTauri} onClick={chooseFile}>
          Open a file
        </button>
        <button className="dl-button" type="button" disabled={!inTauri} onClick={newWindow}>
          Open a second window
        </button>
      </p>
    </>
  );
}
