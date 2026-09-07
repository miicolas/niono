import { ORPCError } from "@orpc/server";
import type { DatabaseTransaction } from "@/db";
import type { Page } from "@/db/schema/pages/types";
import { audienceChange } from "@/server/services/access/audience";

type Audience = { id: string; access: string }[];

const audienceKey = (audience: Audience) =>
  audience
    .map((p) => `${p.id}:${p.access}`)
    .sort()
    .join("|");

/** Refuse un déplacement qui ouvre de nouveaux accès tant que l'utilisateur n'a pas confirmé exactement cette audience. */
export async function assertAudienceConfirmed(
  tx: DatabaseTransaction,
  page: Page,
  input: {
    parentId: string | null;
    confirmAudienceChange?: boolean;
    confirmedAudience?: { id: string; access: "read" | "edit" }[];
  }
) {
  if (page.parentId === input.parentId) {
    return;
  }
  const expanded = await audienceChange(tx, page, input.parentId);
  if (
    expanded.length &&
    (!input.confirmAudienceChange ||
      audienceKey(expanded) !== audienceKey(input.confirmedAudience ?? []))
  ) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message:
        "Ce déplacement donne de nouveaux accès. Confirmez les destinataires.",
      data: { audience: expanded },
    });
  }
}
