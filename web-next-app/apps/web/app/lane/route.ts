import { laneInfo } from "@/lib/lane";

/** The lane values as JSON, the same ones the page shows. */
export function GET(request: Request) {
  return Response.json(laneInfo(request.headers.get("x-forwarded-host")));
}
