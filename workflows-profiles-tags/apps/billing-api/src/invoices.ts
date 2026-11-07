import { JsonStore, nextId } from "@profiles-tags/shared";
import { env } from "./env.js";

/** An invoice; `name` is its number. */
export type Invoice = {
  id: number;
  name: string;
  customer: string;
  total: string;
};

const SEED: Invoice[] = [
  { id: 1, name: "INV-0001", customer: "Ada Acme", total: "49.00 EUR" },
  { id: 2, name: "INV-0002", customer: "Grace Acme", total: "12.50 EUR" },
];

const store = new JsonStore(env.dataFile, SEED);

/** The file the invoices are stored in. */
export const invoicesFile = store.file;

/** Every stored invoice, oldest first. */
export function listInvoices(): Invoice[] {
  return store.read();
}

/** Stores a new invoice for a customer, numbered after the last one. */
export function addInvoice(customer = "Acme Ltd"): Invoice {
  const invoices = store.read();
  const id = nextId(invoices);
  const name = `INV-${String(id).padStart(4, "0")}`;
  const invoice = { id, name, customer, total: "10.00 EUR" };
  store.write([...invoices, invoice]);
  console.log(`added invoice ${name} to ${store.file}`);
  return invoice;
}
