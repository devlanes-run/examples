import { readApiTarget, readServerEnv } from "@profiles-tags/shared";

/** Everything shop-web reads from its environment, parsed once at startup. */
export const env = {
  ...readServerEnv(),
  catalog: readApiTarget("catalog-api", "CATALOG_API"),
  accounts: readApiTarget("accounts-api", "ACCOUNTS_API"),
};
