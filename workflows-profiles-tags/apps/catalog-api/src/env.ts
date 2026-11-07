import { readServerEnv, required } from "@profiles-tags/shared";

/** Everything catalog-api reads from its environment, parsed once at startup. */
export const env = {
  ...readServerEnv(),
  // The api template points this into the lane's data folder; the test profile moves it.
  dataFile: required("DATA_FILE"),
};
