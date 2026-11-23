import { Platform } from "react-native";

/** Fails with a hint when the dev server ran outside devlanes and the bundle has no value. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set; start the expo service with devlanes start`);
  }
  return value;
}

// Expo inlines EXPO_PUBLIC_* into the bundle only when each one is read by its full name.
/** The values devlanes.yaml sets on `expo`, baked into the bundle this lane's dev server sends. */
export const env = {
  project: required("EXPO_PUBLIC_PROJECT", process.env.EXPO_PUBLIC_PROJECT),
  lane: Number(required("EXPO_PUBLIC_LANE", process.env.EXPO_PUBLIC_LANE)),
  laneName: required("EXPO_PUBLIC_LANE_NAME", process.env.EXPO_PUBLIC_LANE_NAME),
  branch: required("EXPO_PUBLIC_LANE_LABEL", process.env.EXPO_PUBLIC_LANE_LABEL),
  service: required("EXPO_PUBLIC_SERVICE", process.env.EXPO_PUBLIC_SERVICE),
  port: Number(required("EXPO_PUBLIC_PORT", process.env.EXPO_PUBLIC_PORT)),
  // A browser page on the lane's hostname calls the API's hostname; a device calls the port.
  apiUrl:
    Platform.OS === "web"
      ? required("EXPO_PUBLIC_API_PUBLIC_URL", process.env.EXPO_PUBLIC_API_PUBLIC_URL)
      : required("EXPO_PUBLIC_API_URL", process.env.EXPO_PUBLIC_API_URL),
};
