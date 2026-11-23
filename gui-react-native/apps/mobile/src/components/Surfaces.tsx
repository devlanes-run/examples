import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../theme";
import { Button } from "./Button";
import { NoteModal } from "./NoteModal";

type SurfacesProps = {
  lane: number;
  onOpenRows: () => void;
};

/** Small screens to test window streaming on: typing, a modal and a navigation to a long list. */
export function Surfaces({ lane, onOpenRows }: SurfacesProps) {
  const [text, setText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View style={styles.surfaces}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type something"
        placeholderTextColor={colors.lede}
        autoCorrect={false}
      />
      <Text style={styles.echo}>{text ? `You typed: ${text}` : "Nothing typed yet."}</Text>
      <View style={styles.buttons}>
        <Button label="Open a modal" onPress={() => setModalOpen(true)} />
        <Button label="Scroll 1,000 rows" onPress={onOpenRows} />
      </View>
      <NoteModal visible={modalOpen} lane={lane} onClose={() => setModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  surfaces: { gap: 12 },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: colors.ink,
    borderWidth: 1,
    borderRadius: 5,
    color: colors.ink,
    fontSize: 16,
  },
  echo: { color: colors.lede, fontFamily: fonts.mono, fontSize: 13 },
  buttons: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8 },
});
