import { hasContentPermission } from "./has-content-permission";

export const canReadWorkspace = (role: string | undefined) =>
  hasContentPermission(role, "read");
