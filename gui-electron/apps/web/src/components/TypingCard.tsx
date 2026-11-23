import { useState } from "react";
import { Card } from "./Card";

/** A text input that echoes what was typed, to check that keys reach the page. */
export function TypingCard() {
  const [text, setText] = useState("");
  return (
    <Card title="input">
      <div className="typing">
        <input
          type="text"
          value={text}
          placeholder="Type here"
          aria-label="Text to echo"
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <dl className="dl-rows">
        <dt>echo</dt>
        <dd>{text || "(empty)"}</dd>
        <dt>length</dt>
        <dd>{text.length}</dd>
      </dl>
    </Card>
  );
}
