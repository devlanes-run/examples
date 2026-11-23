/** One note in the mock notebook. */
export type Note = {
  id: number;
  title: string;
  updated: string;
};

/** The mock notebook every lane's API serves to its desktop app. */
export const notes: Note[] = [
  { id: 1, title: "Order more anvils", updated: "2026-11-02" },
  { id: 2, title: "Test the rocket skates on a slope", updated: "2026-11-09" },
  { id: 3, title: "Return the giant magnet", updated: "2026-11-16" },
];
