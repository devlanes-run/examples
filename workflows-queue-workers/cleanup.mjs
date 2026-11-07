import { connect, keys } from "./queue.mjs";

// Drops this lane's finished-job records. The waiting jobs and the workers'
// state stay, so it is safe to run while the workers consume.
const redis = await connect();
const removed = await redis.lLen(keys.done);
await redis.del(keys.done);
console.log(`cleanup removed ${removed} finished jobs from ${keys.done}`);
await redis.close();
