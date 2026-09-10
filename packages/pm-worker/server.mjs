import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { dockerJob } from "./docker-job.mjs";
import { validateTask } from "./validate-task.mjs";
const token = process.env.PM_WORKER_TOKEN;
if (!token || token.length < 32)
  throw new Error("PM_WORKER_TOKEN doit contenir au moins 32 caractères.");
const directory = resolve(process.env.PM_WORKER_DATA_DIR || ".data/pm-worker");
await mkdir(directory, { recursive: true, mode: 0o700 });
const jobs = new Map();
const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  const supplied = Buffer.from(request.headers.authorization || "");
  const expected = Buffer.from("Bearer " + token);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    response.writeHead(401).end("{}");
    return;
  }
  const id = /^\/jobs\/([a-f0-9]{64})$/.exec(request.url || "")?.[1];
  if (!id) {
    response.writeHead(404).end("{}");
    return;
  }
  try {
    const saved =
      jobs.get(id) ||
      (await readFile(join(directory, id + ".json"), "utf8")
        .then(JSON.parse)
        .catch(() => null));
    if (request.method === "DELETE") {
      jobs.get(id)?.controller.abort();
      response.end(JSON.stringify({ cancelled: true }));
      return;
    }
    if (request.method === "GET") {
      if (!saved) {
        response.writeHead(404).end("{}");
        return;
      }
      const { controller, ...view } = saved;
      if (view.status === "running" && !jobs.has(id)) {
        view.status = "failed";
        view.error =
          "Le worker a redémarré. Reprendre explicitement le calcul.";
      }
      response.end(JSON.stringify(view));
      return;
    }
    if (request.method !== "PUT") {
      response.writeHead(405).end("{}");
      return;
    }
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 75000000) throw new Error("Entrée trop volumineuse.");
    }
    const task = validateTask(JSON.parse(body));
    const hash = createHash("sha256")
      .update(JSON.stringify(task))
      .digest("hex");
    if (saved && saved.hash !== hash) {
      response.writeHead(409).end(
        JSON.stringify({
          error: "Une même étape ne peut pas changer de contenu.",
        }),
      );
      return;
    }
    if (saved?.status === "completed" || jobs.has(id)) {
      response.end(JSON.stringify({ id, status: saved.status }));
      return;
    }
    if (jobs.size >= 3) {
      response.writeHead(429).end(
        JSON.stringify({
          error: "Trois calculs sont déjà actifs. Réessayer après leur fin.",
        }),
      );
      return;
    }
    const controller = new AbortController();
    const job = { id, hash, status: "running", controller };
    jobs.set(id, job);
    await writeFile(
      join(directory, id + ".json"),
      JSON.stringify({ id, hash, status: "running" }),
      { mode: 0o600 },
    );
    void dockerJob(id, task, controller.signal)
      .then(
        (result) => ({ id, hash, status: "completed", result }),
        (error) => ({ id, hash, status: "failed", error: error.message }),
      )
      .then(async (result) => {
        await writeFile(join(directory, id + ".tmp"), JSON.stringify(result), {
          mode: 0o600,
        });
        await rename(
          join(directory, id + ".tmp"),
          join(directory, id + ".json"),
        );
      })
      .finally(() => jobs.delete(id))
      .catch(() => {});
    response.writeHead(202).end(JSON.stringify({ id, status: "running" }));
  } catch (error) {
    response.writeHead(400).end(JSON.stringify({ error: error.message }));
  }
});
server.listen(
  Number(process.env.PM_WORKER_PORT || 8090),
  process.env.PM_WORKER_HOST || "127.0.0.1",
);
process.on("SIGTERM", () => {
  for (const job of jobs.values()) job.controller.abort();
  server.close();
});
