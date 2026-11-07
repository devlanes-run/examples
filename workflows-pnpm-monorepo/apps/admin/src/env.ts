import { pageEnv } from "@acme/config";

/** Every `VITE_*` value the page reads, which Vite inlines into the code it sends the browser. */
export const env = pageEnv(import.meta.env);
