import { createServer } from "node:http";
import { laneInfo, listen, sendJson, sendText } from "./lane.mjs";

const tasks = [
  { id: 1, title: "Run the dev server through devlanes", done: true },
  { id: 2, title: "Run the tests with devlanes with", done: false },
  { id: 3, title: "Stop what this session started", done: false },
];

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;

  if (path === "/healthz") return sendText(res, 200, "ok");
  if (path === "/lane") return sendJson(res, laneInfo(req));
  if (path === "/api/tasks") return sendJson(res, tasks);
  if (path === "/") return sendJson(res, { ...laneInfo(req), tasks });
  sendText(res, 404, "not found\n");
});

listen(server);
