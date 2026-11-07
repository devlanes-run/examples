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
  lane: Number(required("VITE_LANE")),
  // https://inspect.${{ lane.domain }}, the hostname devlanes routes to the inspector port.
  inspectUrl: required("VITE_INSPECT_URL"),
};
