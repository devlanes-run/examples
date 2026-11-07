/** Reads a variable devlanes.yaml sets on `web`, failing early when Vite runs outside devlanes. */
function required(name: string): string {
  const value: unknown = import.meta.env[name];
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Every `VITE_*` value the page reads, which Vite inlines into the code it sends the browser. */
export const env = {
  project: required("VITE_PROJECT"),
  lane: Number(required("VITE_LANE")),
  laneName: required("VITE_LANE_NAME"),
  branch: required("VITE_LANE_LABEL"),
  service: required("VITE_SERVICE"),
  port: Number(required("VITE_PORT")),
  // ${{ services.api.public_url }}: the browser calls it, so it is the https hostname.
  apiUrl: required("VITE_API_URL"),
};
