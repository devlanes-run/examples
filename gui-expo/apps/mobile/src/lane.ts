import Constants from "expo-constants";
import { Platform } from "react-native";
import { env } from "./env";

/** The lane values every example shows; `url` is where this bundle came from. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string;
};

// On a device the bundle comes from the dev server's port, which hostUri names.
const origin =
  Platform.OS === "web"
    ? window.location.origin
    : `http://${Constants.expoConfig?.hostUri ?? `127.0.0.1:${env.port}`}`;

/** The lane values of the `expo` service that served this app. */
export const laneInfo: LaneInfo = {
  project: env.project,
  lane: env.lane,
  lane_name: env.laneName,
  branch: env.branch,
  service: env.service,
  port: env.port,
  url: origin,
};
