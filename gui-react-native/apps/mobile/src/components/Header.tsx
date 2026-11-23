import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { Logo } from "./Logo";

const EXAMPLE = "gui-react-native";
const SOURCE = `https://github.com/devlanes-run/examples/tree/main/${EXAMPLE}`;

/** The `.dl-header` of every example page: logo, wordmark and the example's folder on GitHub. */
export function Header() {
  return (
    <View style={styles.header}>
      <Pressable style={styles.brand} onPress={() => Linking.openURL("https://devlanes.run")}>
        <Logo />
        <Text style={styles.wordmark}>devlanes</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(SOURCE)}>
        <Text style={styles.link}>{EXAMPLE} on GitHub</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { color: colors.ink, fontFamily: fonts.mono, fontSize: 19, fontWeight: "700" },
  link: { color: colors.ink, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
