import { type ChildProcess, execFile, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";

// The React Native CLI runs through node itself, so Windows needs no shell for react-native.cmd.
// react-native/cli.js is not in react-native's exports, so this is the script it hands over to.
const cli = createRequire(import.meta.url).resolve("@react-native-community/cli/build/bin.js");

/** Prints a line of the script's own, which ready checks and `devlanes logs` see. */
export const log = (line: string) => console.log(`[devlanes-example] ${line}`);

/** Runs a React Native CLI command with the service's output and fails when it fails. */
export function reactNative(args: string[], env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`react-native ${args[0]} exited with ${code}`)),
    );
  });
}

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

/** Resolves with the exit code of a long-running child, such as the emulator. */
export const exited = (child: ChildProcess) =>
  new Promise<number>((resolve) => child.on("exit", (code) => resolve(code ?? 1)));
