import { Fragment } from "react";
import { env } from "../env";
import { Card } from "./Card";

/** Links to the other parts of this lane: the API's JSON routes and the lane's Mailpit inbox. */
export function LaneLinks() {
  const links = [
    ["api", env.apiUrl],
    ["api /lane", `${env.apiUrl}/lane`],
    ["api /api/orders", `${env.apiUrl}/api/orders`],
    ["mailpit", env.mailUrl],
  ];
  return (
    <Card title="in this lane">
      <dl className="dl-rows">
        {links.map(([name, url]) => (
          <Fragment key={name}>
            <dt>{name}</dt>
            <dd className="dl-url">
              <a href={url}>{url}</a>
            </dd>
          </Fragment>
        ))}
      </dl>
    </Card>
  );
}
