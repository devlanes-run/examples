// Usage: npm run ios (as the ios service, macOS only). Builds and installs the development build
// in the iOS simulator and opens it on this lane's dev server, then runs until devlanes stops it.
import { iosEnv, lanePorts } from "./lib/env";
import { expo, log, onStop, output } from "./lib/process";

const APP_ID = "com.acme.exampleexpo";

const ports = lanePorts();
const ios = iosEnv();

async function main() {
  if (process.platform !== "darwin") throw new Error("the iOS simulator needs macOS and Xcode");
  // The simulator shares this Mac's loopback, so the app reaches both ports with no forwarding.
  // With --port, the Expo CLI finds the lane's dev server on that port and uses it.
  const device = ios.simulator ? ["--device", ios.simulator] : [];
  await expo(["run:ios", "--port", String(ports.metro), ...device]);
  log(`app opened in the simulator with the dev server at http://127.0.0.1:${ports.metro}`);
  onStop(() =>
    output("xcrun", ["simctl", "terminate", "booted", APP_ID]).then(
      () => undefined,
      () => undefined,
    ),
  );
  // The Simulator app owns the window, so this process only keeps the service up until a stop.
  setInterval(() => undefined, 60_000);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
