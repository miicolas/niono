import { forUser } from "./for-user";
import { removeOwnedConversation } from "./remove-owned-conversation";

export async function removeConversation(userId: string, id: string) {
  return forUser(userId, () => removeOwnedConversation(userId, id));
}
