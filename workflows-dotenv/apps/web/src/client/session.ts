// The browser sends acme_session to api.<domain> because the cookie's domain covers it, and the
// api lets this page read the answer because its origin is in DEVLANES_ORIGINS.
const out = document.getElementById("session");

async function checkSession(element: HTMLElement): Promise<void> {
  try {
    const res = await fetch(element.dataset.url ?? "", {
      credentials: "include",
      signal: AbortSignal.timeout(5000),
    });
    const { session } = (await res.json()) as { session: string | null };
    element.className = session ? "dl-ok" : "dl-bad";
    element.textContent = session ? `api saw acme_session=${session}` : "api got no cookie";
  } catch (err) {
    element.className = "dl-bad";
    element.textContent = String(err);
  }
}

if (out) void checkSession(out);
