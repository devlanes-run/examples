import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { LaneInfo } from "../lane";
import { colors, ui } from "../theme";

/** A button that opens a native modal naming the lane, and closes it again. */
export function LaneModal({ info }: { info: LaneInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={ui.button} onPress={() => setOpen(true)}>
        <Text style={ui.buttonText}>Open a modal</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={ui.h2}>Lane {info.lane}</Text>
            <Text style={ui.lede}>
              A modal of {info.project} on {info.branch}.
            </Text>
            <Pressable style={ui.button} onPress={() => setOpen(false)}>
              <Text style={ui.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheet: { gap: 12, padding: 24, borderRadius: 12, backgroundColor: colors.paint },
});
