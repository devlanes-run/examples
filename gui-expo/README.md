# Expo app on an emulator or simulator

An [Expo](https://expo.dev) app with Expo Router and a small [Hono](https://hono.dev) API, both run by each lane. The Expo dev server gets its port from devlanes and also serves the app as a web page, and on-demand services open the app as a development build on an Android emulator or the iOS simulator, where it talks to the dev server and the API of its own lane.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.18 or later
- For `android`: the Android SDK with `platform-tools` and `emulator`, at `ANDROID_HOME` or where Android Studio puts it, at least one virtual device (AVD) created in Android Studio, and JDK 17 or later for the Gradle build. On Windows, also the SDK's CMake 3.31.6 package and the Gradle property `android.cmakeVersion=3.31.6`, for example in `%USERPROFILE%\.gradle\gradle.properties`: the default CMake's Ninja fails on the long paths of the native build ([Expo's guide](https://docs.expo.dev/troubleshooting/windows-long-paths/)).
- For `ios`: a Mac with Xcode, an iOS simulator runtime and CocoaPods. The `ios` service needs macOS and has not been run yet; the web page and `android` were checked on Windows 11.

The web page needs neither.

## Run it

```sh
cd gui-expo
devlanes start
```

Open https://example-expo.localhost. The page says `This is lane 0 of example-expo.`, lists the lane, branch, service, port and URL of the `expo` service, and shows what https://api.example-expo.localhost answered. Then open the app on a device:

```sh
devlanes start android # or, on a Mac: devlanes start ios
```

## During a start

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs `apps/api` and `apps/mobile`.
2. `api` runs `tsx watch src/index.ts` on its `PORT`, is ready once `/healthz` answers, and serves https://api.example-expo.localhost.
3. `expo` runs `expo start --localhost`, which starts Metro on `127.0.0.1` at the port in `RCT_METRO_PORT`. It is ready once Metro's `/status` answers, and serves the web target at https://example-expo.localhost. With `pty: false` the Expo CLI sees no terminal, so it neither prompts nor opens a browser.

`android` and `ios` have `autostart: false`, so they stay stopped until you start them by name.

## Opening the app on a device

`devlanes start android` runs [`scripts/android.ts`](apps/mobile/scripts/android.ts):

1. It starts the adb server if none runs, then the emulator, with the AVD in `ANDROID_AVD` or the first one `emulator -list-avds` prints, on the console port in `EMULATOR_PORT`. The emulator window belongs to the service, and `devlanes stop android` closes it.
2. Once Android has booted, `expo run:android --no-bundler` builds the development build with Gradle and installs it. The first build takes several minutes, which the ready check's `timeout: 20m` allows for.
3. `adb reverse` maps the dev server's port and the API's port on the emulator to the same ports on your machine.
4. It opens the app on `http://127.0.0.1:<expo port>`, with the dev menu closed, and prints `app opened on emulator-5554 with the dev server at http://127.0.0.1:<expo port>`, which the ready check waits for.
5. It runs until the emulator closes, and maps the ports again whenever the emulator's adb connection changes.

The second step writes thousands of files into `node_modules/*/android`. [`metro.config.ts`](apps/mobile/metro.config.ts) keeps Metro from watching them, so the dev server keeps answering during the build.

`devlanes start ios` (macOS only, not run yet) runs [`scripts/ios.ts`](apps/mobile/scripts/ios.ts), which calls `expo run:ios --port <expo port>`. The Expo CLI finds the lane's dev server on that port and uses it, builds with Xcode, boots the simulator in `IOS_SIMULATOR` (a name or UDID) or its default one, and opens the app. The simulator window belongs to the Simulator app, not to the service.

## Reaching the lane from a device

The dev server bakes the lane's values into the bundle it sends, from the `EXPO_PUBLIC_*` variables in `devlanes.yaml`. On a device the app calls `services.api.url`, which is `http://127.0.0.1:<api port>`, and not the HTTPS hostname: emulators and simulators do not trust the devlanes CA. The web page calls `services.api.public_url` instead, and the API allows it through CORS with `DEVLANES_ORIGINS`.

`127.0.0.1` on the iOS simulator is your Mac, so both ports work as they are. On Android it is the emulator itself, so `adb reverse` maps each port to the same number on your machine. Every lane has its own ports and its own emulator, on console port `5554 + 2 * (lane index % 16)`, so lane 1's emulator `emulator-5556` reaches lane 1 only. The emulator's `10.0.2.2` alias would also reach your machine, but it needs a different URL per platform and does not work on a phone connected over USB.

The emulators of all lanes share one adb server, which belongs to the `android` service that started it. Stopping that service stops the server; the other lanes' `android` services start a new one and map their ports again. Their apps keep their screen, but Fast Refresh comes back only after a reload: type `R` twice in the emulator window.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/gui-expo && devlanes start`. To stay in this folder instead, run `devlanes lane new --name example-expo-review --start`. https://example-expo1.localhost says `This is lane 1 of example-expo.` and shows lane 1's API with another port.
- `devlanes start android` in both lanes boots two emulators, `emulator-5554` and `emulator-5556`, each showing its own lane. They can use the same AVD because the script starts it with `-read-only`.
- Edit the heading of the "Things to click" section in `apps/mobile/src/app/index.tsx` and save. The app on the emulator shows it at once through Fast Refresh, and the next load of https://example-expo.localhost shows it too.
- In the emulator, type in the text field and the echo card below repeats it. `Open a modal` shows the lane over a dimmed screen, and `Open a long list` goes to a second screen with a thousand rows to scroll.
- `devlanes stop expo` and reload the web page: the proxy answers with its `Service not running` page (503, `DL201 service-idle`).
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `example-expo-review` for the lane from `lane new`, or with `1` from the second worktree.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `install` task, `api`, `expo` with the values the bundle gets, and the on-demand `android` and `ios`.
- [`apps/mobile/src/app/`](apps/mobile/src/app): the Expo Router screens. `index.tsx` has the lane card, the API's answer, a text field and a modal; `rows.tsx` is a list of a thousand rows.
- [`apps/mobile/src/theme.ts`](apps/mobile/src/theme.ts): the colours of [`_internal/brand/devlanes.css`](../_internal/brand/devlanes.css), copied because a native UI cannot load CSS.
- [`apps/mobile/scripts/`](apps/mobile/scripts): what `android` and `ios` run.
- [`apps/mobile/metro.config.ts`](apps/mobile/metro.config.ts): Expo's Metro config, minus the native build folders.
- [`apps/api/src/`](apps/api/src): the Hono API.

## Docs

- [Start a service only on demand](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/on-demand.md)
- [Wait until a service is ready](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ready-checks.md)
- [Limits](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/limits.md)
