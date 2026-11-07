import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// devlanes sets DATA_FILE to a file in the lane's data folder. Under mprocs it
// was unset and each worktree had its own .data/acme.json.
export const dataFile =
  process.env.DATA_FILE ?? fileURLToPath(new URL("../.data/acme.json", import.meta.url));

export const SCHEMA = 2;

export const exists = () => existsSync(dataFile);

export const load = () => JSON.parse(readFileSync(dataFile, "utf8"));

export function save(data) {
  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(data, null, 2) + "\n");
}
