/** Reads a variable devlanes sets, failing early with a hint when the app runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Everything the main process reads from its environment, parsed once at startup. */
export const env = {
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  service: required("DEVLANES_SERVICE"),
  // The service's own port, used for the Chrome DevTools Protocol.
  port: Number(required("PORT")),
  // Set in devlanes.yaml from ${{ lane.label }}.
  branch: required("LANE_LABEL"),
  // ${{ services.web.public_url }}: the lane's own renderer, through the devlanes proxy.
  rendererUrl: required("RENDERER_URL"),
  // ${{ lane.data_path }}/electron, so two lanes never share a profile or its lock.
  userData: required("ELECTRON_USER_DATA"),
};
