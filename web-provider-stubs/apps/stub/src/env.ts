import { findProvider, providerKinds, type Provider } from "./provider.js";

/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** The provider named by PROVIDER, which devlanes.yaml sets per service. */
function provider(): Provider {
  const kind = required("PROVIDER");
  const found = findProvider(kind);
  if (!found) {
    throw new Error(`PROVIDER is ${kind}; expected one of ${providerKinds.join(", ")}`);
  }
  return found;
}

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }}.
  branch: required("LANE_LABEL"),
  provider: provider(),
  // The key senders must pass as Authorization: Bearer <key>.
  apiKey: required("API_KEY"),
  // The api's public URL, for the link back from the inbox page.
  appUrl: required("APP_URL"),
};
