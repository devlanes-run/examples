import type { IDToken } from "openid-client";
import { Card } from "./Card.js";

/** The ID token's claims with a logout link, or the login button before a login. */
export function ClaimsCard({ claims, domain }: { claims: IDToken | undefined; domain: string }) {
  if (!claims) {
    return (
      <p>
        <a class="dl-button" href="/login">
          Log in at auth.{domain}
        </a>
      </p>
    );
  }
  return (
    <>
      <Card title="ID token claims">
        <pre>{JSON.stringify(claims, null, 2)}</pre>
      </Card>
      <p>
        <a class="dl-button" href="/logout">
          Log out
        </a>
      </p>
    </>
  );
}
