// Usage: npm run ios (as the ios service, macOS only). Builds the debug app, boots the iOS
// simulator, installs and opens the app on this lane's Metro, then follows the simulator's log so
// the service keeps running until it is stopped.
import { metroPort } from "./lib/env.mts";
import { log, reactNative } from "./lib/process.mts";

const port = metroPort();

async function main(): Promise<void> {
  // --no-packager: the lane's metro service is the packager; without it the CLI opens Metro in
  // a new terminal window. xcodebuild compiles RCT_METRO_PORT into the app.
  await reactNative(["run-ios", "--no-packager"]);
  log(`app opened in the simulator with Metro on port ${port}`);
  await reactNative(["log-ios"]);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
