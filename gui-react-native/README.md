# React Native app per lane

A bare React Native app, its Metro bundler and a small [Hono](https://hono.dev) API, all in one lane. Each lane's Metro gets its own port, and each lane boots its own Android emulator with the app built against that port, so two worktrees run their apps side by side. The app also has a few small screens to test window streaming with: a text field, a modal and a long list on a second screen.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.18 or later
- For the `android` service: a JDK, 17 or later, and the Android SDK with platform tools, the emulator and at least one Android virtual device, as in [React Native's environment guide](https://reactnative.dev/docs/set-up-your-environment). The service finds the SDK at `ANDROID_HOME`, or where Android Studio installs it. On Windows, also the SDK's CMake 3.31.6 package and the Gradle property `android.cmakeVersion=3.31.6`, for example in `%USERPROFILE%\.gradle\gradle.properties`: the Ninja of the default CMake 3.22.1 fails on the long paths of the native build.
- For the `ios` service: macOS with Xcode, an iOS simulator runtime and CocoaPods. The first build runs `pod install`. The `ios` service needs macOS and has not been run; everything else here was checked on Windows 11.

`api` and `metro` need only Node.

## Run it

```sh
cd gui-react-native
devlanes start
devlanes start android --timeout 20m # or, on a Mac: devlanes start ios --timeout 20m
```

`devlanes start` runs `api` and `metro`. The services that open the app start only by name. The first Gradle build takes several minutes, longer than the 180 seconds `devlanes start` waits by default, hence `--timeout`.

The app's home screen says `This is lane 0 of example-react-native.` and shows the lane card for `metro`, the API's mock orders and the test surfaces. https://metro.example-react-native.localhost/lane returns Metro's lane values as JSON, and https://api.example-react-native.localhost/ the API's.

## During a start

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs `apps/api` and `apps/mobile`.
2. `api` runs `tsx watch src/index.ts` and counts as ready once `/healthz` answers. It serves https://api.example-react-native.localhost.
3. `metro` runs `react-native start --host 127.0.0.1` on the port in `RCT_METRO_PORT`, which `devlanes.yaml` sets to the service's own port. It counts as ready once Metro's `/status` answers. Besides the bundles, it serves `/healthz`, `/lane` and `/api/`, added in [`metro.config.mts`](apps/mobile/metro.config.mts). It serves https://metro.example-react-native.localhost.
4. `android` and `ios` stay idle until started by name.

## Opening the app on Android

`devlanes start android` runs [`scripts/android.mts`](apps/mobile/scripts/android.mts):

1. It starts the adb server if none runs, then the emulator, with the virtual device in `ANDROID_AVD` or the first one `emulator -list-avds` prints, on console port `5554 + 2 * (lane index % 16)`. The emulator is a child of the service, and `devlanes stop android` closes its window.
2. Once Android has booted, `react-native run-android --no-packager` builds the debug app with Gradle for the emulator's CPU only, installs it on that emulator and opens it.
3. It prints `app opened on emulator-5554 with Metro on port <port>`, which the ready check waits for, and runs until the emulator closes.

Gradle writes thousands of files into `node_modules/*/android` during the build, and `metro.config.mts` keeps Metro from watching them.

The emulators of all lanes share one adb server, which belongs to the `android` service that started it, so stopping that service stops the server and the Gradle daemon. The other lanes' emulators and apps keep running, because the app reaches Metro through the emulator's `10.0.2.2` alias rather than through adb.

`devlanes start ios` (macOS only, not run yet) runs [`scripts/ios.mts`](apps/mobile/scripts/ios.mts): `react-native run-ios --no-packager` builds the app, boots the simulator, opens the app and then follows the simulator's log. The Simulator app opens its own window, outside the service.

## One port per lane

The app reaches its lane through Metro's port only:

- `android` and `ios` get `RCT_METRO_PORT: ${{ services.metro.port }}`. The React Native CLI passes it to Gradle or `xcodebuild`, which build it into the app as the dev server port. The emulator reaches it at `http://10.0.2.2:<port>`, its alias for your machine's `127.0.0.1`; the iOS simulator shares your Mac's loopback.
- The app calls `/api/` on the Metro origin it loaded its bundle from. Metro forwards the call to `${{ services.api.url }}`, the API's `http://127.0.0.1` address. Emulators and simulators do not trust the devlanes CA, so the app never calls the HTTPS hostname.
- Each lane boots its own emulator, so two lanes never install over each other's app. On iOS both lanes use the same simulator and bundle id, so a second lane's build replaces the first one's app.

Lanes have different Metro ports, so an app built in lane 1 cannot load lane 0's bundle or reach lane 0's API.

The look comes from `_internal/brand/devlanes.css` and `_internal/brand/logo.svg`. A native app cannot load a stylesheet or an SVG file, so [`src/theme.ts`](apps/mobile/src/theme.ts) repeats the colours and [`src/components/Logo.tsx`](apps/mobile/src/components/Logo.tsx) draws the logo with views. Text uses the system fonts.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/gui-react-native && devlanes start && devlanes start android --timeout 20m`. To stay in this folder instead, run `devlanes lane new --name example-react-native-review --start`, then `devlanes start 1:android --timeout 20m` with that lane's number. A second emulator, `emulator-5556`, opens next to the first and its app says `This is lane 1 of example-react-native.`, with lane 1's Metro and API ports.
- In the emulator, type in the text field and the line below repeats it. `Open a modal` shows the lane over a dimmed screen, and `Scroll 1,000 rows` goes to a second screen with a thousand rows.
- `devlanes stop api`, then type `R` twice in the emulator to reload the app. The API card shows the 502 Metro returns, `api at http://127.0.0.1:<port> unreachable: connect ECONNREFUSED`. `devlanes start api` and another reload bring the orders back.
- Edit the heading `The lane's API` in `apps/mobile/src/screens/HomeScreen.tsx` and save. Fast Refresh updates the app on the emulator without a rebuild, and the text field keeps what you typed.
- `devlanes stop android` closes the lane's emulator.
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` from the second worktree, or with `example-react-native-review` for the lane from `lane new`.

## Files

- [`devlanes.yaml`](devlanes.yaml): `api`, `metro` with `RCT_METRO_PORT` and `API_URL`, and the on-demand `android` and `ios` services.
- [`apps/api/src/`](apps/api/src): the Hono API.
- [`apps/mobile/metro.config.mts`](apps/mobile/metro.config.mts) and [`apps/mobile/devserver/`](apps/mobile/devserver): Metro's settings for the npm workspace and its lane routes.
- [`apps/mobile/scripts/`](apps/mobile/scripts): what `android` and `ios` run.
- [`apps/mobile/android/build.gradle`](apps/mobile/android/build.gradle): the `android.cmakeVersion` property.
- [`apps/mobile/src/`](apps/mobile/src): the app. `api.ts` makes the calls, `screens/` holds the two screens.

## Docs

- [Start a service only on demand](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/on-demand.md)
- [Wait until a service is ready](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ready-checks.md)
- [Environment and expressions](https://github.com/devlanes-run/devlanes/blob/main/docs/concepts/environment.md)
- [Limits](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/limits.md)
