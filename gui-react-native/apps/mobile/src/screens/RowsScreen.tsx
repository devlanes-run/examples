import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenProps } from "../navigation";
import { colors, fonts, laneColor } from "../theme";

const ROWS = Array.from({ length: 1000 }, (_, index) => index + 1);

/** A long list to scroll, reached by navigation from the home screen. */
export function RowsScreen({ route }: ScreenProps<"Rows">) {
  const insets = useSafeAreaInsets();
  const { lane } = route.params;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      data={ROWS}
      keyExtractor={(row) => String(row)}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: laneColor(lane + item) }]} />
          <Text style={styles.text}>
            row {item} of {ROWS.length}
          </Text>
          <Text style={styles.lane}>lane {lane}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.paint },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    paddingHorizontal: 20,
    borderBottomColor: "rgba(0, 0, 0, 0.12)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1, color: colors.ink, fontFamily: fonts.mono, fontSize: 14 },
  lane: { color: colors.lede, fontFamily: fonts.mono, fontSize: 12 },
});
