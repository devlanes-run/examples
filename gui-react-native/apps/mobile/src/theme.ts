import { Platform } from "react-native";

// The devlanes look from _internal/brand/devlanes.css. A native app cannot load a stylesheet,
// so the values are repeated here; change them there first.
export const colors = {
  paint: "#f5c542",
  ink: "#0d0c0a",
  lede: "#3a3000",
  termBg: "rgba(26, 25, 23, 0.92)",
  termBar: "rgba(255, 255, 255, 0.035)",
  termBorder: "rgba(255, 255, 255, 0.09)",
  termInk: "#e8e6df",
  termOut: "#b3ada0",
  termDim: "#a39e91",
  dot: "#4a463f",
  ok: "#91c59f",
  url: "#f5d47a",
  bad: "#e39a8f",
  key: "#c0b8ff",
};

// --dl-lane-0 to --dl-lane-3, picked by lane index modulo 4.
const laneColors = ["#c4a350", "#7c9fc6", "#a494be", "#78aaa7"];

/** The lane's colour, so two lanes side by side look different. */
export function laneColor(lane: number): string {
  return laneColors[lane % laneColors.length];
}

// Overpass and JetBrains Mono are web fonts; the app uses the system's sans and monospace.
export const fonts = {
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
};
