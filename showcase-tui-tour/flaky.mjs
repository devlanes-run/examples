// A nightly report job with a bug: the tenth batch has no totals, and reading
// them throws about 20 seconds after the start. devlanes never restarts it, so
// the unit stays failed with this stack trace until you restart it.
const clock = () => new Date().toTimeString().slice(0, 8);

const batches = Array.from({ length: 12 }, (_, i) =>
  i === 9
    ? { id: i + 1 }
    : { id: i + 1, totals: { orders: 40 + i * 3, cents: 129_900 + i * 7_150 } },
);

function summarize(batch) {
  return `${batch.totals.orders} orders, ${(batch.totals.cents / 100).toFixed(2)} total`;
}

function buildReport(batch) {
  return { batch: batch.id, line: summarize(batch) };
}

console.log(`flaky ready: building the nightly report in ${batches.length} batches`);

let next = 0;
setInterval(() => {
  const report = buildReport(batches[next]);
  console.log(`${clock()} INFO batch ${report.batch}/${batches.length}: ${report.line}`);
  next += 1;
}, 2_000);
