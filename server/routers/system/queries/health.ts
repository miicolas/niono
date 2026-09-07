import { publicProcedure } from "@/server/procedure/public.procedure";
import { healthCheck } from "@/server/services/system/health-check";

export const systemHealthHandler = publicProcedure
  .route({ method: "GET" })
  .handler(async () => {
    await healthCheck();
    return { status: "ok" as const };
  });
