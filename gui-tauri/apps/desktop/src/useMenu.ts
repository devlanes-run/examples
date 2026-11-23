import { useEffect, useRef } from "react";
import { inTauri, onMenu } from "./tauri";

/** Calls `handler` with the id of each native menu item picked while the component is mounted. */
export function useMenu(handler: (id: string) => void) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!inTauri) return;
    const unlisten = onMenu((id) => latest.current(id));
    return () => {
      void unlisten.then((stop) => stop());
    };
  }, []);
}
