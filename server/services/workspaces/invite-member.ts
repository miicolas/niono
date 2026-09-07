import { createHash, randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { db, schema as s } from "@/db";
import WorkspaceInvitationEmail, {
  workspaceInvitationSubject,
} from "@/emails/workspace-invitation";
import { env } from "@/env/server";
import { workspaceRole } from "@/server/services/access/workspace-role";
import { sendTemplateEmail } from "@/server/services/email/send-email";

export async function inviteMember(
  userId: string,
  input: { workspaceId: string; email: string; role: "editor" | "viewer" }
) {
  if ((await workspaceRole(db, userId, input.workspaceId)) !== "owner") {
    throw new ORPCError("FORBIDDEN");
  }
  const token = randomBytes(32).toString("hex");
  await db.insert(s.invitations).values({
    ...input,
    email: input.email.toLowerCase(),
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 7 * 86_400_000),
  });
  await sendTemplateEmail(
    input.email,
    workspaceInvitationSubject,
    WorkspaceInvitationEmail({
      url: `${env.BETTER_AUTH_URL}/invite?token=${token}`,
    })
  );
  return { ok: true };
}
