import { StyleSheet, View } from "react-native";

/** The devlanes logo from _internal/brand/logo.svg, drawn with views at 32 by 32 points. */
export function Logo() {
  return (
    <View style={styles.box}>
      <View style={[styles.bar, styles.top]} />
      <View style={[styles.bar, styles.middle]} />
      <View style={[styles.bar, styles.bottom]} />
    </View>
  );
}

// logo.svg's 64-unit view box at half size: three 16x4 bars, each shifted 4 right and 6 down.
const styles = StyleSheet.create({
  box: { width: 32, height: 32 },
  bar: { position: "absolute", width: 16, height: 4, borderRadius: 2 },
  top: { left: 4, top: 8, backgroundColor: "#0d0c0a" },
  middle: { left: 8, top: 14, backgroundColor: "#3d3b36" },
  bottom: { left: 12, top: 20, backgroundColor: "#3d3b36" },
});
