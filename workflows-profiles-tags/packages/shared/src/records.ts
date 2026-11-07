import type { LaneInfo } from "./lane.js";

/** What every API record has: an id and the name the pages list. */
export type Item = {
  id: number;
  name: string;
};

/** What an API answers on `/`: its lane values, the file it reads and the records in it. */
export type ApiIndex = LaneInfo & {
  data_file: string;
  records: string;
  items: Item[];
};

/** The id for a new record, one above the highest stored one. */
export function nextId(items: Item[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}
