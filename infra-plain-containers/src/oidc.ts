import * as oidc from "openid-client";
import { serverEnv } from "./env.js";

// The mock provider accepts any client id and secret.
const CLIENT_ID = "acme-web";
const CLIENT_SECRET = "acme-secret";
const SCOPE = "openid profile email";
const TIMEOUT_SECONDS = 5;

/** The values a login keeps between the redirect to the provider and the callback. */
export type PendingLogin = {
  verifier: string;
  state: string;
  nonce: string;
};

/** What the page shows about the lane's provider, read from its discovery document. */
export type ProviderInfo = {
  issuer: string;
  authorize: string;
  token: string;
};

let config: Promise<oidc.Configuration> | undefined;

/**
 * Discovery, and later the token request, go over HTTPS to auth.<lane domain>, trusted through
 * the NODE_EXTRA_CA_CERTS devlanes sets. On 127.0.0.1 the provider would answer with an
 * http://127.0.0.1 issuer, and the ID token's iss would not match the one the browser logged in at.
 */
function discover(): Promise<oidc.Configuration> {
  config ??= oidc
    .discovery(new URL(serverEnv().oidcIssuer), CLIENT_ID, CLIENT_SECRET, undefined, {
      timeout: TIMEOUT_SECONDS,
    })
    .catch((err: unknown) => {
      // Try again on the next request, for example once the container is back.
      config = undefined;
      throw err;
    });
  return config;
}

function redirectUri(): string {
  return new URL("/callback", serverEnv().publicUrl).href;
}

/** The provider's issuer and endpoints, as its discovery document lists them. */
export async function providerInfo(): Promise<ProviderInfo> {
  const meta = (await discover()).serverMetadata();
  return {
    issuer: meta.issuer,
    authorize: meta.authorization_endpoint ?? "-",
    token: meta.token_endpoint ?? "-",
  };
}

/** Starts a login: the values to keep in the session and the provider URL to redirect to. */
export async function startLogin(): Promise<{ login: PendingLogin; url: URL }> {
  const login: PendingLogin = {
    verifier: oidc.randomPKCECodeVerifier(),
    state: oidc.randomState(),
    nonce: oidc.randomNonce(),
  };
  const url = oidc.buildAuthorizationUrl(await discover(), {
    redirect_uri: redirectUri(),
    scope: SCOPE,
    code_challenge: await oidc.calculatePKCECodeChallenge(login.verifier),
    code_challenge_method: "S256",
    state: login.state,
    nonce: login.nonce,
  });
  return { login, url };
}

/** Exchanges the code in the callback URL for tokens and returns the ID token's claims. */
export async function finishLogin(callbackUrl: URL, login: PendingLogin): Promise<oidc.IDToken> {
  const tokens = await oidc.authorizationCodeGrant(await discover(), callbackUrl, {
    pkceCodeVerifier: login.verifier,
    expectedState: login.state,
    expectedNonce: login.nonce,
  });
  const claims = tokens.claims();
  if (!claims) throw new Error("the token response has no ID token");
  return claims;
}

/**
 * The callback as the browser requested it. The app listens on 127.0.0.1, so the request URL has
 * that origin, and openid-client derives the redirect_uri for the code exchange from it.
 */
export function callbackUrl(requestUrl: string): URL {
  const { pathname, search } = new URL(requestUrl);
  return new URL(pathname + search, serverEnv().publicUrl);
}
