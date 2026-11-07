import { dollars, invoices } from "../invoices.js";
import { Card } from "./Card.js";

/** The mock invoices `/api/invoices` returns, with overdue ones in red. */
export function InvoicesCard() {
  return (
    <Card title="/api/invoices">
      <dl class="dl-rows">
        {invoices.map((invoice) => (
          <>
            <dt class="dl-key">{invoice.id}</dt>
            <dd>
              {invoice.account}, {dollars(invoice.total_cents)},{" "}
              <span class={invoice.status === "overdue" ? "dl-bad" : "dl-ok"}>
                {invoice.status}
              </span>
            </dd>
          </>
        ))}
      </dl>
    </Card>
  );
}
