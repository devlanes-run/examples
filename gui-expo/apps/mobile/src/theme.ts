import { Platform, StyleSheet } from "react-native";

// The variables of _internal/brand/devlanes.css, which a native UI cannot load.
// Keep them in step with that file.
/** The brand colours, named after the `--dl-*` variables. */
export const colors = {
  paint: "#f5c542",
  ink: "#0d0c0a",
  lede: "#3a3000",
  line: "rgba(0, 0, 0, 0.35)",
  termBg: "rgba(26, 25, 23, 0.92)",
  termBar: "rgba(255, 255, 255, 0.035)",
  termInk: "#e8e6df",
  termOut: "#b3ada0",
  termDim: "#a39e91",
  ok: "#91c59f",
  url: "#f5d47a",
  bad: "#e39a8f",
  key: "#c0b8ff",
  dot: "#4a463f",
};

const laneColors = ["#c4a350", "#7c9fc6", "#a494be", "#78aaa7"];

/** The lane colour devlanes.css calls `--dl-lane-<index mod 4>`. */
export const laneColor = (lane: number) => laneColors[lane % laneColors.length];

// The brand loads Overpass and JetBrains Mono from Google Fonts; the app uses the system faces.
export const mono = Platform.select({ ios: "Menlo", default: "monospace" });

/** The brand classes the screens use, named after their `.dl-*` counterparts. */
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paint },
  main: { padding: 20, paddingBottom: 48, gap: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 36 },
  h2: { color: colors.ink, fontSize: 24, fontWeight: "900", marginTop: 16 },
  lede: { color: colors.lede, fontSize: 16, lineHeight: 24 },
  code: { fontFamily: mono, fontSize: 14 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  buttonText: { color: colors.paint, fontSize: 14, fontWeight: "600" },
});
