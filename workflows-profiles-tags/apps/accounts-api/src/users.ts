import { JsonStore, nextId } from "@profiles-tags/shared";
import { env } from "./env.js";

/** A customer account; the mailer sends each new one a welcome mail. */
export type User = {
  id: number;
  name: string;
  email: string;
};

const SEED: User[] = [
  { id: 1, name: "Ada Acme", email: "ada@example.invalid" },
  { id: 2, name: "Grace Acme", email: "grace@example.invalid" },
];

const store = new JsonStore(env.dataFile, SEED);

/** The file the users are stored in. */
export const usersFile = store.file;

/** Every stored user, oldest first. */
export function listUsers(): User[] {
  return store.read();
}

/** Stores a new user, named `user <id>` when no name is given. */
export function addUser(name?: string): User {
  const users = store.read();
  const id = nextId(users);
  const user = { id, name: name ?? `user ${id}`, email: `user${id}@example.invalid` };
  store.write([...users, user]);
  console.log(`added user ${id} to ${store.file}`);
  return user;
}
