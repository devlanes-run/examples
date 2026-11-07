import type { AppUrls } from "@example-dotenv/config";
import { Card } from "./Card.js";

/** The URLs and cookie domain `appUrls` derived from `APP_DOMAIN`. */
export function UrlsCard({ urls }: { urls: AppUrls }) {
  return (
    <Card title="appUrls(APP_DOMAIN)">
      <dl class="dl-rows">
        <dt>APP_DOMAIN</dt>
        <dd>{urls.domain}</dd>
        <dt>web</dt>
        <dd>
          <a href={urls.web}>{urls.web}</a>
        </dd>
        <dt>api</dt>
        <dd>
          <a href={urls.api}>{urls.api}</a>
        </dd>
        <dt>assets</dt>
        <dd>
          <a href={urls.assets}>{urls.assets}</a>{" "}
          <span class="dl-key">this page's CSS and logo</span>
        </dd>
        <dt>cookie domain</dt>
        <dd>
          {urls.cookieDomain} <span class="dl-key">acme_session</span>
        </dd>
      </dl>
    </Card>
  );
}
