import { useEffect, useRef, useState } from "react";
import { get, del } from "idb-keyval";
import type { DocumentNode } from "@digipm/contracts";
import { replaceSharedText } from "@digipm/editor/collaboration/replace-shared-text";
import { DocumentProvider } from "./document-provider";

type Draft = { content: DocumentNode; revision: number; time: number };

export function useCollaborativeDocument(
  user: { id: string; name: string },
  workspaceId: string,
  pageId: string,
  initialRevision: number,
) {
  const [provider, setProvider] = useState<DocumentProvider | null>(null);
  const [, render] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState(false);
  const content = useRef<DocumentNode | null>(null);
  const key = `digipm-draft:${user.id}:${workspaceId}:${pageId}`;
  useEffect(() => {
    const next = new DocumentProvider(pageId, user, workspaceId);
    const update = () => render((value) => value + 1);
    const unsubscribe = next.subscribe(update);
    setProvider(next);
    let alive = true;
    void get<Draft>(key)
      .then((value) => {
        if (alive) setDraft(value ?? null);
      })
      .catch(() => {
        if (alive) setDraftError(true);
      });
    return () => {
      alive = false;
      unsubscribe();
      next.destroy();
    };
  }, [user.id, user.name, workspaceId, pageId, key]);
  return {
    provider,
    ready: provider?.ready ?? false,
    writable: !!provider?.ready && provider.canEdit && !provider.revoked,
    revoked: provider?.revoked ?? false,
    status: provider?.status ?? "saving",
    title: provider?.ready
      ? provider.document.getText("title").toString()
      : null,
    setTitle: (value: string) => {
      if (provider?.canEdit && !provider.revoked)
        replaceSharedText(provider.document.getText("title"), value);
    },
    peers: provider
      ? [...provider.awareness.getStates()]
          .filter(
            ([id, state]) => id !== provider.document.clientID && state.user,
          )
          .map(([id, state]) => ({
            clientId: id,
            name: String(state.user.name),
            color: String(state.user.color),
          }))
      : [],
    draft,
    draftError: draftError || !!provider?.diskError,
    change: (value: DocumentNode) => {
      content.current = value;
    },
    flush: () => provider?.flush() ?? Promise.resolve(),
    revision: () => provider?.revision ?? initialRevision,
    latest: () => content.current,
    dirty: () => provider?.dirty() ?? false,
    recover: () => {
      const recovered = draft;
      setDraft(null);
      void del(key);
      return recovered?.content;
    },
    ignoreRecovered: async () => {
      await del(key);
      setDraft(null);
    },
    discard: async () => {
      await provider?.flush();
      await del(key);
      setDraft(null);
    },
  };
}
