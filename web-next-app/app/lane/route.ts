import { laneInfo } from "@/lib/lane";

export function GET(request: Request) {
  return Response.json(laneInfo(request.headers.get("x-forwarded-host")));
}
