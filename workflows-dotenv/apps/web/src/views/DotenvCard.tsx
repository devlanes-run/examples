import type { DotenvFile, DotenvKey } from "@example-dotenv/config";
import { Card } from "./Card.js";

function KeyState({ entry }: { entry: DotenvKey }) {
  switch (entry.state) {
    case "missing":
      return <span class="dl-key">not in this process</span>;
    case "empty":
      return <>empty</>;
    case "masked":
      return (
        <>
          <span class="dl-ok">set</span> <span class="dl-key">value hidden</span>
        </>
      );
    case "set":
      return <span class="dl-ok">{entry.value}</span>;
  }
}

/** The `.env` file devlanes read and, per key, what reached this process. */
export function DotenvCard({ file, keys }: { file: DotenvFile | null; keys: DotenvKey[] }) {
  return (
    <Card title=".env">
      <dl class="dl-rows">
        <dt>file</dt>
        <dd>
          {file ? (
            <>
              {file.path} <span class="dl-key">from {file.from}</span>
            </>
          ) : (
            <span class="dl-bad">no .env; copy .env.example to .env</span>
          )}
        </dd>
        {keys.map((entry) => (
          <>
            <dt>{entry.key}</dt>
            <dd>
              <KeyState entry={entry} />
            </dd>
          </>
        ))}
      </dl>
    </Card>
  );
}
