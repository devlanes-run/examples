import { env } from "./env.js";

/** One failure the index page lists: where to see it and the command that triggers it. */
export type Failure = {
  /** The service that fails, or what fails when no service is involved. */
  service: string;
  /** The error devlanes reports, such as a proxy error page. */
  error: string;
  /** The page to open, or null when the failure only shows in the terminal. */
  url: string | null;
  description: string;
  command: string;
};

// Full unit references, so the commands work from any folder and for every lane of one folder.
function unit(service: string): string {
  return `${env.project}@${env.lane}:${service}`;
}

function site(service: string, path = "/"): string {
  return `https://${service}.${env.domain}${path}`;
}

/** Every failure this lane can show, in the order the README walks through them. */
export function failures(): Failure[] {
  return [
    {
      service: "crash-on-boot",
      error: "DL203 service-failed",
      url: site("crash-on-boot"),
      description:
        "Exits 1 before it listens. The start fails, the unit stays failed and is not restarted, and the page shows the end of its output.",
      command: `devlanes start ${unit("crash-on-boot")}`,
    },
    {
      service: "crash-route",
      error: "DL203 service-failed",
      url: site("crash-route", "/crash"),
      description: "A healthy server whose /crash route kills the process a second later.",
      command: `devlanes start ${unit("crash-route")}`,
    },
    {
      service: "crash-route",
      error: "DL201 service-idle",
      url: site("crash-route"),
      description: "A stopped service, or one that was never started.",
      command: `devlanes stop ${unit("crash-route")}`,
    },
    {
      service: "reset",
      error: "DL302 upstream-failed",
      url: site("reset"),
      description: "Closes the connection without an answer.",
      command: `devlanes start ${unit("reset")}`,
    },
    {
      service: "upgrade",
      error: "DL303 unexpected-upgrade",
      url: site("upgrade"),
      description: "Answers a plain GET with 101 Switching Protocols.",
      command: `devlanes start ${unit("upgrade")}`,
    },
    {
      service: "missing-program",
      error: "command not found on PATH",
      url: null,
      description:
        "Its run names a program that is not installed, so the start fails before a process exists.",
      command: `devlanes start ${unit("missing-program")}`,
    },
    {
      service: "wrong-port",
      error: "DL301 upstream-unreachable",
      url: site("wrong-port"),
      description:
        "Listens on a port of its own choosing. With ready: started it still counts as ready.",
      command: `devlanes start ${unit("wrong-port")}`,
    },
    {
      service: "never-ready",
      error: "DL202 service-starting, then DL203",
      url: site("never-ready"),
      description:
        "Its /healthz never passes. Requests wait 30 seconds for it; after the 45 second ready timeout the unit fails.",
      command: `devlanes start ${unit("never-ready")}`,
    },
    {
      service: "proxy-loop",
      error: "DL104 proxy-loop",
      url: site("proxy-loop"),
      description: "Sends every request back to its own public URL with the original Host header.",
      command: `devlanes start ${unit("proxy-loop")}`,
    },
    {
      service: "(no service)",
      error: "DL101 unknown-host",
      url: `http://nothing.${env.domain}/`,
      description:
        "No lane routes the hostname. Use http://, since HTTPS fails on the certificate first.",
      command: `curl http://nothing.${env.domain}/`,
    },
    {
      service: "(config)",
      error: "unknown key",
      url: null,
      description: "devlanes.broken.yaml has a typo in a key, and config check points at its line.",
      command: "devlanes --file devlanes.broken.yaml config check",
    },
  ];
}
