import { Fragment } from "react";
import { fetchApi } from "../api";
import { env } from "../env";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

/** The answer of `api` in this lane, fetched from its https hostname. */
export function ApiCard() {
  const [answer] = useRequest(fetchApi);
  return (
    <Card title="VITE_API_URL">
      <dl className="dl-rows">
        <dt>GET</dt>
        <dd className="dl-url">{env.apiUrl}/</dd>
        <dt>result</dt>
        <Outcome state={answer} ok={(data) => `200 from lane ${data.lane}, ${data.url}`} />
        {answer.status === "ok" &&
          answer.data.releases.map((release) => (
            <Fragment key={release.version}>
              <dt className="dl-key">{release.version}</dt>
              <dd>
                {release.channel}, {release.date}
              </dd>
            </Fragment>
          ))}
      </dl>
    </Card>
  );
}
