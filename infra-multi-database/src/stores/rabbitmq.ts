import { type ChannelModel, connect } from "amqplib";
import { env } from "../env.js";
import { TIMEOUT_MS, namespaceOf, now, type Store } from "./store.js";

const vhost = namespaceOf(env.amqpUrl);

// A connection per call keeps the example free of reconnect handling; the URL
// already names this lane's vhost.
async function withConnection<T>(use: (conn: ChannelModel) => Promise<T>): Promise<T> {
  const conn = await connect(env.amqpUrl, { timeout: TIMEOUT_MS });
  try {
    return await use(conn);
  } finally {
    await conn.close().catch(() => {});
  }
}

/** A vhost per lane in the shared RabbitMQ, created by infra.setup.rabbitmq. */
export const rabbitmq: Store = {
  key: "rabbitmq",
  title: "RabbitMQ",
  container: "shared",
  kind: "vhost",
  namespace: vhost,
  envVar: "AMQP_URL",
  access: { console: `https://rabbitmq.${env.domain}/#/queues/${encodeURIComponent(vhost)}` },

  async health() {
    return withConnection(async (conn) => {
      const { version } = conn.connection.serverProperties;
      return `RabbitMQ ${version}, vhost ${vhost} open`;
    });
  },

  async demo() {
    return withConnection(async (conn) => {
      const channel = await conn.createConfirmChannel();
      await channel.assertQueue("events", { durable: true });
      const body = JSON.stringify({ lane: env.laneName, at: now() });
      channel.sendToQueue("events", Buffer.from(body), { persistent: true });
      await channel.waitForConfirms();
      const message = await channel.get("events", { noAck: true });
      await channel.close();
      return [
        `publish events <- ${body}`,
        `get events -> ${message ? message.content.toString() : "(empty)"}`,
      ];
    });
  },
};
