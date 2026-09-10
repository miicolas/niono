import { forUser } from "./for-user";
import { interruptOwnedConversation } from "./interrupt-owned-conversation";

export async function interrupt(userId: string, id: string) {
  return forUser(userId, () => interruptOwnedConversation(userId, id));
}
