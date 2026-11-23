import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../brand/devlanes.css";
import "./styles.css";
import { SecondWindow } from "./SecondWindow";
import { env } from "./env";

document.body.style.setProperty("--dl-lane", `var(--dl-lane-${env.lane % 4})`);

const root = document.getElementById("root");
if (!root) throw new Error("second.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <SecondWindow />
  </StrictMode>,
);
