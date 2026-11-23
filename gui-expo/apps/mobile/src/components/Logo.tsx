import { StyleSheet, View } from "react-native";

/** The three bars of `_internal/brand/logo.svg`, drawn with views so no SVG library is needed. */
export function Logo() {
  return (
    <View style={styles.box}>
      <View style={[styles.bar, { left: 4, top: 8, backgroundColor: "#0d0c0a" }]} />
      <View style={[styles.bar, { left: 8, top: 14 }]} />
      <View style={[styles.bar, { left: 12, top: 20 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 32, height: 32 },
  bar: {
    position: "absolute",
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3d3b36",
  },
});
