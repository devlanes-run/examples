import { Modal, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Button } from "./Button";

type NoteModalProps = {
  visible: boolean;
  lane: number;
  onClose: () => void;
};

/** A modal over the home screen, one of the surfaces window streaming is tested with. */
export function NoteModal({ visible, lane, onClose }: NoteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>A modal on lane {lane}</Text>
          <Text style={styles.text}>
            It opens over the screen with a fade and closes with the button or the back gesture.
          </Text>
          <Button label="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(13, 12, 10, 0.6)",
  },
  sheet: { gap: 16, padding: 24, borderRadius: 12, backgroundColor: colors.paint },
  title: { color: colors.ink, fontSize: 24, fontWeight: "900", textAlign: "center" },
  text: { color: colors.lede, fontSize: 16, lineHeight: 24, textAlign: "center" },
});
