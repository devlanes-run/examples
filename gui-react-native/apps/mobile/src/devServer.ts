import { TurboModuleRegistry, type TurboModule } from "react-native";

interface SourceCode extends TurboModule {
  getConstants(): { scriptURL: string };
}

/**
 * The origin of the Metro server this bundle came from, such as `http://10.0.2.2:20581` on the
 * Android emulator or `http://localhost:20581` on a device behind adb reverse. Its port is the
 * lane's, built into the app, so calls to it stay in the lane.
 */
export function devServerOrigin(): string {
  const scriptURL = TurboModuleRegistry.get<SourceCode>("SourceCode")?.getConstants().scriptURL;
  const origin = scriptURL?.match(/^https?:\/\/[^/]+/)?.[0];
  if (!origin) {
    throw new Error("this build did not load its bundle from Metro; start it with devlanes start");
  }
  return origin;
}
