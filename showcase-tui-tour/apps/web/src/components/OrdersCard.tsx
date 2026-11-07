import { Fragment } from "react";
import { fetchOrders } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";

const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** The orders the API reads from this lane's database, or the error when it cannot. */
export function OrdersCard() {
  const [orders] = useRequest(fetchOrders);
  const title =
    orders.status === "ok" ? `GET /api/orders · ${orders.data.database}` : "GET /api/orders";
  return (
    <Card title={title}>
      <dl className="dl-rows">
        {orders.status === "loading" && <dt>...</dt>}
        {orders.status === "error" && (
          <>
            <dt>error</dt>
            <dd className="dl-bad">{orders.error} (is api running?)</dd>
          </>
        )}
        {orders.status === "ok" && (
          <>
            <dt>answered by</dt>
            <dd className="dl-ok">lane {orders.data.lane}</dd>
            {orders.data.orders.map((order) => (
              <Fragment key={order.id}>
                <dt>#{order.id}</dt>
                <dd>
                  {order.item}, {price(order.total_cents)}{" "}
                  <span className="dl-key">{order.customer}</span>
                </dd>
              </Fragment>
            ))}
          </>
        )}
      </dl>
    </Card>
  );
}
