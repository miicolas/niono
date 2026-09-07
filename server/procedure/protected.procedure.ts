import { authMiddleware } from "../middleware/auth.middleware";
import { publicProcedure } from "./public.procedure";

export const protectedProcedure = publicProcedure.use(authMiddleware);
