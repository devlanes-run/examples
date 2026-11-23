// Usage: npm run android (as the android service). Starts this lane's emulator, builds and
// installs the development build, points the device's loopback ports at this lane, and opens the
// app on this lane's dev server. Runs until the emulator closes.
import { type ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";
import { androidEnv, lanePorts } from "./lib/env";
import { exited, expo, log, onStop, output, poll } from "./lib/process";

const APP_ID = "com.acme.exampleexpo";
const SCHEME = "exampleexpo";
const exe = (name: string) => (process.platform === "win32" ? `${name}.exe` : name);

const ports = lanePorts();
const android = androidEnv();
const adbPath = join(android.sdk, "platform-tools", exe("adb"));
const emulatorPath = join(android.sdk, "emulator", exe("emulator"));
// adb names a local emulator after its console port, so the serial is known before it starts.
const serial = `emulator-${android.consolePort}`;
const adb = (...args: string[]) => output(adbPath, ["-s", serial, ...args]);

async function pickAvd(): Promise<string> {
  if (android.avd) return android.avd;
  const avds = (await output(emulatorPath, ["-list-avds"]))
    .split(/\r?\n/)
    .filter((l) => !l.includes(" "));
  if (!avds[0]) throw new Error("no Android virtual device; create one in Android Studio");
  return avds[0];
}

// -read-only lets every lane boot the same AVD at once, each as its own emulator.
function startEmulator(avd: string) {
  log(`starting ${avd} as ${serial}`);
  const args = ["-avd", avd, "-port", String(android.consolePort), "-read-only", "-no-boot-anim"];
  return spawn(emulatorPath, args, { stdio: "inherit" });
}

const booted = () => adb("shell", "getprop", "sys.boot_completed").then((v) => v === "1");

// adb reverse maps a port on this device to the same port on this machine. Each lane has its own
// ports and its own emulator, so the bundle's http://127.0.0.1:<port> URLs reach this lane only.
async function reversePorts() {
  for (const port of [ports.metro, ports.api]) await adb("reverse", `tcp:${port}`, `tcp:${port}`);
}

// The Expo CLI opens a --no-bundler build on port 8081 and reverses that port, which is not this
// lane's, so drop that mapping and open the app on this lane's port instead.
async function openApp() {
  await adb("reverse", "--remove", "tcp:8081").catch(() => undefined);
  const manifest = encodeURIComponent(`http://127.0.0.1:${ports.metro}`);
  const url = `${SCHEME}://?__expo_url=${manifest}`;
  await adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url, APP_ID);
}

let emulator: ChildProcess | null = null;

async function main() {
  emulator = startEmulator(await pickAvd());
  onStop(() => {
    emulator?.kill();
  });
  await poll(`${serial} to boot`, booted, 5 * 60_000);
  await expo(["run:android", "--no-bundler", "--device", serial], { ANDROID_HOME: android.sdk });
  await reversePorts();
  await openApp();
  log(`app opened on ${serial} with the dev server at http://127.0.0.1:${ports.metro}`);
  process.exit(await exited(emulator));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  emulator?.kill();
  process.exit(1);
});
