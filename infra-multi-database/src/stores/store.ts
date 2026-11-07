/** One datastore on the dashboard: the part of it this lane owns, and a way to try it. */
export type Store = {
  /** The store's segment in `/stores/<key>/try` and `/api/stores`. */
  key: string;
  title: string;
  /** Whether every lane shares the container or each lane runs its own. */
  container: "shared" | "per lane";
  /** What the namespace is called in this store: a database, an index, a vhost. */
  kind: string;
  namespace: string;
  /** The global_env variable that carries the store's URL. */
  envVar: string;
  /** The web console behind the devlanes proxy, or a shell command for stores without one. */
  access: { console: string } | { shell: string };
  /** Connects and describes the server and the namespace in one line. */
  health(): Promise<string>;
  /** Writes mock data into the namespace and reads it back, one line per step. */
  demo(): Promise<string[]>;
};

/** How long a store may take to answer before the page shows it as failed. */
export const TIMEOUT_MS = 3000;

/** The namespace at the end of a store URL; global_env puts the lane's name there. */
export function namespaceOf(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

/** `1 key`, `2 keys`. */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The current time as written into every mock record. */
export function now(): string {
  return new Date().toISOString();
}
