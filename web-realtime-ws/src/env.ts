/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  host: process.env.HOST ?? "127.0.0.1",
  // PORT is the main port; devlanes.yaml maps self.ports.ws and self.ports.admin to the others.
  ports: {
    default: Number(required("PORT")),
    ws: Number(required("WS_PORT")),
    admin: Number(required("ADMIN_PORT")),
  },
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  // The lane's https origins, which the WebSocket routes accept in an Origin header.
  origins: required("DEVLANES_ORIGINS").split(",").filter(Boolean),
};

/** A name under self.ports, plus `default` for the main port. */
export type PortName = keyof typeof env.ports;
