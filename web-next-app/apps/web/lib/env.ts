/** Reads a variable devlanes sets, failing with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

function parse() {
  return {
    port: Number(required("PORT")),
    project: required("DEVLANES_LANE_PROJECT"),
    lane: Number(required("DEVLANES_LANE")),
    laneName: required("DEVLANES_LANE_NAME"),
    service: required("DEVLANES_SERVICE"),
    // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
    branch: required("LANE_LABEL"),
    domain: required("LANE_DOMAIN"),
    // Set in devlanes.yaml from the api service's public_url and url.
    apiPublicUrl: required("API_PUBLIC_URL"),
    apiUrl: required("API_URL"),
  };
}

export type Env = ReturnType<typeof parse>;

let cached: Env | undefined;

/** Everything the web service reads from its environment, parsed on first use. */
export function env(): Env {
  // Parsed on first use instead of at import, because next build imports the routes without
  // the lane's variables.
  cached ??= parse();
  return cached;
}
