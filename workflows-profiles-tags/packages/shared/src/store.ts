import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A JSON file holding one value, seeded on first read. The services keep their records in the
 * lane's data folder, so each lane, and each profile that moves `DATA_FILE`, has its own copy.
 * Access is synchronous because one process owns each file: a read-modify-write never interleaves.
 */
export class JsonStore<T> {
  constructor(
    readonly file: string,
    private readonly seed: T,
  ) {}

  /** Returns the stored value, writing the seed first when the file does not exist yet. */
  read(): T {
    if (!existsSync(this.file)) this.write(this.seed);
    return JSON.parse(readFileSync(this.file, "utf8")) as T;
  }

  /** Replaces the stored value, creating the file's folder when needed. */
  write(value: T): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, `${JSON.stringify(value, null, 2)}\n`);
  }
}
