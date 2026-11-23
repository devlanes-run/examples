import { type ChildProcess, execFile, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";

// The Expo CLI runs through node itself, so Windows needs no shell for expo.cmd.
const expoCli = createRequire(import.meta.url).resolve("expo/bin/cli");

/** Prints a line of the script's own, which ready checks and `devlanes logs` see. */
export const log = (line: string) => console.log(`[devlanes-example] ${line}`);

/** Runs a command with the service's output and fails when it exits with an error. */
export function run(command: string, args: string[], env?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args[0]} exited with ${code}`)),
    );
  });
}

/** Runs the project's Expo CLI, such as `expo run:android`. */
export const expo = (args: string[], env?: Record<string, string>) =>
  run(process.execPath, [expoCli, ...args], env);

/** Runs a command and returns what it printed, giving up after `timeoutMs`. */
export function output(command: string, args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: timeoutMs }, (error, stdout) =>
      error ? reject(error) : resolve(stdout.trim()),
    );
  });
}

/** Calls `check` every two seconds until it returns true, failing after `timeoutMs`. */
export async function poll(what: string, check: () => Promise<boolean>, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;
    await sleep(2000);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/** Runs `cleanup` when devlanes stops the service, then exits. */
export function onStop(cleanup: () => Promise<void> | void) {
  const stop = () => {
    Promise.resolve(cleanup()).finally(() => process.exit(0));
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

/** Resolves with the exit code of a long-running child, such as the emulator. */
export const exited = (child: ChildProcess) =>
  new Promise<number>((resolve) => child.on("exit", (code) => resolve(code ?? 1)));
