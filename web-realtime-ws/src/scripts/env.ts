const USAGE = "devlanes exec --name chat -- npm run chat -- <text>";

/** Reads a variable from the lane environment `devlanes exec` gives the script. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; run: ${USAGE}`);
  }
  return value;
}

/** What the terminal scripts read; services get a different set, parsed in src/env.ts. */
export const scriptEnv = {
  // The lane's https URL of the realtime service, such as https://example-realtime-ws.localhost.
  publicUrl: required("DEVLANES_PUBLIC_URL_REALTIME"),
  // An exec unit gets no NODE_EXTRA_CA_CERTS, so the script trusts the devlanes CA itself.
  caCert: required("DEVLANES_CA_CERT"),
};
