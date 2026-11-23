/** Reads a variable devlanes.yaml sets on `web`, failing early when Vite runs outside devlanes. */
function required(name: string): string {
  const value: unknown = import.meta.env[name];
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Every `VITE_*` value the renderer reads, which Vite inlines into the code it serves. */
export const env = {
  project: required("VITE_PROJECT"),
  lane: Number(required("VITE_LANE")),
  laneName: required("VITE_LANE_NAME"),
  branch: required("VITE_LANE_LABEL"),
  service: required("VITE_SERVICE"),
  port: Number(required("VITE_PORT")),
  // ${{ services.api.public_url }}: the renderer calls it like a browser page would.
  apiUrl: required("VITE_API_URL"),
};
