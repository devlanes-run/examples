import nodemailer from "nodemailer";
import { createClient } from "redis";

const env = process.env;
const redisDb = new URL(env.REDIS_URL).pathname.slice(1);
const mail = nodemailer.createTransport(env.SMTP_URL);
const clock = () => new Date().toTimeString().slice(0, 8);

const redis = createClient({ url: env.REDIS_URL });
redis.on("error", (err) => console.error(`redis: ${err.message}`));
await redis.connect();
// BRPOP blocks its connection, so the writes go through a second one.
const queue = redis.duplicate();
queue.on("error", (err) => console.error(`redis: ${err.message}`));
await queue.connect();

await mail.verify();
console.log(`connected to redis (db ${redisDb}) and smtp (${new URL(env.SMTP_URL).host})`);
// The ready check waits for this line.
console.log(`worker ready: waiting for jobs on mail:queue`);

for (;;) {
  // Blocks without using CPU until a job arrives, so an idle lane can freeze.
  const item = await queue.brPop("mail:queue", 0);
  const job = JSON.parse(item.element);
  const started = performance.now();
  try {
    const info = await mail.sendMail({
      from: `worker@${env.LANE_DOMAIN}`,
      to: job.to,
      subject: job.subject,
      text: `Queued by api at ${job.queued_at}, sent by the worker of lane ${env.DEVLANES_LANE} (${env.LANE_LABEL}).`,
    });
    const took = Math.round(performance.now() - started);
    const done = { ...job, sent_at: new Date().toISOString(), took_ms: took, smtp: info.response };
    await redis.lPush("mail:done", JSON.stringify(done));
    await redis.lTrim("mail:done", 0, 19);
    console.log(
      `${clock()} INFO job done queue=mail:queue id=${job.id} to=${job.to} took=${took}ms`,
    );
  } catch (err) {
    console.error(`${clock()} ERROR job failed queue=mail:queue id=${job.id}: ${err.message}`);
  }
}
