// Usage: npm run android (as the android service). Boots this lane's emulator as a child of the
// service, builds and installs the debug app on it and opens it on this lane's Metro. Runs until
// the emulator closes, so stopping the service closes the emulator.
import { type ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";
import { androidEnv, metroPort } from "./lib/env.mts";
import { exited, log, output, poll, reactNative } from "./lib/process.mts";

const exe = (name: string) => (process.platform === "win32" ? `${name}.exe` : name);

const port = metroPort();
const android = androidEnv();
const adbPath = join(android.sdk, "platform-tools", exe("adb"));
const emulatorPath = join(android.sdk, "emulator", exe("emulator"));
// adb names a local emulator after its console port, so the serial is known before it starts.
const serial = `emulator-${android.consolePort}`;
const adb = (...args: string[]) => output(adbPath, ["-s", serial, ...args]);

let emulator: ChildProcess | null = null;

async function pickAvd(): Promise<string> {
  if (android.avd) return android.avd;
  const avds = (await output(emulatorPath, ["-list-avds"]))
    .split(/\r?\n/)
    .filter((line) => line && !line.includes(" "));
  if (!avds[0]) throw new Error("no Android virtual device; create one in Android Studio");
  return avds[0];
}

// -read-only lets every lane boot the same virtual device at once, each as its own emulator.
function startEmulator(avd: string): ChildProcess {
  log(`starting ${avd} as ${serial}`);
  const args = ["-avd", avd, "-port", String(android.consolePort), "-read-only", "-no-boot-anim"];
  return spawn(emulatorPath, args, { stdio: "inherit" });
}

const booted = () => adb("shell", "getprop", "sys.boot_completed").then((value) => value === "1");

function stopEmulator(): void {
  emulator?.kill();
}

async function main(): Promise<void> {
  const avd = await pickAvd();
  // An emulator registers with the adb server running when it boots; one started later misses it.
  await output(adbPath, ["start-server"]);
  emulator = startEmulator(avd);
  process.once("SIGINT", () => process.exit(0));
  process.once("SIGTERM", () => process.exit(0));
  process.once("exit", stopEmulator);
  await poll(`${serial} to boot`, booted, 5 * 60_000);
  // The CLI passes RCT_METRO_PORT to Gradle as the app's dev server port, runs
  // adb reverse for that port on this serial only, installs the app and opens it.
  // --active-arch-only builds the native code for the emulator's CPU only.
  await reactNative(["run-android", "--no-packager", "--device", serial, "--active-arch-only"], {
    ANDROID_HOME: android.sdk,
  });
  log(`app opened on ${serial} with Metro on port ${port}`);
  process.exit(await exited(emulator));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
