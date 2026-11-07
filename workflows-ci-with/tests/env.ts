/** Reads a variable devlanes sets, failing early with a hint when the tests run outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; run the tests with devlanes with -- npm test`);
  }
  return value;
}

/** The lane the tests run against, from the variables `devlanes with` and `devlanes exec` set. */
export const lane = {
  project: required("DEVLANES_LANE_PROJECT"),
  index: Number(required("DEVLANES_LANE")),
  // One DEVLANES_PUBLIC_URL_<SERVICE> per service in devlanes.yaml, so no test names a hostname.
  urls: {
    api: required("DEVLANES_PUBLIC_URL_API"),
    web: required("DEVLANES_PUBLIC_URL_WEB"),
  },
};
