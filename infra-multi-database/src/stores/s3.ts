import {
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../env.js";
import { TIMEOUT_MS, namespaceOf, now, plural, type Store } from "./store.js";

// S3_URL carries the endpoint, the keys and the bucket in one value.
const url = new URL(env.s3Url);
const bucket = namespaceOf(env.s3Url);

const client = new S3Client({
  endpoint: url.origin,
  region: "us-east-1",
  // RustFS serves buckets as paths; virtual-host names would need DNS per bucket.
  forcePathStyle: true,
  credentials: {
    accessKeyId: decodeURIComponent(url.username),
    secretAccessKey: decodeURIComponent(url.password),
  },
  requestHandler: { connectionTimeout: TIMEOUT_MS, requestTimeout: TIMEOUT_MS },
});

/** A bucket per lane in the shared RustFS, created by infra.setup.s3. */
export const s3: Store = {
  key: "s3",
  title: "S3 (RustFS)",
  container: "shared",
  kind: "bucket",
  namespace: bucket,
  envVar: "S3_URL",
  access: { console: `https://rustfs.${env.domain}/rustfs/console/` },

  async health() {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return `bucket ${bucket} exists`;
  },

  async demo() {
    const key = `notes/${now().replace(/[:.]/g, "-")}.txt`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: `note from ${env.laneName}\n`,
        ContentType: "text/plain",
      }),
    );
    const list = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "notes/" }));
    return [`PUT ${key}`, `LIST notes/ -> ${plural(list.KeyCount ?? 0, "object")}`];
  },
};
