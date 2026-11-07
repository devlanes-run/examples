/** Everything the worker reads from its environment, parsed once at startup. */
export const env = {
  // The defaults are lane 0 of the mprocs setup in before/.
  apiUrl: process.env.API_URL ?? "http://127.0.0.1:4000",
  smsUrl: process.env.SMS_URL ?? "http://127.0.0.1:4010",
  // Sent along with each message, so the stub shows which lane it came from.
  lane: process.env.DEVLANES_LANE ? Number(process.env.DEVLANES_LANE) : null,
};
