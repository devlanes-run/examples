/** Order totals for one batch of the nightly report. */
export type Totals = { orders: number; cents: number };

/** One batch as the report expects it from the orders export. */
export type Batch = { id: number; totals: Totals };

/** The export's raw record for batch `id`; batch 10 comes without totals. */
function exportRecord(id: number): unknown {
  if (id === 10) return { id };
  return { id, totals: { orders: 37 + id * 3, cents: 122_750 + id * 7_150 } };
}

// The bug this service exists for: records are cast to Batch without checking them, so the
// missing totals only show up when summarize reads them.
export const batches = Array.from({ length: 12 }, (_, i) => exportRecord(i + 1) as Batch);

function summarize(batch: Batch): string {
  return `${batch.totals.orders} orders, ${(batch.totals.cents / 100).toFixed(2)} total`;
}

/** The report line for one batch. */
export function buildReport(batch: Batch): { batch: number; line: string } {
  return { batch: batch.id, line: summarize(batch) };
}
