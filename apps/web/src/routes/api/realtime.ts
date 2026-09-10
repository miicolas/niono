import { createFileRoute } from "@tanstack/react-router";
import { realtimeStream } from "@digipm/server/realtime/stream";

export const Route = createFileRoute("/api/realtime")({
  server: { handlers: { GET: ({ request }) => realtimeStream(request) } },
});
