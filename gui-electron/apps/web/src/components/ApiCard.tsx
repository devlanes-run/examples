import { Fragment } from "react";
import { fetchApi } from "../api";
import { env } from "../env";
import { useRequest } from "../useRequest";
import { Card } from "./Card";

/** The API's answer, fetched over https from its own hostname in this lane. */
export function ApiCard() {
  const answer = useRequest(fetchApi);
  return (
    <Card title="VITE_API_URL">
      <dl className="dl-rows">
        <dt>GET</dt>
        <dd className="dl-url">{env.apiUrl}/</dd>
        <dt>result</dt>
        {answer.status === "loading" && <dd>...</dd>}
        {answer.status === "error" && <dd className="dl-bad">{answer.error}</dd>}
        {answer.status === "ok" && (
          <dd className="dl-ok">
            200 from lane {answer.data.lane}, {answer.data.url ?? "not through the proxy"}
          </dd>
        )}
        {answer.status === "ok" &&
          answer.data.notes.map((note) => (
            <Fragment key={note.id}>
              <dt className="dl-key">{note.updated}</dt>
              <dd>{note.title}</dd>
            </Fragment>
          ))}
      </dl>
    </Card>
  );
}
