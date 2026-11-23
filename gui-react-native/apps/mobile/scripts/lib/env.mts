import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Reads a variable devlanes.yaml sets, failing with a hint when the script runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

// Where Android Studio installs the SDK when ANDROID_HOME is not set.
const DEFAULT_SDK: Partial<Record<NodeJS.Platform, string>> = {
  darwin: join(homedir(), "Library", "Android", "sdk"),
  linux: join(homedir(), "Android", "Sdk"),
  win32: join(homedir(), "AppData", "Local", "Android", "Sdk"),
};

/** The lane's Metro port. The React Native CLI reads it too and builds it into the app. */
export function metroPort(): number {
  return Number(required("RCT_METRO_PORT"));
}

/** What the android service reads: the SDK, the virtual device to boot and its console port. */
export function androidEnv() {
  const sdk = process.env.ANDROID_HOME || DEFAULT_SDK[process.platform];
  if (!sdk || !existsSync(sdk)) {
    throw new Error(`no Android SDK at ${sdk ?? "(none)"}; set ANDROID_HOME before devlanes start`);
  }
  return {
    sdk,
    avd: process.env.ANDROID_AVD || null,
    consolePort: Number(required("EMULATOR_PORT")),
  };
}
