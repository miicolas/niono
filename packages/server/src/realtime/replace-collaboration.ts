import { CollaborativeDocument } from "@digipm/editor/collaboration";
import type { DocumentNode } from "@digipm/contracts";

export function replaceCollaboration(
  state: string | null,
  content: DocumentNode,
  title: string,
  changes: { content?: DocumentNode; title?: string },
) {
  if (!state)
    return { collaborationState: null, content: changes.content ?? content };
  const document = new CollaborativeDocument(
    Buffer.from(state, "base64"),
    content,
    title,
  );
  try {
    document.replace(changes.content, changes.title);
    const snapshot = document.snapshot();
    return {
      collaborationState: Buffer.from(snapshot.state).toString("base64"),
      content: snapshot.content,
    };
  } finally {
    document.destroy();
  }
}
