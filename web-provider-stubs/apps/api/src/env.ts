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
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }}.
  branch: required("LANE_LABEL"),
  // Every https origin of this lane; form posts from anywhere else are refused.
  origins: required("DEVLANES_ORIGINS").split(","),
  // In production these point at the real providers; devlanes.yaml points them at this lane's stubs.
  sms: { url: required("SMS_API_URL"), key: required("SMS_API_KEY") },
  email: { url: required("EMAIL_API_URL"), key: required("EMAIL_API_KEY") },
};
