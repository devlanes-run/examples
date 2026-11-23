// Usage: npm run android (as the android service). Starts this lane's emulator, builds and
// installs the development build, points the device's loopback ports at this lane, and opens the
// app on this lane's dev server. Runs until the emulator closes.
import { type ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { androidEnv, lanePorts } from "./lib/env";
import { exited, expo, log, onStop, output, poll } from "./lib/process";

const APP_ID = "com.acme.exampleexpo";
// The scheme expo-dev-client registers, exp+ and the slug in app.json.
const SCHEME = "exp+example-expo";
// What the Expo CLI adds when nobody is at its terminal: no dev menu button or menu on launch.
const DEV_MENU_OFF =
  "__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1";
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
// lane's, so drop that mapping and reopen the app on this lane's port, with the URL the Expo CLI
// itself builds for a development build.
async function openApp() {
  await adb("reverse", "--remove", "tcp:8081").catch(() => undefined);
  await adb("shell", "am", "force-stop", APP_ID);
  const manifest = encodeURIComponent(`http://127.0.0.1:${ports.metro}`);
  const url = `${SCHEME}://?__expo_url=${manifest}&${DEV_MENU_OFF}`;
  // adb shell runs the command through the device's shell, where & would end it.
  await adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", `'${url}'`, APP_ID);
}

let emulator: ChildProcess | null = null;

async function main() {
  const avd = await pickAvd();
  // A booting emulator registers with the running adb server; one started mid-boot misses it.
  await output(adbPath, ["start-server"]);
  emulator = startEmulator(avd);
  onStop(() => {
    emulator?.kill();
  });
  await poll(`${serial} to boot`, booted, 5 * 60_000);
  await expo(["run:android", "--no-bundler", "--device", serial], { ANDROID_HOME: android.sdk });
  await reversePorts();
  await openApp();
  log(`app opened on ${serial} with the dev server at http://127.0.0.1:${ports.metro}`);
  void keepPortsReversed();
  process.exit(await exited(emulator));
}

/** The id the adb server gave this emulator's connection, or null while it is not connected. */
async function transportId(): Promise<string | null> {
  const devices = await output(adbPath, ["devices", "-l"]).catch(() => "");
  const line = devices.split(/\r?\n/).find((l) => l.startsWith(`${serial} `));
  return line?.match(/transport_id:(\d+)/)?.[1] ?? null;
}

// Every lane shares one adb server, which belongs to the android service that started it.
// Stopping that service stops the server, and a new one does not carry the old mappings even
// though the emulator still lists them, so map the ports again whenever the connection changes.
async function keepPortsReversed() {
  let mapped = await transportId();
  for (;;) {
    await sleep(5000);
    const current = await transportId();
    if (current === mapped || current === null) continue;
    await reversePorts().then(
      () => {
        mapped = current;
        log(`ports mapped again on ${serial}`);
      },
      () => undefined,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  emulator?.kill();
  process.exit(1);
});
