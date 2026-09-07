import { createHash, randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { db, schema as s } from "@/db";
import { env } from "@/env/server";
import { workspaceRole } from "@/server/services/access/workspace-role";
import { sendEmail } from "@/server/services/email/send-email";

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
  await sendEmail(
    input.email,
    "Votre invitation DigiPM",
    `Vous avez été invité dans un espace DigiPM. Connectez-vous ou inscrivez-vous avec cette adresse, puis ouvrez ce lien :\n${env.BETTER_AUTH_URL}/invite?token=${token}`
  );
  return { ok: true };
}
