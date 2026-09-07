import { systemHealthHandler } from "./queries";

export const systemRouter = {
  health: systemHealthHandler,
};
