/** Every service in devlanes.yaml except the index, with the ready check it uses there. */
export const checks = [
  {
    service: "http-check",
    check: "ready.http",
    about: "Ready once GET /healthz on its port answers 2xx.",
  },
  {
    service: "tcp-check",
    check: "ready.tcp",
    about: "Ready once its port accepts a TCP connection. The app is never asked anything.",
  },
  {
    service: "log-check",
    check: "ready.log",
    about: 'Waits 3 s, then ready once it prints a line matching "listening on http://".',
  },
  {
    service: "own-host",
    check: "ready.http.host",
    about: "Answers only Host: its own hostname, so the check sends that Host header.",
  },
  {
    service: "own-host-cmd",
    check: "ready.cmd",
    about: "The same app, checked by curl with a Host header instead.",
  },
  {
    service: "legacy-host",
    check: "host_header: upstream",
    about: "Answers only Host: 127.0.0.1:<port>, so the proxy sends that instead of the hostname.",
  },
  {
    service: "slow-start",
    check: "ready.http",
    about: "Sleeps 8 s before it listens, so the start shows it starting.",
  },
] as const;

/** A service the index links to. */
export type CheckedService = (typeof checks)[number]["service"];

/** The entry for one service, or undefined for the index. */
export function checkFor(service: string) {
  return checks.find((entry) => entry.service === service);
}
