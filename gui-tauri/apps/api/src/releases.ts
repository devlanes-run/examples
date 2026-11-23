/** One desktop build in the mock release feed. */
export type Release = {
  version: string;
  channel: "stable" | "beta";
  date: string;
};

/** The mock release feed every lane's API serves to its desktop app. */
export const releases: Release[] = [
  { version: "1.4.0", channel: "stable", date: "2026-10-02" },
  { version: "1.5.0-beta.1", channel: "beta", date: "2026-11-04" },
  { version: "1.5.0-beta.2", channel: "beta", date: "2026-11-18" },
];
