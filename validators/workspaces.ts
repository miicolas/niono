import { z } from "zod";
import { idSchema } from "./common";

const INVITATION_TOKEN = /^[a-f0-9]{64}$/;

export const invitationTokenSchema = z.string().regex(INVITATION_TOKEN);

export const createWorkspaceInput = z.object({
  name: z.string().trim().min(1).max(100),
});

export const workspaceMembersInput = z.object({ workspaceId: idSchema });

export const inviteMemberInput = z.object({
  workspaceId: idSchema,
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});

export const acceptInvitationInput = z.object({
  token: invitationTokenSchema,
});

export const changeRoleInput = z.object({
  workspaceId: idSchema,
  memberId: z.string(),
  role: z.enum(["editor", "viewer", "remove"]),
});

/** Search params de l'espace : espace, page et vue courants, invitation en attente. */
export const workspaceSearchSchema = z.object({
  w: z.uuid().optional().catch(undefined),
  p: z.uuid().optional().catch(undefined),
  view: z.uuid().optional().catch(undefined),
  invite: z.string().optional(),
});

export const inviteSearchSchema = z.object({
  token: invitationTokenSchema.optional().catch(undefined),
});
