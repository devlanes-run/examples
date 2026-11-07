import { readLaneEnv, required } from "@profiles-tags/shared";

/** Everything the mailer reads from its environment, parsed once at startup. */
export const env = {
  ...readLaneEnv(),
  accountsApiUrl: required("ACCOUNTS_API_URL"),
  // The worker template points this into the lane's data folder; the test profile moves it.
  dataFile: required("DATA_FILE"),
};
