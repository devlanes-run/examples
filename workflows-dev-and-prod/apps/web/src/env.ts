/**
 * What Vite fixed when it made the code the browser runs. The page reads its lane values from
 * `/lane` and `/mode` at load time instead, so one bundle has no lane baked in.
 */
export const env = {
  // "development" from the dev server, "production" from vite build.
  bundleMode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
};
