import { useState } from "react";
import { Card } from "./Card";

/** A text field and what it holds, for checking typing, IME input and the clipboard. */
export function TextInput() {
  const [text, setText] = useState("");
  return (
    <Card title="text input">
      <div className="field">
        <input
          aria-label="Text to type"
          placeholder="Type here"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <dl className="dl-rows">
        <dt>value</dt>
        <dd>{text || "(empty)"}</dd>
        <dt>length</dt>
        <dd>{text.length}</dd>
      </dl>
    </Card>
  );
}
