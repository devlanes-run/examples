import { env, type KindName } from "./env.js";

/** What `/stats` returns, and what the index page shows per service. */
export type Stats = {
  service: string;
  kind: KindName;
  ready_after_ms: number | null;
  bursts: number;
  cpu_ms: number;
  uptime_s: number;
};

let readyAfterMs: number | null = null;
let bursts = 0;

/** Records that the server listens; returns the milliseconds since the process started. */
export function markReady(): number {
  // performance.now() counts from process start, so this includes Node's own startup.
  readyAfterMs = Math.round(performance.now());
  return readyAfterMs;
}

/** Counts one CPU burst; returns the new total. */
export function countBurst(): number {
  bursts += 1;
  return bursts;
}

/** The current numbers for this process. */
export function stats(): Stats {
  const cpu = process.cpuUsage();
  return {
    service: env.service,
    kind: env.kind,
    ready_after_ms: readyAfterMs,
    bursts,
    cpu_ms: Math.round((cpu.user + cpu.system) / 1000),
    uptime_s: Math.round(process.uptime()),
  };
}

/** Milliseconds as seconds with one decimal, as the logs and pages print them. */
export function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}
