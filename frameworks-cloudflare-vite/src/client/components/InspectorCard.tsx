import { env } from "../env";
import { Card } from "./Card";

/** The inspector port the Vite plugin opened, and the hostname devlanes routes to it. */
export function InspectorCard({ port }: { port: number }) {
  const targets = `${env.inspectUrl}/json`;
  return (
    <Card title="inspectorPort">
      <dl className="dl-rows">
        <dt>port</dt>
        <dd>{port}</dd>
        <dt>targets</dt>
        <dd>
          <a href={targets}>{targets}</a>
        </dd>
      </dl>
    </Card>
  );
}
