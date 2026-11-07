import { Fragment } from "react";
import { apiUrl, fetchItems } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** The items fetched cross-origin from `VITE_API_URL`, which only works with CORS. */
export function ItemsList() {
  const [items] = useRequest(fetchItems);
  return (
    <Card title="VITE_API_URL">
      <dl className="dl-rows">
        <dt>GET</dt>
        <dd className="dl-url">{apiUrl}/api/items</dd>
        <dt>result</dt>
        <Outcome state={items} ok={(data) => `200 from lane ${data.lane}`} />
        {items.status === "ok" &&
          items.data.items.map((item) => (
            <Fragment key={item.id}>
              <dt className="dl-key">{item.sku}</dt>
              <dd>
                {item.name}, {price(item.price_cents)}
              </dd>
            </Fragment>
          ))}
      </dl>
    </Card>
  );
}
