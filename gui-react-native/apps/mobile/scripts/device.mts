// Builds the app, installs and launches it on a device, then follows the device log, so the
// service keeps running until it is stopped. An emulator the CLI had to boot stays a child of
// this process.
//
// Usage: node scripts/device.mts <android|ios>
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

type Platform = "android" | "ios";

/** Reads a variable devlanes sets, failing early with a hint when the script runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

const env = {
  // Read again by the React Native CLI, which builds it into the app as the dev server port.
  // Checked here because the CLI would fall back to 8081, another lane's port or none at all.
  metroPort: Number(required("RCT_METRO_PORT")),
  lane: Number(required("DEVLANES_LANE")),
};

const cli = createRequire(import.meta.url).resolve("react-native/cli.js");

function parsePlatform(value: string | undefined): Platform {
  if (value === "android" || value === "ios") {
    return value;
  }
  throw new Error("usage: node scripts/device.mts <android|ios>");
}

// --no-packager: the lane's metro service is the packager; without it the CLI opens Metro in
// a new terminal window. Android gets a per-lane application id, matched by --appIdSuffix so
// the CLI launches the app it just installed.
function installArgs(platform: Platform): string[] {
  if (platform === "ios") {
    return ["run-ios", "--no-packager"];
  }
  const suffix = `lane${env.lane}`;
  return [
    "run-android",
    "--no-packager",
    "--appIdSuffix",
    suffix,
    "--extra-params",
    `-PlaneAppIdSuffix=${suffix}`,
  ];
}

/** Runs one React Native CLI command with this terminal and resolves with its exit code. */
function runCli(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  const platform = parsePlatform(process.argv[2]);
  console.log(`${platform}: building for the Metro server on port ${env.metroPort}`);
  const installed = await runCli(installArgs(platform));
  if (installed !== 0) {
    process.exit(installed);
  }
  process.exit(await runCli([`log-${platform}`]));
}

await main();
