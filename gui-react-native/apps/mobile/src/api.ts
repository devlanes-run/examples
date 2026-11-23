import { devServerOrigin } from "./devServer";
import type { ApiAnswer, LaneInfo } from "./lane";

const TIMEOUT_MS = 5000;

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${devServerOrigin()}${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${path} answered ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${path} did not answer in ${TIMEOUT_MS} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** The lane values of the metro service that served this bundle. */
export function fetchMetroLane(): Promise<LaneInfo> {
  return getJson<LaneInfo>("/lane");
}

/** The API's answer, through Metro's `/api` route to the lane's api service. */
export function fetchApi(): Promise<ApiAnswer> {
  return getJson<ApiAnswer>("/api/");
}
