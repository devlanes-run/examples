import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, mono } from "../theme";
import { Logo } from "./Logo";

const EXAMPLE = "gui-expo";

/** The `.dl-header` row: logo and wordmark, and the link to the example on GitHub. */
export function Header() {
  return (
    <View style={styles.header}>
      <Pressable style={styles.brand} onPress={() => Linking.openURL("https://devlanes.run")}>
        <Logo />
        <Text style={styles.wordmark}>devlanes</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          Linking.openURL(`https://github.com/devlanes-run/examples/tree/main/${EXAMPLE}`)
        }
      >
        <Text style={styles.nav}>{EXAMPLE} on GitHub</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { color: colors.ink, fontFamily: mono, fontSize: 19, fontWeight: "700" },
  nav: { color: colors.ink, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
