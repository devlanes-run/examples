# React Native app per lane

A bare React Native app, its Metro bundler and a small [Hono](https://hono.dev) API, all in one lane. Each lane's Metro gets its own port, and the app built in a lane loads its bundle and calls the API through that port, so the apps of two worktrees run side by side on one emulator. The app also has a few small screens to test window streaming with: a text field, a modal and a long list on a second screen.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.18 or later
- For the `android` service: JDK 17 and the Android SDK with platform tools, the emulator and an Android virtual device, or a USB device with debugging on, as in [React Native's environment guide](https://reactnative.dev/docs/set-up-your-environment). Set `ANDROID_HOME` in the shell you start devlanes from; the React Native CLI finds `adb` and `emulator` under it.
- For the `ios` service: macOS with Xcode, an iOS simulator runtime and CocoaPods. The first build runs `pod install`.

`api` and `metro` need only Node.

## Run it

```sh
cd gui-react-native
devlanes start
devlanes start android # or: devlanes start ios
```

`devlanes start` runs `api` and `metro`. The services that build the app need a device, so they start only by name. With an emulator running or a device plugged in, `devlanes start android` builds the debug app, installs it and opens it; when nothing is connected, the CLI boots the first emulator that `emulator -list-avds` lists. `devlanes start ios` builds for the iOS simulator and boots it.

The app's home screen says `This is lane 0 of example-react-native.` and shows the lane card for `metro`, the API's mock orders and the test surfaces. https://metro.example-react-native.localhost/lane returns Metro's lane values as JSON, and https://api.example-react-native.localhost/ the API's.

## During a start

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs `apps/api` and `apps/mobile`.
2. `api` runs `tsx watch src/index.ts` and counts as ready once `/healthz` answers. It serves https://api.example-react-native.localhost.
3. `metro` runs `react-native start --host 127.0.0.1` on the port in `RCT_METRO_PORT`, which `devlanes.yaml` sets to the service's own port. It counts as ready once Metro's `/status` answers. Besides the bundles, it serves `/healthz`, `/lane` and `/api/`, added in [`metro.config.mts`](apps/mobile/metro.config.mts). It serves https://metro.example-react-native.localhost.
4. `android` and `ios` stay idle until started by name.

## One port per lane

The app reaches its lane through Metro's port only:

- `android` and `ios` get `RCT_METRO_PORT: ${{ services.metro.port }}`. The React Native CLI passes it to Gradle or `xcodebuild`, which build it into the app as the dev server port, and on Android it runs `adb reverse` for that port.
- The app calls `/api/` on the Metro origin it loaded its bundle from. Metro forwards the call to `${{ services.api.url }}`, the API's `http://127.0.0.1` address. Emulators and simulators do not trust the devlanes CA, so the app never calls the HTTPS hostname.
- On Android, each lane's build gets its own application id, `com.acmelanes.lane<N>`, so two lanes install two apps on one device instead of replacing each other. On iOS both lanes build the same bundle id, so a second lane's build replaces the first one's app on a simulator.

Lanes have different Metro ports, so an app built in lane 1 cannot load lane 0's bundle or reach lane 0's API.

The look comes from `_internal/brand/devlanes.css` and `_internal/brand/logo.svg`. A native app cannot load a stylesheet or an SVG file, so [`src/theme.ts`](apps/mobile/src/theme.ts) repeats the colours and [`src/components/Logo.tsx`](apps/mobile/src/components/Logo.tsx) draws the logo with views. Text uses the system fonts.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/gui-react-native && devlanes start && devlanes start android`. The emulator gets a second app, `com.acmelanes.lane1`, which loads from lane 1's Metro and says `This is lane 1 of example-react-native.` To stay in this folder instead, run `devlanes lane new --name example-react-native-review --start`.
- `devlanes stop api`, then reload the app (press `r` after `devlanes attach metro`). The API card shows the error Metro returns. `curl -sS https://metro.example-react-native.localhost/api/` gets the same 502, `api at http://127.0.0.1:<port> unreachable: connect ECONNREFUSED`, with the API's port (on Windows, add `--ssl-revoke-best-effort` to `curl`). `devlanes start api` brings the API back.
- Edit the heading in `apps/mobile/src/screens/HomeScreen.tsx` and save. Fast Refresh updates the app on the device without a rebuild.
- `devlanes stop android` stops the build or the log it follows; the app stays installed.
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` from the second worktree, or with `example-react-native-review` for the lane from `lane new`.

## Files

- [`devlanes.yaml`](devlanes.yaml): `api`, `metro` with `RCT_METRO_PORT` and `API_URL`, and the on-demand `android` and `ios` services.
- [`apps/api/src/`](apps/api/src): the Hono API.
- [`apps/mobile/metro.config.mts`](apps/mobile/metro.config.mts) and [`apps/mobile/devserver/`](apps/mobile/devserver): Metro's settings for the npm workspace and its lane routes.
- [`apps/mobile/scripts/device.mts`](apps/mobile/scripts/device.mts): what `android` and `ios` run.
- [`apps/mobile/src/`](apps/mobile/src): the app. `api.ts` makes the calls, `screens/` holds the two screens.

## Docs

- [Start a service only on demand](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/on-demand.md)
- [Ports](https://github.com/devlanes-run/devlanes/blob/main/docs/concepts/ports.md)
- [Environment and expressions](https://github.com/devlanes-run/devlanes/blob/main/docs/concepts/environment.md)
- [Limits](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/limits.md)
