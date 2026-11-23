import { Card } from "./components/Card";
import { TitleBar } from "./components/TitleBar";
import { env } from "./env";

/** The frameless second window: a drag-region title bar over the lane it belongs to. */
export function SecondWindow() {
  return (
    <div className="second">
      <TitleBar title={`${env.project} lane ${env.lane}, second window`} />
      <main className="second-body">
        <p className="dl-lede">
          This window has no native frame. Drag the strip at the top to move it, and close it with
          its x.
        </p>
        <Card title="second">
          <dl className="dl-rows">
            <dt>lane</dt>
            <dd>
              {env.lane} <span className="dl-key">{env.laneName}</span>
            </dd>
            <dt>page</dt>
            <dd className="dl-url">{window.location.href}</dd>
          </dl>
        </Card>
      </main>
    </div>
  );
}
