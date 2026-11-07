import { useState } from "react";
import { changeSession, fetchMe } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

type Action = { ok: boolean; text: string };

/** Sign in and out buttons, the cookie the browser holds, and who the API says is signed in. */
export function SessionPanel() {
  const [me, reloadMe] = useRequest(fetchMe);
  const [cookie, setCookie] = useState(document.cookie);
  const [action, setAction] = useState<Action | null>(null);

  async function run(method: "POST" | "DELETE") {
    try {
      await changeSession(method);
      setAction({ ok: true, text: `${method} /api/session answered` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAction({ ok: false, text: `${method} /api/session failed: ${message}` });
    }
    setCookie(document.cookie);
    reloadMe();
  }

  return (
    <>
      <Card title="session cookie">
        <dl className="dl-rows">
          <dt>last action</dt>
          {action ? (
            <dd className={action.ok ? "dl-ok" : "dl-bad"}>{action.text}</dd>
          ) : (
            <dd>none yet</dd>
          )}
          <dt>document.cookie</dt>
          <dd>{cookie || "(empty)"}</dd>
          <dt>GET /api/me</dt>
          <Outcome
            state={me}
            ok={(data) =>
              data.signed_in ? `signed in as ${data.user} on lane ${data.lane}` : "not signed in"
            }
          />
        </dl>
      </Card>
      <p className="session-actions">
        <button className="dl-button" type="button" onClick={() => run("POST")}>
          Sign in
        </button>
        <button className="dl-button" type="button" onClick={() => run("DELETE")}>
          Sign out
        </button>
      </p>
    </>
  );
}
