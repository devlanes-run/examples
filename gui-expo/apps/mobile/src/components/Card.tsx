import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, mono } from "../theme";

type CardProps = {
  title: string;
  /** Colour of the first dot, the lane colour on the lane card. */
  accent?: string;
  children: ReactNode;
};

/** The dark `.dl-card` with its title bar and three dots. */
export function Card({ title, accent = colors.paint, children }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.bar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

/** One `dt`/`dd` pair of `.dl-rows`. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.value}>{children}</View>
    </View>
  );
}

/** Text in a card, in the colour of `.dl-rows dd` unless a brand colour is given. */
export function CardText({
  color = colors.termOut,
  children,
}: {
  color?: string;
  children: ReactNode;
}) {
  return <Text style={[styles.text, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.termBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    paddingHorizontal: 14,
    gap: 14,
    backgroundColor: colors.termBar,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
  },
  dots: { flexDirection: "row", gap: 7 },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.dot },
  title: { color: "#b5b0a3", fontFamily: mono, fontSize: 11.5 },
  body: { paddingVertical: 16, paddingHorizontal: 18, gap: 4 },
  row: { flexDirection: "row", gap: 16 },
  label: { width: 64, color: colors.termDim, fontFamily: mono, fontSize: 12.5, lineHeight: 20 },
  value: { flex: 1 },
  text: { fontFamily: mono, fontSize: 12.5, lineHeight: 20 },
});
