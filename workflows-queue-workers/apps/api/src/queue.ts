import { connectQueue } from "@queue-workers/queue";
import { env } from "./env.js";

/** This lane's queue, connected once at startup. */
export const queue = await connectQueue({ url: env.redisUrl, prefix: env.queuePrefix });

/** The most jobs one request may enqueue. */
export const MAX_ENQUEUE = 100;

/** Parses a requested job count, or returns null when it is not a whole number from 1 to 100. */
export function parseCount(raw: unknown): number | null {
  const count = Number(raw ?? 1);
  return Number.isInteger(count) && count >= 1 && count <= MAX_ENQUEUE ? count : null;
}
