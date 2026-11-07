import { readApiTarget, readServerEnv } from "@profiles-tags/shared";

/** Everything admin-web reads from its environment, parsed once at startup. */
export const env = {
  ...readServerEnv(),
  accounts: readApiTarget("accounts-api", "ACCOUNTS_API"),
  billing: readApiTarget("billing-api", "BILLING_API"),
  catalog: readApiTarget("catalog-api", "CATALOG_API"),
};
