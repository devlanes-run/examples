import { Fragment } from "react";
import { fetchItems } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** The Worker's mock catalogue from `GET /api/items`, one row per item. */
export function ItemsCard() {
  const [items] = useRequest(fetchItems);
  return (
    <Card title="GET /api/items">
      <dl className="dl-rows">
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
