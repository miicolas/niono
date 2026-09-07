import type { invitations, members, workspaces } from "./schema";

export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof members.$inferSelect;
export type WorkspaceRole = WorkspaceMember["role"];
export type Invitation = typeof invitations.$inferSelect;
