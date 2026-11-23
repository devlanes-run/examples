import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { colors, mono } from "../theme";
import { Card, CardText } from "./Card";

/** A text field that echoes what was typed, to check that keys reach the app. */
export function EchoInput() {
  const [text, setText] = useState("");
  return (
    <>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type something"
        placeholderTextColor={colors.lede}
        autoCorrect={false}
      />
      <Card title="echo">
        <CardText color={text ? colors.ok : colors.termDim}>{text || "(empty)"}</CardText>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    fontFamily: mono,
    fontSize: 16,
  },
});
