export const dynamic = "force-dynamic";

/** The ready check devlanes polls before it marks `web` ready. */
export function GET() {
  return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
