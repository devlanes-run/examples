/** Every URL a lane's apps use, and the domain their session cookie is set on. */
export type AppUrls = {
  domain: string;
  web: string;
  api: string;
  assets: string;
  cookieDomain: string;
};

/**
 * Derives every URL and the cookie domain from `APP_DOMAIN`, the one value that changes per lane,
 * so `.env` holds no URLs and lanes can share it. A larger app adds its other URLs here.
 */
export function appUrls(domain: string): AppUrls {
  return {
    domain,
    web: `https://${domain}`,
    api: `https://api.${domain}`,
    assets: `https://assets.${domain}`,
    // Covers api.<domain> too, so the browser sends the cookie on its calls to the api.
    cookieDomain: domain,
  };
}
