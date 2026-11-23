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

/** The ports of this lane's dev server and API, which the app on the device has to reach. */
export function lanePorts() {
  return { metro: Number(required("METRO_PORT")), api: Number(required("API_PORT")) };
}

// Where Android Studio installs the SDK when ANDROID_HOME is not set, as the Expo CLI looks for it.
const DEFAULT_SDK: Partial<Record<NodeJS.Platform, string>> = {
  darwin: join(homedir(), "Library", "Android", "sdk"),
  linux: join(homedir(), "Android", "Sdk"),
  win32: join(homedir(), "AppData", "Local", "Android", "Sdk"),
};

/** What the android service reads: the SDK, the emulator to start and its console port. */
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

/** What the ios service reads: the simulator to use, by name or UDID, if not Expo's default. */
export function iosEnv() {
  return { simulator: process.env.IOS_SIMULATOR || null };
}
