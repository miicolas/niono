import { createFileRoute } from "@tanstack/react-router";
import { healthCheck } from "@/server/services/system/health-check";
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await healthCheck();
          return Response.json(
            { status: "ok" },
            { headers: { "Cache-Control": "no-store" } }
          );
        } catch {
          return Response.json({ status: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
