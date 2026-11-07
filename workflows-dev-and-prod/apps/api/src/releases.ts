/** One release of the mock product. */
export type Release = {
  version: string;
  channel: "stable" | "candidate" | "nightly";
  date: string;
};

/** The mock releases every lane's API serves. */
export const releases: Release[] = [
  { version: "2.4.0", channel: "stable", date: "2026-10-28" },
  { version: "2.5.0-rc.1", channel: "candidate", date: "2026-11-03" },
  { version: "2.5.0-dev", channel: "nightly", date: "2026-11-06" },
];
