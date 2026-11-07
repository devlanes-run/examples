import type { OrdersCheck } from "../orders.js";
import { Card } from "./Card.js";

type ChecksCardProps = {
  orders: OrdersCheck;
  /** The api URL the browser calls with its cookie. */
  sessionUrl: string;
  sentry: boolean;
};

function OrdersResult({ orders }: { orders: OrdersCheck }) {
  if ("error" in orders) return <span class="dl-bad">{orders.error}</span>;
  if (orders.status !== 200) return <span class="dl-bad">{orders.status}</span>;
  return (
    <span class="dl-ok">
      {orders.status}, {orders.count} orders
    </span>
  );
}

/** The checks that put the token, the cookie and the optional Sentry DSN to use. */
export function ChecksCard({ orders, sessionUrl, sentry }: ChecksCardProps) {
  return (
    <Card title="checks">
      <dl class="dl-rows">
        <dt>GET api/orders</dt>
        <dd>
          <OrdersResult orders={orders} /> <span class="dl-key">from web, with ACME_API_TOKEN</span>
        </dd>
        <dt>GET api/session</dt>
        <dd>
          {/* src/client/session.ts fills this in from the browser. */}
          <span id="session" data-url={sessionUrl}>
            waiting for the browser
          </span>
        </dd>
        <dt>Sentry</dt>
        <dd>
          {sentry ? (
            <span class="dl-ok">on</span>
          ) : (
            <>
              off <span class="dl-key">SENTRY_DSN is empty</span>
            </>
          )}
        </dd>
      </dl>
    </Card>
  );
}
