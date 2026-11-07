import { JsonStore, nextId } from "@profiles-tags/shared";
import { env } from "./env.js";

/** A product the shop sells. */
export type Product = {
  id: number;
  name: string;
  price: string;
};

const SEED: Product[] = [
  { id: 1, name: "Lane socks", price: "9.00 EUR" },
  { id: 2, name: "Worktree mug", price: "14.00 EUR" },
  { id: 3, name: "Proxy hoodie", price: "49.00 EUR" },
];

const store = new JsonStore(env.dataFile, SEED);

/** The file the products are stored in. */
export const productsFile = store.file;

/** Every stored product, oldest first. */
export function listProducts(): Product[] {
  return store.read();
}

/** Stores a new product, named `product <id>` when no name is given. */
export function addProduct(name?: string): Product {
  const products = store.read();
  const id = nextId(products);
  const product = { id, name: name ?? `product ${id}`, price: "10.00 EUR" };
  store.write([...products, product]);
  console.log(`added product ${id} to ${store.file}`);
  return product;
}
