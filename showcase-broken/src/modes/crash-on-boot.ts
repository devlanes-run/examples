/** Exits 1 before listening, as a server missing a required secret does. */
export function run(): void {
  console.error("crash-on-boot: ACME_API_KEY is not set, refusing to boot");
  // Leaving through exitCode instead of process.exit() lets the message reach the log first.
  process.exitCode = 1;
}
