import { MessageStore } from "@mprocs-migration/store";
import { env } from "./env.js";

/** The lane's data file, which `npm run db:migrate` creates. */
export const store = new MessageStore(env.dataFile);
