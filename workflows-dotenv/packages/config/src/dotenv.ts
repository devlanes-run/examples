import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/** The `.env` file devlanes reads for a lane, and which worktree it came from. */
export type DotenvFile = {
  path: string;
  from: "this worktree" | "the primary worktree";
};

/** The folders `findDotenv` needs: the project file's and both worktree roots. */
export type DotenvPaths = {
  projectDir: string;
  lanePath: string;
  primaryPath: string;
};

/** What reached a process under one `.env` key. Secret values never leave this module. */
export type DotenvKey =
  | { key: string; state: "missing" | "empty" | "masked" }
  | { key: string; state: "set"; value: string };

const KEY_LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
const SECRET_KEY = /TOKEN|SECRET|PASSWORD|DSN|KEY/;

/**
 * Finds the `.env` next to `devlanes.yaml` in this worktree or, since Git does not copy ignored
 * files into a new worktree, the primary worktree's copy, which devlanes falls back to as well.
 */
export function findDotenv({ projectDir, lanePath, primaryPath }: DotenvPaths): DotenvFile | null {
  const own = join(projectDir, ".env");
  if (existsSync(own)) return { path: own, from: "this worktree" };
  // The project file can sit in a subfolder of the worktree, as it does in this repository.
  const primary = join(primaryPath, relative(lanePath, projectDir), ".env");
  if (existsSync(primary)) return { path: primary, from: "the primary worktree" };
  return null;
}

/** Each key named in the `.env` file, with what `vars` (a process environment) has for it. */
export function dotenvSummary(
  file: DotenvFile,
  vars: Readonly<Record<string, string | undefined>>,
): DotenvKey[] {
  return dotenvKeys(readFileSync(file.path, "utf8")).map((key) => {
    const value = vars[key];
    if (value === undefined) return { key, state: "missing" };
    if (value === "") return { key, state: "empty" };
    if (SECRET_KEY.test(key)) return { key, state: "masked" };
    return { key, state: "set", value };
  });
}

// Only the names: the values the process got come from devlanes, not from this file.
function dotenvKeys(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => KEY_LINE.exec(line)?.[1])
    .filter((key): key is string => key !== undefined);
}
