// Every URL and the cookie domain derive from APP_DOMAIN, the one value that
// changes per lane. A larger app adds its other URLs here the same way.
const domain = process.env.APP_DOMAIN;

export const urls = {
  domain,
  web: `https://${domain}`,
  api: `https://api.${domain}`,
  assets: `https://assets.${domain}`,
  cookieDomain: domain,
};
