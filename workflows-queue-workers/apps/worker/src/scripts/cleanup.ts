import { connectQueue } from "@queue-workers/queue";
import { scriptEnv } from "./env.js";

// Drops this lane's finished-job records. Waiting jobs and the workers' state stay, so it is safe
// to run while the workers take jobs.
const queue = await connectQueue({ url: scriptEnv.redisUrl, prefix: scriptEnv.queuePrefix });
const removed = await queue.cleanup();
console.log(`cleanup removed ${removed} finished jobs from ${queue.keys.done}`);
await queue.close();
