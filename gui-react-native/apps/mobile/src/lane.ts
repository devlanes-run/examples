/** The lane values Metro's `/lane` and the API's `/lane` return. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** One delivery from the API's mock data. */
export type Order = {
  id: number;
  item: string;
  status: string;
};

/** The API's answer on `/`: its lane values plus the mock orders. */
export type ApiAnswer = LaneInfo & { orders: Order[] };
