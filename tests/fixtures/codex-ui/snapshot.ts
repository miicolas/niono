export function snapshot() {
  return {
    conversation: {
      id: "conversation",
      title: "Résumé",
      status: "completed",
      context: {},
      sources: [{ pageId: "page", title: "Plan", revision: 0 }],
    },
    cursor: "1",
    changed: true,
    messages: [
      {
        id: "message",
        role: "assistant",
        text: "Voici le [Plan](/?w=workspace&p=page). <script>unsafe()</script>",
        status: "completed",
        error: null,
      },
    ],
    proposals: [
      {
        id: "proposal",
        conversationId: "conversation",
        summary: "Renommer la page",
        status: "pending",
        before: "Ancien titre",
        action: {
          type: "renamePage",
          pageId: "page",
          title: "Nouveau titre",
          expectedRevision: 0,
        },
      },
    ],
  };
}
