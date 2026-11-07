// A nightly report job with a bug: the tenth batch has no totals, and reading them throws about
// 20 seconds after the start. devlanes never restarts it, so the unit stays failed with the stack
// trace until you restart it.
import { batches, buildReport } from "./report.js";

const BATCH_EVERY_MS = 2_000;

let next = 0;

/** Builds the next batch's line; the uncaught TypeError on batch 10 ends the process with code 1. */
function runBatch(): void {
  const report = buildReport(batches[next]);
  const clock = new Date().toTimeString().slice(0, 8);
  console.log(`${clock} INFO batch ${report.batch}/${batches.length}: ${report.line}`);
  next += 1;
}

// The ready check in devlanes.yaml waits for this line.
console.log(`flaky ready: building the nightly report in ${batches.length} batches`);
setInterval(runBatch, BATCH_EVERY_MS);
