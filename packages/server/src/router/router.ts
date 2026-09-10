import { pmRoutes } from "./pm-routes";
import { realtimeRoutes } from "./realtime-routes";
import { codexRoutes } from "./codex-routes";
import { transferRoutes } from "./transfer-routes";
import { bootstrapRoutes } from "./bootstrap-routes";
import { pagesRoutes } from "./pages-routes";
import { databasesRoutes } from "./databases-routes";
import { aiRoutes } from "./ai-routes";

export const router = {
  realtime: realtimeRoutes,
  codex: codexRoutes,
  pm: pmRoutes,
  transfer: transferRoutes,
  bootstrap: bootstrapRoutes,
  pages: pagesRoutes,
  databases: databasesRoutes,
  ai: aiRoutes,
};
