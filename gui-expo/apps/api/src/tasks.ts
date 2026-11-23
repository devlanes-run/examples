/** One release task in the mock checklist. */
export type Task = {
  id: number;
  title: string;
  done: boolean;
};

/** The mock checklist every lane's API serves to the app. */
export const tasks: Task[] = [
  { id: 1, title: "Build the Android development client", done: true },
  { id: 2, title: "Open the app in the iOS simulator", done: false },
  { id: 3, title: "Check the web target in a browser", done: true },
];
