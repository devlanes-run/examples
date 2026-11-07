import { fetchProxiedLane } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

/** The API's `/lane` reached through Vite's `server.proxy`, on the page's own origin. */
export function ProxiedLane() {
  const [lane] = useRequest(fetchProxiedLane);
  return (
    <Card title="server.proxy /proxied">
      <dl className="dl-rows">
        <dt>GET</dt>
        <dd className="dl-url">{window.location.origin}/proxied/lane</dd>
        <dt>result</dt>
        <Outcome state={lane} ok={() => "200, no CORS headers needed"} />
      </dl>
      {lane.status === "ok" && <pre>{JSON.stringify(lane.data, null, 2)}</pre>}
    </Card>
  );
}
