import { runTasks } from "../runs/live";
import { executeTool } from "../../codex/tools";
import { pmToolSchemas } from "./definitions";
import { getPmContext } from "./get-context";
import { loadResource } from "./load-resource";
import { readPmPage } from "./read-page";
import { configureWorkspace } from "../context/configure-workspace";
import { withRun } from "../runs/with-run";
import { askQuestions } from "../questions/ask-questions";
import { createArtifact } from "../artifacts/create-artifact";
import { readSourceFile } from "../artifacts/read-source-file";
import { reviewDocument } from "../reviews/review-document";
import { runCode } from "../worker/run-code";
export async function executePmTool(
  userId: string,
  conversationId: string,
  runId: string,
  name: string,
  raw: unknown,
  callId: string,
  signal: AbortSignal,
): Promise<unknown> {
  signal.throwIfAborted();
  if (name === "get_pm_context")
    return getPmContext(userId, conversationId, runId);
  if (name === "initialize_pm") {
    const input = pmToolSchemas.initialize_pm.parse(raw);
    const run = await withRun(
      userId,
      conversationId,
      runId,
      async (_tx, run) => run,
    );
    return configureWorkspace(userId, {
      ...input,
      workspaceId: run.workspaceId,
    });
  }
  if (name === "load_workflow") {
    const { id } = pmToolSchemas.load_workflow.parse(raw);
    return loadResource(
      userId,
      conversationId,
      runId,
      ".claude/skills/" + id + "/SKILL.md",
      id,
    );
  }
  if (name === "read_pm_resource")
    return loadResource(
      userId,
      conversationId,
      runId,
      pmToolSchemas.read_pm_resource.parse(raw).path,
    );
  if (name === "read_page") {
    const input = pmToolSchemas.read_page.parse(raw);
    return readPmPage(
      userId,
      conversationId,
      runId,
      input.pageId,
      input.offset,
    );
  }
  if (name === "read_source_file") {
    const input = pmToolSchemas.read_source_file.parse(raw);
    return readSourceFile(userId, conversationId, runId, input);
  }
  if (name === "ask_questions")
    return askQuestions(userId, conversationId, runId, callId, raw);
  if (name === "create_artifact")
    return createArtifact(userId, conversationId, runId, raw);
  if (name === "review_document" || name === "run_code") {
    const tasks = runTasks.get(runId) ?? new Set<Promise<unknown>>();
    runTasks.set(runId, tasks);
    const task =
      name === "review_document"
        ? reviewDocument(userId, conversationId, runId, raw, signal)
        : runCode(userId, conversationId, runId, raw, signal);
    tasks.add(task);
    try {
      return await task;
    } finally {
      tasks.delete(task);
      if (!tasks.size) runTasks.delete(runId);
    }
  }
  return executeTool(userId, conversationId, runId, name, raw);
}
