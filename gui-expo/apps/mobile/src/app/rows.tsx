import { FlatList, StyleSheet, Text, View } from "react-native";
import { laneInfo } from "../lane";
import { colors, laneColor, mono } from "../theme";

const ROWS = Array.from({ length: 1000 }, (_, i) => i + 1);

/** A second screen with a thousand rows, to scroll through. */
export default function RowsScreen() {
  const accent = laneColor(laneInfo.lane);
  return (
    <FlatList
      data={ROWS}
      keyExtractor={(n) => String(n)}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: item % 2 ? accent : colors.ink }]} />
          <Text style={styles.text}>
            row {item} of lane {laneInfo.lane}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  text: { color: colors.ink, fontFamily: mono, fontSize: 14 },
});
