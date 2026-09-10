import { z } from "zod";
import { codexSendSchema } from "@digipm/contracts/codex";
import { forUser } from "./for-user";
import { sendOwned } from "./send-owned";

export async function send(
  userId: string,
  raw: z.infer<typeof codexSendSchema>,
) {
  return forUser(userId, () => sendOwned(userId, raw));
}
