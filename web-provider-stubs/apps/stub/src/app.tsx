import { serveStatic } from "@hono/node-server/serve-static";
import { laneInfo } from "@provider-stubs/shared";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { Inbox } from "./inbox.js";
import { messageRoutes } from "./routes/messages.js";
import { InboxPage } from "./views/InboxPage.js";

const inbox = new Inbox(env.provider);

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, env)));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));
app.get("/styles.css", serveStatic({ path: "./src/styles.css" }));

app.route("/v1/messages", messageRoutes(inbox));

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => c.render(<InboxPage info={laneInfo(c, env)} inbox={inbox} />));

app.notFound((c) => c.json({ error: "not_found" }, 404));
