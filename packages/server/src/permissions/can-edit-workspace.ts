import { hasContentPermission } from "./has-content-permission";

export const canEditWorkspace = (role: string | undefined) =>
  hasContentPermission(role, "write");
