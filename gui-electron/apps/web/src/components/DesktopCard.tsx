import type { DesktopApi } from "../desktop";
import { windowNumber } from "../desktop";
import { useRequest } from "../useRequest";
import { Card } from "./Card";

/** The Electron shell around this page: its service, versions, process and user data folder. */
export function DesktopCard({ desktop }: { desktop: DesktopApi }) {
  const info = useRequest(desktop.info);
  return (
    <Card title="window.desktop.info()">
      <dl className="dl-rows">
        <dt>window</dt>
        <dd>{windowNumber ?? "?"}</dd>
        {info.status === "loading" && (
          <>
            <dt>info</dt>
            <dd>...</dd>
          </>
        )}
        {info.status === "error" && (
          <>
            <dt>info</dt>
            <dd className="dl-bad">{info.error}</dd>
          </>
        )}
        {info.status === "ok" && (
          <>
            <dt>service</dt>
            <dd>{info.data.service}</dd>
            <dt>electron</dt>
            <dd>
              {info.data.electron} <span className="dl-key">chrome {info.data.chrome}</span>
            </dd>
            <dt>main pid</dt>
            <dd>{info.data.pid}</dd>
            <dt>user data</dt>
            <dd>{info.data.userData}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}
