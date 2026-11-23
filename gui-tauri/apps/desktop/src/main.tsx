import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../brand/devlanes.css";
import "./styles.css";
import { App } from "./App";
import { env } from "./env";
import { inTauri, setWindowTitle } from "./tauri";

// Two lanes side by side get different card colours.
document.body.style.setProperty("--dl-lane", `var(--dl-lane-${env.lane % 4})`);

// Each lane's window says which lane it is in the taskbar and the window list.
if (inTauri) void setWindowTitle(`${env.project} lane ${env.lane}`);

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
