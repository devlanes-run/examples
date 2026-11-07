import { env, type Mode } from "./env.js";
import { run as crashOnBoot } from "./modes/crash-on-boot.js";
import { run as crashRoute } from "./modes/crash-route.js";
import { run as index } from "./modes/index.js";
import { run as neverReady } from "./modes/never-ready.js";
import { run as proxyLoop } from "./modes/proxy-loop.js";
import { run as reset } from "./modes/reset.js";
import { run as upgrade } from "./modes/upgrade.js";
import { run as wrongPort } from "./modes/wrong-port.js";

const modes: Record<Mode, () => void> = {
  index,
  "crash-on-boot": crashOnBoot,
  "crash-route": crashRoute,
  "wrong-port": wrongPort,
  "never-ready": neverReady,
  "proxy-loop": proxyLoop,
  reset,
  upgrade,
};

modes[env.mode]();
