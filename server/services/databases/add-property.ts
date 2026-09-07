import { schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { withPage } from "@/server/services/access/with-page";
import type { PropertyOption, PropertyType } from "@/validators/databases";
import { lockedSource } from "./locked-source";

const MAX_INT32 = 2_147_483_647;

export function addProperty(
  userId: string,
  input: {
    pageId: string;
    name: string;
    type: PropertyType;
    options: PropertyOption[];
  }
) {
  return withPage(userId, input.pageId, async (tx) => {
    const source = await lockedSource(tx, input.pageId);
    const [property] = await tx
      .insert(s.properties)
      .values({
        sourceId: source.id,
        name: input.name,
        type: input.type,
        options: input.options,
        position: Date.now() % MAX_INT32,
      })
      .returning();
    return required(property);
  });
}
