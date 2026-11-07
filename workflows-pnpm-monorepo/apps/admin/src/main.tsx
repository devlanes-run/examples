import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@acme/ui/devlanes.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
