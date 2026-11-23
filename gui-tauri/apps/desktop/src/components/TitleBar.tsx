import logo from "../../brand/logo.svg";
import { closeWindow } from "../tauri";

/**
 * The second window's own title bar. Tauri moves the window when a drag starts on an element
 * with `data-tauri-drag-region`; the attribute does not apply to children, so each one has it.
 */
export function TitleBar({ title }: { title: string }) {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <img src={logo} alt="" width="18" height="18" data-tauri-drag-region />
      <span className="titlebar-title" data-tauri-drag-region>
        {title}
      </span>
      <button className="titlebar-close" type="button" aria-label="Close" onClick={closeWindow}>
        x
      </button>
    </div>
  );
}
