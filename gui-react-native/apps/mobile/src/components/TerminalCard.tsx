import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

type TerminalCardProps = {
  title: string;
  /** The lane's colour, shown on the first dot. */
  laneColor: string;
  children: ReactNode;
};

/** The dark `.dl-card` with its `.dl-bar` of dots and a title. */
export function TerminalCard({ title, laneColor, children }: TerminalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.bar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: laneColor }]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    backgroundColor: colors.termBg,
    borderColor: colors.termBorder,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    paddingHorizontal: 14,
    gap: 14,
    backgroundColor: colors.termBar,
  },
  dots: { flexDirection: "row", gap: 7 },
  dot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.dot },
  title: { flex: 1, color: colors.termDim, fontFamily: fonts.mono, fontSize: 11.5 },
  body: { paddingVertical: 18, paddingHorizontal: 20 },
});
