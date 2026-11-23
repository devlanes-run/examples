import { appIdentifier, inTauri, windowLabel } from "../tauri";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

/** The window and the identifier the tauri preset gave this lane's app. */
export function DesktopCard() {
  if (!inTauri) {
    return (
      <Card title="desktop">
        <dl className="dl-rows">
          <dt>window</dt>
          <dd className="dl-bad">none: this page is open in a browser, not in the desktop app</dd>
        </dl>
      </Card>
    );
  }
  return <DesktopRows />;
}

function DesktopRows() {
  const [identifier] = useRequest(appIdentifier);
  return (
    <Card title="desktop">
      <dl className="dl-rows">
        <dt>window</dt>
        <dd>{windowLabel()}</dd>
        <dt>identifier</dt>
        <Outcome state={identifier} ok={(id) => id} />
      </dl>
    </Card>
  );
}
