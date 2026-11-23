import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

/** The brand's `.dl-button`: ink with paint text, inverted while pressed. */
export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {({ pressed }) => <Text style={[styles.label, pressed && styles.pressedLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: colors.ink,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  pressed: { backgroundColor: "transparent" },
  label: { color: colors.paint, fontSize: 14, fontWeight: "600" },
  pressedLabel: { color: colors.ink },
});
