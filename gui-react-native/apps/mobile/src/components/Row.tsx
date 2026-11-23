import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

/** One `dt`/`dd` pair of a card's `.dl-rows`. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{children}</Text>
    </View>
  );
}

/** Text in a row coloured as the brand's `.dl-ok`, `.dl-bad`, `.dl-url` or `.dl-key`. */
export function Tone({
  tone,
  children,
}: {
  tone: "ok" | "bad" | "url" | "key";
  children: ReactNode;
}) {
  return <Text style={styles[tone]}>{children}</Text>;
}

const styles = StyleSheet.create({
  ok: { color: colors.ok },
  bad: { color: colors.bad },
  url: { color: colors.url },
  key: { color: colors.key },
  row: { flexDirection: "row", gap: 24, paddingVertical: 2 },
  label: { width: 64, color: colors.termDim, fontFamily: fonts.mono, fontSize: 12.5 },
  value: { flex: 1, color: colors.termOut, fontFamily: fonts.mono, fontSize: 12.5 },
});
