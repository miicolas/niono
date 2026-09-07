import { base } from "@/server/context";
import { aiRouter } from "./ai/router";
import { databasesRouter } from "./databases/router";
import { documentsRouter } from "./documents/router";
import { pagesRouter } from "./pages/router";
import { systemRouter } from "./system/router";
import { transferRouter } from "./transfer/router";
import { workspacesRouter } from "./workspaces/router";

export const appRouter = base.router({
  ai: aiRouter,
  databases: databasesRouter,
  documents: documentsRouter,
  pages: pagesRouter,
  system: systemRouter,
  transfer: transferRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
