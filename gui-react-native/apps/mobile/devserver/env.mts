/** Reads a variable devlanes sets, failing early with a hint when Metro runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Everything Metro's lane routes read from the environment, parsed when Metro loads its config. */
export const env = {
  // @react-native/metro-config reads it too, as Metro's port.
  port: Number(required("RCT_METRO_PORT")),
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ services.api.url }}.
  branch: required("LANE_LABEL"),
  apiUrl: required("API_URL"),
};
