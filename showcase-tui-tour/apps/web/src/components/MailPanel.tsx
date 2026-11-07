import { type FormEvent, Fragment, useState } from "react";
import { fetchMail, type MailState, sendMail } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";

// The worker picks the job up a moment after the API queues it.
const RELOAD_AFTER_SEND_MS = 1500;

/** A form that queues a mail, and the lane's queue and sent mails from Redis. */
export function MailPanel() {
  const [mail, reloadMail] = useRequest(fetchMail);
  const [sendError, setSendError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const to = String(new FormData(event.currentTarget).get("to"));
    try {
      await sendMail(to);
      setSendError(null);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : String(error));
    }
    reloadMail();
    setTimeout(reloadMail, RELOAD_AFTER_SEND_MS);
  }

  const title =
    mail.status === "ok" ? `GET /api/mail · redis db ${mail.data.redis_db}` : "GET /api/mail";
  return (
    <>
      <form className="send" onSubmit={onSubmit}>
        <input name="to" type="email" required defaultValue="dev@example.invalid" />
        <button className="dl-button" type="submit">
          Send
        </button>
      </form>
      <Card title={title}>
        <dl className="dl-rows">
          {sendError && (
            <>
              <dt>POST /api/mail</dt>
              <dd className="dl-bad">{sendError}</dd>
            </>
          )}
          {mail.status === "loading" && <dt>...</dt>}
          {mail.status === "error" && (
            <>
              <dt>error</dt>
              <dd className="dl-bad">{mail.error}</dd>
            </>
          )}
          {mail.status === "ok" && <MailRows state={mail.data} />}
        </dl>
      </Card>
    </>
  );
}

/** The owner the setup entry wrote, the queue length and one row per sent mail. */
function MailRows({ state }: { state: MailState }) {
  return (
    <>
      <dt>lane:owner</dt>
      <dd className="dl-key">{state.owner ?? "(unset)"}</dd>
      <dt>waiting</dt>
      <dd className={state.queued ? "dl-bad" : "dl-ok"}>{state.queued} in mail:queue</dd>
      {state.done.map((sent) => (
        <Fragment key={sent.id}>
          <dt>{sent.id}</dt>
          <dd className="dl-ok">
            sent to {sent.to} in {sent.took_ms}ms
          </dd>
        </Fragment>
      ))}
    </>
  );
}
